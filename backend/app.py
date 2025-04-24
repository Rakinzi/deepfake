from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load the model
MODEL_PATH = 'model/best_fine_tuned_EfficientNetV2S_model.h5'
model = load_model(MODEL_PATH)
print(f"Model loaded from {MODEL_PATH}")

@app.route('/api/analyze-face', methods=['POST'])
def analyze_face():
    """
    Endpoint to analyze a face image using our custom model
    """
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
        
        # Load the image
        img = cv2.imread(file_path)
        if img is None:
            return jsonify({
                'success': False,
                'error': 'Failed to process image'
            }), 400
        
        # Face detection (you may want to use a face detector like OpenCV's Haar cascade)
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
                
                # Make prediction
                prediction = model.predict(face_roi)[0][0]
                is_real = bool(prediction >= 0.5)
                
                # Calculate basic image quality metrics
                face_gray = cv2.cvtColor(img[y:y+h, x:x+w], cv2.COLOR_BGR2GRAY)
                sharpness = float(cv2.Laplacian(face_gray, cv2.CV_64F).var())
                brightness = float(np.mean(face_gray))
                contrast = float(np.std(face_gray))
                
                faces_data.append({
                    'is_real': is_real,
                    'real_score': float(prediction),
                    'spoofing_type': 'unknown' if is_real else 'fake',
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
        else:
            # If no face is detected, analyze the whole image
            preprocessed_img = cv2.resize(img, (224, 224))
            preprocessed_img = preprocessed_img / 255.0
            preprocessed_img = img_to_array(preprocessed_img)
            preprocessed_img = np.expand_dims(preprocessed_img, axis=0)
            
            prediction = model.predict(preprocessed_img)[0][0]
            is_real = bool(prediction >= 0.5)
            
            # Calculate image quality metrics for the whole image
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            brightness = float(np.mean(gray))
            contrast = float(np.std(gray))
            
            faces_data.append({
                'is_real': is_real,
                'real_score': float(prediction),
                'spoofing_type': 'unknown' if is_real else 'fake',
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
        
        # Compile results
        results = {
            'faces': faces_data,
            'analysis': {
                'age': None,  # Your model doesn't predict age
                'gender': None,  # Your model doesn't predict gender
                'emotion': None,  # Your model doesn't predict emotion
                'race': None  # Your model doesn't predict race
            },
            'quality': {
                'sharpness': float(cv2.Laplacian(gray, cv2.CV_64F).var()),
                'brightness': float(np.mean(gray)),
                'contrast': float(np.std(gray))
            }
        }
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Error analyzing image: {str(e)}'
        }), 500

@app.route('/api/status', methods=['GET'])
def api_status():
    """Check if the API is running"""
    return jsonify({
        'status': 'online',
        'message': 'Face analysis API is running with custom fake detection model'
    })

if __name__ == '__main__':
    app.run(debug=False, port=5000)