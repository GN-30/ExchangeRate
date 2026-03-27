import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import axios from 'axios';
import TravelForm from './components/TravelForm';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ExpenseTracker from './components/ExpenseTracker';
import Trends from './components/Trends';
import Alerts from './components/Alerts';
import Chatbot from './components/Chatbot';
import { Plane, Compass, Wallet } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const [localTrip, setLocalTrip] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('voyage_latest_trip');
    if (stored) {
      try { setLocalTrip(JSON.parse(stored)); } catch(e) {}
    }
  }, []);

  const handleCalculate = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/calculate`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(response.data);
      
      const tripForStorage = {
        destination_country: response.data.country || response.data.destination,
        days: response.data.days,
        budget_inr: response.data.budgetINR,
        currency_code: response.data.currencyCode,
        exchange_rate: response.data.rate,
        breakdown: response.data.breakdown
      };
      localStorage.setItem('voyage_latest_trip', JSON.stringify(tripForStorage));
      setLocalTrip(tripForStorage);
    } catch (err) {
      console.error(err);
      setError('Failed to calculate budget. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '1rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '1rem', marginBottom: '1.5rem' }}>
          <Plane size={48} color="var(--primary)" />
        </div>
        <h1 className="premium-gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Explorer'}!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Ready for your next adventure?</p>
      </header>

      {!result && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
                  <Wallet size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Review your overall expenses and track your spending trends.</p>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                      <Link to="/expenses" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: '500', transition: 'background 0.2s' }}>View Expenses</Link>
                      <Link to="/trends" style={{ background: 'var(--primary)', border: '1px solid transparent', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: '500', transition: 'opacity 0.2s' }}>View Trends</Link>
                  </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
                  <Compass size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ marginBottom: '1rem' }}>Recent Trip Plan</h3>
                  {localTrip ? (
                      <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem 2rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <p style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#10b981' }}>
                              {localTrip.destination_country}
                          </p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                              Budget: ₹{Number(localTrip.budget_inr).toLocaleString()} • {localTrip.days} Days
                          </p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                              Currency: {localTrip.currency_code}
                          </p>
                      </div>
                  ) : (
                      <p style={{ color: 'var(--text-muted)' }}>No recent trips planned. Start below!</p>
                  )}
              </div>
          </div>
      )}

      <main style={{ display: 'grid', gap: '4rem' }}>
        {!result || loading ? (
          <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <TravelForm onSubmit={handleCalculate} loading={loading} />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
               <button onClick={() => setResult(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '0.5rem 1.5rem' }}>
                 ← Plan Another Trip
               </button>
            </div>
            <Dashboard data={result} />
          </div>
        )}

        {error && (
          <div className="glass-card" style={{ border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', textAlign: 'center' }}>
            <p style={{ color: '#fca5a5' }}>{error}</p>
          </div>
        )}
      </main>
    </>
  );
}

function AppContent() {
    return (
        <div className="container">
            <Navigation />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Signup />} />
                <Route path="/" element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                } />
                <Route path="/expenses" element={<ProtectedRoute><ExpenseTracker /></ProtectedRoute>} />
                <Route path="/trends" element={<ProtectedRoute><Trends /></ProtectedRoute>} />
                <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            </Routes>
            
            <Chatbot />

            <footer style={{ marginTop: '8rem', textAlign: 'center', color: 'var(--text-muted)', paddingBottom: '4rem' }}>
              <p>© 2026 AI Travel Currency Planner. Powered by Real-time Exchange Rates.</p>
            </footer>
        </div>
    );
}

function App() {
  return (
    <AuthProvider>
        <Router>
            <AppContent />
        </Router>
    </AuthProvider>
  );
}

export default App;
