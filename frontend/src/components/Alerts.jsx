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
    CheckCircle,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE from '../api';

const Alerts = () => {

    // ======================================================
    // STATE
    // ======================================================

    const [alerts, setAlerts] = useState([]);

    const [currencies, setCurrencies] = useState([]);

    const [currencyLoading, setCurrencyLoading] = useState(true);

    const [formData, setFormData] = useState({
        currency_code: '',
        target_rate: '',
        condition: 'below'
    });


    // ======================================================
    // FETCH ALERTS
    // ======================================================

    const fetchAlerts = async () => {

        try {

            const token = sessionStorage.getItem('token');

            const res = await axios.get(
                `${API_BASE}/alerts`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setAlerts(
                Array.isArray(res.data)
                    ? res.data
                    : []
            );

        } catch (e) {

            console.error(
                'Error fetching alerts:',
                e
            );

        }
    };


    // ======================================================
    // FETCH AVAILABLE CURRENCIES DYNAMICALLY
    // ======================================================

    const fetchCurrencies = async () => {

        try {

            setCurrencyLoading(true);

            /*
             * The same exchange-rate API used by your backend
             * returns all currencies supported by the API.
             *
             * INR is the base currency.
             */

            const response = await axios.get(
                'https://open.er-api.com/v6/latest/INR'
            );

            const rates = response.data?.rates;

            if (!rates || typeof rates !== 'object') {

                throw new Error(
                    'Currency data unavailable'
                );

            }


            /*
             * Currency names.
             *
             * The currency codes themselves are obtained
             * dynamically from the API.
             */

            const currencyNames = {
                AED: 'UAE Dirham',
                AFN: 'Afghan Afghani',
                ALL: 'Albanian Lek',
                AMD: 'Armenian Dram',
                ANG: 'Netherlands Antillean Guilder',
                AOA: 'Angolan Kwanza',
                ARS: 'Argentine Peso',
                AUD: 'Australian Dollar',
                AWG: 'Aruban Florin',
                AZN: 'Azerbaijani Manat',
                BAM: 'Bosnia-Herzegovina Convertible Mark',
                BBD: 'Barbadian Dollar',
                BDT: 'Bangladeshi Taka',
                BGN: 'Bulgarian Lev',
                BHD: 'Bahraini Dinar',
                BIF: 'Burundian Franc',
                BMD: 'Bermudian Dollar',
                BND: 'Brunei Dollar',
                BOB: 'Bolivian Boliviano',
                BRL: 'Brazilian Real',
                BSD: 'Bahamian Dollar',
                BTN: 'Bhutanese Ngultrum',
                BWP: 'Botswana Pula',
                BYN: 'Belarusian Ruble',
                BZD: 'Belize Dollar',
                CAD: 'Canadian Dollar',
                CDF: 'Congolese Franc',
                CHF: 'Swiss Franc',
                CLP: 'Chilean Peso',
                CNY: 'Chinese Yuan',
                COP: 'Colombian Peso',
                CRC: 'Costa Rican Colón',
                CUP: 'Cuban Peso',
                CVE: 'Cape Verdean Escudo',
                CZK: 'Czech Koruna',
                DJF: 'Djiboutian Franc',
                DKK: 'Danish Krone',
                DOP: 'Dominican Peso',
                DZD: 'Algerian Dinar',
                EGP: 'Egyptian Pound',
                ERN: 'Eritrean Nakfa',
                ETB: 'Ethiopian Birr',
                EUR: 'Euro',
                FJD: 'Fijian Dollar',
                FKP: 'Falkland Islands Pound',
                FOK: 'Faroese Króna',
                GBP: 'British Pound',
                GEL: 'Georgian Lari',
                GGP: 'Guernsey Pound',
                GHS: 'Ghanaian Cedi',
                GIP: 'Gibraltar Pound',
                GMD: 'Gambian Dalasi',
                GNF: 'Guinean Franc',
                GTQ: 'Guatemalan Quetzal',
                GYD: 'Guyanese Dollar',
                HKD: 'Hong Kong Dollar',
                HNL: 'Honduran Lempira',
                HRK: 'Croatian Kuna',
                HTG: 'Haitian Gourde',
                HUF: 'Hungarian Forint',
                IDR: 'Indonesian Rupiah',
                ILS: 'Israeli New Shekel',
                IMP: 'Isle of Man Pound',
                IQD: 'Iraqi Dinar',
                IRR: 'Iranian Rial',
                ISK: 'Icelandic Króna',
                JEP: 'Jersey Pound',
                JMD: 'Jamaican Dollar',
                JOD: 'Jordanian Dinar',
                JPY: 'Japanese Yen',
                KES: 'Kenyan Shilling',
                KGS: 'Kyrgyzstani Som',
                KHR: 'Cambodian Riel',
                KID: 'Kiribati Dollar',
                KMF: 'Comorian Franc',
                KRW: 'South Korean Won',
                KWD: 'Kuwaiti Dinar',
                KYD: 'Cayman Islands Dollar',
                KZT: 'Kazakhstani Tenge',
                LAK: 'Lao Kip',
                LBP: 'Lebanese Pound',
                LKR: 'Sri Lankan Rupee',
                LRD: 'Liberian Dollar',
                LSL: 'Lesotho Loti',
                LYD: 'Libyan Dinar',
                MAD: 'Moroccan Dirham',
                MDL: 'Moldovan Leu',
                MGA: 'Malagasy Ariary',
                MKD: 'Macedonian Denar',
                MMK: 'Myanmar Kyat',
                MNT: 'Mongolian Tögrög',
                MOP: 'Macanese Pataca',
                MRU: 'Mauritanian Ouguiya',
                MUR: 'Mauritian Rupee',
                MVR: 'Maldivian Rufiyaa',
                MWK: 'Malawian Kwacha',
                MXN: 'Mexican Peso',
                MYR: 'Malaysian Ringgit',
                MZN: 'Mozambican Metical',
                NAD: 'Namibian Dollar',
                NGN: 'Nigerian Naira',
                NIO: 'Nicaraguan Córdoba',
                NOK: 'Norwegian Krone',
                NPR: 'Nepalese Rupee',
                NZD: 'New Zealand Dollar',
                OMR: 'Omani Rial',
                PAB: 'Panamanian Balboa',
                PEN: 'Peruvian Sol',
                PGK: 'Papua New Guinean Kina',
                PHP: 'Philippine Peso',
                PKR: 'Pakistani Rupee',
                PLN: 'Polish Złoty',
                PYG: 'Paraguayan Guarani',
                QAR: 'Qatari Riyal',
                RON: 'Romanian Leu',
                RSD: 'Serbian Dinar',
                RUB: 'Russian Ruble',
                RWF: 'Rwandan Franc',
                SAR: 'Saudi Riyal',
                SBD: 'Solomon Islands Dollar',
                SCR: 'Seychellois Rupee',
                SDG: 'Sudanese Pound',
                SEK: 'Swedish Krona',
                SGD: 'Singapore Dollar',
                SHP: 'Saint Helena Pound',
                SLE: 'Sierra Leonean Leone',
                SLL: 'Sierra Leonean Leone',
                SOS: 'Somali Shilling',
                SRD: 'Surinamese Dollar',
                SSP: 'South Sudanese Pound',
                STN: 'São Tomé and Príncipe Dobra',
                SYP: 'Syrian Pound',
                SZL: 'Eswatini Lilangeni',
                THB: 'Thai Baht',
                TJS: 'Tajikistani Somoni',
                TMT: 'Turkmenistani Manat',
                TND: 'Tunisian Dinar',
                TOP: 'Tongan Paʻanga',
                TRY: 'Turkish Lira',
                TTD: 'Trinidad and Tobago Dollar',
                TVD: 'Tuvaluan Dollar',
                TWD: 'New Taiwan Dollar',
                TZS: 'Tanzanian Shilling',
                UAH: 'Ukrainian Hryvnia',
                UGX: 'Ugandan Shilling',
                USD: 'US Dollar',
                UYU: 'Uruguayan Peso',
                UZS: 'Uzbekistani Som',
                VES: 'Venezuelan Bolívar',
                VND: 'Vietnamese Dong',
                VUV: 'Vanuatu Vatu',
                WST: 'Samoan Tala',
                XAF: 'Central African CFA Franc',
                XCD: 'East Caribbean Dollar',
                XOF: 'West African CFA Franc',
                XPF: 'CFP Franc',
                YER: 'Yemeni Rial',
                ZAR: 'South African Rand',
                ZMW: 'Zambian Kwacha',
                ZWL: 'Zimbabwean Dollar'
            };


            /*
             * Convert the API rates object into an array.
             */

            const currencyList = Object.keys(rates)
                .filter(code => code !== 'INR')
                .map(code => ({
                    code,
                    name:
                        currencyNames[code] ||
                        code
                }))
                .sort((a, b) =>
                    a.code.localeCompare(b.code)
                );


            setCurrencies(currencyList);


            /*
             * Set a default currency after loading.
             */

            setFormData(previous => ({
                ...previous,
                currency_code:
                    previous.currency_code ||
                    currencyList.find(
                        currency =>
                            currency.code === 'USD'
                    )?.code ||
                    currencyList[0]?.code ||
                    ''
            }));

        } catch (error) {

            console.error(
                'Failed to load currencies:',
                error
            );

            setCurrencies([]);

        } finally {

            setCurrencyLoading(false);

        }
    };


    // ======================================================
    // INITIAL LOAD + REFRESH
    // ======================================================

    useEffect(() => {

        fetchAlerts();

        fetchCurrencies();


        /*
         * Refresh alerts every minute.
         *
         * The backend worker runs every 5 minutes,
         * so this allows the UI to detect when
         * is_active changes from true to false.
         */

        const interval = setInterval(() => {
            fetchAlerts();
        }, 60000);


        return () => {
            clearInterval(interval);
        };

    }, []);


    // ======================================================
    // CREATE ALERT
    // ======================================================

    const handleAdd = async (e) => {

        e.preventDefault();

        try {

            const token =
                sessionStorage.getItem('token');


            await axios.post(
                `${API_BASE}/alerts`,
                formData,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


            /*
             * Refresh immediately after creation.
             */

            await fetchAlerts();


            /*
             * Keep selected currency and condition,
             * clear only target rate.
             */

            setFormData(previous => ({
                ...previous,
                target_rate: ''
            }));

        } catch (e) {

            console.error(
                'Error creating alert:',
                e
            );

        }

    };


    // ======================================================
    // DELETE ALERT
    // ======================================================

    const handleDelete = async (id) => {

        try {

            const token =
                sessionStorage.getItem('token');


            await axios.delete(
                `${API_BASE}/alerts/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


            setAlerts(previous =>
                previous.filter(
                    alert => alert.id !== id
                )
            );

        } catch (e) {

            console.error(
                'Error deleting alert:',
                e
            );

        }

    };


    // ======================================================
    // ACTIVE / SENT ALERTS
    // ======================================================

    const activeAlerts =
        alerts.filter(
            alert => alert.is_active === true
        );


    const sentAlerts =
        alerts.filter(
            alert => alert.is_active === false
        );


    // ======================================================
    // DATE FORMAT
    // ======================================================

    const formatDate = (date) => {

        if (!date) {
            return 'Recently';
        }


        try {

            return new Date(date)
                .toLocaleString();

        } catch {

            return 'Recently';

        }

    };


    // ======================================================
    // RETURN
    // ======================================================

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

            {/* ==================================================
                CREATE ALERT
            ================================================== */}

            <form
                onSubmit={handleAdd}
                style={{
                    display: 'grid',
                    gap: '1.25rem'
                }}
            >

                <div
                    style={{
                        marginBottom: '0.5rem'
                    }}
                >

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
                        Get notified when exchange rates
                        reach your target
                    </p>

                </div>


                {/* ==================================================
                    DYNAMIC CURRENCY
                ================================================== */}

                <motion.div
                    whileHover={{
                        scale: 1.02,
                        y: -2
                    }}
                    transition={{
                        duration: 0.2
                    }}
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
                                    color:
                                        'var(--text-main)',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    display: 'block'
                                }}
                            >
                                Target Currency
                            </label>

                            <span
                                style={{
                                    color:
                                        'var(--text-muted)',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Choose any supported currency
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
                            value={
                                formData.currency_code
                            }
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    currency_code:
                                        e.target.value
                                })
                            }
                            disabled={
                                currencyLoading ||
                                currencies.length === 0
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
                                WebkitAppearance: 'none',
                                cursor:
                                    currencyLoading
                                        ? 'wait'
                                        : 'pointer',
                                boxShadow:
                                    '0 4px 15px rgba(0,0,0,0.05)'
                            }}
                        >

                            {currencyLoading ? (

                                <option value="">
                                    Loading currencies...
                                </option>

                            ) : currencies.length === 0 ? (

                                <option value="">
                                    No currencies available
                                </option>

                            ) : (

                                currencies.map(
                                    currency => (

                                        <option
                                            key={
                                                currency.code
                                            }
                                            value={
                                                currency.code
                                            }
                                        >
                                            {currency.code} - {currency.name}
                                        </option>

                                    )
                                )

                            )}

                        </select>


                        {currencyLoading ? (

                            <Loader2
                                size={18}
                                color="var(--primary)"
                                style={{
                                    position:
                                        'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform:
                                        'translateY(-50%)',
                                    animation:
                                        'spin 1s linear infinite'
                                }}
                            />

                        ) : (

                            <ChevronDown
                                size={18}
                                color="var(--primary)"
                                style={{
                                    position:
                                        'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform:
                                        'translateY(-50%)',
                                    pointerEvents:
                                        'none'
                                }}
                            />

                        )}

                    </div>

                </motion.div>


                {/* ==================================================
                    CONDITION
                ================================================== */}

                <motion.div
                    whileHover={{
                        scale: 1.02,
                        y: -2
                    }}
                    transition={{
                        duration: 0.2
                    }}
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
                            value={
                                formData.condition
                            }
                            onChange={(e) =>
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
                                WebkitAppearance: 'none',
                                cursor: 'pointer',
                                boxShadow:
                                    '0 4px 15px rgba(0,0,0,0.05)'
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


                {/* ==================================================
                    TARGET RATE
                ================================================== */}

                <motion.div
                    whileHover={{
                        scale: 1.02,
                        y: -2
                    }}
                    transition={{
                        duration: 0.2
                    }}
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
                        step="0.000001"
                        placeholder="Enter target rate"
                        value={
                            formData.target_rate
                        }
                        onChange={(e) =>
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
                            fontSize: '1.05rem',
                            boxShadow:
                                'inset 0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    />

                </motion.div>


                {/* ==================================================
                    SUBMIT
                ================================================== */}

                <button
                    type="submit"
                    className="glow-btn"
                    disabled={
                        currencyLoading ||
                        !formData.currency_code
                    }
                    style={{
                        height: '3.5rem',
                        borderRadius: '1rem',
                        fontSize: '1.1rem',
                        marginTop: '0.5rem',
                        opacity:
                            currencyLoading
                                ? 0.6
                                : 1
                    }}
                >

                    <Bell
                        size={20}
                        color="#ffffff"
                    />

                    Create Smart Alert

                </button>

            </form>


            {/* ==================================================
                RIGHT SIDE
            ================================================== */}

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem'
                }}
            >

                {/* ==================================================
                    ACTIVE ALERTS
                ================================================== */}

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

                        {activeAlerts.map(a => (

                            <motion.li
                                key={a.id}
                                whileHover={{
                                    x: 4
                                }}
                                style={{
                                    display: 'flex',
                                    justifyContent:
                                        'space-between',
                                    alignItems: 'center',
                                    padding:
                                        '1.25rem 1.5rem',
                                    background:
                                        'var(--bg-main)',
                                    borderRadius: '1rem',
                                    border:
                                        '1px solid var(--glass-border)',
                                    borderLeft:
                                        `6px solid ${
                                            a.condition === 'above'
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
                                            background:
                                                a.condition === 'above'
                                                    ? 'rgba(16, 185, 129, 0.15)'
                                                    : 'rgba(239, 68, 68, 0.15)',
                                            padding:
                                                '0.75rem',
                                            borderRadius:
                                                '50%',
                                            display: 'flex',
                                            alignItems:
                                                'center',
                                            justifyContent:
                                                'center'
                                        }}
                                    >

                                        {a.condition === 'above'
                                            ? (
                                                <TrendingUp
                                                    color="#10b981"
                                                    size={22}
                                                />
                                            )
                                            : (
                                                <TrendingDown
                                                    color="#ef4444"
                                                    size={22}
                                                />
                                            )
                                        }

                                    </div>


                                    <div>

                                        <strong
                                            style={{
                                                color:
                                                    'var(--text-main)',
                                                fontSize:
                                                    '1.2rem',
                                                display:
                                                    'block',
                                                fontWeight:
                                                    '800'
                                            }}
                                        >
                                            {a.currency_code}
                                        </strong>


                                        <p
                                            style={{
                                                fontSize:
                                                    '0.9rem',
                                                color:
                                                    'var(--text-muted)',
                                                marginTop:
                                                    '0.2rem'
                                            }}
                                        >
                                            Notify when rate is{' '}
                                            <strong>
                                                {a.condition}
                                            </strong>{' '}
                                            ₹{a.target_rate}
                                        </p>


                                        <span
                                            style={{
                                                fontSize:
                                                    '0.8rem',
                                                color:
                                                    '#10b981',
                                                fontWeight:
                                                    '700'
                                            }}
                                        >
                                            ● Active
                                        </span>

                                    </div>

                                </div>


                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDelete(a.id)
                                    }
                                    style={{
                                        background:
                                            'rgba(239, 68, 68, 0.15)',
                                        color:
                                            '#ef4444',
                                        border:
                                            '1px solid rgba(239, 68, 68, 0.3)',
                                        padding:
                                            '0.65rem',
                                        borderRadius:
                                            '0.65rem',
                                        cursor:
                                            'pointer',
                                        display:
                                            'flex',
                                        alignItems:
                                            'center',
                                        justifyContent:
                                            'center'
                                    }}
                                >

                                    <Trash2 size={18} />

                                </button>

                            </motion.li>

                        ))}


                        {activeAlerts.length === 0 && (

                            <div
                                style={{
                                    textAlign:
                                        'center',
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
                                    No active rate alerts configured yet.
                                </p>

                            </div>

                        )}

                    </ul>

                </div>


                {/* ==================================================
                    ALERT SENT
                ================================================== */}

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

                        {sentAlerts.map(a => (

                            <motion.li
                                key={a.id}
                                whileHover={{
                                    x: 4
                                }}
                                style={{
                                    padding:
                                        '1.25rem 1.5rem',
                                    background:
                                        'var(--bg-main)',
                                    borderRadius:
                                        '1rem',
                                    border:
                                        '1px solid var(--glass-border)',
                                    borderLeft:
                                        '6px solid #10b981'
                                }}
                            >

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent:
                                            'space-between',
                                        alignItems:
                                            'center',
                                        gap: '1rem'
                                    }}
                                >

                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems:
                                                'center',
                                            gap: '1.25rem'
                                        }}
                                    >

                                        <div
                                            style={{
                                                background:
                                                    'rgba(16, 185, 129, 0.15)',
                                                padding:
                                                    '0.75rem',
                                                borderRadius:
                                                    '50%',
                                                display:
                                                    'flex',
                                                alignItems:
                                                    'center',
                                                justifyContent:
                                                    'center'
                                            }}
                                        >

                                            <CheckCircle
                                                color="#10b981"
                                                size={22}
                                            />

                                        </div>


                                        <div>

                                            <strong
                                                style={{
                                                    color:
                                                        'var(--text-main)',
                                                    fontSize:
                                                        '1.2rem',
                                                    display:
                                                        'block',
                                                    fontWeight:
                                                        '800'
                                                }}
                                            >
                                                {a.currency_code}
                                            </strong>


                                            <p
                                                style={{
                                                    fontSize:
                                                        '0.9rem',
                                                    color:
                                                        'var(--text-muted)',
                                                    marginTop:
                                                        '0.2rem'
                                                }}
                                            >
                                                Alert triggered when rate was{' '}
                                                <strong>
                                                    {a.condition}
                                                </strong>{' '}
                                                ₹{a.target_rate}
                                            </p>


                                            <p
                                                style={{
                                                    fontSize:
                                                        '0.8rem',
                                                    color:
                                                        'var(--text-muted)',
                                                    marginTop:
                                                        '0.35rem'
                                                }}
                                            >
                                                Sent:{' '}
                                                {formatDate(
                                                    a.last_triggered_at
                                                )}
                                            </p>

                                        </div>

                                    </div>


                                    <span
                                        style={{
                                            background:
                                                'rgba(16, 185, 129, 0.15)',
                                            color:
                                                '#10b981',
                                            padding:
                                                '0.4rem 0.7rem',
                                            borderRadius:
                                                '0.6rem',
                                            fontSize:
                                                '0.75rem',
                                            fontWeight:
                                                '800',
                                            whiteSpace:
                                                'nowrap'
                                        }}
                                    >
                                        SENT
                                    </span>

                                </div>

                            </motion.li>

                        ))}


                        {sentAlerts.length === 0 && (

                            <div
                                style={{
                                    textAlign:
                                        'center',
                                    padding:
                                        '2.5rem 1.5rem',
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
                                            '1.05rem'
                                    }}
                                >
                                    No alerts have been sent yet.
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

