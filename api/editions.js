import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  });
}

const db = admin.firestore();

// Authentication middleware
function checkAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7);
  return token === process.env.ADMIN_TOKEN;
}

// Main handler
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get all editions
      const snapshot = await db.collection('editions').orderBy('createdAt', 'desc').get();
      const editions = [];
      snapshot.forEach(doc => {
        editions.push({ id: doc.id, ...doc.data() });
      });
      return res.status(200).json(editions);
    }

    if (req.method === 'POST') {
      if (!checkAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id, name, description, image, price, status, auctionStartDate, auctionEndDate } = req.body;
      if (!id || !name) {
        return res.status(400).json({ error: 'Missing required fields: id, name' });
      }

      const newEdition = {
        id,
        name,
        description: description || '',
        image: image || '',
        price: price || 0,
        status: status || 'upcoming',
        auctionStartDate: auctionStartDate || new Date().toISOString(),
        auctionEndDate: auctionEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };

      const docRef = await db.collection('editions').doc(id.toString()).set(newEdition);
      return res.status(201).json({ id, ...newEdition });
    }

    if (req.method === 'PUT') {
      if (!checkAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Edition ID required' });
      }

      const updates = req.body;
      await db.collection('editions').doc(id).update(updates);
      const updated = await db.collection('editions').doc(id).get();
      return res.status(200).json({ id: updated.id, ...updated.data() });
    }

    if (req.method === 'DELETE') {
      if (!checkAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Edition ID required' });
      }

      await db.collection('editions').doc(id).delete();
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
