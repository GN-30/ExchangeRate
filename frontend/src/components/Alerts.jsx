import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Trash2, TrendingDown, TrendingUp, Coins, Sliders, Target, ChevronDown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE from '../api';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [formData, setFormData] = useState({ currency_code: 'USD', target_rate: '', condition: 'below' });

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/alerts`, { headers: { Authorization: `Bearer ${token}` }});
            setAlerts(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('token');
            await axios.post(`${API_BASE}/alerts`, formData, { headers: { Authorization: `Bearer ${token}` }});
            fetchAlerts();
            setFormData({ ...formData, target_rate: '' });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id) => {
        try {
            setAlerts(alerts.filter(a => a.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            
            {/* FORM CONTAINER WITH INDIVIDUAL ANIMATED FIELD CARDS */}
            <form onSubmit={handleAdd} style={{ display: 'grid', gap: '1.25rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Bell color="var(--primary)" size={26} /> Set Smart Alert
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Get notified when exchange rates reach your target</p>
                </div>

                {/* FIELD CARD 1: CURRENCY DROPDOWN */}
                <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card" 
                    style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <motion.div 
                            animate={{ rotate: [0, 360] }}
                            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                            style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.6rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Coins size={20} color="var(--primary)" />
                        </motion.div>
                        <div>
                            <label style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', display: 'block' }}>Target Currency</label>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Choose currency to monitor</span>
                        </div>
                    </div>

                    {/* ATTRACTIVE CUSTOM GLASS DROPDOWN */}
                    <div style={{ position: 'relative', width: '100%', marginTop: '0.25rem' }}>
                        <select 
                            value={formData.currency_code} 
                            onChange={e => setFormData({...formData, currency_code: e.target.value})}
                            style={{ 
                                width: '100%',
                                height: '3.25rem', 
                                background: 'var(--bg-main)', 
                                color: 'var(--text-main)', 
                                padding: '0 2.5rem 0 1.2rem', 
                                borderRadius: '0.85rem', 
                                border: '1.5px solid var(--glass-border)', 
                                outline: 'none',
                                fontWeight: '700',
                                fontSize: '1rem',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                            }}
                        >
                            <option value="USD">💵 USD - US Dollar</option>
                            <option value="EUR">💶 EUR - Euro</option>
                            <option value="GBP">💷 GBP - British Pound</option>
                            <option value="JPY">💴 JPY - Japanese Yen</option>
                            <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                        </select>
                        <ChevronDown size={18} color="var(--primary)" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                </motion.div>

                {/* FIELD CARD 2: CONDITION DROPDOWN */}
                <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card" 
                    style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <motion.div 
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Sliders size={20} color="#10b981" />
                        </motion.div>
                        <div>
                            <label style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', display: 'block' }}>Trigger Condition</label>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Alert threshold rule</span>
                        </div>
                    </div>

                    {/* ATTRACTIVE CUSTOM GLASS DROPDOWN */}
                    <div style={{ position: 'relative', width: '100%', marginTop: '0.25rem' }}>
                        <select 
                            value={formData.condition} 
                            onChange={e => setFormData({...formData, condition: e.target.value})}
                            style={{ 
                                width: '100%',
                                height: '3.25rem', 
                                background: 'var(--bg-main)', 
                                color: 'var(--text-main)', 
                                padding: '0 2.5rem 0 1.2rem', 
                                borderRadius: '0.85rem', 
                                border: '1.5px solid var(--glass-border)', 
                                outline: 'none',
                                fontWeight: '700',
                                fontSize: '1rem',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                            }}
                        >
                            <option value="below">📉 Rate drops below target</option>
                            <option value="above">📈 Rate rises above target</option>
                        </select>
                        <ChevronDown size={18} color="#10b981" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                </motion.div>

                {/* FIELD CARD 3: TARGET RATE INPUT */}
                <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card" 
                    style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <motion.div 
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                            style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '0.6rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Target size={20} color="#ec4899" />
                        </motion.div>
                        <div>
                            <label style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', display: 'block' }}>Target Rate (INR)</label>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Specific rate to watch</span>
                        </div>
                    </div>
                    <input 
                        type="number" 
                        step="0.01" 
                        placeholder="e.g. ₹82.50" 
                        value={formData.target_rate} 
                        onChange={e => setFormData({...formData, target_rate: e.target.value})} 
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
                            fontWeight: '700',
                            fontSize: '1.05rem',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                        }} 
                    />
                </motion.div>

                {/* SUBMIT BUTTON */}
                <button type="submit" className="glow-btn" style={{ height: '3.5rem', borderRadius: '1rem', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                    <Bell size={20} color="#ffffff" /> Create Smart Alert
                </button>
            </form>

            {/* ACTIVE ALERTS CARD LIST */}
            <div className="glass-card" style={{ padding: '2.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Sparkles color="var(--primary)" size={24} /> Active Alerts
                </h3>
                <ul style={{ listStyle: 'none', display: 'grid', gap: '1rem' }}>
                    {alerts.map(a => (
                        <motion.li 
                            key={a.id} 
                            whileHover={{ x: 4 }}
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '1.25rem 1.5rem', 
                                background: 'var(--bg-main)', 
                                borderRadius: '1rem', 
                                border: '1px solid var(--glass-border)', 
                                borderLeft: `6px solid ${a.condition === 'above' ? '#10b981' : '#ef4444'}` 
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{ background: a.condition === 'above' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '0.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {a.condition === 'above' ? <TrendingUp color="#10b981" size={22} /> : <TrendingDown color="#ef4444" size={22} />}
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--text-main)', fontSize: '1.2rem', display: 'block', fontWeight: '800' }}>{a.currency_code}</strong>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Notify when rate is <strong>{a.condition}</strong> ₹{a.target_rate}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(a.id)} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.65rem', borderRadius: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trash2 size={18} />
                            </button>
                        </motion.li>
                    ))}
                    {alerts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                            <Bell size={40} color="var(--primary)" style={{ opacity: 0.4, marginBottom: '1rem' }} />
                            <p style={{ fontSize: '1.1rem' }}>No active rate alerts configured yet.</p>
                        </div>
                    )}
                </ul>
            </div>

        </div>
    );
};

export default Alerts;
