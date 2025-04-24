from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import bcrypt
import mysql.connector
from datetime import datetime

# Create a Blueprint for user-related routes
user_bp = Blueprint('user_bp', __name__)

# Helper function to get a database connection from the pool
def get_db_connection():
    from app import conn_pool
    try:
        conn = conn_pool.get_connection()
        return conn
    except Exception as e:
        print(f"Error getting database connection: {e}")
        raise

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    current_user_id = get_jwt_identity()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id, username, email, created_at FROM users WHERE id = %s", (current_user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Format dates for JSON response
        if 'created_at' in user and user['created_at']:
            user['created_at'] = user['created_at'].isoformat()
        
        return jsonify({'success': True, 'user': user}), 200
    
    except Exception as e:
        print(f"Get profile error: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch user profile'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not all(key in data for key in ['username', 'email']):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    username = data['username']
    email = data['email']
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if email is already taken by another user
        cursor.execute("SELECT id FROM users WHERE email = %s AND id != %s", (email, current_user_id))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Email already in use by another account'}), 409
        
        # Update user profile
        cursor.execute(
            "UPDATE users SET username = %s, email = %s WHERE id = %s",
            (username, email, current_user_id)
        )
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Profile updated successfully'}), 200
    
    except Exception as e:
        print(f"Update profile error: {e}")
        return jsonify({'success': False, 'error': 'Failed to update profile'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@user_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not all(key in data for key in ['currentPassword', 'newPassword']):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    current_password = data['currentPassword']
    new_password = data['newPassword']
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get current password hash
        cursor.execute("SELECT password FROM users WHERE id = %s", (current_user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Verify current password
        if not bcrypt.checkpw(current_password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'success': False, 'error': 'Current password is incorrect'}), 401
        
        # Hash new password and update
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cursor.execute(
            "UPDATE users SET password = %s WHERE id = %s",
            (hashed_password, current_user_id)
        )
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Password updated successfully'}), 200
    
    except Exception as e:
        print(f"Password change error: {e}")
        return jsonify({'success': False, 'error': 'Failed to update password'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@user_bp.route('/history', methods=['GET'])
@jwt_required()
def get_user_history():
    current_user_id = get_jwt_identity()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get user's analysis history
        cursor.execute('''
            SELECT i.id, i.original_filename, i.file_path, i.created_at,
                   ar.is_real, ar.real_score, ar.spoofing_type, 
                   ar.sharpness, ar.brightness, ar.contrast
            FROM images i
            LEFT JOIN analysis_results ar ON i.id = ar.image_id
            WHERE i.user_id = %s
            ORDER BY i.created_at DESC
        ''', (current_user_id,))
        
        history = cursor.fetchall()
        
        # Format dates for JSON response
        for item in history:
            if 'created_at' in item and item['created_at']:
                item['created_at'] = item['created_at'].isoformat()
        
        return jsonify({'success': True, 'history': history}), 200
    
    except Exception as e:
        print(f"Get history error: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch analysis history'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@user_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    current_user_id = get_jwt_identity()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Total images analyzed
        cursor.execute("SELECT COUNT(*) as total_images FROM images WHERE user_id = %s", (current_user_id,))
        total_images = cursor.fetchone()['total_images']
        
        # Fake images detected
        cursor.execute('''
            SELECT COUNT(*) as fake_images 
            FROM images i
            JOIN analysis_results ar ON i.id = ar.image_id
            WHERE i.user_id = %s AND ar.is_real = 0
        ''', (current_user_id,))
        fake_images = cursor.fetchone()['fake_images']
        
        # Real images detected
        cursor.execute('''
            SELECT COUNT(*) as real_images 
            FROM images i
            JOIN analysis_results ar ON i.id = ar.image_id
            WHERE i.user_id = %s AND ar.is_real = 1
        ''', (current_user_id,))
        real_images = cursor.fetchone()['real_images']
        
        # Recent analysis (last 7 days)
        cursor.execute('''
            SELECT COUNT(*) as recent_analysis
            FROM images 
            WHERE user_id = %s AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ''', (current_user_id,))
        recent_analysis = cursor.fetchone()['recent_analysis']
        
        stats = {
            'total_images': total_images,
            'fake_images': fake_images,
            'real_images': real_images,
            'recent_analysis': recent_analysis
        }
        
        return jsonify({'success': True, 'stats': stats}), 200
    
    except Exception as e:
        print(f"Get stats error: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch user statistics'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@user_bp.route('/history/<int:image_id>', methods=['DELETE'])
@jwt_required()
def delete_analysis(image_id):
    current_user_id = get_jwt_identity()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if the image belongs to the current user
        cursor.execute("SELECT id FROM images WHERE id = %s AND user_id = %s", (image_id, current_user_id))
        if not cursor.fetchone():
            return jsonify({'success': False, 'error': 'Image not found or you don\'t have permission to delete it'}), 404
        
        # Delete analysis results first (foreign key constraint)
        cursor.execute("DELETE FROM analysis_results WHERE image_id = %s", (image_id,))
        
        # Delete the image record
        cursor.execute("DELETE FROM images WHERE id = %s", (image_id,))
        
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Analysis record deleted successfully'}), 200
    
    except Exception as e:
        print(f"Delete analysis error: {e}")
        return jsonify({'success': False, 'error': 'Failed to delete analysis record'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()