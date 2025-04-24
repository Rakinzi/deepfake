from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import mysql.connector
from datetime import datetime, timedelta

# Create a Blueprint for dashboard-related routes
dashboard_bp = Blueprint('dashboard_bp', __name__)

# Helper function to get a database connection from the pool
def get_db_connection():
    from app import conn_pool
    try:
        conn = conn_pool.get_connection()
        return conn
    except Exception as e:
        print(f"Error getting database connection: {e}")
        raise

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    current_user_id = get_jwt_identity()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Total images analyzed
        cursor.execute("SELECT COUNT(*) as total_images FROM images WHERE user_id = %s", (current_user_id,))
        total_images = cursor.fetchone()['total_images']
        
        # If no images, return empty stats
        if total_images == 0:
            return jsonify({
                'success': True,
                'stats': {
                    'scanned': {
                        'title': 'Images Scanned',
                        'value': '0',
                        'change': '0%',
                        'isPositive': True
                    }
                },
                'recent_detections': [],
                'chart_data': {
                    'authentic': {'percent': 0, 'count': 0},
                    'ai_generated': {'percent': 0, 'count': 0}
                }
            }), 200
        
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
        
        # Calculate detection accuracy 
        # (This is a simple approximation - a real system would use a more complex metric)
        accuracy = 0
        if total_images > 0:
            # This is a placeholder accuracy calculation
            # In a real system, you'd need ground truth data to calculate actual accuracy
            accuracy = 98.2  # Placeholder value
        
        # Stats for last month vs previous month
        current_date = datetime.now()
        this_month_start = datetime(current_date.year, current_date.month, 1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        
        # This month analysis count
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM images
            WHERE user_id = %s AND created_at >= %s
        ''', (current_user_id, this_month_start))
        this_month_count = cursor.fetchone()['count']
        
        # Last month analysis count
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM images
            WHERE user_id = %s AND created_at >= %s AND created_at < %s
        ''', (current_user_id, last_month_start, this_month_start))
        last_month_count = cursor.fetchone()['count']
        
        # Calculate change percentage
        change_percentage = 0
        if last_month_count > 0:
            change_percentage = ((this_month_count - last_month_count) / last_month_count) * 100
        elif this_month_count > 0:
            change_percentage = 100  # If last month was 0 and this month has data
            
        # Recent detections
        cursor.execute('''
            SELECT 
                i.id, 
                i.original_filename, 
                ar.is_real, 
                ar.real_score,
                ar.spoofing_type,
                i.created_at
            FROM images i
            JOIN analysis_results ar ON i.id = ar.image_id
            WHERE i.user_id = %s
            ORDER BY i.created_at DESC
            LIMIT 5
        ''', (current_user_id,))
        
        recent_detections = cursor.fetchall()
        
        # Format the recent detections
        formatted_detections = []
        for detection in recent_detections:
            time_difference = current_date - detection['created_at']
            
            if time_difference.days > 0:
                time_ago = f"{time_difference.days} days ago"
            elif time_difference.seconds >= 3600:
                hours = time_difference.seconds // 3600
                time_ago = f"{hours} hours ago"
            elif time_difference.seconds >= 60:
                minutes = time_difference.seconds // 60
                time_ago = f"{minutes} minutes ago"
            else:
                time_ago = "Just now"
            
            result = "Authentic" if detection['is_real'] else "AI Generated"
            if not detection['is_real'] and detection['spoofing_type'] != "AI-generated":
                result = detection['spoofing_type']
            
            formatted_detections.append({
                'id': detection['id'],
                'filename': detection['original_filename'],
                'result': result,
                'confidence': f"{(detection['real_score'] * 100):.1f}%" if detection['is_real'] else f"{((1 - detection['real_score']) * 100):.1f}%",
                'time': time_ago
            })
        
        # Distribution of authentic vs AI-generated
        cursor.execute('''
            SELECT 
                SUM(CASE WHEN ar.is_real = 1 THEN 1 ELSE 0 END) as authentic_count,
                SUM(CASE WHEN ar.is_real = 0 THEN 1 ELSE 0 END) as ai_generated_count,
                COUNT(*) as total_count
            FROM images i
            JOIN analysis_results ar ON i.id = ar.image_id
            WHERE i.user_id = %s AND i.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ''', (current_user_id,))
        
        distribution = cursor.fetchone()
        authentic_count = distribution['authentic_count'] or 0
        ai_generated_count = distribution['ai_generated_count'] or 0
        total_count = distribution['total_count'] or 0
        
        # Calculate percentages
        authentic_percent = 0
        ai_generated_percent = 0
        
        if total_count > 0:
            authentic_percent = (authentic_count / total_count) * 100
            ai_generated_percent = (ai_generated_count / total_count) * 100
        
        # Compile stats
        stats = {
            'scanned': {
                'title': 'Images Scanned',
                'value': str(total_images),
                'change': f"+{change_percentage:.1f}%" if change_percentage >= 0 else f"{change_percentage:.1f}%",
                'isPositive': change_percentage >= 0
            },
            'detected': {
                'title': 'Fakes Detected',
                'value': str(fake_images),
                'change': f"+{(fake_images / total_images * 100):.1f}%" if total_images > 0 else "0%",
                'isPositive': False  # More fakes detected is shown as negative
            },
            'accuracy': {
                'title': 'Detection Accuracy',
                'value': f"{accuracy:.1f}%",
                'change': "+1.2%",  # Placeholder
                'isPositive': True
            }
        }
        
        # Only add processing time stat if we have data
        # In a real application, you would calculate this from your database
        if total_images > 0:
            stats['processing'] = {
                'title': 'Avg. Processing Time',
                'value': '1.8s',  # In a real app, calculate this from actual processing times
                'change': "-0.3s",  # Placeholder
                'isPositive': True
            }
        
        # Chart data
        chart_data = {
            'authentic': {
                'percent': authentic_percent,
                'count': authentic_count
            },
            'ai_generated': {
                'percent': ai_generated_percent,
                'count': ai_generated_count
            }
        }
        
        return jsonify({
            'success': True,
            'stats': stats,
            'recent_detections': formatted_detections,
            'chart_data': chart_data,
        }), 200
    
    except Exception as e:
        print(f"Dashboard stats error: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch dashboard statistics'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@dashboard_bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_analyses():
    current_user_id = get_jwt_identity()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get recent analyses
        cursor.execute('''
            SELECT 
                i.id, 
                i.original_filename,
                i.file_path, 
                ar.is_real, 
                ar.real_score,
                ar.spoofing_type,
                i.created_at
            FROM images i
            JOIN analysis_results ar ON i.id = ar.image_id
            WHERE i.user_id = %s
            ORDER BY i.created_at DESC
            LIMIT 6
        ''', (current_user_id,))
        
        analyses = cursor.fetchall()
        
        # Format the results
        formatted_analyses = []
        for analysis in analyses:
            # Format created_at for JSON response
            if 'created_at' in analysis and analysis['created_at']:
                analysis['created_at'] = analysis['created_at'].isoformat()
            
            formatted_analyses.append(analysis)
        
        return jsonify({
            'success': True,
            'analyses': formatted_analyses
        }), 200
    
    except Exception as e:
        print(f"Recent analyses error: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch recent analyses'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()