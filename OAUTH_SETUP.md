# OAuth Setup Instructions

## Files Changed
```
BACKEND — replace these files:
  backend/package.json               ← added passport packages
  backend/server.js                  ← added passport.initialize()
  backend/models/User.js             ← added googleId, githubId, avatar fields
  backend/controllers/authController.js  ← handles OAuth users on login
  backend/routes/authRoutes.js       ← added Google + GitHub OAuth routes

BACKEND — add these new files:
  backend/config/passport.js         ← Google + GitHub strategies

FRONTEND — replace these files:
  frontend/src/App.jsx               ← added /oauth/success route
  frontend/src/pages/Login.jsx       ← added OAuth buttons
  frontend/src/pages/Register.jsx    ← added OAuth buttons

FRONTEND — add this new file:
  frontend/src/pages/OAuthSuccess.jsx  ← catches token after OAuth redirect
```

---

## Step 1 — Install backend packages
```powershell
cd backend
npm install
```

---

## Step 2 — Get Google OAuth Credentials
1. Go to https://console.cloud.google.com
2. Create a new project → APIs & Services → Credentials
3. Click "Create Credentials" → "OAuth 2.0 Client ID"
4. Application type: Web application
5. Add Authorized redirect URIs:
   - http://localhost:5000/api/auth/google/callback
   - https://focus-tracker-kcyj.onrender.com/api/auth/google/callback
6. Copy Client ID and Client Secret

---

## Step 3 — Get GitHub OAuth Credentials
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: FocusTracker
   - Homepage URL: https://focus-tracker-nu.vercel.app
   - Authorization callback URL: https://focus-tracker-kcyj.onrender.com/api/auth/github/callback
4. Copy Client ID and generate Client Secret

---

## Step 4 — Update backend/.env
Add these lines to your existing .env:
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
CLIENT_URL=https://focus-tracker-nu.vercel.app
```

For local development use:
```
CLIENT_URL=http://localhost:3000
```

---

## Step 5 — Add to Render Environment Variables
Go to Render dashboard → your backend service → Environment tab → Add:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- CLIENT_URL = https://focus-tracker-nu.vercel.app

---

## Step 6 — Push to GitHub
```powershell
git add .
git commit -m "feat: Google and GitHub OAuth login"
git push
```

---

## How OAuth Flow Works
1. User clicks "Continue with Google" on Login page
2. Browser goes to → your backend /api/auth/google
3. Redirects to Google's login page
4. User approves → Google sends back to /api/auth/google/callback
5. Backend finds or creates user → generates JWT token
6. Redirects to → /oauth/success?token=xxxxx (your frontend)
7. OAuthSuccess page saves token to localStorage
8. User lands on Dashboard ✅
