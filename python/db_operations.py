import os
import sys
import json
import mysql.connector
from mysql.connector import Error
import datetime

def get_db_connection():
    """Create a database connection using environment variables"""
    try:
        connection = mysql.connector.connect(
            host=os.environ.get('MYSQL_HOST', 'localhost'),
            user=os.environ.get('MYSQL_USER', 'root'),
            password=os.environ.get('MYSQL_PASSWORD', 'MYSQL_PASSWORD'),
            database=os.environ.get('MYSQL_DATABASE', 'ocr_app')
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# Function to convert datetime objects to strings
def convert_to_serializable(obj):
    """Convert MySQL row results to JSON serializable format"""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, datetime.datetime):
                obj[key] = value.isoformat()
            elif isinstance(value, dict):
                obj[key] = convert_to_serializable(value)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            obj[i] = convert_to_serializable(item)
    return obj

def initialize_database():
    """Initialize the database with required tables"""
    try:
        connection = get_db_connection()
        if connection is None:
            return {"success": False, "error": "Failed to connect to database"}
        
        cursor = connection.cursor()
        
        # Create images table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                image_path VARCHAR(255) NOT NULL,
                extracted_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ''')
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {"success": True, "message": "Database initialized successfully"}
    except Error as e:
        return {"success": False, "error": str(e)}

def get_images(search=None):
    """Get all images with optional search filter"""
    try:
        connection = get_db_connection()
        if connection is None:
            return {"success": False, "error": "Failed to connect to database"}
        
        cursor = connection.cursor(dictionary=True)
        
        if search:
            query = "SELECT * FROM images WHERE name LIKE %s OR extracted_text LIKE %s ORDER BY created_at DESC"
            params = (f"%{search}%", f"%{search}%")
            cursor.execute(query, params)
        else:
            query = "SELECT * FROM images ORDER BY created_at DESC"
            cursor.execute(query)
        
        images = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        # Convert datetime objects to strings
        serializable_images = convert_to_serializable(images)
        
        # Add a debug log to stderr - this won't interfere with the JSON output
        print(f"DEBUG: Returning {len(serializable_images)} images", file=sys.stderr)
        
        return {"success": True, "data": serializable_images}
    except Error as e:
        return {"success": False, "error": str(e)}

def get_image_by_id(id):
    """Get a single image by ID"""
    try:
        connection = get_db_connection()
        if connection is None:
            return {"success": False, "error": "Failed to connect to database"}
        
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT * FROM images WHERE id = %s"
        cursor.execute(query, (id,))
        
        image = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if image:
            # Convert datetime objects to strings
            serializable_image = convert_to_serializable(image)
            return {"success": True, "data": serializable_image}
        else:
            return {"success": False, "error": "Image not found"}
    except Error as e:
        return {"success": False, "error": str(e)}

def add_image(name, image_path, extracted_text):
    """Add a new image"""
    try:
        connection = get_db_connection()
        if connection is None:
            return {"success": False, "error": "Failed to connect to database"}
        
        cursor = connection.cursor()
        
        query = "INSERT INTO images (name, image_path, extracted_text) VALUES (%s, %s, %s)"
        cursor.execute(query, (name, image_path, extracted_text))
        
        connection.commit()
        
        # Get the ID of the inserted row
        insert_id = cursor.lastrowid
        
        cursor.close()
        connection.close()
        
        return {"success": True, "id": insert_id}
    except Error as e:
        return {"success": False, "error": str(e)}

def update_image(id, name, image_path=None, extracted_text=None):
    """Update an existing image"""
    try:
        connection = get_db_connection()
        if connection is None:
            return {"success": False, "error": "Failed to connect to database"}
        
        cursor = connection.cursor()
        
        # Check if the image exists
        cursor.execute("SELECT id FROM images WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return {"success": False, "error": "Image not found"}
        
        # Build the update query based on provided parameters
        query = "UPDATE images SET name = %s"
        params = [name]
        
        if image_path:
            query += ", image_path = %s"
            params.append(image_path)
        
        if extracted_text:
            query += ", extracted_text = %s"
            params.append(extracted_text)
        
        query += " WHERE id = %s"
        params.append(id)
        
        cursor.execute(query, tuple(params))
        
        connection.commit()
        
        cursor.close()
        connection.close()
        
        return {"success": True}
    except Error as e:
        return {"success": False, "error": str(e)}

def delete_image(id):
    """Delete an image"""
    try:
        connection = get_db_connection()
        if connection is None:
            return {"success": False, "error": "Failed to connect to database"}
        
        cursor = connection.cursor()
        
        # Check if the image exists
        cursor.execute("SELECT id FROM images WHERE id = %s", (id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return {"success": False, "error": "Image not found"}
        
        query = "DELETE FROM images WHERE id = %s"
        cursor.execute(query, (id,))
        
        connection.commit()
        
        cursor.close()
        connection.close()
        
        return {"success": True}
    except Error as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Read input from stdin
    input_data = sys.stdin.read()
    
    try:
        # Parse the JSON input
        data = json.loads(input_data)
        operation = data.get("operation")
        
        print(f"DEBUG: Processing operation '{operation}'", file=sys.stderr)
        
        if operation == "initialize":
            result = initialize_database()
        elif operation == "get_images":
            search = data.get("search")
            result = get_images(search)
        elif operation == "get_image_by_id":
            id = data.get("id")
            result = get_image_by_id(id)
        elif operation == "add_image":
            name = data.get("name")
            image_path = data.get("image_path")
            extracted_text = data.get("extracted_text")
            result = add_image(name, image_path, extracted_text)
        elif operation == "update_image":
            id = data.get("id")
            name = data.get("name")
            image_path = data.get("image_path")
            extracted_text = data.get("extracted_text")
            result = update_image(id, name, image_path, extracted_text)
        elif operation == "delete_image":
            id = data.get("id")
            result = delete_image(id)
        else:
            result = {"success": False, "error": "Invalid operation"}
        
        # Ensure all results are JSON serializable
        result = convert_to_serializable(result)
        
        # Debug the result before sending
        print(f"DEBUG: Result type: {type(result)}", file=sys.stderr)
        print(f"DEBUG: Result keys: {result.keys() if isinstance(result, dict) else 'not a dict'}", file=sys.stderr)
        if isinstance(result, dict) and 'data' in result:
            print(f"DEBUG: Data type: {type(result['data'])}", file=sys.stderr)
            print(f"DEBUG: Data length: {len(result['data']) if hasattr(result['data'], '__len__') else 'no length'}", file=sys.stderr)
        
        # Output the result as JSON
        json_result = json.dumps(result)
        print(json_result)
    except Exception as e:
        print(f"DEBUG: Exception in main: {str(e)}", file=sys.stderr)
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
