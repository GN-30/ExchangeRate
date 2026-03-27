import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
    if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

const PageTransition = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ width: '100%' }}
        >
            {children}
        </motion.div>
    );
};

function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div className="fade-in">
      <header style={{ 
          position: 'relative',
          textAlign: 'center', 
          marginBottom: '4rem', 
          padding: '5rem 2rem',
          borderRadius: '2rem',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          border: '1px solid var(--glass-border)'
      }}>
          {/* Background Image with Overlay */}
          <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: 'url("/hero-bg.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: -2,
              filter: 'brightness(1.15) contrast(1.15) saturate(1.2)'
          }} />
          <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(to bottom, rgba(2,6,23,0.2) 0%, rgba(2,6,23,0.9) 100%)',
              backdropFilter: 'blur(2px)',
              zIndex: -1
          }} />

        <div style={{ display: 'inline-flex', padding: '1.5rem', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '1.5rem', marginBottom: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <Plane size={56} color="#ffffff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
        </div>
        <h1 style={{ fontSize: '4rem', fontWeight: '800', marginBottom: '1rem', color: '#ffffff', textShadow: '0 4px 12px rgba(0,0,0,0.6)', letterSpacing: '-0.05em' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Explorer'}!
        </h1>
        <p style={{ color: '#e2e8f0', fontSize: '1.4rem', maxWidth: '700px', margin: '0 auto', textShadow: '0 2px 8px rgba(0,0,0,0.9)', fontWeight: '400', lineHeight: '1.6' }}>
          Your AI-powered travel assistant. Plan budgets, track expenses, and optimize your currency exchanges globally.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          <div className="glass-card home-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '3.5rem 2rem', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => window.location.href='/plan'}>
              <div className="card-bg-gradient plan-bg"></div>
              <Map size={56} color="#818cf8" style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} />
              <h3 style={{ marginBottom: '1rem', fontSize: '1.75rem', position: 'relative', zIndex: 1, color: '#fff' }}>Design a Journey</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem', position: 'relative', zIndex: 1, lineHeight: '1.5' }}>Use AI to craft an itinerary and calculate precise localized budgets.</p>
              <Link to="/plan" style={{ background: 'var(--primary)', padding: '1rem 2rem', borderRadius: '0.75rem', color: 'white', textDecoration: 'none', fontWeight: 'bold', position: 'relative', zIndex: 1, fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(129, 140, 248, 0.4)' }}>Plan Trip Now</Link>
          </div>

          <div className="glass-card home-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '3.5rem 2rem', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => window.location.href='/profile'}>
              <div className="card-bg-gradient prof-bg"></div>
              <Globe size={56} color="#34d399" style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} />
              <h3 style={{ marginBottom: '1rem', fontSize: '1.75rem', position: 'relative', zIndex: 1, color: '#fff' }}>Your Travels</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem', position: 'relative', zIndex: 1, lineHeight: '1.5' }}>Access all your previous plans and AI insights in your history.</p>
              <Link to="/profile" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--glass-border)', padding: '1rem 2rem', borderRadius: '0.75rem', color: 'white', textDecoration: 'none', fontWeight: 'bold', position: 'relative', zIndex: 1, fontSize: '1.1rem' }}>View Profile</Link>
          </div>

          <div className="glass-card home-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '3.5rem 2rem', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => window.location.href='/expenses'}>
              <div className="card-bg-gradient exp-bg"></div>
              <Wallet size={56} color="#f59e0b" style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} />
              <h3 style={{ marginBottom: '1rem', fontSize: '1.75rem', position: 'relative', zIndex: 1, color: '#fff' }}>Track Finances</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem', position: 'relative', zIndex: 1, lineHeight: '1.5' }}>Monitor real-time expenses against your projected trip budget.</p>
              <Link to="/expenses" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--glass-border)', padding: '1rem 2rem', borderRadius: '0.75rem', color: 'white', textDecoration: 'none', fontWeight: 'bold', position: 'relative', zIndex: 1, fontSize: '1.1rem' }}>Open Tracker</Link>
          </div>
      </div>
    </div>
  );
}

function AppContent() {
    const location = useLocation();

    return (
        <>
            <div className="ambient-orb orb-1"></div>
            <div className="ambient-orb orb-2"></div>
            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <Navigation />
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                    <Route path="/register" element={<PageTransition><Signup /></PageTransition>} />
                    <Route path="/" element={<ProtectedRoute><PageTransition><Home /></PageTransition></ProtectedRoute>} />
                    <Route path="/plan" element={<ProtectedRoute><PageTransition><PlanTrip /></PageTransition></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
                    <Route path="/expenses" element={<ProtectedRoute><PageTransition><ExpenseTracker /></PageTransition></ProtectedRoute>} />
                    <Route path="/trends" element={<ProtectedRoute><PageTransition><Trends /></PageTransition></ProtectedRoute>} />
                    <Route path="/alerts" element={<ProtectedRoute><PageTransition><Alerts /></PageTransition></ProtectedRoute>} />
                </Routes>
            </AnimatePresence>
            
            <Chatbot />

            <footer style={{ marginTop: '8rem', textAlign: 'center', color: 'var(--text-muted)', paddingBottom: '4rem' }}>
              <p>© 2026 VoyageAI. Powered by Real-time Data & Intelligence.</p>
            </footer>
        </div>
        </>
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
