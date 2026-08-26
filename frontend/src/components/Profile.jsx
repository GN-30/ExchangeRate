import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, MapPin, ChevronDown, ChevronUp, User, PlaneTakeoff, Navigation, ArrowRight, Sparkles } from 'lucide-react';
import Itinerary from './Itinerary';
import API_BASE from '../api';

const Profile = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            let fetchedTrips = [];
            try {
                const token = sessionStorage.getItem('token');
                if (token) {
                    const res = await axios.get(`${API_BASE}/history`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        fetchedTrips = res.data;
                    }
                }
            } catch (err) {
                console.error("Failed to load history from DB", err);
            }

            // Fallback / merge with local session storage trip if present
            try {
                const sessionTripRaw = sessionStorage.getItem('voyage_latest_trip');
                if (sessionTripRaw) {
                    const sessionTrip = JSON.parse(sessionTripRaw);
                    const exists = fetchedTrips.some(t => t.id && sessionTrip.id && t.id === sessionTrip.id);
                    if (!exists) {
                        fetchedTrips = [
                            {
                                id: sessionTrip.id || 101,
                                destination_country: sessionTrip.destination_country || sessionTrip.destination || 'Destination',
                                days: sessionTrip.days || 3,
                                budget_inr: sessionTrip.budget_inr || sessionTrip.budgetINR || 15000,
                                travel_type: sessionTrip.travel_type || sessionTrip.travelType || 'Solo',
                                converted_budget: (sessionTrip.budget_inr || 15000) * (sessionTrip.exchange_rate || 1),
                                currency_code: sessionTrip.currency_code || 'USD',
                                exchange_rate: sessionTrip.exchange_rate || 1,
                                breakdown: sessionTrip.breakdown || {},
                                suggestions: sessionTrip.itinerary?.suggestions || [
                                    `Explore top landmarks`,
                                    `Experience local culture & dining`,
                                    `Utilize budget-friendly transit`
                                ],
                                itinerary: sessionTrip.itinerary || null,
                                created_at: new Date().toISOString()
                            },
                            ...fetchedTrips
                        ];
                    }
                }
            } catch (sErr) {
                console.error("Error reading session storage trip:", sErr);
            }

            setHistory(fetchedTrips);
            if (fetchedTrips.length > 0) {
                setExpandedId(fetchedTrips[0].id);
            }
            setLoading(false);
        };

        fetchHistory();
    }, []);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const parseJSON = (data, fallback = []) => {
        if (!data) return fallback;
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch (e) { return fallback; }
        }
        return data;
    };

    return (
        <div className="fade-in" style={{ display: 'grid', gap: '2rem', maxWidth: '1050px', margin: '0 auto', width: '100%' }}>
            <h2 className="premium-gradient-text" style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: '800' }}>
                <User size={32} color="var(--primary)" /> Your Travel Portfolio
            </h2>
            
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading records...</div>
            ) : history.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <MapPin size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '1.5rem', display: 'inline-block' }} />
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '700' }}>No adventures logged yet</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Head over to the Plan Trip page to deploy your AI travel agent.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {history.map((trip) => {
                        const suggestionsList = parseJSON(trip.suggestions, [
                            "Explore iconic local landmarks",
                            "Enjoy regional cuisine & street food",
                            "Use public transit for efficient travel"
                        ]);
                        const itineraryObj = parseJSON(trip.itinerary, null);
                        const displayBudget = Number(trip.converted_budget || (trip.budget_inr * (trip.exchange_rate || 1)));

                        return (
                            <div key={trip.id} className="glass-card" style={{ padding: '2rem', cursor: 'pointer' }} onClick={() => toggleExpand(trip.id)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <p style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '800', marginBottom: '0.5rem' }}>
                                            Trip ID: {String(trip.id).padStart(4, '0')}
                                        </p>
                                        <h3 style={{ fontSize: '2.25rem', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '800' }}>
                                            <PlaneTakeoff color="var(--primary)" size={32} /> {trip.destination_country}
                                        </h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--glass-border)' }}>
                                                <Calendar size={16} color="var(--primary)" /> {new Date(trip.created_at || Date.now()).toLocaleDateString()}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--glass-border)' }}>
                                                <Navigation size={16} color="var(--primary)" /> {trip.days} Days
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(52, 211, 153, 0.12)', padding: '0.5rem 1rem', borderRadius: '2rem', color: '#10b981', border: '1px solid rgba(52, 211, 153, 0.3)', fontWeight: 'bold' }}>
                                                ₹{Number(trip.budget_inr).toLocaleString()} Budget
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ color: 'var(--primary)', background: 'var(--bg-main)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {expandedId === trip.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                    </div>
                                </div>
                                
                                {expandedId === trip.id && (
                                    <div className="fade-in" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                            <div style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Calculated Total in {trip.currency_code}</p>
                                                <h4 style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: '800' }}>{trip.currency_code} {Math.round(displayBudget).toLocaleString()}</h4>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Rate at the time: {Number(trip.exchange_rate).toFixed(4)}</p>
                                            </div>
                                            <div style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Travel Style</p>
                                                <h4 style={{ fontSize: '1.5rem', textTransform: 'capitalize', color: '#f59e0b', fontWeight: '800' }}>{trip.travel_type}</h4>
                                            </div>
                                        </div>
                                        
                                        <div style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
                                            <h4 style={{ marginBottom: '1.2rem', color: 'var(--primary)', fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Sparkles size={20} color="var(--primary)" /> AI Spending Blueprint & Highlights
                                            </h4>
                                            <ul style={{ listStyle: 'none', display: 'grid', gap: '1rem' }}>
                                                {Array.isArray(suggestionsList) && suggestionsList.map((s, i) => (
                                                    <li key={i} style={{ color: 'var(--text-main)', fontSize: '0.95rem', paddingLeft: '1rem', borderLeft: '3px solid var(--primary)', lineHeight: '1.6' }}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {itineraryObj && (
                                            <Itinerary 
                                                itinerary={itineraryObj} 
                                                currencySymbol={trip.currency_code === 'INR' ? '₹' : trip.currency_code} 
                                                destination={trip.destination_country}
                                                country={trip.destination_country}
                                                dailyBudget={displayBudget / trip.days}
                                                totalBudget={displayBudget}
                                            />
                                        )}

                                        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
                                            <button 
                                                className="glow-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    sessionStorage.setItem('active_trip_id', trip.id);
                                                    window.location.href = '/expenses';
                                                }}
                                                style={{ padding: '1.25rem 2.5rem', borderRadius: '1rem', fontSize: '1.15rem' }}
                                            >
                                                Track Expenses for this Trip <ArrowRight size={20} color="#ffffff" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Profile;
