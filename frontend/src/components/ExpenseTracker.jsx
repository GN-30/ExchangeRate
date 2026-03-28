import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2 } from 'lucide-react';

const ExpenseTracker = () => {
    const { user } = useContext(AuthContext);
    const [latestTrip, setLatestTrip] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [formData, setFormData] = useState({ category: 'Food', amount_inr: '', amount_local: '', description: '', date: new Date().toISOString().split('T')[0] });
    
    // Removed old mock planned data

    useEffect(() => {
        // Ensure trip context is established before fetching specific expenses
        fetchLatestTrip().then(() => fetchExpenses());
    }, []);

    const fetchLatestTrip = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const activeId = sessionStorage.getItem('active_trip_id') || 'latest';
            const res = await axios.get(`http://localhost:5000/api/trips/${activeId}`, { headers: { Authorization: `Bearer ${token}` }});
            if (res.data) {
                setLatestTrip(res.data);
                sessionStorage.setItem('active_trip_id', res.data.id);
            }
        } catch (e) {
            console.error('Failed to fetch latest trip', e);
        }
    };

    const fetchExpenses = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const activeId = sessionStorage.getItem('active_trip_id');
            const res = await axios.get(`http://localhost:5000/api/expenses?tripId=${activeId}`, { headers: { Authorization: `Bearer ${token}` }});
            setExpenses(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('token');
            const activeId = sessionStorage.getItem('active_trip_id');
            if (!activeId) return;
            
            await axios.post('http://localhost:5000/api/expenses', { ...formData, trip_id: activeId }, { headers: { Authorization: `Bearer ${token}` }});
            fetchExpenses();
            setFormData({ ...formData, amount_inr: '', amount_local: '', description: '' });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/expenses/${id}`, { headers: { Authorization: `Bearer ${token}` }});
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
    } : { Food: 15000, Stay: 20000, Transport: 10000, Activities: 5000 }; // Default mock if no trip

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
        <div className="fade-in" style={{ display: 'grid', gap: '2.5rem' }}>
            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '3rem' }}>
                <div>
                    <h2 className="premium-gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Financial Overview</h2>
                    {latestTrip ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                Active Plan: <strong style={{ color: '#fff' }}>{latestTrip.destination_country}</strong>
                            </span>
                            <span style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '0.8rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(52, 211, 153, 0.2)', color: 'var(--accent)' }}>
                                Target Budget: <strong style={{ color: '#fff' }}>₹{Number(latestTrip.budget_inr).toLocaleString()}</strong>
                            </span>
                            <span style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.8rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                                Local Currency: <strong style={{ color: '#fff' }}>{latestTrip.currency_code}</strong> (1 INR = {Number(latestTrip.exchange_rate).toFixed(4)} {latestTrip.currency_code})
                            </span>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No trip planned yet. Showing example budget data.</p>
                    )}
                </div>
            </div>

            <div className="glass-card" style={{ padding: '2.5rem' }}>
                <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem', color: '#f8fafc' }}>Planned vs Actual Spending (INR)</h2>
                <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                            <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#fff' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="Planned" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={40} />
                            <Bar dataKey="Actual" fill="var(--accent)" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid">
                <div className="glass-card" style={{ padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '2rem', fontSize: '1.8rem', color: '#f8fafc' }}>Add Expense</h3>
                    <form onSubmit={handleAdd} style={{ display: 'grid', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Category</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ height: '3.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <option style={{ background: 'var(--bg-dark)' }}>Food</option>
                                <option style={{ background: 'var(--bg-dark)' }}>Stay</option>
                                <option style={{ background: 'var(--bg-dark)' }}>Transport</option>
                                <option style={{ background: 'var(--bg-dark)' }}>Activities</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Amount (INR)</label>
                                <input type="number" placeholder="₹0.00" value={formData.amount_inr} onChange={handleInrChange} required step="0.01" style={{ height: '3.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Local ({latestTrip ? latestTrip.currency_code : 'Currency'})</label>
                                <input type="number" placeholder="0.00" value={formData.amount_local} onChange={handleLocalChange} required step="0.01" style={{ height: '3.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Description</label>
                            <input type="text" placeholder="e.g. Dinner at local cafe" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ height: '3.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Date</label>
                            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required style={{ height: '3.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }} />
                        </div>
                        <button type="submit" style={{ marginTop: '1rem', height: '3.5rem', borderRadius: '1rem', fontSize: '1.1rem' }}><Plus size={20} /> Record Expense</button>
                    </form>
                </div>

                <div className="glass-card" style={{ maxHeight: '600px', overflowY: 'auto', padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '2rem', fontSize: '1.8rem', color: '#f8fafc' }}>Recent Activity</h3>
                    <ul style={{ listStyle: 'none', display: 'grid', gap: '1rem' }}>
                        {expenses.map(exp => (
                            <li key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                                <div>
                                    <strong style={{ fontSize: '1.1rem', color: '#e2e8f0', display: 'block', marginBottom: '0.25rem' }}>{exp.category}</strong>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{exp.description} <span style={{ opacity: 0.5 }}>• {new Date(exp.date).toLocaleDateString()}</span></p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#f8fafc' }}>₹{exp.amount_inr}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exp.amount_local} {latestTrip?.currency_code || 'Local'}</div>
                                    </div>
                                    <button onClick={() => handleDelete(exp.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}><Trash2 size={18} /></button>
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
