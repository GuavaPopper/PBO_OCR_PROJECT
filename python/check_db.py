import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

def check_supabase_connection():
    """Check connection to Supabase"""
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("Error: Missing required Supabase credentials in environment variables")
        return False
        
    print(f"Checking connection to Supabase: {supabase_url}")
    
    try:
        # Try to connect to Supabase by making a simple request
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}"
        }
        
        # Test connection with a simple query
        response = requests.get(f"{supabase_url}/rest/v1/images?select=id&limit=1", headers=headers)
        response.raise_for_status()
        
        print("Supabase connection successful!")
        return True
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return False

def verify_table_exists():
    """Verify that the images table exists"""
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY')
    
    try:
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}"
        }
        
        # Check if images table exists by trying to query it
        print("Checking if 'images' table exists")
        response = requests.get(
            f"{supabase_url}/rest/v1/images?select=id&limit=0",
            headers=headers
        )
        
        if response.status_code == 200:
            print("'images' table exists!")
            return True
        else:
            print(f"Error checking 'images' table: {response.text}")
            return False
    except Exception as e:
        print(f"Error checking table: {e}")
        return False

if __name__ == "__main__":
    print("\nStarting Supabase connection check...")
    if check_supabase_connection():
        if verify_table_exists():
            print("Database setup is complete and working!")
            sys.exit(0)
        else:
            print("Failed to verify database tables")
            sys.exit(1)
    else:
        print("Failed to connect to Supabase")
        sys.exit(1) 