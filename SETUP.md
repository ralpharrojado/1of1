# 1of1 Backend Setup Guide (Complete)

## Phase 1: Firebase Setup (5 min)

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Name: "1of1"
4. Skip Google Analytics
5. Create project

### 2. Set Up Firestore Database
1. Click "Firestore Database" in left menu
2. Click "Create database"
3. Select "Start in test mode" (free)
4. Location: `us-central1`
5. Click "Create"

### 3. Set Up Service Account
1. Go to **Project Settings** (gear icon)
2. Click **Service Accounts**
3. Click **Generate new private key**
4. Download the JSON file
5. Open the JSON and copy:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### 4. Create Firestore Collections
In Firestore, create these collections:

**Collection: `editions`**
Add a test document:
```json
{
  "name": "The Midnight Bloom",
  "description": "Hand-woven silk blend...",
  "image": "https://...",
  "status": "upcoming",
  "price": 12500,
  "auctionStartDate": "2024-02-01",
  "auctionEndDate": "2024-02-10",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Collection: `owners`**
Add a test document:
```json
{
  "name": "Alexander M.",
  "edition": "The Midnight Bloom",
  "editionId": "042",
  "acquiredDate": "2023-10-24",
  "image": "https://...",
  "description": "Collector based in NYC"
}
```

**Collection: `bids`**
(Empty for now - will be populated as bids come in)

---

## Phase 2: Vercel Backend Deployment (10 min)

### 1. Install Dependencies Locally
```powershell
cd C:\Users\st1_i\OneDrive\Desktop\1of1
npm install
```

### 2. Create `.env` File
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
ADMIN_TOKEN=your-super-secret-admin-token-12345
NODE_ENV=production
PORT=3001
```

### 3. Push to GitHub
```powershell
git add .
git commit -m "Add backend API and admin dashboard"
git push origin main
```

### 4. Deploy to Vercel
1. Go to https://vercel.com
2. Click "Import Project"
3. Select your GitHub repo
4. Set **Root Directory** to `.` (current)
5. Add Environment Variables (from your `.env` file):
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `ADMIN_TOKEN`
6. Click "Deploy"

Once deployed, you'll get a URL like: `https://your-project.vercel.app`

---

## Phase 3: Connect Frontend to Backend

### Update index.html
Add this at the top of the `<script>` section:
```javascript
const API_URL = 'https://your-project.vercel.app/api'; // Update this!
```

### Update all fetch calls in index.html, hall-of-fame.html, etc.
Replace hardcoded data with API calls:

Example in `index.html`:
```javascript
async function loadCurrentEdition() {
  try {
    const response = await fetch(`${API_URL}/editions?status=active`);
    const editions = await response.json();
    if (editions.length > 0) {
      const edition = editions[0];
      // Update the DOM with edition data
      document.querySelector('h3').textContent = edition.name;
      document.querySelector('p').textContent = edition.description;
      // etc...
    }
  } catch (error) {
    console.error('Error loading edition:', error);
  }
}

// Call on page load
document.addEventListener('DOMContentLoaded', loadCurrentEdition);
```

---

## Phase 4: Access Admin Dashboard

### Local Development
```powershell
node api.js
```
Then open: `http://localhost:3001/admin.html`

### Production
Open: `https://your-project.vercel.app/admin.html`

### Login
Use your `ADMIN_TOKEN` from `.env`

---

## API Endpoints Reference

### Editions
- `GET /api/editions` - Get all editions
- `GET /api/editions/:id` - Get single edition
- `POST /api/editions` - Create edition (Admin only)
- `PUT /api/editions/:id` - Update edition (Admin only)
- `DELETE /api/editions/:id` - Delete edition (Admin only)

### Owners
- `GET /api/owners` - Get all owners
- `POST /api/owners` - Add owner (Admin only)
- `PUT /api/owners/:id` - Update owner (Admin only)
- `DELETE /api/owners/:id` - Delete owner (Admin only)

### Bids
- `GET /api/bids/:editionId` - Get bids for edition
- `POST /api/bids` - Place bid (public)
- `PUT /api/bids/:id` - Accept/reject bid (Admin only)

All admin endpoints require header:
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## Next Steps

1. **Test Locally** - Run `npm install` and `node api.js`
2. **Deploy** - Push to GitHub and deploy to Vercel
3. **Add Environment Variables** - Set them in Vercel dashboard
4. **Update Frontend** - Replace `API_URL` and add fetch calls
5. **Test Admin Panel** - Login and manage data
6. **Connect Bid System** - Users can place bids through frontend

---

## Troubleshooting

### "Firebase Auth Error"
- Check your `.env` variables
- Make sure service account has Firestore permissions
- Verify project ID matches Firebase console

### "Unauthorized" on admin endpoints
- Check your `ADMIN_TOKEN` in admin panel
- Make sure it matches `.env`

### CORS errors
- The API has CORS enabled for all origins
- If still having issues, update Vercel environment variables

### Firebase free tier limits
- 1GB storage (plenty for this)
- Read/write operations: 50k/day free (more than enough for testing)

