from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import cv2
from deepface import DeepFace
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/analyze-face', methods=['POST'])
def analyze_face():
    """
    Endpoint to analyze a face image using DeepFace with anti_spoofing
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
        
        # Run DeepFace with anti_spoofing enabled
        face_objs = DeepFace.extract_faces(img_path=file_path, anti_spoofing=True)
        
        # Get face analysis
        face_analysis = DeepFace.analyze(
            img_path=file_path,
            actions=['age', 'gender', 'emotion', 'race'],
            enforce_detection=False
        )
        
        print(face_analysis)
        # Extract the first face result if multiple faces are detected
        if isinstance(face_analysis, list) and len(face_analysis) > 0:
            face_data = face_analysis[0]
        else:
            face_data = face_analysis
        
        # Calculate basic image quality metrics
        quality = {}
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            quality = {
                "sharpness": float(cv2.Laplacian(gray, cv2.CV_64F).var()),
                "brightness": float(np.mean(gray)),
                "contrast": float(np.std(gray))
            }
        except:
            quality = {
                "sharpness": 0.0,
                "brightness": 0.0,
                "contrast": 0.0
            }
        
        # Compile results
        results = {
            'faces': [
                {
                    'is_real': face_obj.get('is_real', False),
                    'real_score': face_obj.get('real_score', 0.0),
                    'spoofing_type': face_obj.get('spoofing_type', 'unknown'),
                    'facial_area': face_obj.get('facial_area', {}),
                    'confidence': face_obj.get('confidence', 0.0)
                } for face_obj in face_objs
            ],
            'analysis': {
                'age': face_data.get('age'),
                'gender': face_data.get('dominant_gender'),
                'emotion': face_data.get('emotion'),
                'race': face_data.get('dominant_race')
            },
            'quality': quality
        }
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error analyzing image: {str(e)}'
        }), 500

@app.route('/api/status', methods=['GET'])
def api_status():
    """Check if the API is running"""
    return jsonify({
        'status': 'online',
        'message': 'Face analysis API is running'
    })

if __name__ == '__main__':
    app.run(debug=False, port=5000)