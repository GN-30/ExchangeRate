import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Compass, TrendingUp, Bell, Wallet, LogOut, User, Menu, X, Home } from 'lucide-react';

const Navigation = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    // Close drawer on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Close on Escape key
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMenuOpen(false);
    };

    const navItems = [
        { path: '/',         label: 'Home',     icon: <Home size={18} /> },
        { path: '/plan',     label: 'Plan Trip', icon: <Compass size={18} /> },
        { path: '/expenses', label: 'Expenses', icon: <Wallet size={18} /> },
        { path: '/trends',   label: 'Trends',   icon: <TrendingUp size={18} /> },
        { path: '/alerts',   label: 'Alerts',   icon: <Bell size={18} /> }
    ];

    return (
        <>
            <nav className="app-navbar">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <Compass color="var(--primary)" size={30} />
                    <span className="premium-gradient-text">VoyageAI</span>
                </Link>

                {/* Desktop nav links */}
                {user && (
                    <div className="navbar-links">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`navbar-link${location.pathname === item.path ? ' active' : ''}`}
                            >
                                {item.icon} {item.label}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Right side actions */}
                <div className="navbar-actions">
                    {user ? (
                        <>
                            <Link to="/profile" className="navbar-profile-btn">
                                <User size={18} color="var(--primary)" /> {user.name}
                            </Link>
                            <button onClick={handleLogout} className="navbar-logout-btn">
                                <LogOut size={16} color="var(--primary)" /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="navbar-text-link">Login</Link>
                            <Link to="/register" className="glow-btn navbar-signup-btn">Sign Up</Link>
                        </>
                    )}

                    {/* Hamburger — only on mobile */}
                    {user && (
                        <button
                            className="hamburger-btn"
                            onClick={() => setMenuOpen(o => !o)}
                            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        >
                            {menuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    )}
                </div>
            </nav>

            {/* Mobile drawer backdrop */}
            {menuOpen && (
                <div
                    className="mobile-drawer-backdrop"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            {/* Mobile slide-in drawer */}
            <div className={`mobile-drawer${menuOpen ? ' open' : ''}`}>
                <div className="mobile-drawer-header">
                    <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
                        <Compass color="var(--primary)" size={26} />
                        <span className="premium-gradient-text">VoyageAI</span>
                    </Link>
                    <button
                        className="drawer-close-btn"
                        onClick={() => setMenuOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="mobile-drawer-nav">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`drawer-nav-item${location.pathname === item.path ? ' active' : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <span className="drawer-nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="mobile-drawer-footer">
                    {user && (
                        <>
                            <Link to="/profile" className="drawer-profile-btn" onClick={() => setMenuOpen(false)}>
                                <User size={18} color="var(--primary)" />
                                <span>{user.name}</span>
                            </Link>
                            <button onClick={handleLogout} className="drawer-logout-btn">
                                <LogOut size={16} /> Sign Out
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default Navigation;
