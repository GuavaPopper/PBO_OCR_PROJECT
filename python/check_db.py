import os
import sys
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

def get_db_connection():
    """Create a database connection using environment variables"""
    try:
        host = os.environ.get('MYSQL_HOST')
        user = os.environ.get('MYSQL_USER')
        password = os.environ.get('MYSQL_PASSWORD')
        database = os.environ.get('MYSQL_DATABASE')
        
        if not all([host, user, password, database]):
            print("Error: Missing required database credentials in environment variables")
            return None
        
        print(f"Connecting to MySQL: host={host}, user={user}, database={database}")
        
        # First try connecting to the MySQL server without specifying a database
        connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password
        )
        
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def create_database_and_tables():
    """Create the database and required tables"""
    try:
        connection = get_db_connection()
        if connection is None:
            print("Failed to connect to database")
            return False
        
        cursor = connection.cursor()
        
        # Create database if it doesn't exist
        db_name = os.environ.get('MYSQL_DATABASE')
        if not db_name:
            print("Error: MYSQL_DATABASE environment variable is not set")
            return False
            
        print(f"Creating database {db_name} if it doesn't exist")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        
        # Use the database
        print(f"Using database {db_name}")
        cursor.execute(f"USE {db_name}")
        
        # Create images table if it doesn't exist
        print("Creating 'images' table if it doesn't exist")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                image_path VARCHAR(255) NOT NULL,
                extracted_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT NULL
            )
        ''')
        
        # Check if the table was created successfully
        print("Checking if 'images' table exists")
        cursor.execute("SHOW TABLES LIKE 'images'")
        result = cursor.fetchone()
        
        if result:
            print("'images' table exists!")
        else:
            print("Failed to create 'images' table")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return True
    except Error as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("\nStarting database check and setup...")
    success = create_database_and_tables()
    if not success:
        print("Failed to set up database and tables")
        sys.exit(1)
    print("Database setup completed successfully!")
    sys.exit(0) 