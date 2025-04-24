from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, get_jwt_identity, jwt_required
import os
import uuid
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
import datetime
import mysql.connector
from mysql.connector import pooling
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import bcrypt

# Import routes
from user_routes import user_bp
from dashboard_routes import dashboard_bp

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)  # Enable CORS with credentials support

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = datetime.timedelta(days=30)
jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api/user')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

# Configuration
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# MySQL Connection Pool
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'deepfake_detection')
}

try:
    conn_pool = pooling.MySQLConnectionPool(
        pool_name="deepfake_pool",
        pool_size=5,  # Maximum number of connections in the pool
        **db_config
    )
    print("Database connection pool created successfully")
except Exception as e:
    print(f"Error creating database connection pool: {e}")
    raise

# Helper function to get a connection from the pool
def get_db_connection():
    try:
        conn = conn_pool.get_connection()
        return conn
    except Exception as e:
        print(f"Error getting database connection: {e}")
        raise

# Load the model (only if available)
MODEL_PATH = 'model/best_fine_tuned_EfficientNetV2S_model.h5'
model = None
try:
    if os.path.exists(MODEL_PATH):
        model = load_model(MODEL_PATH)
        print(f"Model loaded from {MODEL_PATH}")
    else:
        print(f"Model file not found at {MODEL_PATH}. Face analysis will be in demo mode.")
except Exception as e:
    print(f"Error loading model: {e}")

