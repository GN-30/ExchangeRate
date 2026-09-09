import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Bell,
    Trash2,
    TrendingDown,
    TrendingUp,
    Coins,
    Sliders,
    Target,
    ChevronDown,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE from '../api';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currencyLoading, setCurrencyLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        currency_code: 'USD',
        target_rate: '',
        condition: 'above'
    });

    // ============================================================
    // FETCH CURRENCIES
    // ============================================================

    const fetchCurrencies = async () => {
        try {
            setCurrencyLoading(true);

            const response = await axios.get(
                'https://open.er-api.com/v6/latest/INR'
            );

            const rates = response.data?.rates || {};

            const currencyList = Object.keys(rates)
                .filter(currency => currency !== 'INR')
                .sort();

            setCurrencies(currencyList);

            // Set first currency if current selection is unavailable
            if (
                currencyList.length > 0 &&
                !currencyList.includes(formData.currency_code)
            ) {
                setFormData(prev => ({
                    ...prev,
                    currency_code: currencyList[0]
                }));
            }

        } catch (error) {
            console.error(
                'Failed to fetch currencies:',
                error
            );

            // Fallback currencies
            setCurrencies([
                'USD',
                'EUR',
                'GBP',
                'JPY',
                'AUD',
                'CAD',
                'SGD',
                'AED',
                'CHF',
                'CNY'
            ]);

        } finally {
            setCurrencyLoading(false);
        }
    };

    // ============================================================
    // FETCH ALERTS
    // ============================================================

    const fetchAlerts = async () => {
        try {
            const token = sessionStorage.getItem('token');

            if (!token) {
                console.error('No authentication token found.');
                setAlerts([]);
                return;
            }

            const response = await axios.get(
                `${API_BASE}/alerts`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = response.data;

            let alertData = [];

            if (Array.isArray(data)) {
                alertData = data;
            } else if (Array.isArray(data?.alerts)) {
                alertData = data.alerts;
            } else if (Array.isArray(data?.data)) {
                alertData = data.data;
            }

            setAlerts(alertData);

        } catch (error) {
            console.error(
                'Failed to fetch alerts:',
                error
            );
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        fetchCurrencies();
        fetchAlerts();
    }, []);

    // ============================================================
    // AUTO REFRESH ALERTS
    // ============================================================

    useEffect(() => {
        const interval = setInterval(() => {
            fetchAlerts();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // ============================================================
    // HANDLE FORM CHANGE
    // ============================================================

    const handleChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // ============================================================
    // ADD ALERT
    // ============================================================

    const handleAdd = async (e) => {
        e.preventDefault();

        if (!formData.currency_code) {
            alert('Please select a currency.');
            return;
        }

        if (
            formData.target_rate === '' ||
            Number.isNaN(Number(formData.target_rate))
        ) {
            alert('Please enter a valid target rate.');
            return;
        }

        if (Number(formData.target_rate) <= 0) {
            alert('Target rate must be greater than 0.');
            return;
        }

        try {
            setSubmitting(true);

            const token = sessionStorage.getItem('token');

            if (!token) {
                alert('Please login again.');
                return;
            }

            const payload = {
                currency_code:
                    formData.currency_code
                        .trim()
                        .toUpperCase(),

                target_rate:
                    Number(formData.target_rate),

                condition:
                    formData.condition
            };

            const response = await axios.post(
                `${API_BASE}/alerts`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Add newly created alert immediately
            if (response.data) {
                const newAlert =
                    response.data?.alert ||
                    response.data;

                if (newAlert?.id) {
                    setAlerts(prev => [
                        newAlert,
                        ...prev
                    ]);
                }
            }

            // Sync with backend
            await fetchAlerts();

            // Reset form
            setFormData(prev => ({
                ...prev,
                target_rate: '',
                condition: 'above'
            }));

        } catch (error) {
            console.error(
                'Failed to create alert:',
                error
            );

            alert(
                error.response?.data?.error ||
                'Failed to create alert. Please try again.'
            );

        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // DELETE ALERT
    // ============================================================

    const handleDelete = async (id) => {
        try {
            const token =
                sessionStorage.getItem('token');

            if (!token) {
                alert('Please login again.');
                return;
            }

            await axios.delete(
                `${API_BASE}/alerts/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            // Remove from UI immediately
            setAlerts(prevAlerts =>
                prevAlerts.filter(
                    alert =>
                        Number(alert.id) !== Number(id)
                )
            );

        } catch (error) {
            console.error(
                'Failed to delete alert:',
                error
            );

            alert(
                error.response?.data?.error ||
                'Failed to delete alert. Please try again.'
            );
        }
    };

    // ============================================================
    // FORMAT DATE
    // ============================================================

    const formatDate = (date) => {
        if (!date) {
            return 'Not available';
        }

        try {
            return new Date(date).toLocaleString(
                'en-IN',
                {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                }
            );
        } catch {
            return date;
        }
    };

    // ============================================================
    // ACTIVE / SENT ALERTS
    // ============================================================

    const activeAlerts = alerts.filter(
        alert => alert.is_active === true
    );

    const sentAlerts = alerts.filter(
        alert => alert.is_active === false
    );

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div
            style={{
                width: '100%',
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '2rem'
            }}
        >

            {/* =====================================================
                HEADER
            ===================================================== */}

            <motion.div
                initial={{
                    opacity: 0,
                    y: -20
                }}
                animate={{
                    opacity: 1,
                    y: 0
                }}
                transition={{
                    duration: 0.5
                }}
                style={{
                    marginBottom: '2rem'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                >
                    <div
                        style={{
                            width: '55px',
                            height: '55px',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background:
                                'rgba(99, 102, 241, 0.15)'
                        }}
                    >
                        <Bell
                            size={28}
                            style={{
                                color:
                                    'var(--accent-color, #6366f1)'
                            }}
                        />
                    </div>

                    <div>
                        <h1
                            style={{
                                margin: 0,
                                fontSize: '2rem',
                                fontWeight: 800
                            }}
                        >
                            Exchange Rate Alerts
                        </h1>

                        <p
                            style={{
                                margin:
                                    '0.4rem 0 0',
                                color:
                                    'var(--text-muted, #888)'
                            }}
                        >
                            Get notified when your target
                            exchange rate is reached.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* =====================================================
                CREATE ALERT
            ===================================================== */}

            <motion.div
                initial={{
                    opacity: 0,
                    y: 20
                }}
                animate={{
                    opacity: 1,
                    y: 0
                }}
                transition={{
                    duration: 0.5,
                    delay: 0.1
                }}
                className="glass-card"
                style={{
                    padding: '2rem',
                    marginBottom: '2.5rem'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.7rem',
                        marginBottom: '1.5rem'
                    }}
                >
                    <Sparkles
                        size={21}
                        style={{
                            color:
                                'var(--accent-color, #6366f1)'
                        }}
                    />

                    <h2
                        style={{
                            margin: 0,
                            fontSize: '1.3rem'
                        }}
                    >
                        Create New Alert
                    </h2>
                </div>

                <form onSubmit={handleAdd}>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '1.2rem',
                            alignItems: 'end'
                        }}
                    >

                        {/* Currency */}

                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom:
                                        '0.5rem',
                                    fontWeight: 600
                                }}
                            >
                                <Coins
                                    size={16}
                                    style={{
                                        verticalAlign:
                                            'middle',
                                        marginRight:
                                            '0.4rem'
                                    }}
                                />
                                Currency
                            </label>

                            <div
                                style={{
                                    position:
                                        'relative'
                                }}
                            >
                                <select
                                    name="currency_code"
                                    value={
                                        formData.currency_code
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        currencyLoading
                                    }
                                    style={{
                                        width: '100%',
                                        padding:
                                            '0.8rem 2.5rem 0.8rem 1rem',
                                        borderRadius:
                                            '10px',
                                        border:
                                            '1px solid var(--border-color, #ddd)',
                                        background:
                                            'var(--card-bg, white)',
                                        color:
                                            'var(--text-color, #222)',
                                        appearance:
                                            'none'
                                    }}
                                >
                                    {currencies.map(
                                        currency => (
                                            <option
                                                key={
                                                    currency
                                                }
                                                value={
                                                    currency
                                                }
                                            >
                                                {currency}
                                            </option>
                                        )
                                    )}
                                </select>

                                <ChevronDown
                                    size={18}
                                    style={{
                                        position:
                                            'absolute',
                                        right:
                                            '0.8rem',
                                        top: '50%',
                                        transform:
                                            'translateY(-50%)',
                                        pointerEvents:
                                            'none'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Condition */}

                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom:
                                        '0.5rem',
                                    fontWeight: 600
                                }}
                            >
                                <Sliders
                                    size={16}
                                    style={{
                                        verticalAlign:
                                            'middle',
                                        marginRight:
                                            '0.4rem'
                                    }}
                                />
                                Condition
                            </label>

                            <div
                                style={{
                                    position:
                                        'relative'
                                }}
                            >
                                <select
                                    name="condition"
                                    value={
                                        formData.condition
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    style={{
                                        width: '100%',
                                        padding:
                                            '0.8rem 2.5rem 0.8rem 1rem',
                                        borderRadius:
                                            '10px',
                                        border:
                                            '1px solid var(--border-color, #ddd)',
                                        background:
                                            'var(--card-bg, white)',
                                        color:
                                            'var(--text-color, #222)',
                                        appearance:
                                            'none'
                                    }}
                                >
                                    <option value="above">
                                        Rate goes above
                                    </option>

                                    <option value="below">
                                        Rate goes below
                                    </option>
                                </select>

                                <ChevronDown
                                    size={18}
                                    style={{
                                        position:
                                            'absolute',
                                        right:
                                            '0.8rem',
                                        top: '50%',
                                        transform:
                                            'translateY(-50%)',
                                        pointerEvents:
                                            'none'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Target Rate */}

                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom:
                                        '0.5rem',
                                    fontWeight: 600
                                }}
                            >
                                <Target
                                    size={16}
                                    style={{
                                        verticalAlign:
                                            'middle',
                                        marginRight:
                                            '0.4rem'
                                    }}
                                />
                                Target Rate
                            </label>

                            <input
                                type="number"
                                name="target_rate"
                                value={
                                    formData.target_rate
                                }
                                onChange={
                                    handleChange
                                }
                                step="0.0001"
                                min="0"
                                placeholder="Enter target rate"
                                required
                                style={{
                                    width: '100%',
                                    boxSizing:
                                        'border-box',
                                    padding:
                                        '0.8rem 1rem',
                                    borderRadius:
                                        '10px',
                                    border:
                                        '1px solid var(--border-color, #ddd)',
                                    background:
                                        'var(--card-bg, white)',
                                    color:
                                        'var(--text-color, #222)'
                                }}
                            />
                        </div>

                        {/* Button */}

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding:
                                    '0.85rem 1.5rem',
                                borderRadius:
                                    '10px',
                                border: 'none',
                                cursor: submitting
                                    ? 'not-allowed'
                                    : 'pointer',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                background:
                                    'var(--accent-color, #6366f1)',
                                color: 'white',
                                opacity:
                                    submitting
                                        ? 0.7
                                        : 1
                            }}
                        >
                            {submitting
                                ? 'Creating...'
                                : 'Create Alert'}
                        </button>

                    </div>
                </form>
            </motion.div>

            {/* =====================================================
                ACTIVE ALERTS
            ===================================================== */}

            <section
                style={{
                    marginBottom: '2.5rem'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                            'space-between',
                        marginBottom: '1rem'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem'
                        }}
                    >
                        <TrendingUp
                            size={21}
                            style={{
                                color: '#22c55e'
                            }}
                        />

                        <h2
                            style={{
                                margin: 0
                            }}
                        >
                            Active Alerts
                        </h2>
                    </div>

                    <span
                        style={{
                            padding:
                                '0.3rem 0.7rem',
                            borderRadius:
                                '20px',
                            fontSize:
                                '0.8rem',
                            fontWeight: 700,
                            background:
                                'rgba(34, 197, 94, 0.12)',
                            color:
                                '#16a34a'
                        }}
                    >
                        {activeAlerts.length}
                    </span>
                </div>

                {loading ? (
                    <div
                        className="glass-card"
                        style={{
                            padding: '2rem',
                            textAlign: 'center'
                        }}
                    >
                        Loading alerts...
                    </div>
                ) : activeAlerts.length === 0 ? (
                    <div
                        className="glass-card"
                        style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color:
                                'var(--text-muted, #888)'
                        }}
                    >
                        <Bell
                            size={35}
                            style={{
                                marginBottom:
                                    '0.7rem',
                                opacity: 0.5
                            }}
                        />

                        <p>
                            No active alerts.
                        </p>

                        <p
                            style={{
                                fontSize:
                                    '0.9rem'
                            }}
                        >
                            Create an alert above to
                            start monitoring exchange
                            rates.
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gap: '1rem'
                        }}
                    >
                        {activeAlerts.map(
                            (alert, index) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{
                                        opacity: 0,
                                        y: 10
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0
                                    }}
                                    transition={{
                                        delay:
                                            index *
                                            0.05
                                    }}
                                    className="glass-card"
                                    style={{
                                        padding:
                                            '1.4rem',
                                        display:
                                            'flex',
                                        justifyContent:
                                            'space-between',
                                        alignItems:
                                            'center',
                                        gap:
                                            '1rem'
                                    }}
                                >

                                    <div>
                                        <div
                                            style={{
                                                display:
                                                    'flex',
                                                alignItems:
                                                    'center',
                                                gap:
                                                    '0.7rem',
                                                marginBottom:
                                                    '0.5rem'
                                            }}
                                        >
                                            <strong
                                                style={{
                                                    fontSize:
                                                        '1.15rem'
                                                }}
                                            >
                                                {
                                                    alert.currency_code
                                                }
                                            </strong>

                                            {alert.condition ===
                                            'above' ? (
                                                <TrendingUp
                                                    size={
                                                        18
                                                    }
                                                    style={{
                                                        color:
                                                            '#22c55e'
                                                    }}
                                                />
                                            ) : (
                                                <TrendingDown
                                                    size={
                                                        18
                                                    }
                                                    style={{
                                                        color:
                                                            '#ef4444'
                                                    }}
                                                />
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                color:
                                                    'var(--text-muted, #888)'
                                            }}
                                        >
                                            Alert when rate
                                            goes{' '}
                                            <strong>
                                                {
                                                    alert.condition
                                                }
                                            </strong>{' '}
                                            <strong>
                                                {Number(
                                                    alert.target_rate
                                                ).toFixed(
                                                    4
                                                )}
                                            </strong>
                                        </div>

                                        <small
                                            style={{
                                                display:
                                                    'block',
                                                marginTop:
                                                    '0.4rem',
                                                color:
                                                    'var(--text-muted, #888)'
                                            }}
                                        >
                                            Created:{' '}
                                            {formatDate(
                                                alert.created_at
                                            )}
                                        </small>
                                    </div>

                                    <button
                                        onClick={() =>
                                            handleDelete(
                                                alert.id
                                            )
                                        }
                                        title="Delete alert"
                                        style={{
                                            width:
                                                '42px',
                                            height:
                                                '42px',
                                            borderRadius:
                                                '10px',
                                            border:
                                                'none',
                                            cursor:
                                                'pointer',
                                            display:
                                                'flex',
                                            alignItems:
                                                'center',
                                            justifyContent:
                                                'center',
                                            background:
                                                'rgba(239, 68, 68, 0.1)',
                                            color:
                                                '#ef4444',
                                            flexShrink: 0
                                        }}
                                    >
                                        <Trash2
                                            size={
                                                19
                                            }
                                        />
                                    </button>

                                </motion.div>
                            )
                        )}
                    </div>
                )}
            </section>

            {/* =====================================================
                ALERT SENT
            ===================================================== */}

            <section>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                            'space-between',
                        marginBottom: '1rem'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem'
                        }}
                    >
                        <Bell
                            size={21}
                            style={{
                                color:
                                    '#6366f1'
                            }}
                        />

                        <h2
                            style={{
                                margin: 0
                            }}
                        >
                            Alert Sent
                        </h2>
                    </div>

                    <span
                        style={{
                            padding:
                                '0.3rem 0.7rem',
                            borderRadius:
                                '20px',
                            fontSize:
                                '0.8rem',
                            fontWeight: 700,
                            background:
                                'rgba(99, 102, 241, 0.12)',
                            color:
                                '#6366f1'
                        }}
                    >
                        {sentAlerts.length}
                    </span>
                </div>

                {sentAlerts.length === 0 ? (
                    <div
                        className="glass-card"
                        style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color:
                                'var(--text-muted, #888)'
                        }}
                    >
                        No alerts have been sent yet.
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gap: '1rem'
                        }}
                    >
                        {sentAlerts.map(
                            (alert, index) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{
                                        opacity: 0,
                                        y: 10
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0
                                    }}
                                    transition={{
                                        delay:
                                            index *
                                            0.05
                                    }}
                                    className="glass-card"
                                    style={{
                                        padding:
                                            '1.4rem',
                                        display:
                                            'flex',
                                        justifyContent:
                                            'space-between',
                                        alignItems:
                                            'center',
                                        gap:
                                            '1rem'
                                    }}
                                >

                                    <div
                                        style={{
                                            flex: 1
                                        }}
                                    >
                                        <div
                                            style={{
                                                display:
                                                    'flex',
                                                alignItems:
                                                    'center',
                                                gap:
                                                    '0.7rem',
                                                marginBottom:
                                                    '0.5rem'
                                            }}
                                        >
                                            <strong
                                                style={{
                                                    fontSize:
                                                        '1.15rem'
                                                }}
                                            >
                                                {
                                                    alert.currency_code
                                                }
                                            </strong>

                                            <span
                                                style={{
                                                    padding:
                                                        '0.25rem 0.6rem',
                                                    borderRadius:
                                                        '20px',
                                                    fontSize:
                                                        '0.75rem',
                                                    fontWeight:
                                                        700,
                                                    background:
                                                        'rgba(34, 197, 94, 0.1)',
                                                    color:
                                                        '#16a34a'
                                                }}
                                            >
                                                Sent
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                color:
                                                    'var(--text-muted, #888)'
                                            }}
                                        >
                                            Rate reached{' '}
                                            <strong>
                                                {Number(
                                                    alert.target_rate
                                                ).toFixed(
                                                    4
                                                )}
                                            </strong>
                                        </div>

                                        <small
                                            style={{
                                                display:
                                                    'block',
                                                marginTop:
                                                    '0.5rem',
                                                color:
                                                    'var(--text-muted, #888)'
                                            }}
                                        >
                                            Alert triggered:{' '}
                                            {formatDate(
                                                alert.last_triggered_at
                                            )}
                                        </small>
                                    </div>

                                    {/* DELETE ICON FOR SENT ALERT */}

                                    <button
                                        onClick={() =>
                                            handleDelete(
                                                alert.id
                                            )
                                        }
                                        title="Delete sent alert"
                                        aria-label="Delete sent alert"
                                        style={{
                                            width:
                                                '42px',
                                            height:
                                                '42px',
                                            borderRadius:
                                                '10px',
                                            border:
                                                'none',
                                            cursor:
                                                'pointer',
                                            display:
                                                'flex',
                                            alignItems:
                                                'center',
                                            justifyContent:
                                                'center',
                                            background:
                                                'rgba(239, 68, 68, 0.1)',
                                            color:
                                                '#ef4444',
                                            flexShrink: 0,
                                            transition:
                                                'all 0.2s ease'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background =
                                                'rgba(239, 68, 68, 0.18)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background =
                                                'rgba(239, 68, 68, 0.1)';
                                        }}
                                    >
                                        <Trash2
                                            size={
                                                19
                                            }
                                        />
                                    </button>

                                </motion.div>
                            )
                        )}
                    </div>
                )}
            </section>

        </div>
    );
};

export default Alerts;