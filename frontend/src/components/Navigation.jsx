import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Compass, TrendingUp, Bell, Wallet, LogOut, User } from 'lucide-react';

const Navigation = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Home', icon: <Compass size={18} /> },
        { path: '/plan', label: 'Plan Trip', icon: <Compass size={18} /> },
        { path: '/expenses', label: 'Expenses', icon: <Wallet size={18} /> },
        { path: '/trends', label: 'Trends', icon: <TrendingUp size={18} /> },
        { path: '/alerts', label: 'Alerts', icon: <Bell size={18} /> }
    ];

    return (
        <nav style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1.2rem 0',
            marginBottom: '2rem',
            borderBottom: '1px solid var(--glass-border)'
        }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '800', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                <Compass color="var(--primary)" size={30} />
                <span className="premium-gradient-text">VoyageAI</span>
            </Link>

            {user && (
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {navItems.map(item => (
                        <Link 
                            key={item.path} 
                            to={item.path}
                            style={{ 
                                textDecoration: 'none', 
                                color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: location.pathname === item.path ? '700' : '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'color 0.2s ease',
                                fontSize: '1.02rem'
                            }}
                        >
                            {item.icon} {item.label}
                        </Link>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {user ? (
                    <>
                        <Link to="/profile" style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 1.1rem', border: '1px solid var(--glass-border)', borderRadius: '2rem', fontSize: '0.95rem', fontWeight: '600', boxShadow: '0 4px 15px var(--shadow-glow)' }}>
                            <User size={18} color="var(--primary)" /> {user.name}
                        </Link>
                        <button onClick={handleLogout} style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '0.5rem 1.1rem', borderRadius: '0.75rem', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <LogOut size={16} color="var(--primary)" /> Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: '600', padding: '0.5rem 1rem' }}>Login</Link>
                        <Link to="/register" className="glow-btn" style={{ 
                            padding: '0.6rem 1.4rem', 
                            borderRadius: '0.75rem', 
                            textDecoration: 'none',
                            fontWeight: '700',
                            fontSize: '0.95rem'
                        }}>Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navigation;
