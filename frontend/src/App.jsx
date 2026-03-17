import React, { useState } from 'react';
import axios from 'axios';
import TravelForm from './components/TravelForm';
import Dashboard from './components/Dashboard';
import { Plane } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCalculate = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/calculate`, formData);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to calculate budget. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '4rem', paddingTop: '2rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '1rem', marginBottom: '1.5rem' }}>
          <Plane size={48} color="var(--primary)" />
        </div>
        <h1 className="premium-gradient-text" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>AI Travel Planner</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>Smart currency conversion and budget breakdowns for your next trip.</p>
      </header>

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

      <footer style={{ marginTop: '8rem', textAlign: 'center', color: 'var(--text-muted)', paddingBottom: '4rem' }}>
        <p>© 2026 AI Travel Currency Planner. Powered by Real-time Exchange Rates.</p>
      </footer>
    </div>
  );
}

export default App;
