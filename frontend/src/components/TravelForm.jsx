import React, { useState, useEffect, useCallback } from 'react';
import { Send, MapPin, Calendar, Wallet, Users, Search } from 'lucide-react';
import axios from 'axios';

const TravelForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    destination: '',
    days: 7,
    budgetINR: 50000,
    travelType: 'budget'
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}`);
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Failed to fetch suggestions');
      setSuggestions([]);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'destination') {
      // Clear previous timeout
      if (searchTimeout) clearTimeout(searchTimeout);
      
      if (value.length >= 3) {
        // Set new timeout for debouncing (500ms)
        const timeoutId = setTimeout(() => {
          fetchSuggestions(value);
        }, 500);
        setSearchTimeout(timeoutId);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setFormData(prev => ({ ...prev, destination: suggestion.display_name }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.destination.trim()) return;
    onSubmit(formData);
  };

  return (
    <div className="glass-ticket fade-in" style={{ cursor: 'default' }}>
      <h2 className="premium-gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2.5rem' }}>Plan Your Adventure</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="form-group" style={{ position: 'relative' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
            <MapPin size={20} /> Destination Target
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              name="destination" 
              value={formData.destination} 
              onChange={handleChange} 
              placeholder="e.g. Paris, Tokyo, Goa, London"
              autoComplete="off"
              required
              style={{ width: '100%', height: '4rem', paddingRight: '2.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.1rem' }}
            />
            <Search size={22} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              background: 'var(--bg-dark)', 
              border: '1px solid var(--glass-border)',
              borderRadius: '0.75rem',
              marginTop: '0.5rem',
              zIndex: 10,
              maxHeight: '200px',
              overflowY: 'auto',
              listStyle: 'none',
              padding: '0.5rem 0'
            }}>
              {suggestions.map((s, i) => (
                <li 
                  key={i} 
                  onClick={() => handleSelectSuggestion(s)}
                  style={{ 
                    padding: '0.75rem 1rem', 
                    cursor: 'pointer', 
                    borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid var(--glass-border)',
                    fontSize: '0.9rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
            <Calendar size={20} /> Duration (Days)
          </label>
          <input type="number" name="days" value={formData.days} onChange={handleChange} min="1" style={{ width: '100%', height: '4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.1rem' }} />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
            <Wallet size={20} /> Target Budget (INR)
          </label>
          <input type="number" name="budgetINR" value={formData.budgetINR} onChange={handleChange} min="1000" style={{ width: '100%', height: '4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.1rem' }} />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
            <Users size={20} /> Travel Style
          </label>
          <select name="travelType" value={formData.travelType} onChange={handleChange} style={{ width: '100%', height: '4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.1rem' }}>
            <option value="budget" style={{ background: 'var(--bg-dark)' }}>Budget Constraints</option>
            <option value="luxury" style={{ background: 'var(--bg-dark)' }}>Absolute Luxury</option>
            <option value="family" style={{ background: 'var(--bg-dark)' }}>Family Friendly</option>
            <option value="solo" style={{ background: 'var(--bg-dark)' }}>Solo Backpacker</option>
          </select>
        </div>

        <button className="glow-btn" type="submit" disabled={loading || !formData.destination.trim()} style={{ marginTop: '1.5rem', height: '4rem', fontSize: '1.2rem', borderRadius: '1rem' }}>
          {loading ? 'Crunching AI Data...' : (
            <>
              Generate Itinerary <Send size={22} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TravelForm;
