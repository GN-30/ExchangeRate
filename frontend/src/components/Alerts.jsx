import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Trash2, TrendingDown, TrendingUp } from 'lucide-react';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [formData, setFormData] = useState({ currency_code: 'USD', target_rate: '', condition: 'below' });

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/alerts', { headers: { Authorization: `Bearer ${token}` }});
            setAlerts(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('token');
            await axios.post('http://localhost:5000/api/alerts', formData, { headers: { Authorization: `Bearer ${token}` }});
            fetchAlerts();
            setFormData({ ...formData, target_rate: '' });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = sessionStorage.getItem('token');
            // Mock delete, usually would need a delete route.
            // await axios.delete(`http://localhost:5000/api/alerts/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            setAlerts(alerts.filter(a => a.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fade-in grid">
            <div className="glass-card">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={24} color="var(--primary)" /> Set Smart Alert
                </h3>
                <form onSubmit={handleAdd} style={{ display: 'grid', gap: '1rem' }}>
                    <div className="form-group">
                        <label style={{ color: 'var(--text-muted)' }}>Currency</label>
                        <select value={formData.currency_code} onChange={e => setFormData({...formData, currency_code: e.target.value})}>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="JPY">JPY</option>
                            <option value="AUD">AUD</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label style={{ color: 'var(--text-muted)' }}>Alert me when rate goes</label>
                        <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                            <option value="below">Below</option>
                            <option value="above">Above</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label style={{ color: 'var(--text-muted)' }}>Target Rate (INR)</label>
                        <input type="number" step="0.01" value={formData.target_rate} onChange={e => setFormData({...formData, target_rate: e.target.value})} required />
                    </div>

                    <button type="submit" style={{ marginTop: '1rem' }}>Create Alert</button>
                </form>
            </div>

            <div className="glass-card">
                <h3 style={{ marginBottom: '1.5rem' }}>Active Alerts</h3>
                <ul style={{ listStyle: 'none', display: 'grid', gap: '1rem' }}>
                    {alerts.map(a => (
                        <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', borderLeft: `4px solid ${a.condition === 'above' ? '#10b981' : '#ef4444'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {a.condition === 'above' ? <TrendingUp color="#10b981" /> : <TrendingDown color="#ef4444" />}
                                <div>
                                    <strong>{a.currency_code}</strong>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>When rate is {a.condition} ₹{a.target_rate}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(a.id)} style={{ background: 'transparent', color: '#ef4444', padding: '0.5rem' }}><Trash2 size={16} /></button>
                        </li>
                    ))}
                    {alerts.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No active alerts.</p>}
                </ul>
            </div>
        </div>
    );
};

export default Alerts;
