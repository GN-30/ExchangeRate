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
    const [tripLoading, setTripLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [formData, setFormData] = useState({ 
        category: 'Food', 
        amount_inr: '', 
        amount_local: '', 
        description: '', 
        date: new Date().toISOString().split('T')[0] 
    });

    useEffect(() => {
        const initialise = async () => {
            const trip = await fetchActiveTrip();
            await fetchExpenses(trip?.id);
        };

        initialise();
    }, []);

    // Load the exact trip selected from Profile.
    // Never invent a trip id or fall back to a fake id.
    const fetchActiveTrip = async () => {
        setTripLoading(true);
        setErrorMessage('');

        let loadedTrip = null;

        try {
            const token = sessionStorage.getItem('token');
            const activeId = sessionStorage.getItem('active_trip_id');

            if (token && activeId && activeId !== 'null' && activeId !== 'undefined') {
                const res = await axios.get(
                    `${API_BASE}/trips/${activeId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (res.data?.id) {
                    loadedTrip = res.data;
                    sessionStorage.setItem(
                        'active_trip_id',
                        String(res.data.id)
                    );
                }
            }
        } catch (e) {
            console.error('Failed to fetch selected trip:', e);
        }

        // If Profile did not provide an active trip, get the user's latest
        // real database trip. This endpoint must return a trip with an id.
        if (!loadedTrip) {
            try {
                const token = sessionStorage.getItem('token');

                if (token) {
                    const res = await axios.get(
                        `${API_BASE}/trips/latest`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    if (res.data?.id) {
                        loadedTrip = res.data;
                        sessionStorage.setItem(
                            'active_trip_id',
                            String(res.data.id)
                        );
                    }
                }
            } catch (e) {
                console.error('Failed to fetch latest trip:', e);
            }
        }

        // Session data is only used if it contains a REAL database id.
        if (!loadedTrip) {
            try {
                const sessionRaw =
                    sessionStorage.getItem('voyage_latest_trip');

                if (sessionRaw) {
                    const sessionTrip = JSON.parse(sessionRaw);

                    if (sessionTrip?.id) {
                        loadedTrip = sessionTrip;
                        sessionStorage.setItem(
                            'active_trip_id',
                            String(sessionTrip.id)
                        );
                    }
                }
            } catch (sErr) {
                console.error('Failed to load session trip:', sErr);
            }
        }

        if (loadedTrip?.id) {
            setLatestTrip(loadedTrip);
        } else {
            setLatestTrip(null);
            setErrorMessage(
                'No saved trip was found. Please generate a trip or select one from your Profile.'
            );
        }

        setTripLoading(false);
        return loadedTrip;
    };

    const fetchExpenses = async (tripId = null) => {
        try {
            const token = sessionStorage.getItem('token');
            const activeId =
                tripId ||
                sessionStorage.getItem('active_trip_id');

            if (
                !token ||
                !activeId ||
                activeId === 'null' ||
                activeId === 'undefined'
            ) {
                setExpenses([]);
                return;
            }

            const res = await axios.get(
                `${API_BASE}/expenses?tripId=${encodeURIComponent(activeId)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (Array.isArray(res.data)) {
                setExpenses(res.data);
            }
        } catch (e) {
            console.error('Failed to load expenses:', e);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();

        if (saving) return;

        setMessage('');
        setErrorMessage('');

        try {
            const token = sessionStorage.getItem('token');
            const activeId =
                sessionStorage.getItem('active_trip_id') ||
                latestTrip?.id;

            // A real DB trip id is mandatory for a persisted expense.
            if (!token) {
                setErrorMessage('Please log in before recording an expense.');
                return;
            }

            if (
                !activeId ||
                activeId === 'null' ||
                activeId === 'undefined'
            ) {
                setErrorMessage(
                    'No active trip is selected. Go to Profile and choose "Track Expenses for this Trip".'
                );
                return;
            }

            if (!latestTrip?.id) {
                setErrorMessage(
                    'The selected trip could not be verified. Please return to Profile and select the trip again.'
                );
                return;
            }

            // Make sure the expense is attached to the same real trip
            // currently shown in the page.
            const tripId = String(activeId);

            if (String(latestTrip.id) !== tripId) {
                setErrorMessage(
                    'The selected trip changed. Please return to Profile and open this trip again.'
                );
                return;
            }

            setSaving(true);

            const payload = {
                category: formData.category,
                amount_inr: Number(formData.amount_inr),
                amount_local: Number(formData.amount_local),
                description:
                    formData.description?.trim() ||
                    formData.category,
                date: formData.date,
                trip_id: tripId
            };

            const response = await axios.post(
                `${API_BASE}/expenses`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // The backend response is the source of truth.
            const createdExpense = response.data;

            setExpenses(prev => [
                createdExpense,
                ...prev
            ]);

            setFormData(prev => ({
                ...prev,
                amount_inr: '',
                amount_local: '',
                description: ''
            }));

            setMessage('Expense recorded successfully.');

            // Keep Recent Activity in sync with the saved DB record.
            window.dispatchEvent(
                new CustomEvent('voyage-expense-recorded', {
                    detail: {
                        ...createdExpense,
                        trip_id: tripId
                    }
                })
            );

            // Refresh from DB so the list exactly matches the server.
            await fetchExpenses(tripId);

        } catch (e) {
            console.error(
                'Expense creation error:',
                e.response?.data || e.message
            );

            const serverMessage =
                e.response?.data?.error ||
                e.response?.data?.message;

            if (e.response?.status === 404) {
                setErrorMessage(
                    serverMessage ||
                    'This trip no longer exists. Please return to Profile and select a saved trip.'
                );
            } else if (e.response?.status === 400) {
                setErrorMessage(
                    serverMessage ||
                    'Please check the expense details and try again.'
                );
            } else {
                setErrorMessage(
                    serverMessage ||
                    'Unable to record the expense. Please try again.'
                );
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = sessionStorage.getItem('token');

            await axios.delete(
                `${API_BASE}/expenses/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            await fetchExpenses(latestTrip?.id);
            setMessage('Expense removed.');

        } catch (e) {
            console.error('Failed to delete expense:', e);
            setErrorMessage(
                e.response?.data?.error ||
                'Failed to delete expense.'
            );
        }
    };

    // Aggregate expenses for chart
    const plannedData = latestTrip ? {
        Food: Math.round(latestTrip.breakdown?.food || 0),
        Stay: Math.round(latestTrip.breakdown?.stay || 0),
        Transport: Math.round(latestTrip.breakdown?.transport || 0),
        Activities: Math.round(
            latestTrip.breakdown?.activities ||
            latestTrip.breakdown?.experiences ||
            0
        )
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

    const getExchangeRate = () => {
        const rate = Number(
            latestTrip?.exchange_rate ??
            latestTrip?.rate ??
            1
        );

        return Number.isFinite(rate) && rate > 0 ? rate : 1;
    };

    const handleInrChange = (e) => {
        const inr = e.target.value;
        const local =
            (latestTrip && inr)
                ? (parseFloat(inr) * getExchangeRate()).toFixed(2)
                : '';

        setFormData({
            ...formData,
            amount_inr: inr,
            amount_local: local
        });
    };

    const handleLocalChange = (e) => {
        const local = e.target.value;
        const inr =
            (latestTrip && local)
                ? (parseFloat(local) / getExchangeRate()).toFixed(2)
                : '';

        setFormData({
            ...formData,
            amount_inr: inr,
            amount_local: local
        });
    };

    return (
        <div className="fade-in" style={{ display: 'grid', gap: '2.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            
            {/* OVERVIEW HEADER CARD */}
            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '2.5rem' }}>
                <div>
                    <h2 className="premium-gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: '800' }}>
                        Financial Overview
                    </h2>
                    {tripLoading ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                            Loading your selected trip...
                        </p>
                    ) : latestTrip ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '1.05rem' }}>
                            <span style={{ background: 'var(--bg-main)', padding: '0.8rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Active Plan:
                                <strong style={{ color: 'var(--text-main)' }}>
                                    {latestTrip.destination_country || latestTrip.destination}
                                </strong>
                            </span>

                            <span style={{ background: 'rgba(52, 211, 153, 0.12)', padding: '0.8rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Target Budget:
                                <strong style={{ color: 'var(--text-main)' }}>
                                    ₹{Number(latestTrip.budget_inr || latestTrip.budgetINR || 0).toLocaleString()}
                                </strong>
                            </span>

                            <span style={{ background: 'var(--bg-main)', padding: '0.8rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Local Currency:
                                <strong style={{ color: 'var(--text-main)' }}>
                                    {latestTrip.currency_code || latestTrip.currencyCode || 'INR'}
                                </strong>
                                {' '}
                                (1 INR = {Number(latestTrip.exchange_rate || latestTrip.rate || 1).toFixed(4)} {latestTrip.currency_code || latestTrip.currencyCode || 'INR'})
                            </span>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                            No saved trip selected. Open Profile and choose a trip to track its expenses.
                        </p>
                    )}

                    {message && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.8rem 1rem',
                            borderRadius: '0.8rem',
                            background: 'rgba(16, 185, 129, 0.10)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            color: '#10b981',
                            fontWeight: 700
                        }}>
                            {message}
                        </div>
                    )}

                    {errorMessage && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.8rem 1rem',
                            borderRadius: '0.8rem',
                            background: 'rgba(239, 68, 68, 0.10)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            fontWeight: 700
                        }}>
                            {errorMessage}
                        </div>
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
                <form
                    onSubmit={handleAdd}
                    style={{
                        display: 'grid',
                        gap: '1.25rem',
                        opacity: (!latestTrip || tripLoading) ? 0.72 : 1
                    }}
                >
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
                                    Local Amount ({latestTrip ? (latestTrip.currency_code || latestTrip.currencyCode || 'INR') : 'Currency'})
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
                    <button
                        type="submit"
                        className="glow-btn"
                        disabled={saving || tripLoading || !latestTrip}
                        style={{
                            height: '3.5rem',
                            borderRadius: '1rem',
                            fontSize: '1.1rem',
                            marginTop: '0.5rem',
                            opacity: (saving || tripLoading || !latestTrip) ? 0.6 : 1,
                            cursor: (saving || tripLoading || !latestTrip) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Plus size={20} color="#ffffff" />
                        {saving ? ' Saving Expense...' : ' Record Expense Item'}
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
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {exp.amount_local} {latestTrip?.currency_code || latestTrip?.currencyCode || 'Local'}
                                        </div>
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
