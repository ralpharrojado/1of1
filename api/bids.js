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
    const { editionId } = req.query;

    if (req.method === 'GET') {
      if (!editionId) {
        return res.status(400).json({ error: 'Edition ID required' });
      }

      // Get bids for specific edition
      const snapshot = await db.collection('bids')
        .where('editionId', '==', editionId)
        .orderBy('bidAmount', 'desc')
        .get();
      
      const bids = [];
      snapshot.forEach(doc => {
        bids.push({ id: doc.id, ...doc.data() });
      });
      return res.status(200).json(bids);
    }

    if (req.method === 'POST') {
      if (!checkAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!editionId) {
        return res.status(400).json({ error: 'Edition ID required' });
      }

      const { bidderName, bidAmount, bidderEmail } = req.body;
      if (!bidderName || !bidAmount) {
        return res.status(400).json({ error: 'Missing required fields: bidderName, bidAmount' });
      }

      const newBid = {
        editionId,
        bidderName,
        bidAmount: parseFloat(bidAmount),
        bidderEmail: bidderEmail || '',
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      const docRef = await db.collection('bids').add(newBid);
      return res.status(201).json({ id: docRef.id, ...newBid });
    }

    if (req.method === 'PUT') {
      if (!checkAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Bid ID required' });
      }

      const updates = req.body;
      await db.collection('bids').doc(id).update(updates);
      const updated = await db.collection('bids').doc(id).get();
      return res.status(200).json({ id: updated.id, ...updated.data() });
    }

    if (req.method === 'DELETE') {
      if (!checkAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Bid ID required' });
      }

      await db.collection('bids').doc(id).delete();
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
