import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div style={{
    minHeight: '100vh',          // full screen height
    width: '100%',              // full width (NOT 150vw)
    position: 'relative',       // avoid overflow issues
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: "url('/landing-bg.jpg')",
    backgroundSize: 'cover',    // keeps it filling screen
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    padding: '2rem',
    boxSizing: 'border-box',
    borderRadius: '10px',
}}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card fade-in" 
                style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}
            >
            <h2 className="premium-gradient-text" style={{ fontSize: '2.25rem', marginBottom: '2rem', textAlign: 'center', fontWeight: '800' }}>Create Account</h2>
            {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', fontWeight: '600' }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        <User size={18} color="var(--primary)" /> Full Name
                    </label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', outline: 'none' }} />
                </div>
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        <Mail size={18} color="var(--primary)" /> Email
                    </label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', outline: 'none' }} />
                </div>
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        <Lock size={18} color="var(--primary)" /> Password
                    </label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', outline: 'none' }} />
                </div>
                <button type="submit" className="glow-btn" style={{ marginTop: '1rem', height: '3.5rem', width: '100%', borderRadius: '0.85rem', fontSize: '1.05rem' }}>
                    Sign Up <UserPlus size={20} color="#ffffff" />
                </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700' }}>Login</Link>
            </p>
            </motion.div>
        </div>
    );
};

export default Signup;
