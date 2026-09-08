import React, { useContext } from 'react';

import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    Link,
    useLocation
} from 'react-router-dom';

import {
    AnimatePresence,
    motion
} from 'framer-motion';

import {
    AuthProvider,
    AuthContext
} from './context/AuthContext';

import PlanTrip from './components/PlanTrip';
import Profile from './components/Profile';
import Navigation from './components/Navigation';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ExpenseTracker from './components/ExpenseTracker';
import Trends from './components/Trends';
import Alerts from './components/Alerts';
import Chatbot from './components/Chatbot';
import ThemeFlightToggle from './components/ThemeFlightToggle';
import PWAInstallPrompt from './components/PWAInstallPrompt';


import {
    Plane,
    Wallet,
    Map,
    Globe,
    Compass,
    TrendingUp,
    Bell,
    Home as HomeIcon,
    User
} from 'lucide-react';


/* ============================================================
   PROTECTED ROUTE
   ============================================================ */

const ProtectedRoute = ({ children }) => {

    const {
        user,
        loading
    } = useContext(AuthContext);

    if (loading) {

        return (
            <div
                style={{
                    textAlign: 'center',
                    marginTop: '4rem',
                    color: 'var(--text-muted)'
                }}
            >
                Loading...
            </div>
        );
    }

    return user
        ? children
        : <Navigate to="/login" />;
};


/* ============================================================
   PAGE TRANSITION
   ============================================================ */

const PageTransition = ({ children }) => {

    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 15
            }}

            animate={{
                opacity: 1,
                y: 0
            }}

            exit={{
                opacity: 0,
                y: -15
            }}

            transition={{
                duration: 0.3,
                ease: 'easeOut'
            }}

            style={{
                width: '100%'
            }}
        >
            {children}
        </motion.div>
    );
};


/* ============================================================
   HOME
   ============================================================ */

function Home() {

    const { user } = useContext(AuthContext);

    return (

        <div className="fade-in">

            <header className="home-hero">

                {/* HERO IMAGE */}

                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                            'url("/hero-bg.jpg")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: -2,
                        filter:
                            'brightness(1.15) contrast(1.15) saturate(1.2)'
                    }}
                />

                {/* HERO OVERLAY */}

                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(to bottom, rgba(2,6,23,0.2) 0%, rgba(2,6,23,0.9) 100%)',
                        backdropFilter: 'blur(2px)',
                        zIndex: -1
                    }}
                />


                {/* HERO ICON */}

                <div className="hero-icon-wrap">

                    <Plane
                        size={56}
                        color="#ffffff"
                        style={{
                            filter:
                                'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                        }}
                    />

                </div>


                {/* TITLE */}

                <h1 className="hero-title">
                    Welcome back,{' '}
                    {user?.name?.split(' ')[0] ||
                        'Explorer'}!
                </h1>


                {/* DESCRIPTION */}

                <p className="hero-subtitle">
                    Your AI-powered travel assistant.
                    Plan budgets, track expenses,
                    and optimize your currency
                    exchanges globally.
                </p>

            </header>


            {/* ==================================================
                HOME CARDS
               ================================================== */}

            {/* ==================================================
                HOME CARDS
               ================================================== */}

            <div className="home-cards-grid">

                {/* PLAN */}

                <div
                    className="glass-card home-card"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        padding: '3.5rem 2rem',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }}

                    onClick={() =>
                        window.location.href = '/plan'
                    }
                >

                    <div
                        className="card-bg-gradient plan-bg"
                    />

                    <Map
                        size={56}
                        color="var(--primary)"
                        style={{
                            marginBottom: '1.5rem',
                            position: 'relative',
                            zIndex: 1,
                            filter:
                                'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                        }}
                    />

                    <h3
                        style={{
                            marginBottom: '1rem',
                            fontSize: '1.75rem',
                            position: 'relative',
                            zIndex: 1,
                            color: 'var(--text-main)',
                            fontWeight: '800'
                        }}
                    >
                        Design a Journey
                    </h3>

                    <p
                        style={{
                            color: 'var(--text-muted)',
                            marginBottom: '2.5rem',
                            fontSize: '1.1rem',
                            position: 'relative',
                            zIndex: 1,
                            lineHeight: '1.5'
                        }}
                    >
                        Use AI to craft an itinerary
                        and calculate precise
                        localized budgets.
                    </p>

                    <Link
                        to="/plan"
                        className="glow-btn"
                        style={{
                            padding: '0.85rem 2rem',
                            borderRadius: '0.75rem',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            position: 'relative',
                            zIndex: 1,
                            fontSize: '1.05rem'
                        }}
                    >
                        Plan Trip Now
                    </Link>

                </div>


                {/* PROFILE */}

                <div
                    className="glass-card home-card"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        padding: '3.5rem 2rem',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }}

                    onClick={() =>
                        window.location.href = '/profile'
                    }
                >

                    <div
                        className="card-bg-gradient prof-bg"
                    />

                    <Globe
                        size={56}
                        color="#34d399"
                        style={{
                            marginBottom: '1.5rem',
                            position: 'relative',
                            zIndex: 1,
                            filter:
                                'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                        }}
                    />

                    <h3
                        style={{
                            marginBottom: '1rem',
                            fontSize: '1.75rem',
                            position: 'relative',
                            zIndex: 1,
                            color: 'var(--text-main)',
                            fontWeight: '800'
                        }}
                    >
                        Your Travels
                    </h3>

                    <p
                        style={{
                            color: 'var(--text-muted)',
                            marginBottom: '2.5rem',
                            fontSize: '1.1rem',
                            position: 'relative',
                            zIndex: 1,
                            lineHeight: '1.5'
                        }}
                    >
                        Access all your previous
                        plans and AI insights
                        in your history.
                    </p>

                    <Link
                        to="/profile"
                        style={{
                            background:
                                'var(--bg-card)',
                            border:
                                '1px solid var(--glass-border)',
                            padding: '0.85rem 2rem',
                            borderRadius: '0.75rem',
                            color: 'var(--text-main)',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            position: 'relative',
                            zIndex: 1,
                            fontSize: '1.05rem'
                        }}
                    >
                        View Profile
                    </Link>

                </div>


                {/* EXPENSES */}

                <div
                    className="glass-card home-card"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        padding: '3.5rem 2rem',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }}

                    onClick={() =>
                        window.location.href = '/expenses'
                    }
                >

                    <div
                        className="card-bg-gradient exp-bg"
                    />

                    <Wallet
                        size={56}
                        color="#f59e0b"
                        style={{
                            marginBottom: '1.5rem',
                            position: 'relative',
                            zIndex: 1,
                            filter:
                                'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                        }}
                    />

                    <h3
                        style={{
                            marginBottom: '1rem',
                            fontSize: '1.75rem',
                            position: 'relative',
                            zIndex: 1,
                            color: 'var(--text-main)',
                            fontWeight: '800'
                        }}
                    >
                        Track Finances
                    </h3>

                    <p
                        style={{
                            color: 'var(--text-muted)',
                            marginBottom: '2.5rem',
                            fontSize: '1.1rem',
                            position: 'relative',
                            zIndex: 1,
                            lineHeight: '1.5'
                        }}
                    >
                        Monitor real-time expenses
                        against your projected
                        trip budget.
                    </p>

                    <Link
                        to="/expenses"
                        style={{
                            background:
                                'var(--bg-card)',
                            border:
                                '1px solid var(--glass-border)',
                            padding: '0.85rem 2rem',
                            borderRadius: '0.75rem',
                            color: 'var(--text-main)',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            position: 'relative',
                            zIndex: 1,
                            fontSize: '1.05rem'
                        }}
                    >
                        Open Tracker
                    </Link>

                </div>

            </div>

        </div>
    );
}


