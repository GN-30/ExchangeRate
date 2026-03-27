import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, MapPin, ChevronDown, ChevronUp, User } from 'lucide-react';
import Itinerary from './Itinerary'; 

const Profile = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get('http://localhost:5000/api/history', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="fade-in" style={{ display: 'grid', gap: '2rem' }}>
            <h2 className="premium-gradient-text" style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <User size={32} color="var(--primary)" /> Your Travel Portfolio
            </h2>
            
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading records...</div>
            ) : history.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <MapPin size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '1.5rem', display: 'inline-block' }} />
                    <h3 style={{ marginBottom: '1rem' }}>No adventures logged yet</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Head over to the Plan Trip page to deploy your AI travel agent.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {history.map((trip) => (
                        <div key={trip.id} className="glass-card" style={{ cursor: 'pointer', transition: 'transform 0.2s', padding: '1.5rem 2rem' }} onClick={() => toggleExpand(trip.id)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', marginBottom: '0.5rem' }}>
                                        {trip.destination_country}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={16} /> {new Date(trip.created_at).toLocaleDateString()}
                                        </span>
                                        <span>• {trip.days} Days</span>
                                        <span>• Budget: ₹{Number(trip.budget_inr).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div style={{ color: 'var(--primary)' }}>
                                    {expandedId === trip.id ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
                                </div>
                            </div>
                            
                            {expandedId === trip.id && (
                                <div className="fade-in" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1rem' }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Calculated Total in {trip.currency_code}</p>
                                            <h4 style={{ fontSize: '1.5rem', color: '#10b981' }}>{trip.currency_code} {Math.round(trip.converted_budget).toLocaleString()}</h4>
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Rate at the time: {Number(trip.exchange_rate).toFixed(4)}</p>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1rem' }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Travel Style</p>
                                            <h4 style={{ fontSize: '1.5rem', textTransform: 'capitalize', color: '#f59e0b' }}>{trip.travel_type}</h4>
                                        </div>
                                    </div>
                                    
                                    <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                                        <h4 style={{ marginBottom: '1.2rem', color: 'var(--primary)', fontSize: '1.2rem' }}>AI Spending Blueprint</h4>
                                        <ul style={{ listStyle: 'none', display: 'grid', gap: '1rem' }}>
                                            {trip.suggestions && trip.suggestions.map((s, i) => (
                                                <li key={i} style={{ color: 'var(--text-main)', fontSize: '0.95rem', paddingLeft: '1rem', borderLeft: '3px solid var(--primary)', lineHeight: '1.6' }}>{s}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {trip.itinerary && (
                                        <Itinerary 
                                            itinerary={trip.itinerary} 
                                            currencySymbol={trip.currency_code === 'INR' ? '₹' : trip.currency_code} 
                                            destination={trip.destination_country}
                                            country={trip.destination_country}
                                            dailyBudget={trip.converted_budget / trip.days}
                                            totalBudget={trip.converted_budget}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Profile;
