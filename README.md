# OCR Next.js Application with Python and MySQL

This application allows users to upload images, extract text using OCR, and manage these entries with a MySQL database.

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.6 or higher)
- MySQL database
- Tesseract OCR installed on your system

## Setup Instructions

### 1. Install Node.js Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Install Python Dependencies

\`\`\`bash
pip install -r python/requirements.txt
\`\`\`

### 3. Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

\`\`\`
MYSQL_HOST=localhost
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=ocr_app
\`\`\`

### 4. Database Setup

Create a MySQL database named `ocr_app`. The application will automatically create the necessary tables on startup.

### 5. Run the Application

\`\`\`bash
npm run dev
\`\`\`

## Features

1. **Home Page**: Displays all uploaded images in a table with their extracted text summaries.
2. **Add Page**: Allows users to upload new images, which are automatically processed with OCR.
3. **Edit Page**: Enables users to modify existing entries.
4. **Delete Page**: Provides a way to remove images from the database.
5. **Batch Processing**: Process multiple images at once.

## Technical Implementation

- **Frontend**: Next.js with App Router, React, and Tailwind CSS
- **Backend**: Next.js API routes for handling requests
- **OCR Processing**: Python script using Tesseract OCR
- **Database**: MySQL with mysql-connector-python for data storage
- **Image Storage**: Local file system (images stored in the public/uploads directory)

## Deployment to GitHub

When deploying this project to GitHub, make sure to follow these security practices:

1. **Never commit sensitive information**:
   - The `.env.local` file is already in `.gitignore` and won't be committed
   - Create a `.env.example` file with the structure but without actual credentials

2. **Before committing**:
   - Make sure uploads directory doesn't contain any sensitive images
   - Check that no hardcoded credentials exist in the code

3. **For production deployment**:
   - Consider using environment variables from your hosting platform
   - Set up proper database access controls and security

4. **Setting up GitHub repository**:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   \`\`\`
