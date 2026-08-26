import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Wallet,
    Sparkles,
    MapPin,
    Calendar,
    Users,
    Compass
} from 'lucide-react';

import Dashboard from './Dashboard';
import API_BASE from '../api';


// =========================================================
// CURATED POPULAR DESTINATIONS
// =========================================================

const POPULAR_DESTINATIONS = [
    {
        name: 'Paris',
        display_name: 'Paris, France 🇫🇷'
    },
    {
        name: 'Tokyo',
        display_name: 'Tokyo, Japan 🇯🇵'
    },
    {
        name: 'Bali',
        display_name: 'Bali, Indonesia 🇮🇩'
    },
    {
        name: 'New York',
        display_name: 'New York, United States 🇺🇸'
    },
    {
        name: 'Rome',
        display_name: 'Rome, Italy 🇮🇹'
    },
    {
        name: 'London',
        display_name: 'London, United Kingdom 🇬🇧'
    },
    {
        name: 'Dubai',
        display_name: 'Dubai, United Arab Emirates 🇦🇪'
    },
    {
        name: 'Maldives',
        display_name: 'Maldives 🇲🇻'
    },
    {
        name: 'Goa',
        display_name: 'Goa, India 🇮🇳'
    },
    {
        name: 'Sydney',
        display_name: 'Sydney, Australia 🇦🇺'
    },
    {
        name: 'Singapore',
        display_name: 'Singapore 🇸🇬'
    },
    {
        name: 'Barcelona',
        display_name: 'Barcelona, Spain 🇪🇸'
    }
];


// =========================================================
// PLAN TRIP
// =========================================================

