import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import axios from 'axios';
import PlanTrip from './components/PlanTrip';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ExpenseTracker from './components/ExpenseTracker';
import Trends from './components/Trends';
import Alerts from './components/Alerts';
import Chatbot from './components/Chatbot';
import { Plane, Compass, Wallet, Map, Globe, Shield } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div className="fade-in">
      <header style={{ textAlign: 'center', marginBottom: '4rem', paddingTop: '2rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '1rem', marginBottom: '1.5rem' }}>
          <Plane size={48} color="var(--primary)" />
        </div>
        <h1 className="premium-gradient-text" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Explorer'}!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          Your AI-powered travel assistant. Plan budgets, track expenses, and optimize your currency exchanges globally.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem', transition: 'transform 0.3s', cursor: 'pointer' }} onClick={() => window.location.href='/plan'}>
              <Map size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
              <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Design a Journey</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Use AI to craft an itinerary and calculate precise localized budgets.</p>
              <Link to="/plan" style={{ background: 'var(--primary)', padding: '0.8rem 1.5rem', borderRadius: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Plan Trip Now</Link>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem', transition: 'transform 0.3s', cursor: 'pointer' }} onClick={() => window.location.href='/profile'}>
              <Globe size={48} color="#10b981" style={{ marginBottom: '1.5rem' }} />
              <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Your Travels</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Access all your previous plans and AI insights in your history.</p>
              <Link to="/profile" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.8rem 1.5rem', borderRadius: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>View Profile</Link>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem', transition: 'transform 0.3s', cursor: 'pointer' }} onClick={() => window.location.href='/expenses'}>
              <Wallet size={48} color="#f59e0b" style={{ marginBottom: '1.5rem' }} />
              <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Track Finances</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Monitor real-time expenses against your projected trip budget.</p>
              <Link to="/expenses" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.8rem 1.5rem', borderRadius: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Open Tracker</Link>
          </div>
      </div>
    </div>
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
                <Route path="/plan" element={<ProtectedRoute><PlanTrip /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute><ExpenseTracker /></ProtectedRoute>} />
                <Route path="/trends" element={<ProtectedRoute><Trends /></ProtectedRoute>} />
                <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            </Routes>
            
            <Chatbot />

            <footer style={{ marginTop: '8rem', textAlign: 'center', color: 'var(--text-muted)', paddingBottom: '4rem' }}>
              <p>© 2026 VoyageAI. Powered by Real-time Data & Intelligence.</p>
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
