const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
});

const db = admin.firestore();

// ==================== EDITIONS ====================

// Get all editions
app.get('/api/editions', async (req, res) => {
  try {
    const snapshot = await db.collection('editions').orderBy('createdAt', 'desc').get();
    const editions = [];
    snapshot.forEach(doc => {
      editions.push({ id: doc.id, ...doc.data() });
    });
    res.json(editions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single edition
app.get('/api/editions/:id', async (req, res) => {
  try {
    const doc = await db.collection('editions').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Edition not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create edition (Admin only)
app.post('/api/editions', async (req, res) => {
  try {
    // Add basic auth check
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, name, description, image, status, price, auctionStartDate, auctionEndDate } = req.body;
    
    await db.collection('editions').doc(id).set({
      name,
      description,
      image,
      status,
      price,
      auctionStartDate,
      auctionEndDate,
      createdAt: new Date().toISOString(),
    });

    res.json({ id, message: 'Edition created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update edition (Admin only)
app.put('/api/editions/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db.collection('editions').doc(req.params.id).update(req.body);
    res.json({ id: req.params.id, message: 'Edition updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete edition (Admin only)
app.delete('/api/editions/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db.collection('editions').doc(req.params.id).delete();
    res.json({ message: 'Edition deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== OWNERS ====================

// Get all owners (Hall of Fame)
app.get('/api/owners', async (req, res) => {
  try {
    const snapshot = await db.collection('owners').orderBy('acquiredDate', 'desc').get();
    const owners = [];
    snapshot.forEach(doc => {
      owners.push({ id: doc.id, ...doc.data() });
    });
    res.json(owners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create owner (Admin only)
app.post('/api/owners', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, edition, editionId, acquiredDate, image, description } = req.body;
    const docRef = await db.collection('owners').add({
      name,
      edition,
      editionId,
      acquiredDate,
      image,
      description,
      createdAt: new Date().toISOString(),
    });

    res.json({ id: docRef.id, message: 'Owner added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update owner (Admin only)
app.put('/api/owners/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db.collection('owners').doc(req.params.id).update(req.body);
    res.json({ id: req.params.id, message: 'Owner updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete owner (Admin only)
app.delete('/api/owners/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db.collection('owners').doc(req.params.id).delete();
    res.json({ message: 'Owner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BIDS ====================

// Get all bids for an edition
app.get('/api/bids/:editionId', async (req, res) => {
  try {
    const snapshot = await db.collection('bids')
      .where('editionId', '==', req.params.editionId)
      .orderBy('amount', 'desc')
      .get();
    
    const bids = [];
    snapshot.forEach(doc => {
      bids.push({ id: doc.id, ...doc.data() });
    });
    res.json(bids);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Place a bid
app.post('/api/bids', async (req, res) => {
  try {
    const { editionId, bidder, amount, email } = req.body;

    // Validate bid
    if (!editionId || !bidder || !amount || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if edition exists and is active
    const edition = await db.collection('editions').doc(editionId).get();
    if (!edition.exists || edition.data().status !== 'active') {
      return res.status(400).json({ error: 'Edition not active for bidding' });
    }

    const docRef = await db.collection('bids').add({
      editionId,
      bidder,
      amount,
      email,
      timestamp: new Date().toISOString(),
      status: 'pending',
    });

    res.json({ id: docRef.id, message: 'Bid placed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept/Reject bid (Admin only)
app.put('/api/bids/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status } = req.body; // 'accepted' or 'rejected'
    await db.collection('bids').doc(req.params.id).update({ status });

    res.json({ id: req.params.id, message: `Bid ${status} successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export for Vercel
module.exports = app;

// Local development
const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
