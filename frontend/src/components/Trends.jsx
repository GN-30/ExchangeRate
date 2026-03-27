import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Search } from 'lucide-react';

const Trends = () => {
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('United States');
    const [loading, setLoading] = useState(false);
    
    // Autocomplete states
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    const fetchTrends = async (query) => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/history/rates/${encodeURIComponent(query)}`);
            setData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrends(searchTerm);
    }, []);

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
            setSuggestions([]);
        }
    }, []);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        if (searchTimeout) clearTimeout(searchTimeout);
        
        if (value.length >= 3) {
            const timeoutId = setTimeout(() => {
                fetchSuggestions(value);
            }, 500);
            setSearchTimeout(timeoutId);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (suggestion) => {
        const query = suggestion.display_name;
        setSearchTerm(query);
        setSuggestions([]);
        setShowSuggestions(false);
        fetchTrends(query);
    };

    return (
        <div className="fade-in glass-card">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="premium-gradient-text" style={{ fontSize: '2rem' }}>Exchange Rate Trends</h2>
                <div style={{ position: 'relative', display: 'flex', flex: 1, minWidth: '250px', maxWidth: '400px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={handleSearchChange}
                        onKeyDown={(e) => { if(e.key === 'Enter') { fetchTrends(searchTerm); setShowSuggestions(false); } }}
                        placeholder="Search any country (e.g. Indonesia)"
                        style={{ 
                            width: '100%', 
                            padding: '0.8rem 1rem 0.8rem 3.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '2rem',
                            color: 'white',
                            fontSize: '1.05rem',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <ul style={{ 
                            position: 'absolute', 
                            top: '100%', left: 0, right: 0, 
                            background: 'var(--bg-dark)', 
                            border: '1px solid var(--glass-border)',
                            borderRadius: '1rem',
                            marginTop: '0.5rem',
                            zIndex: 10,
                            maxHeight: '250px',
                            overflowY: 'auto',
                            listStyle: 'none',
                            padding: '0.5rem 0',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                        }}>
                            {suggestions.map((s, i) => (
                                <li 
                                    key={i} 
                                    onClick={() => handleSelectSuggestion(s)}
                                    style={{ 
                                        padding: '0.8rem 1.5rem', cursor: 'pointer',
                                        borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid var(--glass-border)',
                                        fontSize: '0.95rem', transition: 'background 0.2s',
                                        color: '#cbd5e1'
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
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading trends...</div>
            ) : (
                <div style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#ec4899" />
                                    <stop offset="33%" stopColor="#8b5cf6" />
                                    <stop offset="66%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                stroke="#94a3b8" 
                                minTickGap={20} 
                                tick={{ fontSize: 12, fill: '#cbd5e1' }} 
                            />
                            <YAxis 
                                domain={['auto', 'auto']} 
                                stroke="#94a3b8" 
                                tick={{ fontSize: 12, fill: '#cbd5e1' }} 
                                width={80} 
                                tickFormatter={(val) => val.toFixed(4)} 
                                padding={{ top: 20, bottom: 20 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#ec4899', fontWeight: 'bold' }}
                                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="rate" 
                                stroke="url(#colorGradient)" 
                                strokeWidth={4} 
                                connectNulls={true}
                                dot={{ fill: '#0f172a', r: 4, strokeWidth: 2, stroke: '#8b5cf6' }}
                                activeDot={{ r: 8, strokeWidth: 3, stroke: '#fff', fill: '#ec4899' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default Trends;
