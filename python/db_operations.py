import os
import sys
import json
import datetime
import requests
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

# Supabase credentials
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("Error: Missing Supabase credentials in environment variables", file=sys.stderr)
    sys.exit(1)

# Helper function for Supabase API requests
def supabase_request(method, endpoint, data=None, params=None):
    """Make a request to the Supabase API"""
    url = f"{SUPABASE_URL}{endpoint}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, params=params)
        else:
            return {"success": False, "error": f"Unsupported method: {method}"}
        
        response.raise_for_status()
        return {"success": True, "data": response.json()}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": str(e)}

def initialize_database():
    """Initialize the database - not needed with Supabase as we've created the table via migration"""
    return {"success": True, "message": "Database initialized successfully"}

def get_images(search=None):
    """Get all images with optional search filter"""
    endpoint = "/rest/v1/images"
    params = {"select": "*", "order": "created_at.desc"}
    
    if search:
        # PostgreSQL ILIKE for case-insensitive search
        params["or"] = f"name.ilike.*{search}*,extracted_text.ilike.*{search}*"
    
    result = supabase_request("GET", endpoint, params=params)
    
    # Add a debug log to stderr - this won't interfere with the JSON output
    if result["success"]:
        print(f"DEBUG: Returning {len(result['data'])} images", file=sys.stderr)
    
    return result

def get_image_by_id(id):
    """Get a single image by ID"""
    endpoint = f"/rest/v1/images"
    params = {"id": f"eq.{id}", "select": "*"}
    
    result = supabase_request("GET", endpoint, params=params)
    
    if result["success"]:
        if not result["data"] or len(result["data"]) == 0:
            return {"success": False, "error": "Image not found"}
        # Return the first item
        return {"success": True, "data": result["data"][0]}
    return result

def add_image(name, image_path, extracted_text):
    """Add a new image"""
    endpoint = "/rest/v1/images"
    data = {
        "name": name,
        "image_path": image_path,
        "extracted_text": extracted_text
    }
    
    result = supabase_request("POST", endpoint, data=data)
    
    if result["success"] and result["data"] and len(result["data"]) > 0:
        return {"success": True, "id": result["data"][0]["id"]}
    return result

def update_image(id, name, image_path=None, extracted_text=None):
    """Update an existing image"""
    endpoint = f"/rest/v1/images"
    params = {"id": f"eq.{id}"}
    
    # Build the data dictionary based on provided parameters
    data = {"name": name}
    
    if image_path:
        data["image_path"] = image_path
    
    if extracted_text:
        data["extracted_text"] = extracted_text
    
    # Add the updated_at timestamp
    data["updated_at"] = datetime.datetime.utcnow().isoformat()
    
    result = supabase_request("PUT", endpoint, data=data, params=params)
    
    if result["success"]:
        if not result["data"] or len(result["data"]) == 0:
            return {"success": False, "error": "Image not found"}
        return {"success": True}
    return result

def delete_image(id):
    """Delete an image"""
    endpoint = f"/rest/v1/images"
    params = {"id": f"eq.{id}"}
    
    result = supabase_request("DELETE", endpoint, params=params)
    
    if result["success"]:
        return {"success": True}
    return result

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
            result = {"success": False, "error": f"Unknown operation: {operation}"}
        
        # Print the result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)})) 