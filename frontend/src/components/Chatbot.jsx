import React, { useState } from 'react';
import axios from 'axios';
import { Bot, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
            const res = await axios.post('http://localhost:5000/api/chat', { message: userMsg });
            setMessages(prev => [...prev, { text: res.data.reply, isBot: true }]);
        } catch (err) {
            setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now.", isBot: true }]);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glass-card"
                        style={{ width: '350px', height: '450px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', padding: '0' }}
                    >
                        <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><Bot size={20} /> VoyageAI Assistant</h3>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', padding: '0.25rem' }}><X size={20} /></button>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {messages.map((m, i) => (
                                <div key={i} style={{ 
                                    maxWidth: '80%', 
                                    padding: '0.75rem 1rem', 
                                    borderRadius: '1rem',
                                    alignSelf: m.isBot ? 'flex-start' : 'flex-end',
                                    background: m.isBot ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                                    borderBottomLeftRadius: m.isBot ? 0 : '1rem',
                                    borderBottomRightRadius: !m.isBot ? 0 : '1rem',
                                    lineHeight: '1.4'
                                }}>
                                    {m.text}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
                            <input 
                                type="text" 
                                value={input} 
                                onChange={e => setInput(e.target.value)} 
                                placeholder="Type a message..." 
                                style={{ flex: 1, borderRadius: '2rem', height: '2.5rem', padding: '0 1rem' }}
                            />
                            <button type="submit" style={{ borderRadius: '50%', width: '2.5rem', height: '2.5rem', padding: 0 }}><Send size={16} /></button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    style={{ 
                        width: '4rem', height: '4rem', borderRadius: '50%', 
                        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <Bot size={28} />
                </button>
            )}
        </div>
    );
};

export default Chatbot;
