import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Trends = () => {
    const [data, setData] = useState([]);
    const [currency, setCurrency] = useState('USD');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTrends();
    }, [currency]);

    const fetchTrends = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/history/rates/${currency}`);
            setData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="premium-gradient-text" style={{ fontSize: '2rem' }}>Exchange Rate Trends</h2>
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <select 
                        value={currency} 
                        onChange={e => setCurrency(e.target.value)} 
                        style={{ 
                            width: 'auto', 
                            appearance: 'none', 
                            padding: '0.75rem 3rem 0.75rem 1.5rem', 
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(236,72,153,0.2) 100%)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '1rem',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#fff',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            outline: 'none',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <option value="USD" style={{ background: '#0f172a' }}>🇺🇸 USD</option>
                        <option value="EUR" style={{ background: '#0f172a' }}>🇪🇺 EUR</option>
                        <option value="GBP" style={{ background: '#0f172a' }}>🇬🇧 GBP</option>
                        <option value="JPY" style={{ background: '#0f172a' }}>🇯🇵 JPY</option>
                        <option value="AUD" style={{ background: '#0f172a' }}>🇦🇺 AUD</option>
                    </select>
                    <div style={{ position: 'absolute', right: '1.2rem', pointerEvents: 'none', color: '#fff' }}>
                        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
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