/* ============================================================
   MOBILE BOTTOM NAV
   ============================================================ */

function MobileBottomNav() {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    if (!user) return null;

    const navItems = [
        { path: '/',         label: 'Home',     icon: <HomeIcon size={20} /> },
        { path: '/plan',     label: 'Plan',     icon: <Compass size={20} /> },
        { path: '/expenses', label: 'Expenses', icon: <Wallet size={20} /> },
        { path: '/trends',   label: 'Trends',   icon: <TrendingUp size={20} /> },
        { path: '/alerts',   label: 'Alerts',   icon: <Bell size={20} /> },
    ];

    return (
        <nav className="mobile-bottom-nav">
            {navItems.map(item => {
                const active = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`mobile-nav-item${active ? ' active' : ''}`}
                        aria-label={item.label}
                    >
                        <span className="mobile-nav-icon">{item.icon}</span>
                        <span className="mobile-nav-label">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}


/* ============================================================
   APP CONTENT
   ============================================================ */

function AppContent() {

    const location = useLocation();

    return (

        <>

            {/* AMBIENT ORBS */}

            <div className="ambient-orb orb-1" />
            <div className="ambient-orb orb-2" />


            {/* ==================================================
                GLOBAL THEME FLIGHT
               ================================================== */}

            <ThemeFlightToggle />

            {/* PWA Install Popup */}
            <PWAInstallPrompt />


            <div
                className="container"
                style={{
                    position: 'relative',
                    zIndex: 1,
                    paddingBottom: '5rem'
                }}
            >

                <Navigation />


                <AnimatePresence mode="wait">

                    <Routes
                        location={location}
                        key={location.pathname}
                    >

                        <Route
                            path="/login"
                            element={
                                <PageTransition>
                                    <Login />
                                </PageTransition>
                            }
                        />

                        <Route
                            path="/register"
                            element={
                                <PageTransition>
                                    <Signup />
                                </PageTransition>
                            }
                        />

                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <PageTransition>
                                        <Home />
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/plan"
                            element={
                                <ProtectedRoute>
                                    <PageTransition>
                                        <PlanTrip />
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <PageTransition>
                                        <Profile />
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/expenses"
                            element={
                                <ProtectedRoute>
                                    <PageTransition>
                                        <ExpenseTracker />
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/trends"
                            element={
                                <ProtectedRoute>
                                    <PageTransition>
                                        <Trends />
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/alerts"
                            element={
                                <ProtectedRoute>
                                    <PageTransition>
                                        <Alerts />
                                    </PageTransition>
                                </ProtectedRoute>
                            }
                        />

                    </Routes>

                </AnimatePresence>


                <Chatbot />


                <footer
                    style={{
                        marginTop: '8rem',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        paddingBottom: '4rem'
                    }}
                >
                    <p>
                        © 2026 VoyageAI.
                        Powered by Real-time Data
                        & Intelligence.
                    </p>
                </footer>

            </div>

            {/* ================================================
                MOBILE BOTTOM NAVIGATION BAR
               ================================================ */}
            <MobileBottomNav />

        </>

    );
}


/* ============================================================
   APP
   ============================================================ */

function App() {

    return (

        <AuthProvider>

            <Router>

                <AppContent />

            </Router>

        </AuthProvider>
    );
}


export default App;