# ComplaintsCollectionBackend

A Node.js backend application for generating Auth tokens and performing CRUD operations with MongoDB.

# Features
Token generation (e.g., via Auth0)

RESTful CRUD API with MongoDB

Easily exposed via ngrok for testing

# Getting Started
1. Clone the Repository

git clone https://github.com/subbupost628008-byte/ComplaintsCollectionBackend.git

cd ComplaintsCollectionBackend

2. Install Dependencies

npm install

Ensure Node.js and npm are installed (node -v, npm -v)

# Run the Server

node index.js

By default, the server runs on http://localhost:3000

# Expose Locally with ngrok

To make your local server publicly accessible:

ngrok http 3000

Copy the public URL (e.g., https://xyz.ngrok.io) and use it in your frontend or testing tools (like Postman).

# Environment Variables (Optional)

If your app uses .env for secrets like Auth tokens or DB credentials, create a .env file:

MONGODB_URI=mongodb://localhost:27017/your-db

DB_NAME="Your DB Name"

PORT=3000

AWS_ACCESS_KEY_ID="Your Access Key"

AWS_SECRET_ACCESS_KEY="Your AWS Secret Access Key"

AWS_REGION="Your AWS Region"

AWS_BUCKET_NAME="Your S3 Bucket Name"




