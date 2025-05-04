import os
import sys
import json
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import datetime

# Load environment variables from .env.local
load_dotenv('.env.local')

def get_db_connection():
    """Create a database connection using environment variables"""
    try:
        host = os.environ.get('MYSQL_HOST', 'localhost')
        user = os.environ.get('MYSQL_USER', 'root')
        password = os.environ.get('MYSQL_PASSWORD', 'MYSQL_PASSWORD')
        database = os.environ.get('MYSQL_DATABASE', 'ocr_app')
        
        print(f"Connecting to MySQL: host={host}, user={user}, database={database}")
        
        connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database
        )
        
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def check_database_tables():
    """Check database tables and records"""
    try:
        connection = get_db_connection()
        if connection is None:
            print("Failed to connect to database")
            return False
        
        cursor = connection.cursor()
        
        # Check tables
        print("Checking database tables:")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        if not tables:
            print("No tables found in the database")
            return False
        
        print(f"Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Check images table
        if any(table[0] == 'images' for table in tables):
            print("\nChecking images table structure:")
            cursor.execute("DESCRIBE images")
            columns = cursor.fetchall()
            
            print(f"Found {len(columns)} columns in images table:")
            for column in columns:
                print(f"  - {column[0]}: {column[1]}")
            
            # Check image records
            print("\nChecking image records:")
            cursor.execute("SELECT * FROM images ORDER BY created_at DESC")
            images = cursor.fetchall()
            
            if not images:
                print("No images found in the database")
            else:
                print(f"Found {len(images)} images:")
                for image in images[:5]:  # Show first 5 images
                    print(f"  - ID: {image[0]}, Name: {image[1]}, Path: {image[2]}, Created: {image[4]}")
        else:
            print("Images table not found in the database")
        
        cursor.close()
        connection.close()
        
        return True
    except Error as e:
        print(f"Error checking database: {e}")
        return False

if __name__ == "__main__":
    print("Starting database check...")
    check_database_tables()
    print("Database check completed.") 