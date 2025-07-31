import express from 'express';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import axios from 'axios';
import multer from 'multer';
import AWS from 'aws-sdk';

dotenv.config();

const app = express();
app.use(express.json());

// MongoDB setup
const client = new MongoClient(process.env.MONGODB_URI);
let db;

// Auth0
const AUTH0_DOMAIN = '';
const CLIENT_ID = '';
const CLIENT_SECRET = '';
const AUDIENCE = 'https://688710b6185ab57fcd7b4646.powersync.journeyapps.com';

async function getAccessToken() {
  try {
    const response = await axios.post(`${AUTH0_DOMAIN}/oauth/token`, {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      audience: AUDIENCE,
      grant_type: 'client_credentials',
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching token:', error.response?.data || error.message);
    throw new Error('Token fetch failed');
  }
}

async function connectDB() {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  }
}

await connectDB();

// S3 setup
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload route
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.body;
    const file = req.file;

    console.log('Received ID:', req.body.id);
    console.log('File:', req.file);

    if (!file || !id) {
      return res.status(400).json({ error: 'Missing image or ID' });
    }

    const ext = file.originalname.split('.').pop();
    const filename = `images/${id}_${Date.now()}.${ext}`;

    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,

    };

    const uploadResult = await s3.upload(s3Params).promise();
    const imageUrl = uploadResult.Location;

    // Update MongoDB feedback document with image_url
    await db.collection('feedback').updateOne(
      { _id: id },
      { $set: { image_url: imageUrl } }
    );

    return res.json({ success: true, imageUrl });
  } catch (err) {
    console.error('Upload failed:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// PowerSync CRUD handler
app.post('/powersync/crud', async (req, res) => {
  try {
    const { transaction_id, operations } = req.body;

    console.log(`Processing transaction ${transaction_id}`);

    for (const op of operations) {
      const action = op.op?.toLowerCase();
      const table = op.type;
      const primaryKey = { id: op.id };
      const data = op.data;

      const collection = db.collection(table);

      if (!action || !primaryKey.id || !data) {
        console.error('Invalid operation format:', op);
        continue;
      }

      if (action === 'put') {
        await collection.updateOne(
          { _id: primaryKey.id },
          { $set: { _id: primaryKey.id, ...data, synced: 1 } },
          { upsert: true }
        );
        console.log(`Upserted into ${table}`);
      } else if (action === 'delete') {
        await collection.deleteOne({ _id: primaryKey.id });
        console.log(`Deleted from ${table}`);
      } else {
        console.warn(`Unhandled action: ${action}`);
      }
    }

    res.status(200).send({ status: 'ok' });
  } catch (err) {
    console.error('Unexpected error in /powersync/crud', err);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Token generation route
app.post('/get-token', async (req, res) => {
  const token = await getAccessToken();
  res.json({ access_token: token });
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});
