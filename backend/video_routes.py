# video_routes.py (updated)
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import cv2
import tempfile
import os
import uuid
import numpy as np
import json

# Create a blueprint for video-related routes
video_bp = Blueprint('video_bp', __name__)

# Helper function to get a database connection from the pool
def get_db_connection():
    from app import conn_pool
    try:
        conn = conn_pool.get_connection()
        return conn
    except Exception as e:
        print(f"Error getting database connection: {e}")
        raise

# Helper function to analyze image
def analyze_image_with_huggingface(img_data):
    from app import analyze_image_with_huggingface as analyze_func
    return analyze_func(img_data)

@video_bp.route('/analyze-video', methods=['POST'])
@jwt_required()
def analyze_video_api():
    current_user_id = get_jwt_identity()
    
    if 'video' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No video file provided'
        }), 400
    
    video_file = request.files['video']
    
    # If no file selected
    if video_file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No video selected'
        }), 400
    
    # Check file type
    allowed_extensions = {'mp4', 'mov', 'avi', 'mkv', 'webm'}
    if not '.' in video_file.filename or video_file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({
            'success': False,
            'error': 'Invalid video format. Supported formats: MP4, MOV, AVI, MKV, WEBM'
        }), 400
    
    try:
        print(f"Processing video: {video_file.filename}")
        
        # Save video to a temporary file
        temp_dir = tempfile.gettempdir()
        unique_filename = str(uuid.uuid4()) + os.path.splitext(video_file.filename)[1]
        temp_video_path = os.path.join(temp_dir, unique_filename)
        video_file.save(temp_video_path)
        
        print(f"Saved video to {temp_video_path}")
        
        # Get the file size
        file_size = os.path.getsize(temp_video_path)
        print(f"Video size: {file_size} bytes")
        
        # Save to permanent storage for persistence
        from app import app
        permanent_video_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        os.rename(temp_video_path, permanent_video_path)
        
        # Extract video properties
        cap = cv2.VideoCapture(permanent_video_path)
        
        if not cap.isOpened():
            return jsonify({
                'success': False,
                'error': 'Could not open video file'
            }), 400
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        resolution = f"{width}x{height}"
        
        print(f"Video properties: {fps} fps, {frame_count} frames, {duration:.2f}s, {resolution}")
        
        # Database connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Store video information in the videos table
        cursor.execute(
            """
            INSERT INTO videos 
            (user_id, file_path, original_filename, file_size, duration, fps, resolution, frame_count) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (current_user_id, permanent_video_path, video_file.filename, file_size, 
             duration, fps, resolution, frame_count)
        )
        conn.commit()
        video_id = cursor.lastrowid
        print(f"Saved to database with video_id: {video_id}")
        
        # Analyze frames at regular intervals
        # For longer videos, reduce the sampling rate to maintain reasonable processing time
        if duration > 60:  # For videos longer than 1 minute
            sample_interval = max(1, int(fps * 2))  # One frame every 2 seconds
        else:
            sample_interval = max(1, int(fps / 2))  # Two frames per second
            
        analyzed_frames = 0
        deepfake_frames = 0
        frame_results = []
        detection_regions = []
        current_region = None
        
        for frame_idx in range(0, frame_count, sample_interval):
            # Set frame position
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            
            if not ret:
                continue
            
            # Convert frame to JPEG format
            _, buffer = cv2.imencode('.jpg', frame)
            frame_data = buffer.tobytes()
            
            # Analyze frame using existing image analysis function
            analysis_result = analyze_image_with_huggingface(frame_data)
            
            if analysis_result['success'] and 'faces' in analysis_result and analysis_result['faces']:
                face = analysis_result['faces'][0]
                is_fake = not face['is_real']
                confidence = face['confidence']
                frame_time = frame_idx / fps
                
                # Record result
                frame_results.append({
                    'frame_index': frame_idx,
                    'time': frame_time,
                    'is_fake': is_fake,
                    'confidence': confidence,
                    'spoofing_type': face['spoofing_type'] if is_fake else None
                })
                
                # Update detection regions for continuous segments of fake frames
                if is_fake:
                    deepfake_frames += 1
                    
                    if current_region is None:
                        # Start a new region
                        current_region = {
                            'start_time': frame_time,
                            'end_time': frame_time,
                            'type': face['spoofing_type'] if 'spoofing_type' in face else 'Face Manipulation'
                        }
                    else:
                        # Extend the current region
                        current_region['end_time'] = frame_time
                elif current_region is not None:
                    # Close the current region and add to the list
                    detection_regions.append(current_region)
                    current_region = None
            
            analyzed_frames += 1
            
            # Progress message (optional)
            progress = (frame_idx / frame_count) * 100
            if frame_idx % (sample_interval * 10) == 0:  # Print progress every 10 samples
                print(f"Progress: {progress:.1f}% ({analyzed_frames} frames analyzed)")
        
        # Close the final region if there is one
        if current_region is not None:
            detection_regions.append(current_region)
        
        # Close the video
        cap.release()
        
        # Calculate overall results
        deepfake_probability = deepfake_frames / analyzed_frames if analyzed_frames > 0 else 0
        authenticity_score = 1 - deepfake_probability
        
        # Determine manipulation type (most frequent)
        manipulation_types = {}
        for result in frame_results:
            if result['is_fake'] and result['spoofing_type']:
                manipulation_types[result['spoofing_type']] = manipulation_types.get(result['spoofing_type'], 0) + 1
        
        manipulation_type = None
        if manipulation_types:
            manipulation_type = max(manipulation_types.items(), key=lambda x: x[1])[0]
        
        # Calculate confidence level
        confidence_values = [r['confidence'] for r in frame_results]
        avg_confidence = sum(confidence_values) / len(confidence_values) if confidence_values else 0
        
        # Store analysis results in database
        cursor.execute(
            """
            INSERT INTO video_analysis_results 
            (video_id, is_real, real_score, deepfake_probability, manipulation_type, 
             detected_frames, total_frames, confidence, detection_regions) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                video_id,
                authenticity_score > 0.5,  # is_real
                float(authenticity_score),  # real_score
                float(deepfake_probability),  # deepfake_probability
                manipulation_type,  # manipulation_type
                deepfake_frames,  # detected_frames
                analyzed_frames,  # total_frames
                float(avg_confidence),  # confidence
                json.dumps(detection_regions)  # detection_regions as JSON
            )
        )
        conn.commit()
        
        # Prepare final result
        result = {
            'success': True,
            'video_id': video_id,
            'deepfake_probability': deepfake_probability,
            'authenticity_score': authenticity_score,
            'manipulation_type': manipulation_type,
            'detected_frames': deepfake_frames,
            'total_frames': analyzed_frames,
            'confidence': avg_confidence,
            'detection_regions': detection_regions,
            'video_metadata': {
                'duration': duration,
                'fps': fps,
                'resolution': resolution,
                'frames': frame_count
            }
        }
        
        print("Video analysis completed successfully")
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in analyze_video_api: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Error analyzing video: {str(e)}'
        }), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@video_bp.route('/history', methods=['GET'])
@jwt_required()
def get_video_history():
    current_user_id = get_jwt_identity()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get user's video analysis history
        cursor.execute('''
            SELECT v.id, v.original_filename, v.file_path, v.duration, v.resolution, v.created_at,
                   var.is_real, var.real_score, var.deepfake_probability, var.manipulation_type, 
                   var.detected_frames, var.total_frames, var.confidence
            FROM videos v
            LEFT JOIN video_analysis_results var ON v.id = var.video_id
            WHERE v.user_id = %s
            ORDER BY v.created_at DESC
        ''', (current_user_id,))
        
        history = cursor.fetchall()
        
        # Format dates and serialize any JSON fields
        for item in history:
            if 'created_at' in item and item['created_at']:
                item['created_at'] = item['created_at'].isoformat()
        
        return jsonify({'success': True, 'history': history}), 200
    
    except Exception as e:
        print(f"Get video history error: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch video analysis history'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
