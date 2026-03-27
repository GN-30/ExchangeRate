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
        fetchExpenses();
        fetchLatestTrip();
    }, []);

    const fetchLatestTrip = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/trips/latest', { headers: { Authorization: `Bearer ${token}` }});
            if (res.data) {
                setLatestTrip(res.data);
            } else {
                const localTrip = localStorage.getItem('voyage_latest_trip');
                if (localTrip) setLatestTrip(JSON.parse(localTrip));
            }
        } catch (e) {
            console.error('Failed to fetch latest trip', e);
            const localTrip = localStorage.getItem('voyage_latest_trip');
            if (localTrip) setLatestTrip(JSON.parse(localTrip));
        }
    };

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/expenses', { headers: { Authorization: `Bearer ${token}` }});
            setExpenses(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/expenses', formData, { headers: { Authorization: `Bearer ${token}` }});
            fetchExpenses();
            setFormData({ ...formData, amount_inr: '', amount_local: '', description: '' });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
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
        <div className="fade-in" style={{ display: 'grid', gap: '2rem' }}>
            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Trip Budget Tracker</h2>
                    {latestTrip ? (
                        <p style={{ color: 'var(--text-muted)' }}>
                            Current Plan: <strong>{latestTrip.destination_country}</strong> ({latestTrip.days} Days) • 
                            Budget: ₹{Number(latestTrip.budget_inr).toLocaleString()} • 
                            Currency: <strong>{latestTrip.currency_code}</strong> (1 INR = {Number(latestTrip.exchange_rate).toFixed(4)} {latestTrip.currency_code})
                        </p>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>No trip planned yet. Showing example budget.</p>
                    )}
                </div>
            </div>

            <div className="glass-card">
                <h2 style={{ marginBottom: '1.5rem' }}>Planned vs Actual Spending (INR)</h2>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                            <Legend />
                            <Bar dataKey="Planned" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Actual" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid">
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Add Expense</h3>
                    <form onSubmit={handleAdd} style={{ display: 'grid', gap: '1rem' }}>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            <option>Food</option>
                            <option>Stay</option>
                            <option>Transport</option>
                            <option>Activities</option>
                        </select>
                        <input type="number" placeholder="Amount (INR)" value={formData.amount_inr} onChange={handleInrChange} required step="0.01" />
                        <input type="number" placeholder={`Amount (${latestTrip ? latestTrip.currency_code : 'Local Currency'})`} value={formData.amount_local} onChange={handleLocalChange} required step="0.01" />
                        <input type="text" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                        <button type="submit"><Plus size={18} /> Add Expense</button>
                    </form>
                </div>

                <div className="glass-card" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Recent Expenses</h3>
                    <ul style={{ listStyle: 'none', display: 'grid', gap: '1rem' }}>
                        {expenses.map(exp => (
                            <li key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
                                <div>
                                    <strong>{exp.category}</strong>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exp.description} - {new Date(exp.date).toLocaleDateString()}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '600' }}>₹{exp.amount_inr}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exp.amount_local} {latestTrip?.currency_code || 'Local'}</div>
                                    </div>
                                    <button onClick={() => handleDelete(exp.id)} style={{ background: 'transparent', color: '#ef4444', padding: '0.5rem' }}><Trash2 size={16} /></button>
                                </div>
                            </li>
                        ))}
                        {expenses.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No expenses recorded yet.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ExpenseTracker;