# Initialize database tables
def init_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        ''')
        
        # Create images table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            file_path VARCHAR(255) NOT NULL,
            original_filename VARCHAR(255) NOT NULL,
            file_size INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        ''')
        
        # Create analysis_results table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            image_id INT NOT NULL,
            is_real BOOLEAN NOT NULL,
            real_score FLOAT NOT NULL,
            spoofing_type VARCHAR(50),
            sharpness FLOAT,
            brightness FLOAT,
            contrast FLOAT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (image_id) REFERENCES images(id)
        )
        ''')
        
        conn.commit()
        print("Database tables initialized successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Initialize database tables on startup
init_db()

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    if not all(key in data for key in ['username', 'email', 'password']):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    username = data['username']
    email = data['email']
    password = data['password']
    
    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Email already registered'}), 409
        
        # Insert new user
        cursor.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
            (username, email, hashed_password)
        )
        conn.commit()
        
        return jsonify({'success': True, 'message': 'User registered successfully'}), 201
    
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'success': False, 'error': 'Registration failed. Please try again.'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate required fields
    if not all(key in data for key in ['email', 'password']):
        return jsonify({'success': False, 'error': 'Missing email or password'}), 400
    
    email = data['email']
    password = data['password']
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Find user by email
        cursor.execute("SELECT id, username, email, password FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
        
        # Create tokens
        access_token = create_access_token(identity=user['id'])
        refresh_token = create_refresh_token(identity=user['id'])
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
    
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'success': False, 'error': 'Login failed. Please try again.'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify({'access_token': new_access_token}), 200

# Face Analysis Endpoint
@app.route('/api/analyze-face', methods=['POST'])
@jwt_required()
def analyze_face():
    current_user_id = get_jwt_identity()
    
    if 'image' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No image file provided'
        }), 400
    
    file = request.files['image']
    
    # If no file selected
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No image selected'
        }), 400
    
    try:
        # Save the file with a unique filename
        unique_filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # Get the file size
        file_size = os.path.getsize(file_path)
        
        # Database connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Store image information in the database
        cursor.execute(
            "INSERT INTO images (user_id, file_path, original_filename, file_size) VALUES (%s, %s, %s, %s)",
            (current_user_id, file_path, file.filename, file_size)
        )
        conn.commit()
        image_id = cursor.lastrowid
        
        # Load the image
        img = cv2.imread(file_path)
        if img is None:
            return jsonify({
                'success': False,
                'error': 'Failed to process image'
            }), 400
        
        # Face detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        faces_data = []
        
        if len(faces) > 0:
            for (x, y, w, h) in faces:
                # Extract face ROI
                face_roi = img[y:y+h, x:x+w]
                
                # Preprocess for our model
                face_roi = cv2.resize(face_roi, (224, 224))
                face_roi = face_roi / 255.0  # Normalize
                face_roi = img_to_array(face_roi)
                face_roi = np.expand_dims(face_roi, axis=0)
                
                # Make prediction if model is available
                if model is not None:
                    prediction = model.predict(face_roi)[0][0]
                else:
                    # Demo mode - random prediction
                    prediction = np.random.random()
                    
                is_real = bool(prediction >= 0.5)
                
                # Calculate basic image quality metrics
                face_gray = cv2.cvtColor(img[y:y+h, x:x+w], cv2.COLOR_BGR2GRAY)
                sharpness = float(cv2.Laplacian(face_gray, cv2.CV_64F).var())
                brightness = float(np.mean(face_gray))
                contrast = float(np.std(face_gray))
                
                faces_data.append({
                    'is_real': is_real,
                    'real_score': float(prediction),
                    'spoofing_type': 'unknown' if is_real else 'AI-generated',
                    'facial_area': {
                        'x': int(x),
                        'y': int(y),
                        'w': int(w),
                        'h': int(h)
                    },
                    'confidence': float(prediction if is_real else 1-prediction),
                    'quality': {
                        'sharpness': sharpness,
                        'brightness': brightness,
                        'contrast': contrast
                    }
                })
                
                # Store analysis results in the database
                cursor.execute(
                    "INSERT INTO analysis_results (image_id, is_real, real_score, spoofing_type, sharpness, brightness, contrast) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    (image_id, is_real, float(prediction), 'unknown' if is_real else 'AI-generated', sharpness, brightness, contrast)
                )
                conn.commit()
                
        else:
            # If no face is detected, analyze the whole image
            preprocessed_img = cv2.resize(img, (224, 224))
            preprocessed_img = preprocessed_img / 255.0
            preprocessed_img = img_to_array(preprocessed_img)
            preprocessed_img = np.expand_dims(preprocessed_img, axis=0)
            
            # Make prediction if model is available
            if model is not None:
                prediction = model.predict(preprocessed_img)[0][0]
            else:
                # Demo mode - random prediction
                prediction = np.random.random()
                
            is_real = bool(prediction >= 0.5)
            
            # Calculate image quality metrics for the whole image
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            brightness = float(np.mean(gray))
            contrast = float(np.std(gray))
            
            faces_data.append({
                'is_real': is_real,
                'real_score': float(prediction),
                'spoofing_type': 'unknown' if is_real else 'AI-generated',
                'facial_area': {
                    'x': 0,
                    'y': 0,
                    'w': img.shape[1],
                    'h': img.shape[0]
                },
                'confidence': float(prediction if is_real else 1-prediction),
                'quality': {
                    'sharpness': sharpness,
                    'brightness': brightness,
                    'contrast': contrast
                }
            })
            
            # Store analysis results in the database
            cursor.execute(
                "INSERT INTO analysis_results (image_id, is_real, real_score, spoofing_type, sharpness, brightness, contrast) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (image_id, is_real, float(prediction), 'unknown' if is_real else 'AI-generated', sharpness, brightness, contrast)
            )
            conn.commit()
        
        # Compile results
        results = {
            'faces': faces_data,
            'analysis': {
                'age': None,  # Model doesn't predict age
                'gender': None,  # Model doesn't predict gender
                'emotion': None,  # Model doesn't predict emotion
                'race': None  # Model doesn't predict race
            },
            'quality': {
                'sharpness': float(cv2.Laplacian(gray, cv2.CV_64F).var()),
                'brightness': float(np.mean(gray)),
                'contrast': float(np.std(gray))
            }
        }
        
        return jsonify({
            'success': True,
            'results': results,
            'image_id': image_id
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Error analyzing image: {str(e)}'
        }), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@app.route('/api/status', methods=['GET'])
def api_status():
    """Check if the API is running"""
    return jsonify({
        'status': 'online',
        'message': 'Face analysis API is running with authentication enabled'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)