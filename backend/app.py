from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, get_jwt_identity, jwt_required
import os
import uuid
import cv2
import numpy as np
import datetime
from mysql.connector import pooling
from dotenv import load_dotenv
import bcrypt
import requests
from deepface import DeepFace

# Import routes
from user_routes import user_bp
from dashboard_routes import dashboard_bp
from video_routes import video_bp


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
app.register_blueprint(video_bp, url_prefix='/api/video')

# Configuration
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Hugging Face API Configuration
HF_API_URL = "https://api-inference.huggingface.co/models/dima806/deepfake_vs_real_image_detection"
HF_API_KEY = os.getenv('HF_API_KEY')  # Get API key from environment variables
if not HF_API_KEY:
    print("WARNING: HF_API_KEY not found in environment variables. API calls will fail.")

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

# Function to analyze image using Hugging Face Inference API
def analyze_image_with_huggingface(img_data):
    """
    Send the raw image directly to the Hugging Face API without any preprocessing
    Returns the analysis results
    """
    try:
        # Make API call with the raw image data
        response = requests.post(
            HF_API_URL,
            headers={
                "Content-Type": "image/jpeg", 
                "Authorization": f"Bearer {HF_API_KEY}"
            },
            data=img_data,
            timeout=30
        )
        
        # Check for successful response
        if response.status_code != 200:
            print(f"API error: Status code {response.status_code}")
            print(f"Response content: {response.text}")
            return {
                'success': False,
                'error': f'API error: {response.text}'
            }
            
        # Get the API response
        api_result = response.json()
        print(f"Raw API response: {api_result}")
        
        # Parse the result to determine if real or fake
        is_real = False
        real_score = 0.0
        
        # Handle different response formats
        # Format 1: List of classifications with label and score
        if isinstance(api_result, list) and len(api_result) > 0 and "label" in api_result[0]:
            for item in api_result:
                if "real" in item["label"].lower():
                    real_score = item["score"]
                    is_real = real_score >= 0.5
                elif "fake" in item["label"].lower() and real_score == 0.0:
                    # Only use fake score if we haven't found a real score
                    real_score = 1.0 - item["score"]
                    is_real = real_score >= 0.5
        
        # Format 2: Direct score values
        elif isinstance(api_result, dict):
            if "real" in api_result:
                real_score = api_result["real"]
                is_real = real_score >= 0.5
            elif "fake" in api_result:
                real_score = 1.0 - api_result["fake"]
                is_real = real_score >= 0.5
        
        # Load image to get dimensions for display
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Get image qualities
        img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        sharpness = float(cv2.Laplacian(img_gray, cv2.CV_64F).var())
        brightness = float(np.mean(img_gray))
        contrast = float(np.std(img_gray))
        
        # Try to get facial attributes
        facial_analysis = None
        try:
            analysis = DeepFace.analyze(img, enforce_detection=False, 
                                      actions=['emotion', 'age', 'race'], 
                                      silent=True)
            
            if isinstance(analysis, list) and len(analysis) > 0:
                facial_analysis = {
                    'age': analysis[0].get('age'),
                    'emotion': analysis[0].get('emotion'),
                    'race': analysis[0].get('dominant_race')
                }
                print(f"Facial analysis: {facial_analysis}")
        except Exception as e:
            print(f"Error in facial analysis: {e}")
            facial_analysis = None
        
        # Return complete analysis result
        result = {
            'success': True,
            'faces': [
                {
                    'is_real': is_real,
                    'real_score': float(real_score),
                    'spoofing_type': 'unknown' if is_real else 'AI-generated',
                    'facial_area': {
                        'x': 0,
                        'y': 0,
                        'w': img.shape[1],
                        'h': img.shape[0]
                    },
                    'confidence': float(real_score if is_real else 1-real_score),
                    'quality': {
                        'sharpness': sharpness,
                        'brightness': brightness,
                        'contrast': contrast
                    }
                }
            ],
            'analysis': facial_analysis,
            'quality': {
                'sharpness': sharpness,
                'brightness': brightness,
                'contrast': contrast
            },
            'model_used': 'dima806/deepfake_vs_real_image_detection (HF Inference API)',
            'raw_api_response': api_result
        }
        
        return result
        
    except Exception as e:
        print(f"Error in analyzing image with Hugging Face API: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Analysis error: {str(e)}'
        }

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
        
        # Create videos table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS videos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            file_path VARCHAR(255) NOT NULL,
            original_filename VARCHAR(255) NOT NULL,
            file_size INT NOT NULL,
            duration FLOAT,
            fps FLOAT,
            resolution VARCHAR(20),
            frame_count INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        ''')
        
        # Create video_analysis_results table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS video_analysis_results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            video_id INT NOT NULL,
            is_real BOOLEAN NOT NULL,
            real_score FLOAT NOT NULL,
            deepfake_probability FLOAT NOT NULL,
            manipulation_type VARCHAR(50),
            detected_frames INT,
            total_frames INT,
            confidence FLOAT,
            detection_regions JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (video_id) REFERENCES videos(id)
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
        access_token = create_access_token(identity=str(user['id']))
        refresh_token = create_refresh_token(identity=str(user['id']))
        
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
def analyze_face_api():
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
        print(f"Processing image: {file.filename}")
        
        # Save the file with a unique filename
        unique_filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        print(f"Saved file to {file_path}")
        
        # Get the file size
        file_size = os.path.getsize(file_path)
        print(f"File size: {file_size} bytes")
        
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
        print(f"Saved to database with image_id: {image_id}")
        
        # Read the file for analysis
        with open(file_path, 'rb') as f:
            img_data = f.read()
        
        # Process the image (send directly to HF API)
        print("Starting image analysis...")
        analysis_result = analyze_image_with_huggingface(img_data)
        
        # If analysis failed, return error
        if not analysis_result['success']:
            print(f"Analysis failed: {analysis_result.get('error', 'Unknown error')}")
            return jsonify(analysis_result), 400
        
        # Store analysis results in database
        if 'faces' in analysis_result and analysis_result['faces']:
            for face in analysis_result['faces']:
                cursor.execute(
                    "INSERT INTO analysis_results (image_id, is_real, real_score, spoofing_type, sharpness, brightness, contrast) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    (
                        image_id, 
                        face['is_real'], 
                        float(face['real_score']), 
                        face['spoofing_type'], 
                        face['quality']['sharpness'], 
                        face['quality']['brightness'], 
                        face['quality']['contrast']
                    )
                )
                conn.commit()
                print(f"Saved face analysis to database")
        else:
            print("No faces data to save to database")
        
        # Add image_id to the results
        analysis_result['image_id'] = image_id
        
        # Remove raw API response from the final output to keep it clean
        if 'raw_api_response' in analysis_result:
            del analysis_result['raw_api_response']
        
        print("Analysis completed successfully")
        return jsonify(analysis_result)
        
    except Exception as e:
        print(f"Error in analyze_face_api: {e}")
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

# Test endpoint for direct API comparison
@app.route('/api/test-huggingface', methods=['POST'])
def test_huggingface_api():
    """Test endpoint for the Hugging Face API"""
    if 'image' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No image file provided'
        }), 400
    
    file = request.files['image']
    
    try:
        # Read the image file
        img_data = file.read()
        
        # Call the Hugging Face API directly
        response = requests.post(
            HF_API_URL,
            headers={
                "Content-Type": "image/jpeg", 
                "Authorization": f"Bearer {HF_API_KEY}"
            },
            data=img_data
        )
        
        # Return the raw API response for debugging
        return jsonify({
            'success': True,
            'status_code': response.status_code,
            'raw_response': response.json() if response.status_code == 200 else response.text,
            'inference_time': response.elapsed.total_seconds()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/status', methods=['GET'])
def api_status():
    """Check if the API is running"""
    return jsonify({
        'status': 'online',
        'message': 'Face analysis API is running with authentication enabled',
        'model': 'dima806/deepfake_vs_real_image_detection (Hugging Face Inference API)',
        'version': '1.0.0'
    })
    
    
if __name__ == '__main__':
    app.run(debug=False, port=5000)