const PlanTrip = () => {

    // =====================================================
    // STATE
    // =====================================================

    const [result, setResult] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState(null);


    // =====================================================
    // LOCATION SEARCH STATE
    // =====================================================

    const [suggestions, setSuggestions] =
        useState(POPULAR_DESTINATIONS);

    const [showSuggestions, setShowSuggestions] =
        useState(false);

    const [searchLoading, setSearchLoading] =
        useState(false);

    const destinationRef =
        useRef(null);


    // =====================================================
    // FORM STATE
    // =====================================================

    const [formData, setFormData] = useState({
        destination: '',
        days: 3,
        budgetINR: 30000,
        budget: 'Medium',
        travelType: 'Couple'
    });


    // =====================================================
    // UPDATE FORM
    // =====================================================

    const updateForm = (
        field,
        value
    ) => {

        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

    };


    // =====================================================
    // DESTINATION CHANGE
    // =====================================================

    const handleDestinationChange =
        (e) => {

            const value =
                e.target.value;

            updateForm(
                'destination',
                value
            );

            setShowSuggestions(true);

        };


    // =====================================================
    // LOCATION SEARCH
    //
    // We keep the local popular destinations so the
    // dropdown appears immediately.
    //
    // The backend search is then used for actual locations.
    // =====================================================

    useEffect(() => {

        const query =
            formData.destination.trim();


        // -------------------------------------------------
        // Empty search
        // -------------------------------------------------

        if (!query) {

            setSuggestions(
                POPULAR_DESTINATIONS
            );

            setSearchLoading(false);

            return;

        }


        // -------------------------------------------------
        // Local matches
        // -------------------------------------------------

        const localMatches =
            POPULAR_DESTINATIONS.filter(
                place =>
                    place.display_name
                        .toLowerCase()
                        .includes(
                            query.toLowerCase()
                        ) ||

                    place.name
                        .toLowerCase()
                        .includes(
                            query.toLowerCase()
                        )
            );


        // Show local matches immediately

        setSuggestions(
            localMatches
        );


        // -------------------------------------------------
        // Don't call API for very short text
        // -------------------------------------------------

        if (query.length < 3) {

            setSearchLoading(false);

            return;

        }


        setSearchLoading(true);


        // -------------------------------------------------
        // Debounce API call
        // -------------------------------------------------

        const timer =
            setTimeout(
                async () => {

                    try {

                        console.log(
                            '[PlanTrip] Searching:',
                            query
                        );


                        const response =
                            await axios.get(
                                `${API_BASE}/search?q=${encodeURIComponent(query)}`,
                                {
                                    timeout: 15000
                                }
                            );


                        if (
                            Array.isArray(
                                response.data
                            )
                        ) {

                            const apiItems =
                                response.data.map(
                                    item => ({
                                        name:
                                            item.name ||
                                            (
                                                item.display_name
                                                    ? item.display_name
                                                        .split(',')[0]
                                                    : ''
                                            ),

                                        display_name:
                                            item.display_name ||
                                            item.name ||
                                            ''
                                    })
                                );


                            // ------------------------------------------------
                            // Merge API results + local results
                            // Remove duplicates
                            // ------------------------------------------------

                            const merged = [];

                            const seen =
                                new Set();


                            [
                                ...apiItems,
                                ...localMatches
                            ].forEach(
                                item => {

                                    const key =
                                        (
                                            item.display_name ||
                                            item.name ||
                                            ''
                                        )
                                            .toLowerCase()
                                            .trim();


                                    if (
                                        !key ||
                                        seen.has(key)
                                    ) {
                                        return;
                                    }


                                    seen.add(key);

                                    merged.push(item);

                                }
                            );


                            setSuggestions(
                                merged
                            );

                        }

                    } catch (err) {

                        console.error(
                            '[PlanTrip] Location search error:',
                            err
                        );


                        // ------------------------------------------------
                        // Important:
                        // If API fails / rate limits, local matches
                        // remain visible.
                        // ------------------------------------------------

                        setSuggestions(
                            localMatches
                        );

                    } finally {

                        setSearchLoading(
                            false
                        );

                    }

                },
                500
            );


        // Cleanup debounce

        return () =>
            clearTimeout(timer);

    }, [
        formData.destination
    ]);


    // =====================================================
    // SELECT LOCATION
    // =====================================================

    const handleSelectSuggestion =
        (place) => {

            if (!place) {
                return;
            }


            // Use full location name rather than only city.
            // This is important for Nainital, India etc.

            const placeName =
                place.display_name ||
                place.name ||
                '';


            if (!placeName) {
                return;
            }


            console.log(
                '[PlanTrip] Selected location:',
                placeName
            );


            updateForm(
                'destination',
                placeName
            );


            setShowSuggestions(
                false
            );

            setSuggestions([]);

        };


    // =====================================================
    // CLICK OUTSIDE DESTINATION
    // =====================================================

    useEffect(() => {

        const handleClickOutside =
            (event) => {

                if (
                    destinationRef.current &&
                    !destinationRef.current.contains(
                        event.target
                    )
                ) {

                    setShowSuggestions(
                        false
                    );

                }

            };


        document.addEventListener(
            'mousedown',
            handleClickOutside
        );


        return () => {

            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );

        };

    }, []);


    // =====================================================
    // GENERATE TRIP
    // =====================================================

    const handleCalculate =
        async () => {

            if (
                !formData.destination.trim()
            ) {

                setError(
                    'Please enter a destination to continue.'
                );

                return;

            }


            const numericBudget =
                Number(
                    formData.budgetINR || 30000
                );


            if (
                !numericBudget ||
                numericBudget <= 0
            ) {

                setError(
                    'Please enter a valid budget amount in INR.'
                );

                return;

            }


            setLoading(true);

            setError(null);

            setShowSuggestions(false);


            const payload = {

                destination:
                    formData.destination,

                days:
                    Number(formData.days),

                budgetINR:
                    numericBudget,

                budget:
                    formData.budget ||
                    'Medium',

                travelType:
                    formData.travelType

            };


            try {

                console.log(
                    '[PlanTrip] Sending payload:',
                    payload
                );


                const token =
                    sessionStorage.getItem(
                        'token'
                    );


                const response =
                    await axios.post(
                        `${API_BASE}/calculate`,
                        payload,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,

                                'Content-Type':
                                    'application/json'
                            },

                            timeout: 120000
                        }
                    );


                console.log(
                    '[PlanTrip] Backend response:',
                    response.data
                );


                if (
                    !response.data
                ) {

                    throw new Error(
                        'Backend returned an empty response'
                    );

                }


                if (
                    response.data.error
                ) {

                    throw new Error(
                        response.data.error
                    );

                }


                setResult(
                    response.data
                );


                // =================================================
                // STORE LATEST TRIP
                // =================================================

                const tripForStorage = {

                    id:
                        response.data.id ||
                        null,

                    destination_country:
                        response.data.country ||
                        response.data.destination,

                    destination:
                        response.data.destination,

                    days:
                        response.data.days,

                    budget_inr:
                        response.data.budgetINR,

                    currency_code:
                        response.data.currencyCode,

                    currency_symbol:
                        response.data.currencySymbol,

                    exchange_rate:
                        response.data.rate,

                    travel_type:
                        response.data.travelType,

                    breakdown:
                        response.data.breakdown,

                    itinerary:
                        response.data.itinerary,

                    landmarks:
                        response.data.landmarks

                };


                sessionStorage.setItem(
                    'voyage_latest_trip',
                    JSON.stringify(
                        tripForStorage
                    )
                );


                if (
                    response.data.id
                ) {

                    sessionStorage.setItem(
                        'active_trip_id',
                        response.data.id
                    );

                }

            } catch (err) {

                console.error(
                    '[PlanTrip] Calculation error:',
                    err
                );


                let message =
                    'Failed to generate itinerary.';


                if (err.response) {

                    if (
                        err.response.data?.error
                    ) {

                        message =
                            err.response.data.error;

                    } else if (
                        err.response.status === 500
                    ) {

                        message =
                            'The server encountered an error while generating your itinerary.';

                    } else if (
                        err.response.status === 400
                    ) {

                        message =
                            'Please check your destination, number of days and budget.';

                    }

                } else if (
                    err.code ===
                    'ECONNABORTED'
                ) {

                    message =
                        'The request took too long. Please try again.';

                } else if (
                    err.message
                ) {

                    message =
                        err.message;

                }


                setError(
                    message
                );

            } finally {

                setLoading(
                    false
                );

            }

        };


    // =====================================================
    // NEW TRIP
    // =====================================================

    const handleNewTrip =
        () => {

            setResult(null);

            setError(null);

            setFormData({
                destination: '',
                days: 3,
                budgetINR: 30000,
                budget: 'Medium',
                travelType: 'Couple'
            });

            setSuggestions(
                POPULAR_DESTINATIONS
            );

            setShowSuggestions(
                false
            );

        };


    // =====================================================
    // SELECTION CHIPS
    // =====================================================

    const renderOptions =
        (
            field,
            options
        ) => (

            <div
                style={{
                    display: 'flex',
                    gap: '0.8rem',
                    flexWrap: 'wrap',
                    marginTop: '1rem'
                }}
            >

                {options.map(
                    option => {

                        const isSelected =
                            formData[field] ===
                            option;


                        return (

                            <button
                                key={option}
                                type="button"

                                onClick={() =>
                                    updateForm(
                                        field,
                                        option
                                    )
                                }

                                style={{
                                    padding:
                                        '0.65rem 1.4rem',

                                    borderRadius:
                                        '2rem',

                                    border:
                                        isSelected
                                            ? '2px solid var(--primary)'
                                            : '1px solid var(--glass-border)',

                                    background:
                                        isSelected
                                            ? 'var(--btn-gradient)'
                                            : 'var(--bg-card)',

                                    color:
                                        isSelected
                                            ? '#ffffff'
                                            : 'var(--text-main)',

                                    fontWeight:
                                        isSelected
                                            ? '700'
                                            : '500',

                                    cursor:
                                        'pointer',

                                    transition:
                                        'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',

                                    fontSize:
                                        '0.95rem',

                                    boxShadow:
                                        isSelected
                                            ? '0 4px 15px var(--shadow-glow)'
                                            : 'none'
                                }}
                            >

                                {option}

                            </button>

                        );

                    }
                )}

            </div>

        );


    // =====================================================
    // UI
    // =====================================================

    return (

        <div
            className="fade-in"
        >

            {/* =================================================
                HEADER
               ================================================= */}

            <header
                style={{
                    textAlign:
                        'center',

                    marginBottom:
                        '3rem'
                }}
            >

                <h2
                    className="premium-gradient-text"

                    style={{
                        fontSize:
                            '2.75rem',

                        marginBottom:
                            '1rem',

                        fontWeight:
                            '800'
                    }}
                >
                    Generate New Itinerary
                </h2>


                <p
                    style={{
                        color:
                            'var(--text-muted)',

                        maxWidth:
                            '650px',

                        margin:
                            '0 auto',

                        lineHeight:
                            '1.6',

                        fontSize:
                            '1.1rem'
                    }}
                >
                    Answer a few quick questions to
                    generate a geographically organized,
                    AI-powered travel plan tailored just
                    for you.
                </p>

            </header>


            {/* =================================================
                MAIN
               ================================================= */}

            <main
                style={{
                    display:
                        'grid',

                    gap:
                        '2rem',

                    maxWidth:
                        '750px',

                    margin:
                        '0 auto',

                    width:
                        '100%'
                }}
            >

                {/* =================================================
                    FORM
                   ================================================= */}

                {(!result && !loading) && (

                    <div
                        style={{
                            display:
                                'flex',

                            flexDirection:
                                'column',

                            gap:
                                '1.5rem'
                        }}
                    >

                        {/* =================================================
                            QUESTION 1 — DESTINATION
                           ================================================= */}

                        <div
                            className="glass-card destination-card"
    style={{
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        position: 'relative',
        zIndex: 1000,
        overflow: 'visible'
    }}
                        >

                            <h3
                                style={{
                                    margin:
                                        0,

                                    fontSize:
                                        '1.25rem',

                                    color:
                                        'var(--text-main)',

                                    fontWeight:
                                        '700',

                                    display:
                                        'flex',

                                    alignItems:
                                        'center',

                                    gap:
                                        '0.5rem'
                                }}
                            >

                                <Compass
                                    size={22}
                                    color="var(--primary)"
                                />

                                1. Where do you want to go?

                            </h3>


                            {/* =================================================
                                DESTINATION INPUT + SIMPLE DROPDOWN
                               ================================================= */}

                            <div
                                ref={destinationRef}
                                 className="destination-search-wrapper"

                                style={{
                                    position:
                                        'relative',

                                    width:
                                        '100%',

                                    zIndex:
                                        100
                                }}
                            >

                                <input
                                    type="text"

                                    placeholder="Type or select a destination (e.g. Paris, Tokyo, Bali)"

                                    value={
                                        formData.destination
                                    }

                                    onChange={
                                        handleDestinationChange
                                    }

                                    onFocus={() => {

                                        setShowSuggestions(
                                            true
                                        );

                                    }}

                                    autoComplete="off"

                                    style={{
                                        width:
                                            '100%',

                                        boxSizing:
                                            'border-box',

                                        padding:
                                            '1rem 1.25rem',

                                        borderRadius:
                                            '0.75rem',

                                        border:
                                            '1.5px solid var(--glass-border)',

                                        background:
                                            'var(--bg-main)',

                                        color:
                                            'var(--text-main)',

                                        fontSize:
                                            '1.05rem',

                                        fontWeight:
                                            '600',

                                        outline:
                                            'none',

                                        boxShadow:
                                            'inset 0 2px 4px rgba(0,0,0,0.05)'
                                    }}
                                />


                                {/* =================================================
                                    SIMPLE EXCHANGE-RATE STYLE DROPDOWN
                                   ================================================= */}

                                {showSuggestions &&
                                    suggestions.length > 0 && (

                                    <ul
                                        style={{
                                            position:
                                                'absolute',

                                            top:
                                                '100%',

                                            left:
                                                0,

                                            right:
                                                0,

                                            background:
                                                'var(--bg-card)',

                                            border:
                                                '1px solid var(--glass-border)',

                                            borderRadius:
                                                '1rem',

                                            margin:
                                                '0.5rem 0 0',

                                            zIndex:
                                                9999,

                                            maxHeight:
                                                '250px',

                                            overflowY:
                                                'auto',

                                            listStyle:
                                                'none',

                                            padding:
                                                '0.5rem 0',

                                            boxShadow:
                                                '0 8px 32px rgba(0,0,0,0.2)'
                                        }}
                                    >

                                        {suggestions.map(
                                            (
                                                place,
                                                index
                                            ) => (

                                                <li
                                                    key={
                                                        `${place.display_name}-${index}`
                                                    }

                                                    onClick={() =>
                                                        handleSelectSuggestion(
                                                            place
                                                        )
                                                    }

                                                    style={{
                                                        padding:
                                                            '0.8rem 1.5rem',

                                                        cursor:
                                                            'pointer',

                                                        borderBottom:
                                                            index ===
                                                            suggestions.length - 1
                                                                ? 'none'
                                                                : '1px solid var(--glass-border)',

                                                        fontSize:
                                                            '0.95rem',

                                                        transition:
                                                            'background 0.2s',

                                                        color:
                                                            'var(--text-main)',

                                                        whiteSpace:
                                                            'nowrap',

                                                        overflow:
                                                            'hidden',

                                                        textOverflow:
                                                            'ellipsis'
                                                    }}

                                                    onMouseEnter={
                                                        (e) => {

                                                            e.currentTarget.style.background =
                                                                'var(--bg-main)';

                                                        }
                                                    }

                                                    onMouseLeave={
                                                        (e) => {

                                                            e.currentTarget.style.background =
                                                                'transparent';

                                                        }
                                                    }
                                                >

                                                    {place.display_name ||
                                                        place.name}

                                                </li>

                                            )
                                        )}

                                    </ul>

                                )}

                            </div>


                            {/* =================================================
                                SEARCH STATUS
                               ================================================= */}

                            {searchLoading &&
                                formData.destination.trim().length >= 3 && (

                                <div
                                    style={{
                                        fontSize:
                                            '0.8rem',

                                        color:
                                            'var(--text-muted)',

                                        marginTop:
                                            '-0.5rem'
                                    }}
                                >
                                    Searching locations...
                                </div>

                            )}

                        </div>


                        {/* =================================================
                            QUESTION 2 — DURATION
                           ================================================= */}

                        <div
                            className="glass-card"

                            style={{
                                padding:
                                    '2rem'
                            }}
                        >

                            <h3
                                style={{
                                    margin:
                                        '0 0 1rem 0',

                                    fontSize:
                                        '1.25rem',

                                    color:
                                        'var(--text-main)',

                                    fontWeight:
                                        '700',

                                    display:
                                        'flex',

                                    alignItems:
                                        'center',

                                    gap:
                                        '0.5rem'
                                }}
                            >

                                <Calendar
                                    size={22}
                                    color="var(--primary)"
                                />

                                2. How many days are you staying?

                            </h3>


                            <div
                                style={{
                                    display:
                                        'flex',

                                    alignItems:
                                        'center',

                                    gap:
                                        '1.25rem'
                                }}
                            >

                                <input
                                    type="range"

                                    min="1"

                                    max="30"

                                    value={
                                        formData.days
                                    }

                                    onChange={
                                        (e) =>
                                            updateForm(
                                                'days',
                                                parseInt(
                                                    e.target.value
                                                )
                                            )
                                    }

                                    style={{
                                        flexGrow:
                                            1,

                                        accentColor:
                                            'var(--primary)',

                                        height:
                                            '8px',

                                        cursor:
                                            'pointer'
                                    }}
                                />


                                <span
                                    style={{
                                        fontSize:
                                            '1.25rem',

                                        fontWeight:
                                            '800',

                                        color:
                                            'var(--primary)',

                                        minWidth:
                                            '5rem',

                                        textAlign:
                                            'center',

                                        background:
                                            'var(--bg-main)',

                                        padding:
                                            '0.5rem 1rem',

                                        borderRadius:
                                            '0.75rem',

                                        border:
                                            '1px solid var(--glass-border)'
                                    }}
                                >

                                    {formData.days}{' '}

                                    {
                                        formData.days === 1
                                            ? 'day'
                                            : 'days'
                                    }

                                </span>

                            </div>

                        </div>


                        {/* =================================================
                            QUESTION 3 — BUDGET
                           ================================================= */}

                        <div
                            className="glass-card"

                            style={{
                                padding:
                                    '2rem',

                                display:
                                    'flex',

                                flexDirection:
                                    'column',

                                gap:
                                    '1.25rem'
                            }}
                        >

                            <div>

                                <h3
                                    style={{
                                        margin:
                                            '0 0 0.5rem 0',

                                        fontSize:
                                            '1.25rem',

                                        color:
                                            'var(--text-main)',

                                        fontWeight:
                                            '700',

                                        display:
                                            'flex',

                                        alignItems:
                                            'center',

                                        gap:
                                            '0.5rem'
                                    }}
                                >

                                    <Wallet
                                        size={22}
                                        color="#10b981"
                                    />

                                    3. What is your total estimated budget? (INR ₹)

                                </h3>


                                <p
                                    style={{
                                        margin:
                                            0,

                                        color:
                                            'var(--text-muted)',

                                        fontSize:
                                            '0.9rem'
                                    }}
                                >
                                    Enter your budget in INR or pick a quick preset tier below
                                </p>

                            </div>


                            <div
                                style={{
                                    display:
                                        'flex',

                                    alignItems:
                                        'center',

                                    gap:
                                        '0.75rem'
                                }}
                            >

                                <span
                                    style={{
                                        fontSize:
                                            '1.3rem',

                                        fontWeight:
                                            '800',

                                        color:
                                            '#10b981',

                                        background:
                                            'rgba(16, 185, 129, 0.12)',

                                        padding:
                                            '0.75rem 1.25rem',

                                        borderRadius:
                                            '0.75rem',

                                        border:
                                            '1px solid rgba(16, 185, 129, 0.3)'
                                    }}
                                >
                                    ₹
                                </span>


                                <input
                                    type="number"

                                    step="1000"

                                    min="1000"

                                    placeholder="e.g. 30000"

                                    value={
                                        formData.budgetINR
                                    }

                                    onChange={
                                        (e) =>
                                            updateForm(
                                                'budgetINR',
                                                e.target.value
                                            )
                                    }

                                    style={{
                                        flexGrow:
                                            1,

                                        padding:
                                            '0.9rem 1.25rem',

                                        borderRadius:
                                            '0.75rem',

                                        border:
                                            '1px solid var(--glass-border)',

                                        background:
                                            'var(--bg-main)',

                                        color:
                                            'var(--text-main)',

                                        fontSize:
                                            '1.1rem',

                                        fontWeight:
                                            '700',

                                        outline:
                                            'none'
                                    }}
                                />

                            </div>


                            {/* =================================================
                                BUDGET PRESETS
                               ================================================= */}

                            <div
                                style={{
                                    display:
                                        'flex',

                                    gap:
                                        '0.8rem',

                                    flexWrap:
                                        'wrap'
                                }}
                            >

                                {[
                                    {
                                        label:
                                            'Budget (₹15,000)',
                                        val:
                                            15000,
                                        level:
                                            'Budget'
                                    },

                                    {
                                        label:
                                            'Standard (₹30,000)',
                                        val:
                                            30000,
                                        level:
                                            'Medium'
                                    },

                                    {
                                        label:
                                            'Premium (₹60,000)',
                                        val:
                                            60000,
                                        level:
                                            'High'
                                    },

                                    {
                                        label:
                                            'Luxury (₹150,000)',
                                        val:
                                            150000,
                                        level:
                                            'Luxury'
                                    }

                                ].map(
                                    preset => {

                                        const isSelected =
                                            Number(
                                                formData.budgetINR
                                            ) ===
                                            preset.val;


                                        return (

                                            <button
                                                key={
                                                    preset.level
                                                }

                                                type="button"

                                                onClick={() =>
                                                    setFormData(
                                                        prev => ({
                                                            ...prev,

                                                            budgetINR:
                                                                preset.val,

                                                            budget:
                                                                preset.level
                                                        })
                                                    )
                                                }

                                                style={{
                                                    padding:
                                                        '0.65rem 1.2rem',

                                                    borderRadius:
                                                        '2rem',

                                                    border:
                                                        isSelected
                                                            ? '2px solid #10b981'
                                                            : '1px solid var(--glass-border)',

                                                    background:
                                                        isSelected
                                                            ? 'rgba(16, 185, 129, 0.18)'
                                                            : 'var(--bg-card)',

                                                    color:
                                                        isSelected
                                                            ? '#10b981'
                                                            : 'var(--text-main)',

                                                    fontWeight:
                                                        '800',

                                                    cursor:
                                                        'pointer',

                                                    transition:
                                                        'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',

                                                    fontSize:
                                                        '0.9rem',

                                                    boxShadow:
                                                        isSelected
                                                            ? '0 4px 15px rgba(16, 185, 129, 0.2)'
                                                            : 'none'
                                                }}
                                            >

                                                {preset.label}

                                            </button>

                                        );

                                    }
                                )}

                            </div>

                        </div>


                        {/* =================================================
                            QUESTION 4 — TRAVEL TYPE
                           ================================================= */}

                        <div
                            className="glass-card"

                            style={{
                                padding:
                                    '2rem'
                            }}
                        >

                            <h3
                                style={{
                                    margin:
                                        '0 0 0.5rem 0',

                                    fontSize:
                                        '1.25rem',

                                    color:
                                        'var(--text-main)',

                                    fontWeight:
                                        '700',

                                    display:
                                        'flex',

                                    alignItems:
                                        'center',

                                    gap:
                                        '0.5rem'
                                }}
                            >

                                <Users
                                    size={22}
                                    color="var(--primary)"
                                />

                                4. Who is traveling?

                            </h3>


                            {renderOptions(
                                'travelType',
                                [
                                    'Solo',
                                    'Couple',
                                    'Family',
                                    'Friends'
                                ]
                            )}

                        </div>


                        {/* =================================================
                            ERROR
                           ================================================= */}

                        {error && (

                            <div
                                style={{
                                    padding:
                                        '1rem 1.5rem',

                                    background:
                                        'rgba(239, 68, 68, 0.15)',

                                    color:
                                        '#ef4444',

                                    border:
                                        '1px solid rgba(239, 68, 68, 0.3)',

                                    borderRadius:
                                        '0.85rem',

                                    fontWeight:
                                        '600',

                                    textAlign:
                                        'center'
                                }}
                            >

                                {error}

                            </div>

                        )}


                        {/* =================================================
                            SUBMIT
                           ================================================= */}

                        <button
                            onClick={
                                handleCalculate
                            }

                            className="glow-btn"

                            disabled={
                                loading
                            }

                            style={{
                                width:
                                    '100%',

                                padding:
                                    '1.1rem',

                                fontSize:
                                    '1.15rem',

                                borderRadius:
                                    '0.85rem',

                                marginTop:
                                    '0.5rem',

                                display:
                                    'flex',

                                alignItems:
                                    'center',

                                justifyContent:
                                    'center',

                                gap:
                                    '0.6rem'
                            }}
                        >

                            <Sparkles
                                size={20}
                                color="#ffffff"
                            />

                            Generate My Itinerary

                        </button>

                    </div>

                )}


                {/* =================================================
                    LOADING STATE
                   ================================================= */}

                {loading && (

                    <div
                        className="glass-card fade-in"

                        style={{
                            textAlign:
                                'center',

                            padding:
                                '3rem 1.5rem'
                        }}
                    >

                        <div
                            className="spinner"

                            style={{
                                margin:
                                    '0 auto 1.5rem auto'
                            }}
                        />

                        <div
                            style={{
                                fontSize:
                                    '1.3rem',

                                color:
                                    'var(--text-main)',

                                fontWeight:
                                    '700',

                                marginBottom:
                                    '0.5rem'
                            }}
                        >
                            Designing your perfect trip...
                        </div>


                        <div
                            style={{
                                fontSize:
                                    '0.95rem',

                                color:
                                    'var(--text-muted)'
                            }}
                        >

                            Analyzing{' '}

                            {formData.destination}

                            {' '}for a{' '}

                            {formData.days}

                            -day trip with ₹

                            {Number(
                                formData.budgetINR
                            ).toLocaleString()}

                            {' '}budget.

                        </div>

                    </div>

                )}


                {/* =================================================
                    RESULT STATE
                   ================================================= */}

                {result && (

                    <div>

                        <div
                            style={{
                                marginBottom:
                                    '1.5rem',

                                display:
                                    'flex',

                                justifyContent:
                                    'space-between',

                                alignItems:
                                    'center'
                            }}
                        >

                            <button
                                onClick={
                                    handleNewTrip
                                }

                                style={{
                                    padding:
                                        '0.75rem 1.5rem',

                                    borderRadius:
                                        '2rem',

                                    border:
                                        '1px solid var(--glass-border)',

                                    background:
                                        'var(--bg-main)',

                                    color:
                                        'var(--text-main)',

                                    fontWeight:
                                        '600',

                                    cursor:
                                        'pointer'
                                }}
                            >

                                ← Plan Another Trip

                            </button>

                        </div>


                        <Dashboard
                            data={
                                result
                            }
                        />

                    </div>

                )}

            </main>

        </div>

    );

};


export default PlanTrip;