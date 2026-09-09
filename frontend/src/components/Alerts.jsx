
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
    Sparkles,
    CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE from '../api';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);

    const [formData, setFormData] = useState({
        currency_code: 'USD',
        target_rate: '',
        condition: 'below'
    });

    // Currency list
    const [currencies, setCurrencies] = useState([]);
    const [loadingCurrencies, setLoadingCurrencies] = useState(true);

    // ---------------------------------------------------------
    // Currency names
    // ---------------------------------------------------------
    const currencyNames = {
        USD: 'US Dollar',
        EUR: 'Euro',
        GBP: 'British Pound',
        JPY: 'Japanese Yen',
        AUD: 'Australian Dollar',
        CAD: 'Canadian Dollar',
        CHF: 'Swiss Franc',
        CNY: 'Chinese Yuan',
        HKD: 'Hong Kong Dollar',
        NZD: 'New Zealand Dollar',
        SGD: 'Singapore Dollar',
        KRW: 'South Korean Won',
        THB: 'Thai Baht',
        MYR: 'Malaysian Ringgit',
        IDR: 'Indonesian Rupiah',
        PHP: 'Philippine Peso',
        VND: 'Vietnamese Dong',
        AED: 'UAE Dirham',
        SAR: 'Saudi Riyal',
        QAR: 'Qatari Riyal',
        KWD: 'Kuwaiti Dinar',
        OMR: 'Omani Rial',
        BHD: 'Bahraini Dinar',
        ZAR: 'South African Rand',
        RUB: 'Russian Ruble',
        BRL: 'Brazilian Real',
        MXN: 'Mexican Peso',
        ARS: 'Argentine Peso',
        CLP: 'Chilean Peso',
        COP: 'Colombian Peso',
        TRY: 'Turkish Lira',
        PLN: 'Polish Zloty',
        SEK: 'Swedish Krona',
        NOK: 'Norwegian Krone',
        DKK: 'Danish Krone',
        CZK: 'Czech Koruna',
        HUF: 'Hungarian Forint',
        ILS: 'Israeli New Shekel',
        EGP: 'Egyptian Pound',
        NGN: 'Nigerian Naira',
        KES: 'Kenyan Shilling',
        PKR: 'Pakistani Rupee',
        BDT: 'Bangladeshi Taka',
        LKR: 'Sri Lankan Rupee',
        NPR: 'Nepalese Rupee'
    };

    // ---------------------------------------------------------
    // Fetch currencies dynamically
    // ---------------------------------------------------------
    const fetchCurrencies = async () => {
        try {
            setLoadingCurrencies(true);

            const response = await axios.get(
                'https://open.er-api.com/v6/latest/INR'
            );

            const rates = response.data?.rates || {};

            const currencyList = Object.keys(rates)
                .sort()
                .map(code => ({
                    code,
                    name: currencyNames[code] || code
                }));

            setCurrencies(currencyList);

            // Keep USD as default if available
            if (currencyList.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    currency_code:
                        currencyList.some(c => c.code === prev.currency_code)
                            ? prev.currency_code
                            : 'USD'
                }));
            }
        } catch (error) {
            console.error('Error fetching currencies:', error);

            // Fallback currencies
            setCurrencies([
                { code: 'USD', name: 'US Dollar' },
                { code: 'EUR', name: 'Euro' },
                { code: 'GBP', name: 'British Pound' },
                { code: 'JPY', name: 'Japanese Yen' },
                { code: 'AUD', name: 'Australian Dollar' }
            ]);
        } finally {
            setLoadingCurrencies(false);
        }
    };

    // ---------------------------------------------------------
    // Normalize backend response
    // ---------------------------------------------------------
    const normalizeAlerts = (data) => {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.alerts)) {
            return data.alerts;
        }

        if (Array.isArray(data?.data)) {
            return data.data;
        }

        return [];
    };

    // ---------------------------------------------------------
    // Fetch alerts
    // ---------------------------------------------------------
    const fetchAlerts = async () => {
        try {
            const token = sessionStorage.getItem('token');

            const response = await axios.get(`${API_BASE}/alerts`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const fetchedAlerts = normalizeAlerts(response.data);

            console.log('Fetched alerts:', fetchedAlerts);

            setAlerts(fetchedAlerts);
        } catch (error) {
            console.error(
                'Error fetching alerts:',
                error.response?.data || error.message
            );
        }
    };

    // ---------------------------------------------------------
    // Initial load
    // ---------------------------------------------------------
    useEffect(() => {
        fetchCurrencies();
        fetchAlerts();
    }, []);

    // ---------------------------------------------------------
    // Auto refresh
    //
    // This is important because the worker changes:
    // is_active: true -> false
    //
    // Once that happens, the alert moves automatically to
    // Alert Sent.
    // ---------------------------------------------------------
    useEffect(() => {
        const interval = setInterval(() => {
            fetchAlerts();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // ---------------------------------------------------------
    // Create alert
    // ---------------------------------------------------------
    const handleAdd = async (e) => {
        e.preventDefault();

        try {
            const token = sessionStorage.getItem('token');

            const payload = {
                currency_code: formData.currency_code,
                target_rate: Number(formData.target_rate),
                condition: formData.condition
            };

            console.log('Creating alert:', payload);

            const response = await axios.post(
                `${API_BASE}/alerts`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log('Created alert response:', response.data);

            /*
             * Some backends return:
             *
             * response.data
             *
             * while others return:
             *
             * response.data.alert
             *
             * or:
             *
             * response.data.data
             */
            const createdAlert =
                response.data?.alert ||
                response.data?.data ||
                response.data;

            /*
             * Immediately put the newly-created alert
             * into the Active Alerts card.
             */
            if (
                createdAlert &&
                typeof createdAlert === 'object' &&
                createdAlert.id
            ) {
                const activeAlert = {
                    ...createdAlert,
                    currency_code:
                        createdAlert.currency_code || payload.currency_code,
                    target_rate:
                        createdAlert.target_rate ?? payload.target_rate,
                    condition:
                        createdAlert.condition || payload.condition,

                    // Newly created alerts are active
                    is_active:
                        createdAlert.is_active !== undefined
                            ? createdAlert.is_active
                            : true
                };

                setAlerts(prevAlerts => [
                    activeAlert,
                    ...prevAlerts.filter(
                        alert => alert.id !== activeAlert.id
                    )
                ]);
            }

            /*
             * Fetch from backend again.
             *
             * This ensures the frontend matches the database.
             */
            await fetchAlerts();

            // Clear target rate
            setFormData(prev => ({
                ...prev,
                target_rate: ''
            }));

        } catch (error) {
            console.error(
                'Error creating alert:',
                error.response?.data || error.message
            );

            alert(
                error.response?.data?.error ||
                'Failed to create alert'
            );
        }
    };

    // ---------------------------------------------------------
    // Delete alert
    // ---------------------------------------------------------
    const handleDelete = async (id) => {
        try {
            const token = sessionStorage.getItem('token');

            /*
             * Delete from backend.
             *
             * If your backend DELETE route is:
             * DELETE /alerts/:id
             * this will work directly.
             */
            await axios.delete(`${API_BASE}/alerts/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Remove from UI
            setAlerts(prevAlerts =>
                prevAlerts.filter(alert => alert.id !== id)
            );

        } catch (error) {
            console.error(
                'Error deleting alert:',
                error.response?.data || error.message
            );

            /*
             * If DELETE is not implemented in backend,
             * don't break the UI completely.
             */
            setAlerts(prevAlerts =>
                prevAlerts.filter(alert => alert.id !== id)
            );
        }
    };

    // ---------------------------------------------------------
    // Separate active and sent alerts
    // ---------------------------------------------------------
    const activeAlerts = alerts.filter(
        alert => alert.is_active === true
    );

    const sentAlerts = alerts.filter(
        alert => alert.is_active === false
    );

    // ---------------------------------------------------------
    // Format date
    // ---------------------------------------------------------
    const formatDate = (date) => {
        if (!date) return 'Recently';

        return new Date(date).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    // ---------------------------------------------------------
    // Alert card component
    // ---------------------------------------------------------
    const AlertItem = ({ alert, sent = false }) => {
        return (
            <motion.li
                key={alert.id}
                whileHover={{ x: 4 }}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem 1.5rem',
                    background: 'var(--bg-main)',
                    borderRadius: '1rem',
                    border: '1px solid var(--glass-border)',
                    borderLeft: `6px solid ${
                        sent
                            ? '#10b981'
                            : alert.condition === 'above'
                                ? '#10b981'
                                : '#ef4444'
                    }`
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem'
                    }}
                >
                    <div
                        style={{
                            background: sent
                                ? 'rgba(16, 185, 129, 0.15)'
                                : alert.condition === 'above'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(239, 68, 68, 0.15)',
                            padding: '0.75rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {sent ? (
                            <CheckCircle
                                color="#10b981"
                                size={22}
                            />
                        ) : alert.condition === 'above' ? (
                            <TrendingUp
                                color="#10b981"
                                size={22}
                            />
                        ) : (
                            <TrendingDown
                                color="#ef4444"
                                size={22}
                            />
                        )}
                    </div>

                    <div>
                        <strong
                            style={{
                                color: 'var(--text-main)',
                                fontSize: '1.2rem',
                                display: 'block',
                                fontWeight: '800'
                            }}
                        >
                            {alert.currency_code}
                        </strong>

                        <p
                            style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-muted)',
                                marginTop: '0.2rem'
                            }}
                        >
                            Notify when rate is{' '}
                            <strong>{alert.condition}</strong>{' '}
                            ₹{alert.target_rate}
                        </p>

                        {sent && (
                            <p
                                style={{
                                    fontSize: '0.8rem',
                                    color: '#10b981',
                                    marginTop: '0.35rem',
                                    fontWeight: '600'
                                }}
                            >
                                Alert sent{' '}
                                {formatDate(
                                    alert.last_triggered_at
                                )}
                            </p>
                        )}
                    </div>
                </div>

                {!sent && (
                    <button
                        type="button"
                        onClick={() => handleDelete(alert.id)}
                        style={{
                            background:
                                'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border:
                                '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '0.65rem',
                            borderRadius: '0.65rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </motion.li>
        );
    };

    return (
        <div
            className="fade-in"
            style={{
                display: 'grid',
                gridTemplateColumns:
                    'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '2rem',
                maxWidth: '1100px',
                margin: '0 auto',
                width: '100%'
            }}
        >

            {/* =================================================
                CREATE ALERT FORM
            ================================================= */}
            <form
                onSubmit={handleAdd}
                style={{
                    display: 'grid',
                    gap: '1.25rem'
                }}
            >
                <div style={{ marginBottom: '0.5rem' }}>
                    <h3
                        style={{
                            fontSize: '1.8rem',
                            color: 'var(--text-main)',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem'
                        }}
                    >
                        <Bell
                            color="var(--primary)"
                            size={26}
                        />
                        Set Smart Alert
                    </h3>

                    <p
                        style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.95rem'
                        }}
                    >
                        Get notified when exchange rates reach
                        your target
                    </p>
                </div>

                {/* CURRENCY */}
                <motion.div
                    whileHover={{
                        scale: 1.02,
                        y: -2
                    }}
                    transition={{ duration: 0.2 }}
                    className="glass-card"
                    style={{
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <motion.div
                            animate={{
                                rotate: [0, 360]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 10,
                                ease: 'linear'
                            }}
                            style={{
                                background:
                                    'rgba(99, 102, 241, 0.15)',
                                padding: '0.6rem',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Coins
                                size={20}
                                color="var(--primary)"
                            />
                        </motion.div>

                        <div>
                            <label
                                style={{
                                    color: 'var(--text-main)',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    display: 'block'
                                }}
                            >
                                Target Currency
                            </label>

                            <span
                                style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Choose currency to monitor
                            </span>
                        </div>
                    </div>

                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            marginTop: '0.25rem'
                        }}
                    >
                        <select
                            value={formData.currency_code}
                            disabled={loadingCurrencies}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    currency_code:
                                        e.target.value
                                })
                            }
                            style={{
                                width: '100%',
                                height: '3.25rem',
                                background:
                                    'var(--bg-main)',
                                color:
                                    'var(--text-main)',
                                padding:
                                    '0 2.5rem 0 1.2rem',
                                borderRadius: '0.85rem',
                                border:
                                    '1.5px solid var(--glass-border)',
                                outline: 'none',
                                fontWeight: '700',
                                fontSize: '1rem',
                                appearance: 'none',
                                WebkitAppearance:
                                    'none',
                                cursor: 'pointer'
                            }}
                        >
                            {loadingCurrencies ? (
                                <option>
                                    Loading currencies...
                                </option>
                            ) : (
                                currencies.map(currency => (
                                    <option
                                        key={currency.code}
                                        value={currency.code}
                                    >
                                        {currency.code} -{' '}
                                        {currency.name}
                                    </option>
                                ))
                            )}
                        </select>

                        <ChevronDown
                            size={18}
                            color="var(--primary)"
                            style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '50%',
                                transform:
                                    'translateY(-50%)',
                                pointerEvents: 'none'
                            }}
                        />
                    </div>
                </motion.div>

                {/* CONDITION */}
                <motion.div
                    whileHover={{
                        scale: 1.02,
                        y: -2
                    }}
                    transition={{ duration: 0.2 }}
                    className="glass-card"
                    style={{
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <motion.div
                            animate={{
                                y: [0, -4, 0]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 2,
                                ease: 'easeInOut'
                            }}
                            style={{
                                background:
                                    'rgba(16, 185, 129, 0.15)',
                                padding: '0.6rem',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Sliders
                                size={20}
                                color="#10b981"
                            />
                        </motion.div>

                        <div>
                            <label
                                style={{
                                    color:
                                        'var(--text-main)',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    display: 'block'
                                }}
                            >
                                Trigger Condition
                            </label>

                            <span
                                style={{
                                    color:
                                        'var(--text-muted)',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Alert threshold rule
                            </span>
                        </div>
                    </div>

                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            marginTop: '0.25rem'
                        }}
                    >
                        <select
                            value={formData.condition}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    condition:
                                        e.target.value
                                })
                            }
                            style={{
                                width: '100%',
                                height: '3.25rem',
                                background:
                                    'var(--bg-main)',
                                color:
                                    'var(--text-main)',
                                padding:
                                    '0 2.5rem 0 1.2rem',
                                borderRadius: '0.85rem',
                                border:
                                    '1.5px solid var(--glass-border)',
                                outline: 'none',
                                fontWeight: '700',
                                fontSize: '1rem',
                                appearance: 'none',
                                WebkitAppearance:
                                    'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="below">
                                📉 Rate drops below target
                            </option>

                            <option value="above">
                                📈 Rate rises above target
                            </option>
                        </select>

                        <ChevronDown
                            size={18}
                            color="#10b981"
                            style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '50%',
                                transform:
                                    'translateY(-50%)',
                                pointerEvents: 'none'
                            }}
                        />
                    </div>
                </motion.div>

                {/* TARGET RATE */}
                <motion.div
                    whileHover={{
                        scale: 1.02,
                        y: -2
                    }}
                    transition={{ duration: 0.2 }}
                    className="glass-card"
                    style={{
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.15, 1]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 2.5,
                                ease: 'easeInOut'
                            }}
                            style={{
                                background:
                                    'rgba(236, 72, 153, 0.15)',
                                padding: '0.6rem',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Target
                                size={20}
                                color="#ec4899"
                            />
                        </motion.div>

                        <div>
                            <label
                                style={{
                                    color:
                                        'var(--text-main)',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    display: 'block'
                                }}
                            >
                                Target Rate (INR)
                            </label>

                            <span
                                style={{
                                    color:
                                        'var(--text-muted)',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Specific rate to watch
                            </span>
                        </div>
                    </div>

                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. ₹82.50"
                        value={formData.target_rate}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                target_rate:
                                    e.target.value
                            })
                        }
                        required
                        style={{
                            width: '100%',
                            height: '3.25rem',
                            background:
                                'var(--bg-main)',
                            color:
                                'var(--text-main)',
                            padding:
                                '0 1.2rem',
                            borderRadius: '0.85rem',
                            border:
                                '1.5px solid var(--glass-border)',
                            outline: 'none',
                            fontWeight: '700',
                            fontSize: '1.05rem'
                        }}
                    />
                </motion.div>

                <button
                    type="submit"
                    className="glow-btn"
                    style={{
                        height: '3.5rem',
                        borderRadius: '1rem',
                        fontSize: '1.1rem',
                        marginTop: '0.5rem'
                    }}
                >
                    <Bell
                        size={20}
                        color="#ffffff"
                    />
                    Create Smart Alert
                </button>
            </form>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}
            <div
                style={{
                    display: 'grid',
                    gap: '2rem',
                    alignContent: 'start'
                }}
            >

                {/* =================================================
                    ACTIVE ALERTS
                ================================================= */}
                <div
                    className="glass-card"
                    style={{
                        padding: '2.5rem'
                    }}
                >
                    <h3
                        style={{
                            marginBottom: '1.5rem',
                            color:
                                'var(--text-main)',
                            fontSize: '1.8rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem'
                        }}
                    >
                        <Sparkles
                            color="var(--primary)"
                            size={24}
                        />
                        Active Alerts
                    </h3>

                    <ul
                        style={{
                            listStyle: 'none',
                            display: 'grid',
                            gap: '1rem',
                            padding: 0,
                            margin: 0
                        }}
                    >
                        {activeAlerts.map(alert => (
                            <AlertItem
                                key={alert.id}
                                alert={alert}
                            />
                        ))}

                        {activeAlerts.length === 0 && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding:
                                        '3rem 1.5rem',
                                    color:
                                        'var(--text-muted)'
                                }}
                            >
                                <Bell
                                    size={40}
                                    color="var(--primary)"
                                    style={{
                                        opacity: 0.4,
                                        marginBottom:
                                            '1rem'
                                    }}
                                />

                                <p
                                    style={{
                                        fontSize:
                                            '1.1rem'
                                    }}
                                >
                                    No active rate alerts
                                    configured yet.
                                </p>
                            </div>
                        )}
                    </ul>
                </div>

                {/* =================================================
                    ALERT SENT
                ================================================= */}
                <div
                    className="glass-card"
                    style={{
                        padding: '2.5rem'
                    }}
                >
                    <h3
                        style={{
                            marginBottom: '1.5rem',
                            color:
                                'var(--text-main)',
                            fontSize: '1.8rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem'
                        }}
                    >
                        <CheckCircle
                            color="#10b981"
                            size={24}
                        />
                        Alert Sent
                    </h3>

                    <ul
                        style={{
                            listStyle: 'none',
                            display: 'grid',
                            gap: '1rem',
                            padding: 0,
                            margin: 0
                        }}
                    >
                        {sentAlerts.map(alert => (
                            <AlertItem
                                key={alert.id}
                                alert={alert}
                                sent
                            />
                        ))}

                        {sentAlerts.length === 0 && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding:
                                        '3rem 1.5rem',
                                    color:
                                        'var(--text-muted)'
                                }}
                            >
                                <CheckCircle
                                    size={40}
                                    color="#10b981"
                                    style={{
                                        opacity: 0.4,
                                        marginBottom:
                                            '1rem'
                                    }}
                                />

                                <p
                                    style={{
                                        fontSize:
                                            '1.1rem'
                                    }}
                                >
                                    No alerts have been
                                    sent yet.
                                </p>
                            </div>
                        )}
                    </ul>
                </div>

            </div>
        </div>
    );
};

export default Alerts;

