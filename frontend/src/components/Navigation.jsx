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
            padding: '1.5rem 0',
            marginBottom: '2rem',
            borderBottom: '1px solid var(--glass-border)'
        }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '1.5rem' }}>
                <Compass color="var(--primary)" size={28} />
                <span>VoyageAI</span>
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
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'color 0.2s'
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
                        <Link to="/profile" style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2rem' }}>
                            <User size={18} color="var(--primary)" /> {user.name}
                        </Link>
                        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '0.5rem 1rem' }}>
                            <LogOut size={16} /> Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={{ textDecoration: 'none', color: 'white' }}>Login</Link>
                        <Link to="/register" style={{ 
                            background: 'var(--primary)', 
                            color: 'white', 
                            padding: '0.5rem 1.25rem', 
                            borderRadius: '0.5rem', 
                            textDecoration: 'none',
                            fontWeight: '600'
                        }}>Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navigation;
