# AI Travel Currency Planner

A modern full-stack application for planning travel budgets with real-time currency conversion and AI-powered expense breakdowns.

## Tech Stack
- **Frontend**: React (Vite), Recharts, Lucide Icons, Glassmorphism CSS.
- **Backend**: Node.js, Express, Axios.
- **Database**: PostgreSQL (pg client).

## Prerequisites
- Node.js installed.
- PostgreSQL installed and running (optional for demo, as the app handles DB errors gracefully).

## Setup Instructions

### 1. Backend Setup
1. Open a terminal in the `backend` directory.
2. Install dependencies: `npm install`.
3. Create a `.env` file (one has been created for you).
4. (Optional) Set your `EXCHANGE_RATE_API_KEY` from [ExchangeRate-API](https://www.exchangerate-api.com/).
5. Start the server: `node server.js`.
   - The backend runs on `http://localhost:5000`.

### 2. Frontend Setup
1. Open a terminal in the `frontend` directory.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.
   - The frontend runs on `http://localhost:5173`.

## Features
- **Real-time Conversion**: INR to destination currency.
- **AI Estimation**: Smart budget breakdown based on travel type (Budget, Luxury, etc.).
- **Visual Charts**: Interactive pie charts for spending categories.
- **Smart Suggestions**: Contextual travel tips.
- **Premium UI**: Glassmorphism, animations, and dark mode.
