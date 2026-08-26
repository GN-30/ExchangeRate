import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Tag, Wallet, Globe, FileText, Calendar, ChevronDown, Sparkles, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE from '../api';

const ExpenseTracker = () => {
    const { user } = useContext(AuthContext);
    const [latestTrip, setLatestTrip] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [formData, setFormData] = useState({ 
        category: 'Food', 
        amount_inr: '', 
        amount_local: '', 
        description: '', 
        date: new Date().toISOString().split('T')[0] 
    });

    useEffect(() => {
        fetchLatestTrip().then(() => fetchExpenses());
    }, []);

    const fetchLatestTrip = async () => {
        let loadedTrip = null;
        try {
            const token = sessionStorage.getItem('token');
            const activeId = sessionStorage.getItem('active_trip_id') || 'latest';
            if (token) {
                const res = await axios.get(`${API_BASE}/trips/${activeId}`, { headers: { Authorization: `Bearer ${token}` }});
                if (res.data) {
                    loadedTrip = res.data;
                    if (res.data.id) sessionStorage.setItem('active_trip_id', res.data.id);
                }
            }
        } catch (e) {
            console.error('Failed to fetch trip from API', e);
        }

        if (!loadedTrip) {
            try {
                const sessionRaw = sessionStorage.getItem('voyage_latest_trip');
                if (sessionRaw) {
                    loadedTrip = JSON.parse(sessionRaw);
                }
            } catch (sErr) {
                console.error('Failed to load session trip:', sErr);
            }
        }

        if (loadedTrip) {
            setLatestTrip(loadedTrip);
        }
    };

    const fetchExpenses = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const activeId = sessionStorage.getItem('active_trip_id');
            if (token && activeId) {
                const res = await axios.get(`${API_BASE}/expenses?tripId=${activeId}`, { headers: { Authorization: `Bearer ${token}` }});
                if (Array.isArray(res.data)) {
                    setExpenses(res.data);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('token');
            const activeId = sessionStorage.getItem('active_trip_id') || latestTrip?.id;
            
            if (token && activeId) {
                await axios.post(`${API_BASE}/expenses`, { ...formData, trip_id: activeId }, { headers: { Authorization: `Bearer ${token}` }});
                fetchExpenses();
            } else {
                // Local session fallback for offline/guest trip expense logging
                const newLocalExpense = {
                    id: Date.now(),
                    category: formData.category,
                    amount_inr: formData.amount_inr,
                    amount_local: formData.amount_local,
                    description: formData.description || formData.category,
                    date: formData.date
                };
                setExpenses(prev => [newLocalExpense, ...prev]);
            }
            setFormData({ ...formData, amount_inr: '', amount_local: '', description: '' });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.delete(`${API_BASE}/expenses/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            fetchExpenses();
        } catch (e) {
            console.error(e);
        }
    };

    // Aggregate expenses for chart
    const plannedData = latestTrip ? {
        Food: Math.round(latestTrip.breakdown?.food || 0),
        Stay: Math.round(latestTrip.breakdown?.stay || 0),
        Transport: Math.round(latestTrip.breakdown?.transport || 0),
        Activities: Math.round(latestTrip.breakdown?.activities || 0)
    } : { Food: 15000, Stay: 20000, Transport: 10000, Activities: 5000 };

    const actualData = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount_inr);
        return acc;
    }, {});

    const chartData = Object.keys(plannedData).map(key => ({
        name: key,
        Planned: plannedData[key],
        Actual: actualData[key] || 0
    }));

    const handleInrChange = (e) => {
        const inr = e.target.value;
        const local = (latestTrip && inr) ? (parseFloat(inr) * Number(latestTrip.exchange_rate)).toFixed(2) : '';
        setFormData({ ...formData, amount_inr: inr, amount_local: local });
    };

    const handleLocalChange = (e) => {
        const local = e.target.value;
        const inr = (latestTrip && local) ? (parseFloat(local) / Number(latestTrip.exchange_rate)).toFixed(2) : '';
        setFormData({ ...formData, amount_inr: inr, amount_local: local });
    };

    return (
        <div className="fade-in" style={{ display: 'grid', gap: '2.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            
            {/* OVERVIEW HEADER CARD */}
            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '2.5rem' }}>
                <div>
                    <h2 className="premium-gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: '800' }}>
                        Financial Overview
                    </h2>
                    {latestTrip ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '1.05rem' }}>
                            <span style={{ background: 'var(--bg-main)', padding: '0.8rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Active Plan: <strong style={{ color: 'var(--text-main)' }}>{latestTrip.destination_country}</strong>
                            </span>
                            <span style={{ background: 'rgba(52, 211, 153, 0.12)', padding: '0.8rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Target Budget: <strong style={{ color: 'var(--text-main)' }}>₹{Number(latestTrip.budget_inr).toLocaleString()}</strong>
                            </span>
                            <span style={{ background: 'var(--bg-main)', padding: '0.8rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Local Currency: <strong style={{ color: 'var(--text-main)' }}>{latestTrip.currency_code}</strong> (1 INR = {Number(latestTrip.exchange_rate).toFixed(4)} {latestTrip.currency_code})
                            </span>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No trip planned yet. Showing example budget data.</p>
                    )}
                </div>
            </div>

            {/* BAR CHART CARD */}
            <div className="glass-card" style={{ padding: '2.5rem' }}>
                <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Receipt color="var(--primary)" size={28} /> Planned vs Actual Spending (INR)
                </h2>
                <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                            <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: 'var(--text-main)' }} itemStyle={{ color: 'var(--text-main)' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="Planned" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={40} />
                            <Bar dataKey="Actual" fill="var(--accent)" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* TWO COLUMN SECTION: FIELD CARDS FORM & ACTIVITY LIST */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
                
                {/* FORM CONTAINER WITH INDIVIDUAL ANIMATED FIELD CARDS */}
                <form onSubmit={handleAdd} style={{ display: 'grid', gap: '1.25rem' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Sparkles color="var(--primary)" size={24} /> Record Expense
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Add a new expense item with live conversion</p>
                    </div>

                    {/* FIELD CARD 1: CATEGORY DROPDOWN */}
                    <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="glass-card" 
                        style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <motion.div 
                                animate={{ rotate: [0, -10, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.6rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Tag size={20} color="var(--primary)" />
                            </motion.div>
                            <div>
                                <label style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', display: 'block' }}>Category</label>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Select expense type</span>
                            </div>
                        </div>

                        {/* ATTRACTIVE CUSTOM GLASS DROPDOWN */}
                        <div style={{ position: 'relative', width: '100%', marginTop: '0.25rem' }}>
                            <select 
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})} 
                                style={{ 
                                    width: '100%',
                                    height: '3.25rem', 
                                    background: 'var(--bg-main)', 
                                    color: 'var(--text-main)', 
                                    padding: '0 2.5rem 0 1.2rem', 
                                    borderRadius: '0.85rem', 
                                    border: '1.5px solid var(--glass-border)', 
                                    outline: 'none',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                                }}
                            >
                                <option value="Food">🍔 Food & Dining</option>
                                <option value="Stay">🏨 Hotel & Lodging</option>
                                <option value="Transport">🚕 Transport & Transit</option>
                                <option value="Activities">🎟️ Activities & Sightseeing</option>
                            </select>
                            <ChevronDown size={18} color="var(--primary)" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                    </motion.div>

                    {/* FIELD CARD 2: AMOUNT (INR) */}
                    <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="glass-card" 
                        style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <motion.div 
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Wallet size={20} color="#10b981" />
                            </motion.div>
                            <div>
                                <label style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', display: 'block' }}>Amount in INR (₹)</label>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Enter Indian Rupee value</span>
                            </div>
                        </div>
                        <input 
                            type="number" 
                            placeholder="₹ 0.00" 
                            value={formData.amount_inr} 
                            onChange={handleInrChange} 
                            required 
                            step="0.01" 
                            style={{ 
                                width: '100%',
                                height: '3.25rem', 
                                background: 'var(--bg-main)', 
                                color: 'var(--text-main)', 
                                padding: '0 1.2rem', 
                                borderRadius: '0.85rem', 
                                border: '1.5px solid var(--glass-border)', 
                                outline: 'none',
                                fontWeight: '700',
                                fontSize: '1.05rem',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                            }} 
                        />
                    </motion.div>

                    {/* FIELD CARD 3: LOCAL AMOUNT */}
                    <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="glass-card" 
                        style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <motion.div 
                                animate={{ rotate: [0, 360] }}
                                transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                                style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.6rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Globe size={20} color="#38bdf8" />
                            </motion.div>
                            <div>
                                <label style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', display: 'block' }}>
                                    Local Amount ({latestTrip ? latestTrip.currency_code : 'Currency'})
                                </label>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Auto-calculated or manual input</span>
                            </div>
                        </div>
                        <input 
                            type="number" 
                            placeholder="0.00" 
                            value={formData.amount_local} 
                            onChange={handleLocalChange} 
                            required 
                            step="0.01" 
                            style={{ 
                                width: '100%',
                                height: '3.25rem', 
                                background: 'var(--bg-main)', 
                                color: 'var(--text-main)', 
                                padding: '0 1.2rem', 
                                borderRadius: '0.85rem', 
                                border: '1.5px solid var(--glass-border)', 
                                outline: 'none',
                                fontWeight: '700',
                                fontSize: '1.05rem',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                            }} 
                        />
                    </motion.div>

                    {/* FIELD CARD 4: DESCRIPTION */}
                    <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="glass-card" 
                        style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <motion.div 
                                animate={{ y: [0, -3, 0] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.6rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <FileText size={20} color="#f59e0b" />
                            </motion.div>
                            <div>
                                <label style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', display: 'block' }}>Description</label>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>e.g., Dinner at seaside bistro</span>
                            </div>
                        </div>
                        <input 
                            type="text" 
                            placeholder="What was this expense for?" 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                            style={{ 
                                width: '100%',
                                height: '3.25rem', 
                                background: 'var(--bg-main)', 
                                color: 'var(--text-main)', 
                                padding: '0 1.2rem', 
                                borderRadius: '0.85rem', 
                                border: '1.5px solid var(--glass-border)', 
                                outline: 'none',
                                fontSize: '1rem'
                            }} 
                        />
                    </motion.div>

                    {/* FIELD CARD 5: DATE */}
                    <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="glass-card" 
                        style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <motion.div 
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                                style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '0.6rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Calendar size={20} color="#ec4899" />
                            </motion.div>
                            <div>
                                <label style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', display: 'block' }}>Date</label>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Date of transaction</span>
                            </div>
                        </div>
                        <input 
                            type="date" 
                            value={formData.date} 
                            onChange={e => setFormData({...formData, date: e.target.value})} 
                            required 
                            style={{ 
                                width: '100%',
                                height: '3.25rem', 
                                background: 'var(--bg-main)', 
                                color: 'var(--text-main)', 
                                padding: '0 1.2rem', 
                                borderRadius: '0.85rem', 
                                border: '1.5px solid var(--glass-border)', 
                                outline: 'none',
                                fontSize: '1rem'
                            }} 
                        />
                    </motion.div>

                    {/* SUBMIT BUTTON */}
                    <button type="submit" className="glow-btn" style={{ height: '3.5rem', borderRadius: '1rem', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                        <Plus size={20} color="#ffffff" /> Record Expense Item
                    </button>
                </form>

                {/* RECENT ACTIVITY CARD */}
                <div className="glass-card" style={{ maxHeight: '680px', overflowY: 'auto', padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '2rem', fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: '700' }}>Recent Activity</h3>
                    <ul style={{ listStyle: 'none', display: 'grid', gap: '1rem' }}>
                        {expenses.map(exp => (
                            <li key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', background: 'var(--bg-main)', borderRadius: '1rem', border: '1px solid var(--glass-border)', transition: 'transform 0.2s, background 0.2s', cursor: 'default' }}>
                                <div>
                                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>{exp.category}</strong>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{exp.description} <span style={{ opacity: 0.7 }}>• {new Date(exp.date).toLocaleDateString()}</span></p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-main)' }}>₹{exp.amount_inr}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exp.amount_local} {latestTrip?.currency_code || 'Local'}</div>
                                    </div>
                                    <button onClick={() => handleDelete(exp.id)} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                </div>
                            </li>
                        ))}
                        {expenses.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No expenses recorded yet.</p>}
                    </ul>
                </div>

            </div>
        </div>
    );
};

export default ExpenseTracker;
