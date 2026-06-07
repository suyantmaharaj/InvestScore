# INvestScore

SDG Scorecard Platform for Sanlam Investments — Twin Transition Challenge 2026

## Setup

### Prerequisites
- Node.js 18+
- Firebase project with Firestore and Authentication enabled
- Anthropic API key

### 1. Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in your Firebase config values
npm run dev
```
Runs on http://localhost:3000

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in Firebase service account and Anthropic key
npm run dev
```
Runs on http://localhost:4000

### 3. Seed demo data
```bash
cd backend
npm run seed
```
This creates the seeded Firebase users and company data listed in CREDENTIALS.https

## Demo Login Credentials
See CREDENTIALS.https in the project root.

## Architecture
- `frontend/`  — Next.js App Router
- `backend/`   — Node.js + Express REST API
- Firebase     — Auth + Firestore database
- Claude API   — AI coaching and narrative features
