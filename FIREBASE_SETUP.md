# Firebase Setup Instructions

## 1. Create Firebase Project
- Go to https://console.firebase.google.com/
- Click "Create a project"
- Name it "1of1"
- Skip Google Analytics (optional)
- Wait for project creation

## 2. Enable Firestore Database
- In Firebase Console, click "Firestore Database"
- Click "Create database"
- Start in **Test mode** (free, development)
- Choose location: `us-central1`
- Click "Enable"

## 3. Get Your Firebase Config
- Go to Project Settings (gear icon)
- Copy your Web API Key and Project ID
- You'll need these for the backend


## 4. Create Database Collections

### Option A: Manual UI (Easiest)

**Create `editions` collection:**
1. In Firestore Console, click **+ Create collection**
2. Name it `editions`
3. Click **Add document** → Use auto-ID
4. Add these fields:
   - `name` (string): "The Midnight Bloom"
   - `description` (string): "Hand-woven silk blend..."
   - `image` (string): your image URL
   - `status` (string): "upcoming"
   - `price` (number): 12500
   - `auctionStartDate` (string): "2024-02-01"
   - `auctionEndDate` (string): "2024-02-10"
   - `createdAt` (string): "2024-01-01T00:00:00Z"

**Create `owners` collection:**
1. Click **+ Create collection**
2. Name it `owners`
3. Add documents with:
   - `name`, `edition`, `editionId`, `acquiredDate`, `image`, `description`

**Create `bids` collection:**
1. Click **+ Create collection**
2. Name it `bids` (leave empty for now)

### Option B: Import JSON (Fastest)

**We've created a `firestore-data.json` file with sample data:**

```powershell
# Install Firebase CLI (one time)
npm install -g firebase-tools

# Login to your Firebase account
firebase login

# Initialize Firebase in your project
firebase init

# Import the data
firebase firestore:delete collections --recursive
firebase firestore:import firestore-data.json --project your-project-id
```

**Or use the Web UI import:**
1. In Firestore, click **⋮ (menu)** → **Backups and imports** → **Restore from file**
2. Upload `firestore-data.json`

The `firestore-data.json` file includes sample editions and owners ready to import!

