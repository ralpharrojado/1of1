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
app.get('/editions', async (req, res) => {
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
app.get('/editions/:id', async (req, res) => {
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
app.post('/editions', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id, name, description, image, price, status, auctionStartDate, auctionEndDate } = req.body;
    await db.collection('editions').doc(id).set({
      name,
      description,
      image,
      price,
      status,
      auctionStartDate,
      auctionEndDate,
      createdAt: new Date().toISOString()
    });
    res.json({ id, message: 'Edition created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update edition (Admin only)
app.put('/editions/:id', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db.collection('editions').doc(req.params.id).update(req.body);
    res.json({ id: req.params.id, message: 'Edition updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete edition (Admin only)
app.delete('/editions/:id', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db.collection('editions').doc(req.params.id).delete();
    res.json({ id: req.params.id, message: 'Edition deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== OWNERS ====================

// Get all owners
app.get('/owners', async (req, res) => {
  try {
    const snapshot = await db.collection('owners').get();
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
app.post('/owners', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id, name, edition, editionId, acquiredDate, image, description } = req.body;
    await db.collection('owners').doc(id || name.replace(/\s+/g, '_')).set({
      name,
      edition,
      editionId,
      acquiredDate,
      image,
      description
    });
    res.json({ message: 'Owner added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete owner (Admin only)
app.delete('/owners/:id', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db.collection('owners').doc(req.params.id).delete();
    res.json({ id: req.params.id, message: 'Owner deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BIDS ====================

// Get bids for edition
app.get('/bids/:editionId', async (req, res) => {
  try {
    const snapshot = await db.collection('bids').where('editionId', '==', req.params.editionId).get();
    const bids = [];
    snapshot.forEach(doc => {
      bids.push({ id: doc.id, ...doc.data() });
    });
    res.json(bids);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Place bid (Public)
app.post('/bids', async (req, res) => {
  try {
    const { editionId, bidder, amount, email } = req.body;
    const docRef = await db.collection('bids').add({
      editionId,
      bidder,
      amount,
      email,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
    res.json({ id: docRef.id, message: 'Bid placed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept/Reject bid (Admin only)
app.put('/bids/:id', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db.collection('bids').doc(req.params.id).update({ status: req.body.status });
    res.json({ id: req.params.id, message: `Bid ${req.body.status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
