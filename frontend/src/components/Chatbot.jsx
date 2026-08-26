import React, { useState } from 'react';
import axios from 'axios';
import { Bot, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE from '../api';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ text: "Hi! I'm VoyageAI. Ask me about budget, best payment methods, or currency advice.", isBot: true }]);
    const [input, setInput] = useState('');

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
        setInput('');

        try {
            const token = sessionStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.post(`${API_BASE}/chat`, { message: userMsg }, { headers });
            setMessages(prev => [...prev, { text: res.data.reply, isBot: true }]);
        } catch (err) {
            setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now.", isBot: true }]);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glass-card"
                        style={{ width: '360px', height: '480px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', padding: '0', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
                    >
                        <div style={{ background: 'var(--btn-gradient)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem', color: '#ffffff' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, fontSize: '1.1rem', color: '#ffffff', fontWeight: '700' }}>
                                <Bot size={22} color="#ffffff" /> VoyageAI Assistant
                            </h3>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '0.35rem', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={18} color="#ffffff" />
                            </button>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {messages.map((m, i) => (
                                <div key={i} style={{ 
                                    maxWidth: '85%', 
                                    padding: '0.85rem 1.1rem', 
                                    borderRadius: '1.2rem',
                                    alignSelf: m.isBot ? 'flex-start' : 'flex-end',
                                    background: m.isBot ? 'var(--bg-main)' : 'var(--btn-gradient)',
                                    color: m.isBot ? 'var(--text-main)' : '#ffffff',
                                    border: m.isBot ? '1px solid var(--glass-border)' : 'none',
                                    borderBottomLeftRadius: m.isBot ? 0 : '1.2rem',
                                    borderBottomRightRadius: !m.isBot ? 0 : '1.2rem',
                                    lineHeight: '1.5',
                                    fontSize: '0.95rem',
                                    fontWeight: '500',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                }}>
                                    {m.text}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem', background: 'var(--bg-card)' }}>
                            <input 
                                type="text" 
                                value={input} 
                                onChange={e => setInput(e.target.value)} 
                                placeholder="Ask VoyageAI anything..." 
                                style={{ 
                                    flex: 1, 
                                    borderRadius: '2rem', 
                                    height: '2.75rem', 
                                    padding: '0 1.25rem',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--glass-border)',
                                    outline: 'none'
                                }}
                            />
                            <button className="glow-btn" type="submit" style={{ borderRadius: '50%', width: '2.75rem', height: '2.75rem', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Send size={16} color="#ffffff" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    style={{ 
                        width: '4.75rem', 
                        height: '4.75rem', 
                        borderRadius: '50%', 
                        background: 'var(--btn-gradient)',
                        border: '2.5px solid rgba(255, 255, 255, 0.5)',
                        color: '#ffffff',
                        boxShadow: '0 12px 40px var(--shadow-glow), 0 0 25px rgba(99, 102, 241, 0.5)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.12)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    aria-label="Open AI Assistant"
                >
                    <Bot size={38} strokeWidth={2.5} color="#ffffff" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))' }} />
                </button>
            )}
        </div>
    );
};

export default Chatbot;
