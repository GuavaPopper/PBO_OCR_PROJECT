import os
import sys
import json
import base64
from PIL import Image
import pytesseract
import io

# Configure Tesseract to use custom tessdata directory
TESSDATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tessdata')
if not os.path.exists(TESSDATA_DIR):
    os.makedirs(TESSDATA_DIR)
pytesseract.pytesseract.tesseract_cmd = r'tesseract'  # Make sure this points to your tesseract executable
os.environ['TESSDATA_PREFIX'] = TESSDATA_DIR

def process_image(image_data, language="eng+ind"):
    """
    Process an image using OCR to extract text
    
    Args:
        image_data: Base64 encoded image data
        language: Language code for OCR (default: eng+ind for English and Indonesian)
        
    Returns:
        dict: Dictionary containing the extracted text
    """
    try:
        # Decode the base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        
        # Open the image using PIL
        image = Image.open(io.BytesIO(image_bytes))
        
        # Configure OCR options for better accuracy
        custom_config = r'--oem 1 --psm 3'
        
        # Use pytesseract to extract text with specified language
        extracted_text = pytesseract.image_to_string(
            image, 
            lang=language,
            config=custom_config
        )
        
        return {
            "success": True,
            "text": extracted_text.strip(),
            "language": language
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
        language = data.get("language", "eng+ind")  # Default to both English and Indonesian
        
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
