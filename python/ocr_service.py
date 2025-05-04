import os
import sys
import json
import base64
from PIL import Image
import pytesseract
import io

def process_image(image_data, language="eng"):
    """
    Process an image using OCR to extract text
    
    Args:
        image_data: Base64 encoded image data
        language: Language code for OCR (default: eng)
        
    Returns:
        dict: Dictionary containing the extracted text
    """
    try:
        # Decode the base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        
        # Open the image using PIL
        image = Image.open(io.BytesIO(image_bytes))
        
        # Use pytesseract to extract text with specified language
        extracted_text = pytesseract.image_to_string(image, lang=language)
        
        return {
            "success": True,
            "text": extracted_text
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    # Read input from stdin
    input_data = sys.stdin.read()
    
    try:
        # Parse the JSON input
        data = json.loads(input_data)
        image_data = data.get("image")
        language = data.get("language", "eng")
        
        if not image_data:
            result = {
                "success": False,
                "error": "No image data provided"
            }
        else:
            result = process_image(image_data, language)
            
        # Output the result as JSON
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
