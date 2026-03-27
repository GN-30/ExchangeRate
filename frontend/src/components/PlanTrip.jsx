import React, { useState } from 'react';
import axios from 'axios';
import TravelForm from './TravelForm';
import Dashboard from './Dashboard';
import { Plane } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const PlanTrip = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      
      if (response.data.id) {
          localStorage.setItem('active_trip_id', response.data.id);
      }
      
      localStorage.setItem('voyage_latest_trip', JSON.stringify(tripForStorage));
    } catch (err) {
      console.error(err);
      setError('Failed to calculate budget. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 className="premium-gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Generate New Itinerary</h2>
        <p style={{ color: 'var(--text-muted)' }}>Fill in the details below to deploy your AI travel agent.</p>
      </header>

      <main style={{ display: 'grid', gap: '4rem' }}>
        {!result || loading ? (
          <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <TravelForm onSubmit={handleCalculate} loading={loading} />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
               <button onClick={() => setResult(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '0.5rem 1.5rem', color: 'white' }}>
                 ← Draft Another Trip
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
    </div>
  );
};

export default PlanTrip;
