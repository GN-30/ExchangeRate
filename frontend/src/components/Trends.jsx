import React, {
    useState,
    useEffect,
    useCallback,
    useRef
} from 'react';

import axios from 'axios';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';

import {
    Search,
    ArrowLeftRight,
    MapPin,
    Loader2,
    X
} from 'lucide-react';

import API_BASE from '../api';


const Trends = () => {

    const [data, setData] = useState([]);

    const [searchTerm, setSearchTerm] =
        useState('United States');

    const [loading, setLoading] =
        useState(false);


    // ------------------------------------------
    // Toggle
    //
    // false = INR → Foreign Currency
    // true  = Foreign Currency → INR
    // ------------------------------------------

    const [reverseRate, setReverseRate] =
        useState(false);


    // Currency code returned by backend

    const [currencyCode, setCurrencyCode] =
        useState('USD');


    // ------------------------------------------
    // Autocomplete
    // ------------------------------------------

    const [suggestions, setSuggestions] =
        useState([]);

    const [showSuggestions, setShowSuggestions] =
        useState(false);

    const [suggestionLoading, setSuggestionLoading] =
        useState(false);


    // ------------------------------------------
    // Refs
    // ------------------------------------------

    const searchContainerRef =
        useRef(null);

    const inputRef =
        useRef(null);

    const searchTimeoutRef =
        useRef(null);


    // =====================================================
    // FETCH TRENDS
    // =====================================================

    const fetchTrends = async (query) => {

        if (!query || !query.trim()) {
            return;
        }

        setLoading(true);

        try {

            const res = await axios.get(
                `${API_BASE}/history/rates/${encodeURIComponent(
                    query.trim()
                )}`
            );


            const responseData =
                Array.isArray(res.data)
                    ? res.data
                    : [];


            // ------------------------------------------
            // Get currency from backend response
            // ------------------------------------------

            if (responseData.length > 0) {

                setCurrencyCode(
                    responseData[0].currency || 'USD'
                );

            }


            setData(responseData);


        } catch (e) {

            console.error(
                'Failed to fetch trends:',
                e
            );

            setData([]);

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        fetchTrends(searchTerm);

        return () => {

            if (searchTimeoutRef.current) {

                clearTimeout(
                    searchTimeoutRef.current
                );

            }

        };

    }, []);


    // =====================================================
    // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
    // =====================================================

    useEffect(() => {

        const handleOutsideClick = (event) => {

            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(
                    event.target
                )
            ) {

                setShowSuggestions(false);

            }

        };


        document.addEventListener(
            'mousedown',
            handleOutsideClick
        );


        return () => {

            document.removeEventListener(
                'mousedown',
                handleOutsideClick
            );

        };

    }, []);


    // =====================================================
    // FETCH SEARCH SUGGESTIONS
    // =====================================================

    const fetchSuggestions =
        useCallback(async (query) => {

            const cleanQuery =
                query.trim();


            if (cleanQuery.length < 2) {

                setSuggestions([]);

                setShowSuggestions(false);

                return;

            }


            setSuggestionLoading(true);


            try {

                const response =
                    await axios.get(
                        `${API_BASE}/search?q=${encodeURIComponent(
                            cleanQuery
                        )}`
                    );


                const results =
                    Array.isArray(response.data)
                        ? response.data
                        : [];


                setSuggestions(results);

                setShowSuggestions(
                    results.length > 0
                );


            } catch (err) {

                console.error(
                    'Suggestion error:',
                    err
                );

                setSuggestions([]);

                setShowSuggestions(false);

            } finally {

                setSuggestionLoading(false);

            }

        }, []);


    // =====================================================
    // SEARCH INPUT
    // =====================================================

    const handleSearchChange = (e) => {

        const value =
            e.target.value;


        setSearchTerm(value);


        // Cancel previous timeout

        if (searchTimeoutRef.current) {

            clearTimeout(
                searchTimeoutRef.current
            );

        }


        if (value.trim().length >= 2) {

            searchTimeoutRef.current =
                setTimeout(() => {

                    fetchSuggestions(value);

                }, 350);

        } else {

            setSuggestions([]);

            setShowSuggestions(false);

        }

    };


    // =====================================================
    // SELECT SUGGESTION
    // =====================================================

    const handleSelectSuggestion =
        (suggestion) => {

            if (!suggestion) {
                return;
            }


            const query =
                suggestion.display_name ||
                suggestion.name ||
                '';


            if (!query) {
                return;
            }


            setSearchTerm(query);

            setSuggestions([]);

            setShowSuggestions(false);

            setSuggestionLoading(false);


            // Reset toggle for new currency

            setReverseRate(false);


            fetchTrends(query);

        };


    // =====================================================
    // ENTER KEY
    // =====================================================

    const handleKeyDown = (e) => {

        if (e.key === 'Escape') {

            setShowSuggestions(false);

            return;

        }


        if (e.key === 'Enter') {

            e.preventDefault();


            if (searchTimeoutRef.current) {

                clearTimeout(
                    searchTimeoutRef.current
                );

            }


            setShowSuggestions(false);

            setSuggestions([]);


            fetchTrends(searchTerm);

        }

    };


    // =====================================================
    // CLEAR SEARCH
    // =====================================================

    const clearSearch = () => {

        setSearchTerm('');

        setSuggestions([]);

        setShowSuggestions(false);

        inputRef.current?.focus();

    };


    // =====================================================
    // TOGGLE RATE DIRECTION
    // =====================================================

    const handleToggleRate = () => {

        setReverseRate(
            previous => !previous
        );

    };


    // =====================================================
    // PREPARE DATA FOR CHART
    // =====================================================

    const chartData =
        data.map(item => {

            const originalRate =
                Number(item.rate);


            if (
                !originalRate ||
                originalRate <= 0
            ) {

                return {
                    ...item,
                    displayRate: null
                };

            }


            // Backend gives:
            //
            // INR → Foreign Currency
            //
            // Reverse:
            //
            // Foreign Currency → INR

            const displayRate =
                reverseRate
                    ? 1 / originalRate
                    : originalRate;


            return {

                ...item,

                displayRate

            };

        });


    // =====================================================
    // CURRENT RATE
    // =====================================================

    const latestRate =
        chartData.length > 0
            ? chartData[
                chartData.length - 1
            ].displayRate
            : null;


    // =====================================================
    // LABELS
    // =====================================================

    const fromCurrency =
        reverseRate
            ? currencyCode
            : 'INR';


    const toCurrency =
        reverseRate
            ? 'INR'
            : currencyCode;


    const rateLabel =
        `${fromCurrency} → ${toCurrency}`;


    // =====================================================
    // FORMAT RATE
    // =====================================================

    const formatRate = (value) => {

        if (
            value === null ||
            value === undefined ||
            !isFinite(value)
        ) {

            return '-';

        }


        if (value >= 10) {

            return value.toFixed(2);

        }


        if (value >= 1) {

            return value.toFixed(4);

        }


        return value.toFixed(6);

    };


    return (

        <div
            className="fade-in glass-card"
            style={{
                position: 'relative',

                // IMPORTANT:
                // Allows dropdown to escape card boundaries

                overflow: 'visible',

                zIndex: 1
            }}
        >

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',

                    // IMPORTANT

                    position: 'relative',
                    zIndex: 100
                }}
            >

                <h2
                    className="premium-gradient-text"
                    style={{
                        fontSize: '2rem',
                        margin: 0
                    }}
                >
                    Exchange Rate Trends
                </h2>


                {/* ================================================= */}
                {/* SEARCH CONTAINER */}
                {/* ================================================= */}

                <div
                    ref={searchContainerRef}

                    style={{
                        position: 'relative',

                        display: 'flex',

                        flex: 1,

                        minWidth: '250px',

                        maxWidth: '400px',

                        // VERY IMPORTANT

                        zIndex: 10000
                    }}
                >

                    {/* SEARCH ICON */}

                    <Search
                        size={20}
                        style={{
                            position: 'absolute',

                            left: '1.2rem',

                            top: '50%',

                            transform:
                                'translateY(-50%)',

                            color:
                                'var(--text-muted)',

                            zIndex: 3,

                            pointerEvents:
                                'none'
                        }}
                    />


                    {/* SEARCH INPUT */}

                    <input
                        ref={inputRef}

                        type="text"

                        value={searchTerm}

                        onChange={
                            handleSearchChange
                        }

                        onKeyDown={
                            handleKeyDown
                        }

                        onFocus={() => {

                            if (
                                suggestions.length > 0
                            ) {

                                setShowSuggestions(
                                    true
                                );

                            }

                        }}

                        autoComplete="off"

                        placeholder="Search any country or location..."

                        style={{
                            width: '100%',

                            padding:
                                '0.85rem 4.5rem 0.85rem 3.5rem',

                            background:
                                'var(--bg-main)',

                            border:
                                showSuggestions
                                    ? '1px solid rgba(139,92,246,0.7)'
                                    : '1px solid var(--glass-border)',

                            borderRadius:
                                '2rem',

                            color:
                                'var(--text-main)',

                            fontSize:
                                '1.05rem',

                            boxShadow:
                                showSuggestions
                                    ? '0 0 25px rgba(139,92,246,0.15)'
                                    : '0 4px 15px rgba(0,0,0,0.05)',

                            outline:
                                'none',

                            transition:
                                'all 0.25s ease'
                        }}
                    />


                    {/* LOADING / CLEAR BUTTON */}

                    <div
                        style={{
                            position:
                                'absolute',

                            right:
                                '1rem',

                            top:
                                '50%',

                            transform:
                                'translateY(-50%)',

                            display:
                                'flex',

                            alignItems:
                                'center',

                            justifyContent:
                                'center',

                            zIndex: 3
                        }}
                    >

                        {suggestionLoading ? (

                            <Loader2
                                size={18}
                                style={{
                                    color:
                                        'var(--primary)',

                                    animation:
                                        'trendsSpin 1s linear infinite'
                                }}
                            />

                        ) : searchTerm ? (

                            <button
                                type="button"

                                onClick={
                                    clearSearch
                                }

                                style={{
                                    border:
                                        'none',

                                    background:
                                        'transparent',

                                    padding:
                                        '4px',

                                    display:
                                        'flex',

                                    cursor:
                                        'pointer',

                                    color:
                                        'var(--text-muted)'
                                }}

                                aria-label="Clear search"
                            >

                                <X
                                    size={17}
                                />

                            </button>

                        ) : null}

                    </div>


                    {/* ================================================= */}
                    {/* DYNAMIC DROPDOWN */}
                    {/* ================================================= */}

                    {showSuggestions &&
                        suggestions.length > 0 && (

                        <div
                            className="trends-suggestions-wrapper"

                            style={{
                                position:
                                    'absolute',

                                top:
                                    'calc(100% + 10px)',

                                left: 0,

                                right: 0,

                                width: '100%',

                                zIndex:
                                    999999,

                                pointerEvents:
                                    'auto'
                            }}
                        >

                            <ul
                                style={{
                                    width:
                                        '100%',

                                    boxSizing:
                                        'border-box',

                                    background:
                                        'var(--bg-card)',

                                    border:
                                        '1px solid var(--glass-border)',

                                    borderRadius:
                                        '16px',

                                    margin:
                                        0,

                                    padding:
                                        '7px 0',

                                    listStyle:
                                        'none',

                                    maxHeight:
                                        '300px',

                                    overflowY:
                                        'auto',

                                    boxShadow:
                                        '0 20px 50px rgba(0,0,0,0.35), 0 0 30px rgba(139,92,246,0.12)',

                                    backdropFilter:
                                        'blur(20px)',

                                    WebkitBackdropFilter:
                                        'blur(20px)'
                                }}
                            >

                                {suggestions.map(
                                    (s, i) => (

                                    <li
                                        key={
                                            `${s.display_name || s.name}-${i}`
                                        }

                                        onMouseDown={
                                            (e) => {

                                                /*
                                                 * Prevent input
                                                 * blur before
                                                 * click fires.
                                                 */

                                                e.preventDefault();

                                                handleSelectSuggestion(
                                                    s
                                                );

                                            }
                                        }

                                        style={{
                                            display:
                                                'flex',

                                            alignItems:
                                                'center',

                                            gap:
                                                '0.75rem',

                                            padding:
                                                '0.8rem 1rem',

                                            cursor:
                                                'pointer',

                                            borderBottom:
                                                i ===
                                                suggestions.length - 1
                                                    ? 'none'
                                                    : '1px solid var(--glass-border)',

                                            fontSize:
                                                '0.92rem',

                                            color:
                                                'var(--text-main)',

                                            transition:
                                                'all 0.2s ease'
                                        }}

                                        onMouseEnter={
                                            (e) => {

                                                e.currentTarget.style.background =
                                                    'linear-gradient(90deg, rgba(139,92,246,0.15), rgba(236,72,153,0.08))';

                                                e.currentTarget.style.transform =
                                                    'translateX(3px)';

                                            }
                                        }

                                        onMouseLeave={
                                            (e) => {

                                                e.currentTarget.style.background =
                                                    'transparent';

                                                e.currentTarget.style.transform =
                                                    'translateX(0)';

                                            }
                                        }
                                    >

                                        <span
                                            style={{
                                                width:
                                                    '32px',

                                                height:
                                                    '32px',

                                                minWidth:
                                                    '32px',

                                                borderRadius:
                                                    '10px',

                                                display:
                                                    'flex',

                                                alignItems:
                                                    'center',

                                                justifyContent:
                                                    'center',

                                                background:
                                                    'rgba(139,92,246,0.12)',

                                                color:
                                                    'var(--primary)'
                                            }}
                                        >

                                            <MapPin
                                                size={17}
                                            />

                                        </span>


                                        <span
                                            style={{
                                                flex:
                                                    1,

                                                overflow:
                                                    'hidden',

                                                textOverflow:
                                                    'ellipsis',

                                                whiteSpace:
                                                    'nowrap'
                                            }}
                                        >
                                            {
                                                s.display_name ||
                                                s.name
                                            }
                                        </span>

                                    </li>

                                ))}

                            </ul>

                        </div>

                    )}

                </div>

            </div>


            {/* ================================================= */}
            {/* RATE DIRECTION + CURRENT RATE */}
            {/* ================================================= */}

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    alignItems: 'center',
                    justifyContent:
                        'space-between',
                    marginBottom: '1.5rem'
                }}
            >

                {/* CURRENT RATE */}

                <div>

                    <div
                        style={{
                            color:
                                'var(--text-muted)',
                            fontSize:
                                '0.9rem',
                            marginBottom:
                                '0.25rem'
                        }}
                    >
                        Current Rate
                    </div>


                    <div
                        style={{
                            fontSize:
                                '1.5rem',
                            fontWeight:
                                '700',
                            color:
                                'var(--text-main)'
                        }}
                    >

                        {latestRate !== null
                            ? `1 ${fromCurrency} = ${formatRate(latestRate)} ${toCurrency}`
                            : 'Rate unavailable'
                        }

                    </div>

                </div>


                {/* TOGGLE */}

                <button
                    type="button"

                    onClick={
                        handleToggleRate
                    }

                    style={{
                        display: 'flex',
                        alignItems:
                            'center',
                        gap: '0.75rem',
                        padding:
                            '0.75rem 1.25rem',
                        borderRadius:
                            '2rem',
                        border:
                            '1px solid var(--glass-border)',
                        background:
                            'var(--bg-main)',
                        color:
                            'var(--text-main)',
                        cursor:
                            'pointer',
                        fontSize:
                            '0.95rem',
                        fontWeight:
                            '600',
                        transition:
                            'all 0.2s'
                    }}
                >

                    <span>
                        {fromCurrency}
                    </span>


                    <ArrowLeftRight
                        size={18}
                        color="var(--primary)"
                    />


                    <span>
                        {toCurrency}
                    </span>

                </button>

            </div>


            {/* ================================================= */}
            {/* CHART */}
            {/* ================================================= */}

            {loading ? (

                <div
                    style={{
                        textAlign:
                            'center',
                        padding:
                            '2rem',
                        color:
                            'var(--text-muted)'
                    }}
                >
                    Loading trends...
                </div>

            ) : chartData.length === 0 ? (

                <div
                    style={{
                        textAlign:
                            'center',
                        padding:
                            '2rem',
                        color:
                            'var(--text-muted)'
                    }}
                >
                    No exchange rate data available.
                </div>

            ) : (

                <div
                    style={{
                        height: '400px'
                    }}
                >

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >

                        <LineChart
                            data={chartData}

                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5
                            }}
                        >

                            <defs>

                                <linearGradient
                                    id="colorGradient"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="0%"
                                >

                                    <stop
                                        offset="0%"
                                        stopColor="#ec4899"
                                    />

                                    <stop
                                        offset="33%"
                                        stopColor="#8b5cf6"
                                    />

                                    <stop
                                        offset="66%"
                                        stopColor="#3b82f6"
                                    />

                                    <stop
                                        offset="100%"
                                        stopColor="#10b981"
                                    />

                                </linearGradient>

                            </defs>


                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.05)"
                                vertical={false}
                            />


                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                minTickGap={20}

                                tick={{
                                    fontSize: 12,
                                    fill: '#cbd5e1'
                                }}
                            />


                            <YAxis
                                domain={[
                                    'auto',
                                    'auto'
                                ]}

                                stroke="#94a3b8"

                                tick={{
                                    fontSize: 12,
                                    fill: '#cbd5e1'
                                }}

                                width={90}

                                tickFormatter={
                                    (val) =>
                                        formatRate(val)
                                }

                                padding={{
                                    top: 20,
                                    bottom: 20
                                }}

                                axisLine={false}

                                tickLine={false}
                            />


                            <Tooltip
                                contentStyle={{
                                    backgroundColor:
                                        'rgba(15, 23, 42, 0.9)',
                                    backdropFilter:
                                        'blur(8px)',
                                    border:
                                        '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius:
                                        '12px',
                                    color:
                                        'white',
                                    boxShadow:
                                        '0 8px 32px rgba(0,0,0,0.5)'
                                }}

                                formatter={
                                    (value) => [
                                        `${formatRate(value)} ${toCurrency}`,
                                        rateLabel
                                    ]
                                }

                                labelFormatter={
                                    (label) =>
                                        label
                                }

                                itemStyle={{
                                    color:
                                        '#ec4899',
                                    fontWeight:
                                        'bold'
                                }}

                                cursor={{
                                    stroke:
                                        'rgba(255,255,255,0.1)',
                                    strokeWidth:
                                        2
                                }}
                            />


                            <Line
                                type="monotone"

                                dataKey="displayRate"

                                stroke="url(#colorGradient)"

                                strokeWidth={4}

                                connectNulls={true}

                                dot={{
                                    fill:
                                        '#0f172a',
                                    r: 4,
                                    strokeWidth: 2,
                                    stroke:
                                        '#8b5cf6'
                                }}

                                activeDot={{
                                    r: 8,
                                    strokeWidth: 3,
                                    stroke: '#fff',
                                    fill:
                                        '#ec4899'
                                }}
                            />

                        </LineChart>

                    </ResponsiveContainer>

                </div>

            )}

        </div>

    );

};


export default Trends;