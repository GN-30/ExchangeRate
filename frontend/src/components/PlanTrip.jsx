
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Wallet,
    Sparkles,
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
// ANIMATED TRAIN
// =========================================================

const AnimatedTrain = () => {
    return (
        <svg
            className="itinerary-train-border"
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <defs>
                <filter
                    id="trainGlow"
                    x="-100%"
                    y="-100%"
                    width="300%"
                    height="300%"
                >
                    <feGaussianBlur
                        stdDeviation="1.8"
                        result="blur"
                    />

                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Railway */}
            <path
                d="
                    M 150 28
                    H 850
                    A 122 122 0 0 1 972 150
                    V 450
                    A 122 122 0 0 1 850 572
                    H 150
                    A 122 122 0 0 1 28 450
                    V 150
                    A 122 122 0 0 1 150 28
                "
                fill="none"
                stroke="var(--train-rail-dark)"
                strokeWidth="5"
            />

            <path
                d="
                    M 150 35
                    H 850
                    A 115 115 0 0 1 965 150
                    V 450
                    A 115 115 0 0 1 850 565
                    H 150
                    A 115 115 0 0 1 35 450
                    V 150
                    A 115 115 0 0 1 150 35
                "
                fill="none"
                stroke="var(--train-rail-light)"
                strokeWidth="3"
            />

            <path
                d="
                    M 150 28
                    H 850
                    A 122 122 0 0 1 972 150
                    V 450
                    A 122 122 0 0 1 850 572
                    H 150
                    A 122 122 0 0 1 28 450
                    V 150
                    A 122 122 0 0 1 150 28
                "
                fill="none"
                stroke="var(--train-track-highlight)"
                strokeWidth="2"
                strokeDasharray="5 9"
                opacity="0.8"
            />

            {/* Railway sleepers */}
            <g className="railway-sleepers">
                {Array.from({ length: 29 }).map((_, index) => (
                    <line
                        key={`top-${index}`}
                        x1={75 + index * 30}
                        y1="14"
                        x2={75 + index * 30}
                        y2="42"
                        stroke="var(--train-sleeper)"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                ))}

                {Array.from({ length: 29 }).map((_, index) => (
                    <line
                        key={`bottom-${index}`}
                        x1={75 + index * 30}
                        y1="558"
                        x2={75 + index * 30}
                        y2="586"
                        stroke="var(--train-sleeper)"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                ))}

                {Array.from({ length: 17 }).map((_, index) => (
                    <line
                        key={`left-${index}`}
                        x1="14"
                        y1={75 + index * 28}
                        x2="42"
                        y2={75 + index * 28}
                        stroke="var(--train-sleeper)"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                ))}

                {Array.from({ length: 17 }).map((_, index) => (
                    <line
                        key={`right-${index}`}
                        x1="958"
                        y1={75 + index * 28}
                        x2="986"
                        y2={75 + index * 28}
                        stroke="var(--train-sleeper)"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                ))}
            </g>

            {/* Train path */}
            <path
                id="trainPath"
                d="
                    M 150 28
                    H 850
                    A 122 122 0 0 1 972 150
                    V 450
                    A 122 122 0 0 1 850 572
                    H 150
                    A 122 122 0 0 1 28 450
                    V 150
                    A 122 122 0 0 1 150 28
                "
                fill="none"
                stroke="transparent"
            />

            {/* Train */}
            <g filter="url(#trainGlow)">
                <g className="border-train">

                    {/* Smoke */}
                    <g className="train-smoke">
                        <circle
                            cx="-18"
                            cy="-49"
                            r="7"
                            fill="var(--train-smoke)"
                            opacity="0.85"
                        />

                        <circle
                            cx="-10"
                            cy="-61"
                            r="6"
                            fill="var(--train-smoke)"
                            opacity="0.68"
                        />

                        <circle
                            cx="1"
                            cy="-72"
                            r="5"
                            fill="var(--train-smoke)"
                            opacity="0.52"
                        />

                        <circle
                            cx="8"
                            cy="-81"
                            r="3.5"
                            fill="var(--train-smoke)"
                            opacity="0.35"
                        />
                    </g>

                    {/* Engine body */}
                    <rect
                        x="-40"
                        y="-12"
                        width="72"
                        height="29"
                        rx="7"
                        fill="var(--train-engine)"
                    />

                    {/* Cabin */}
                    <rect
                        x="-27"
                        y="-40"
                        width="32"
                        height="30"
                        rx="5"
                        fill="var(--train-engine-cabin)"
                    />

                    {/* Window */}
                    <rect
                        x="-20"
                        y="-34"
                        width="18"
                        height="13"
                        rx="2.5"
                        fill="var(--train-window)"
                    />

                    {/* Chimney */}
                    <rect
                        x="-14"
                        y="-59"
                        width="10"
                        height="20"
                        rx="3"
                        fill="var(--train-chimney)"
                    />

                    <rect
                        x="-18"
                        y="-63"
                        width="18"
                        height="5"
                        rx="2"
                        fill="var(--train-chimney)"
                    />

                    {/* Front */}
                    <rect
                        x="30"
                        y="-7"
                        width="9"
                        height="20"
                        rx="3"
                        fill="var(--train-engine-front)"
                    />

                    <circle
                        cx="42"
                        cy="0"
                        r="5"
                        fill="var(--train-headlight)"
                    />

                    <rect
                        x="37"
                        y="9"
                        width="8"
                        height="5"
                        rx="2"
                        fill="var(--train-front-bar)"
                    />

                    {/* Wheels */}
                    <circle
                        cx="-24"
                        cy="19"
                        r="9"
                        fill="var(--train-wheel)"
                    />

                    <circle
                        cx="7"
                        cy="19"
                        r="9"
                        fill="var(--train-wheel)"
                    />

                    <circle
                        cx="-24"
                        cy="19"
                        r="3.5"
                        fill="var(--train-wheel-center)"
                    />

                    <circle
                        cx="7"
                        cy="19"
                        r="3.5"
                        fill="var(--train-wheel-center)"
                    />

                    {/* Coupler */}
                    <rect
                        x="40"
                        y="-2"
                        width="9"
                        height="5"
                        rx="2"
                        fill="var(--train-coupler)"
                    />

                    {/* Train animation */}
                    <animateMotion
                        dur="11s"
                        repeatCount="indefinite"
                        rotate="auto"
                        calcMode="linear"
                    >
                        <mpath href="#trainPath" />
                    </animateMotion>
                </g>
            </g>
        </svg>
    );
};


// =========================================================
// PLAN TRIP
// =========================================================

const PlanTrip = () => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // =====================================================
    // LOCATION SEARCH STATE
    // =====================================================

    const [suggestions, setSuggestions] = useState(
        POPULAR_DESTINATIONS
    );

    const [showSuggestions, setShowSuggestions] =
        useState(false);

    const [searchLoading, setSearchLoading] =
        useState(false);

    const destinationRef = useRef(null);

    // =====================================================
    // FORM STATE
    // =====================================================

    const [formData, setFormData] = useState({
        destination: '',
        startDate: '',
        endDate: '',
        days: 0,
        budgetINR: 30000,
        budget: 'Medium',
        travelType: 'Couple'
    });

    // =====================================================
    // UPDATE FORM
    // =====================================================

    const updateForm = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // =====================================================
    // CALCULATE DAYS FROM DATES
    // =====================================================

    const calculateDaysFromDates = (
        startDate,
        endDate
    ) => {
        if (!startDate || !endDate) {
            return 0;
        }

        const start = new Date(
            `${startDate}T00:00:00`
        );

        const end = new Date(
            `${endDate}T00:00:00`
        );

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return 0;
        }

        if (end < start) {
            return 0;
        }

        const difference =
            end.getTime() - start.getTime();

        return (
            Math.floor(
                difference /
                    (1000 * 60 * 60 * 24)
            ) + 1
        );
    };

    // =====================================================
    // DATE CHANGE
    // =====================================================

    const handleDateChange = (field, value) => {
        setFormData(prev => {
            const updated = {
                ...prev,
                [field]: value
            };

            return {
                ...updated,
                days: calculateDaysFromDates(
                    updated.startDate,
                    updated.endDate
                )
            };
        });

        setError(null);
    };

    // =====================================================
    // DATE VALIDATION
    // =====================================================

    const validateDates = () => {
        if (!formData.startDate) {
            return 'Please select your start date.';
        }

        if (!formData.endDate) {
            return 'Please select your end date.';
        }

        const start = new Date(
            `${formData.startDate}T00:00:00`
        );

        const end = new Date(
            `${formData.endDate}T00:00:00`
        );

        if (end < start) {
            return 'End date must be after or equal to the start date.';
        }

        const days = calculateDaysFromDates(
            formData.startDate,
            formData.endDate
        );

        if (days <= 0) {
            return 'Please select valid travel dates.';
        }

        if (days > 30) {
            return 'Trip duration cannot exceed 30 days.';
        }

        return null;
    };

    // =====================================================
    // DESTINATION CHANGE
    // =====================================================

    const handleDestinationChange = e => {
        const value = e.target.value;

        updateForm(
            'destination',
            value
        );

        setShowSuggestions(true);
    };

    // =====================================================
    // LOCATION SEARCH
    // =====================================================

    useEffect(() => {
        const query =
            formData.destination.trim();

        if (!query) {
            setSuggestions(
                POPULAR_DESTINATIONS
            );

            setSearchLoading(false);

            return;
        }

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

        setSuggestions(localMatches);

        if (query.length < 3) {
            setSearchLoading(false);
            return;
        }

        setSearchLoading(true);

        const timer = setTimeout(
            async () => {
                try {
                    console.log(
                        '[PlanTrip] Searching:',
                        query
                    );

                    const response =
                        await axios.get(
                            `${API_BASE}/search?q=${encodeURIComponent(
                                query
                            )}`,
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
                            response.data
                                .map(item => {
                                    const placeName =
                                        String(
                                            item.name ||
                                                (
                                                    item.display_name
                                                        ? item.display_name.split(
                                                              ','
                                                          )[0]
                                                        : ''
                                                ) ||
                                                ''
                                        ).trim();

                                    return {
                                        name: placeName,
                                        display_name:
                                            item.display_name ||
                                            placeName
                                    };
                                })
                                .filter(
                                    item =>
                                        item.name
                                );

                        const merged = [];
                        const seen = new Set();

                        [
                            ...apiItems,
                            ...localMatches
                        ].forEach(item => {
                            const key =
                                (
                                    item.name ||
                                    item.display_name ||
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
                        });

                        setSuggestions(
                            merged
                        );
                    }
                } catch (err) {
                    console.error(
                        '[PlanTrip] Location search error:',
                        err
                    );

                    setSuggestions(
                        localMatches
                    );
                } finally {
                    setSearchLoading(false);
                }
            },
            500
        );

        return () => clearTimeout(timer);
    }, [formData.destination]);

    // =====================================================
    // SELECT LOCATION
    // =====================================================

    const handleSelectSuggestion = place => {
        if (!place) {
            return;
        }

        const placeName = String(
            place.name || ''
        ).trim();

        if (!placeName) {
            return;
        }

        console.log(
            '[PlanTrip] Selected PLACE:',
            placeName
        );

        console.log(
            '[PlanTrip] Full location:',
            place.display_name
        );

        updateForm(
            'destination',
            placeName
        );

        setShowSuggestions(false);
        setSuggestions([]);
    };

    // =====================================================
    // CLICK OUTSIDE
    // =====================================================

    useEffect(() => {
        const handleClickOutside = event => {
            if (
                destinationRef.current &&
                !destinationRef.current.contains(
                    event.target
                )
            ) {
                setShowSuggestions(false);
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

    const handleCalculate = async () => {
        if (
            !formData.destination.trim()
        ) {
            setError(
                'Please enter a destination to continue.'
            );

            return;
        }

        const dateError =
            validateDates();

        if (dateError) {
            setError(dateError);
            return;
        }

        const numericBudget =
            Number(
                formData.budgetINR ||
                    30000
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

        const destinationToSend =
            String(
                formData.destination
            ).trim();

        const payload = {
            destination:
                destinationToSend,

            startDate:
                formData.startDate,

            endDate:
                formData.endDate,

            days:
                Number(
                    formData.days
                ),

            budgetINR:
                numericBudget,

            budget:
                formData.budget ||
                'Medium',

            travelType:
                formData.travelType
        };

        console.log(
            '[PlanTrip] EXACT DESTINATION BEING SENT:',
            destinationToSend
        );

        console.log(
            '[PlanTrip] START DATE:',
            formData.startDate
        );

        console.log(
            '[PlanTrip] END DATE:',
            formData.endDate
        );

        console.log(
            '[PlanTrip] CALCULATED DAYS:',
            formData.days
        );

        console.log(
            '[PlanTrip] Sending payload:',
            payload
        );

        try {
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

            if (!response.data) {
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

            const actualDestination =
                String(
                    response.data.destination ||
                        destinationToSend
                ).trim();

            const tripForStorage = {
                id:
                    response.data.id ||
                    null,

                destination_country:
                    actualDestination,

                destination:
                    actualDestination,

                country:
                    response.data.country ||
                    '',

                start_date:
                    response.data.startDate ||
                    formData.startDate,

                end_date:
                    response.data.endDate ||
                    formData.endDate,

                days:
                    response.data.days ||
                    formData.days,

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

            console.log(
                '[PlanTrip] Trip stored for profile:',
                tripForStorage
            );

            window.dispatchEvent(
                new CustomEvent(
                    'voyage-trip-created',
                    {
                        detail:
                            tripForStorage
                    }
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
                        'Please check your destination, travel dates and budget.';
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

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // NEW TRIP
    // =====================================================

    const handleNewTrip = () => {
        setResult(null);
        setError(null);

        setFormData({
            destination: '',
            startDate: '',
            endDate: '',
            days: 0,
            budgetINR: 30000,
            budget: 'Medium',
            travelType: 'Couple'
        });

        setSuggestions(
            POPULAR_DESTINATIONS
        );

        setShowSuggestions(false);
    };

    // =====================================================
    // SELECTION CHIPS
    // =====================================================

    const renderOptions = (
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
            {options.map(option => {
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
            })}
        </div>
    );

    // =====================================================
    // TODAY
    // =====================================================

    const today =
        new Date()
            .toISOString()
            .split('T')[0];

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="fade-in">

            {!loading && (
                <header
                    style={{
                        textAlign: 'center',
                        marginBottom: '3rem'
                    }}
                >
                    <h2
                        className="premium-gradient-text"
                        style={{
                            fontSize: '2.75rem',
                            marginBottom: '1rem',
                            fontWeight: '800'
                        }}
                    >
                        Generate New Itinerary
                    </h2>

                    <p
                        style={{
                            color:
                                'var(--text-muted)',
                            maxWidth: '650px',
                            margin: '0 auto',
                            lineHeight: '1.6',
                            fontSize: '1.1rem'
                        }}
                    >
                        Answer a few quick questions to
                        generate a geographically organized,
                        AI-powered travel plan tailored just
                        for you.
                    </p>
                </header>
            )}

            <main
                style={{
                    display: 'grid',
                    gap: '2rem',
                    maxWidth: '750px',
                    margin: '0 auto',
                    width: '100%',
                    minHeight: loading
                        ? 'calc(100vh - 130px)'
                        : 'auto',
                    alignContent: loading
                        ? 'center'
                        : 'normal'
                }}
            >

                {/* =================================================
                    FORM
                   ================================================= */}

                {!result && !loading && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem'
                        }}
                    >

                        {/* =================================================
                            DESTINATION
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
                                    margin: 0,
                                    fontSize: '1.25rem',
                                    color:
                                        'var(--text-main)',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Compass
                                    size={22}
                                    color="var(--primary)"
                                />

                                1. Where do you want to go?
                            </h3>

                            <div
                                ref={destinationRef}
                                className="destination-search-wrapper"
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    zIndex: 100
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
                                    onFocus={() =>
                                        setShowSuggestions(
                                            true
                                        )
                                    }
                                    autoComplete="off"
                                    style={{
                                        width: '100%',
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
                                        outline: 'none',
                                        boxShadow:
                                            'inset 0 2px 4px rgba(0,0,0,0.05)'
                                    }}
                                />

                                {showSuggestions &&
                                    suggestions.length >
                                        0 && (
                                        <ul
                                            style={{
                                                position:
                                                    'absolute',
                                                top:
                                                    '100%',
                                                left: 0,
                                                right: 0,
                                                background:
                                                    'var(--bg-card)',
                                                border:
                                                    '1px solid var(--glass-border)',
                                                borderRadius:
                                                    '1rem',
                                                margin:
                                                    '0.5rem 0 0',
                                                zIndex: 9999,
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
                                                        key={`${place.display_name}-${index}`}
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
                                                                suggestions.length -
                                                                    1
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
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.background =
                                                                'var(--bg-main)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.background =
                                                                'transparent';
                                                        }}
                                                    >
                                                        {place.display_name ||
                                                            place.name}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    )}
                            </div>

                            {searchLoading &&
                                formData.destination.trim()
                                    .length >= 3 && (
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
                            DATES
                           ================================================= */}

                        <div
                            className="glass-card"
                            style={{
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.25rem'
                            }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: '1.25rem',
                                    color:
                                        'var(--text-main)',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Calendar
                                    size={22}
                                    color="var(--primary)"
                                />

                                2. When are you travelling?
                            </h3>

                            <p
                                style={{
                                    margin: 0,
                                    color:
                                        'var(--text-muted)',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5'
                                }}
                            >
                                Select your start and end
                                dates. Trip duration will be
                                calculated automatically.
                            </p>

                            <div
                                className="date-grid"
                            >

                                {/* Start Date */}
                                <div
                                    className="date-selection-card"
                                >
                                    <label
                                        htmlFor="startDate"
                                        className="date-card-label"
                                    >
                                        <Calendar
                                            size={18}
                                            color="var(--primary)"
                                        />

                                        Start Date
                                    </label>

                                    <input
                                        id="startDate"
                                        type="date"
                                        value={
                                            formData.startDate
                                        }
                                        min={today}
                                        max={
                                            formData.endDate ||
                                            undefined
                                        }
                                        onChange={e =>
                                            handleDateChange(
                                                'startDate',
                                                e.target.value
                                            )
                                        }
                                        className="date-input"
                                    />
                                </div>

                                {/* End Date */}
                                <div
                                    className="date-selection-card"
                                >
                                    <label
                                        htmlFor="endDate"
                                        className="date-card-label"
                                    >
                                        <Calendar
                                            size={18}
                                            color="var(--primary)"
                                        />

                                        End Date
                                    </label>

                                    <input
                                        id="endDate"
                                        type="date"
                                        value={
                                            formData.endDate
                                        }
                                        min={
                                            formData.startDate ||
                                            today
                                        }
                                        onChange={e =>
                                            handleDateChange(
                                                'endDate',
                                                e.target.value
                                            )
                                        }
                                        className="date-input"
                                    />
                                </div>

                            </div>

                            {/* Automatic Duration */}
                            {formData.days > 0 && (
                                <div
                                    className="trip-duration-card"
                                >
                                    <Sparkles
                                        size={19}
                                        color="var(--primary)"
                                    />

                                    <span
                                        className="duration-label"
                                    >
                                        Trip Duration:
                                    </span>

                                    <strong
                                        className="duration-value"
                                    >
                                        {formData.days}{' '}
                                        {formData.days === 1
                                            ? 'Day'
                                            : 'Days'}
                                    </strong>
                                </div>
                            )}
                        </div>

                        {/* =================================================
                            BUDGET
                           ================================================= */}

                        <div
                            className="glass-card"
                            style={{
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.25rem'
                            }}
                        >
                            <div>
                                <h3
                                    style={{
                                        margin:
                                            '0 0 0.5rem 0',
                                        fontSize: '1.25rem',
                                        color:
                                            'var(--text-main)',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Wallet
                                        size={22}
                                        color="#10b981"
                                    />

                                    3. What is your total
                                    estimated budget? (INR ₹)
                                </h3>

                                <p
                                    style={{
                                        margin: 0,
                                        color:
                                            'var(--text-muted)',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Enter your budget in INR
                                    or pick a quick preset
                                    tier below.
                                </p>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '1.3rem',
                                        fontWeight: '800',
                                        color: '#10b981',
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
                                    onChange={e =>
                                        updateForm(
                                            'budgetINR',
                                            e.target.value
                                        )
                                    }
                                    style={{
                                        flexGrow: 1,
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
                                        fontSize: '1.1rem',
                                        fontWeight: '700',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    gap: '0.8rem',
                                    flexWrap: 'wrap'
                                }}
                            >
                                {[
                                    {
                                        label:
                                            'Budget (₹15,000)',
                                        val: 15000,
                                        level:
                                            'Budget'
                                    },
                                    {
                                        label:
                                            'Standard (₹30,000)',
                                        val: 30000,
                                        level:
                                            'Medium'
                                    },
                                    {
                                        label:
                                            'Premium (₹60,000)',
                                        val: 60000,
                                        level:
                                            'High'
                                    },
                                    {
                                        label:
                                            'Luxury (₹150,000)',
                                        val: 150000,
                                        level:
                                            'Luxury'
                                    }
                                ].map(preset => {
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
                                            {
                                                preset.label
                                            }
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* =================================================
                            TRAVEL TYPE
                           ================================================= */}

                        <div
                            className="glass-card"
                            style={{
                                padding: '2rem'
                            }}
                        >
                            <h3
                                style={{
                                    margin:
                                        '0 0 0.5rem 0',
                                    fontSize: '1.25rem',
                                    color:
                                        'var(--text-main)',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
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
                                    color: '#ef4444',
                                    border:
                                        '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius:
                                        '0.85rem',
                                    fontWeight: '600',
                                    textAlign: 'center'
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
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '1.1rem',
                                fontSize: '1.15rem',
                                borderRadius:
                                    '0.85rem',
                                marginTop: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent:
                                    'center',
                                gap: '0.6rem'
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
                    LOADING
                   ================================================= */}

                {loading && (
                    <div
                        className="itinerary-loading-card fade-in"
                    >
                        <AnimatedTrain />

                        <div
                            className="loading-card-content"
                        >
                            <div
                                className="loading-icon-wrapper"
                            >
                                <span
                                    className="loading-suitcase"
                                >
                                    🧳
                                </span>
                            </div>

                            <h2
                                className="loading-title"
                            >
                                <span>
                                    Designing
                                </span>{' '}
                                your perfect trip...
                            </h2>

                            <p
                                className="loading-description"
                            >
                                Our AI travel planner is
                                crafting the best itinerary
                                just for you.
                                <br />
                                Please wait a moment.
                            </p>

                            <div
                                className="loading-steps"
                            >
                                <div
                                    className="loading-step"
                                >
                                    <div
                                        className="loading-step-icon"
                                    >
                                        🔎
                                    </div>

                                    <span>
                                        Finding best places
                                    </span>
                                </div>

                                <div
                                    className="loading-dots"
                                >
                                    •••••
                                </div>

                                <div
                                    className="loading-step"
                                >
                                    <div
                                        className="loading-step-icon"
                                    >
                                        📍
                                    </div>

                                    <span>
                                        Planning route
                                    </span>
                                </div>

                                <div
                                    className="loading-dots"
                                >
                                    •••••
                                </div>

                                <div
                                    className="loading-step"
                                >
                                    <div
                                        className="loading-step-icon"
                                    >
                                        🛏️
                                    </div>

                                    <span>
                                        Adding stays
                                    </span>
                                </div>

                                <div
                                    className="loading-dots"
                                >
                                    •••••
                                </div>

                                <div
                                    className="loading-step"
                                >
                                    <div
                                        className="loading-step-icon"
                                    >
                                        💳
                                    </div>

                                    <span>
                                        Estimating budget
                                    </span>
                                </div>
                            </div>

                            <div
                                className="loading-destination"
                            >
                                <Sparkles size={18} />

                                <span>
                                    Creating your{' '}
                                    <strong>
                                        {formData.days || 0}-day
                                    </strong>{' '}
                                    journey through{' '}
                                    <strong>
                                        {
                                            formData.destination
                                        }
                                    </strong>
                                </span>
                            </div>

                            <div
                                className="loading-tip"
                            >
                                <Sparkles size={18} />

                                <span>
                                    <strong>
                                        Great trips are worth
                                        the wait!
                                    </strong>{' '}
                                    Thanks for your patience.
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* =================================================
                    RESULT
                   ================================================= */}

                {result && (
                    <div>
                        <div
                            style={{
                                marginBottom:
                                    '1.5rem',
                                display: 'flex',
                                justifyContent:
                                    'space-between',
                                alignItems: 'center'
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
                            data={result}
                        />
                    </div>
                )}
            </main>

            {/* =================================================
                STYLES
               ================================================= */}

            <style>
                {`
                    .date-grid {
                        display: grid;
                        grid-template-columns:
                            repeat(
                                auto-fit,
                                minmax(220px, 1fr)
                            );
                        gap: 1rem;
                    }

                    .date-selection-card {
                        padding: 1.25rem;
                        border-radius: 1rem;
                        border:
                            1px solid
                            var(--glass-border);
                        background:
                            var(--bg-main);
                        transition:
                            all 0.3s
                            cubic-bezier(
                                0.4,
                                0,
                                0.2,
                                1
                            );
                    }

                    .date-selection-card:hover {
                        transform:
                            translateY(-3px);
                        border-color:
                            var(--primary);
                        box-shadow:
                            0 8px 25px
                            var(--shadow-glow);
                    }

                    .date-selection-card:focus-within {
                        transform:
                            translateY(-3px);
                        border-color:
                            var(--primary);
                        box-shadow:
                            0 8px 25px
                            var(--shadow-glow);
                    }

                    .date-card-label {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        margin-bottom: 0.75rem;
                        color:
                            var(--text-main);
                        font-weight: 700;
                        font-size: 0.95rem;
                    }

                    .date-input {
                        width: 100%;
                        box-sizing: border-box;
                        padding:
                            0.85rem 1rem;
                        border-radius:
                            0.75rem;
                        border:
                            1px solid
                            var(--glass-border);
                        background:
                            var(--bg-card);
                        color:
                            var(--text-main);
                        font-size: 1rem;
                        font-weight: 600;
                        outline: none;
                        cursor: pointer;
                        transition:
                            all 0.25s ease;
                    }

                    .date-input:hover {
                        border-color:
                            var(--primary);
                    }

                    .date-input:focus {
                        border-color:
                            var(--primary);
                        box-shadow:
                            0 0 0 3px
                            var(--shadow-glow);
                    }

                    .trip-duration-card {
                        position: relative;
                        overflow: hidden;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.65rem;
                        padding:
                            0.9rem 1.25rem;
                        border-radius: 1rem;
                        background:
                            linear-gradient(
                                135deg,
                                rgba(
                                    99,
                                    102,
                                    241,
                                    0.10
                                ),
                                rgba(
                                    139,
                                    92,
                                    246,
                                    0.10
                                )
                            );
                        border:
                            1px solid
                            rgba(
                                99,
                                102,
                                241,
                                0.20
                            );
                        animation:
                            durationAppear
                            0.4s ease;
                    }

                    .trip-duration-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background:
                            linear-gradient(
                                90deg,
                                transparent,
                                rgba(
                                    255,
                                    255,
                                    255,
                                    0.18
                                ),
                                transparent
                            );
                        animation:
                            durationShimmer
                            3s infinite;
                    }

                    .duration-label {
                        color:
                            var(--text-muted);
                        font-size: 0.95rem;
                    }

                    .duration-value {
                        color:
                            var(--primary);
                        font-size: 1.1rem;
                    }

                    @keyframes durationAppear {
                        from {
                            opacity: 0;
                            transform:
                                translateY(8px)
                                scale(0.98);
                        }

                        to {
                            opacity: 1;
                            transform:
                                translateY(0)
                                scale(1);
                        }
                    }

                    @keyframes durationShimmer {
                        0% {
                            left: -100%;
                        }

                        50% {
                            left: 100%;
                        }

                        100% {
                            left: 100%;
                        }
                    }

                    .itinerary-loading-card {
                        --train-engine: #e63946;
                        --train-engine-cabin: #b91c1c;
                        --train-engine-front: #991b1b;
                        --train-front-bar: #7f1d1d;
                        --train-chimney: #334155;
                        --train-window: #dff6ff;
                        --train-headlight: #fff4a3;
                        --train-wheel: #263238;
                        --train-wheel-center: #f8fafc;
                        --train-coupler: #475569;
                        --train-smoke: #d9dee5;

                        --train-rail-dark:
                            rgba(
                                124,
                                83,
                                52,
                                0.72
                            );

                        --train-rail-light:
                            rgba(
                                218,
                                126,
                                44,
                                0.92
                            );

                        --train-sleeper:
                            rgba(
                                217,
                                132,
                                52,
                                0.72
                            );

                        --train-track-highlight:
                            rgba(
                                255,
                                183,
                                77,
                                0.9
                            );

                        position: relative;
                        width: 100%;
                        height:
                            min(
                                500px,
                                calc(
                                    100vh - 150px
                                )
                            );
                        min-height: 460px;
                        max-height: 500px;
                        box-sizing: border-box;
                        padding:
                            4.8rem 2.2rem 2rem;
                        overflow: hidden;
                        border-radius: 1.5rem;
                        border:
                            1px solid
                            rgba(
                                239,
                                68,
                                68,
                                0.22
                            );
                        background:
                            radial-gradient(
                                circle at 50% 0%,
                                rgba(
                                    239,
                                    68,
                                    68,
                                    0.10
                                ),
                                transparent 38%
                            ),
                            radial-gradient(
                                circle at 100% 100%,
                                rgba(
                                    245,
                                    158,
                                    11,
                                    0.08
                                ),
                                transparent 35%
                            ),
                            var(--bg-card);
                        box-shadow:
                            0 25px 70px
                            rgba(
                                15,
                                23,
                                42,
                                0.16
                            ),
                            inset 0 1px 0
                            rgba(
                                255,
                                255,
                                255,
                                0.35
                            );
                    }

                    .itinerary-train-border {
                        position: absolute;
                        inset: 0;
                        width: 100%;
                        height: 100%;
                        pointer-events: none;
                        z-index: 1;
                        overflow: visible;
                    }

                    .border-train {
                        transform-box:
                            fill-box;
                        transform-origin:
                            center;
                    }

                    .railway-sleepers {
                        filter:
                            drop-shadow(
                                0 1px 1px
                                rgba(
                                    0,
                                    0,
                                    0,
                                    0.10
                                )
                            );
                    }

                    .train-smoke {
                        animation:
                            trainSmoke
                            1.8s
                            ease-in-out
                            infinite;
                        transform-box:
                            fill-box;
                        transform-origin:
                            center bottom;
                    }

                    @keyframes trainSmoke {
                        0%,
                        100% {
                            opacity: 0.65;
                            transform:
                                translate(0, 0)
                                scale(0.9);
                        }

                        50% {
                            opacity: 0.95;
                            transform:
                                translate(5px, -5px)
                                scale(1.08);
                        }
                    }

                    .loading-card-content {
                        position: relative;
                        z-index: 5;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        max-width: 650px;
                        margin: 0 auto;
                    }

                    .loading-icon-wrapper {
                        width: 62px;
                        height: 62px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        margin-bottom: 0.8rem;
                        background:
                            linear-gradient(
                                135deg,
                                rgba(
                                    239,
                                    68,
                                    68,
                                    0.14
                                ),
                                rgba(
                                    245,
                                    158,
                                    11,
                                    0.12
                                )
                            );
                        border:
                            1px solid
                            rgba(
                                239,
                                68,
                                68,
                                0.16
                            );
                        box-shadow:
                            0 12px 30px
                            rgba(
                                239,
                                68,
                                68,
                                0.10
                            );
                        animation:
                            suitcaseFloat
                            2.4s
                            ease-in-out
                            infinite;
                    }

                    .loading-suitcase {
                        font-size: 2rem;
                        filter:
                            drop-shadow(
                                0 5px 8px
                                rgba(
                                    0,
                                    0,
                                    0,
                                    0.15
                                )
                            );
                    }

                    @keyframes suitcaseFloat {
                        0%,
                        100% {
                            transform:
                                translateY(0)
                                rotate(-2deg);
                        }

                        50% {
                            transform:
                                translateY(-7px)
                                rotate(2deg);
                        }
                    }

                    .loading-title {
                        margin:
                            0 0 0.65rem;
                        font-size:
                            clamp(
                                1.55rem,
                                3.4vw,
                                2.35rem
                            );
                        line-height: 1.2;
                        font-weight: 850;
                        letter-spacing: -0.04em;
                        color:
                            var(--text-main);
                    }

                    .loading-title span {
                        background:
                            linear-gradient(
                                90deg,
                                #ef4444,
                                #f97316,
                                #ef4444
                            );
                        background-size:
                            200% auto;
                        -webkit-background-clip:
                            text;
                        background-clip:
                            text;
                        -webkit-text-fill-color:
                            transparent;
                        animation:
                            titleGradient
                            3s
                            linear
                            infinite;
                    }

                    @keyframes titleGradient {
                        0% {
                            background-position:
                                0% center;
                        }

                        50% {
                            background-position:
                                100% center;
                        }

                        100% {
                            background-position:
                                0% center;
                        }
                    }

                    .loading-description {
                        margin: 0;
                        color:
                            var(--text-muted);
                        font-size: 1.05rem;
                        line-height: 1.7;
                    }

                    .loading-steps {
                        width: 100%;
                        margin-top: 1.55rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.45rem;
                    }

                    .loading-step {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0.4rem;
                        min-width: 85px;
                        color:
                            var(--text-main);
                        font-size: 0.8rem;
                        font-weight: 700;
                    }

                    .loading-step-icon {
                        width: 42px;
                        height: 42px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        background:
                            rgba(
                                239,
                                68,
                                68,
                                0.08
                            );
                        border:
                            1px solid
                            rgba(
                                239,
                                68,
                                68,
                                0.18
                            );
                        font-size: 1.05rem;
                        animation:
                            stepPulse
                            2s
                            ease-in-out
                            infinite;
                    }

                    .loading-step:nth-child(1)
                    .loading-step-icon {
                        animation-delay: 0s;
                    }

                    .loading-step:nth-child(3)
                    .loading-step-icon {
                        animation-delay: 0.35s;
                    }

                    .loading-step:nth-child(5)
                    .loading-step-icon {
                        animation-delay: 0.7s;
                    }

                    .loading-step:nth-child(7)
                    .loading-step-icon {
                        animation-delay: 1.05s;
                    }

                    @keyframes stepPulse {
                        0%,
                        100% {
                            transform:
                                translateY(0)
                                scale(1);
                            box-shadow:
                                0 0 0
                                rgba(
                                    239,
                                    68,
                                    68,
                                    0
                                );
                        }

                        50% {
                            transform:
                                translateY(-4px)
                                scale(1.05);
                            box-shadow:
                                0 8px 22px
                                rgba(
                                    239,
                                    68,
                                    68,
                                    0.15
                                );
                        }
                    }

                    .loading-dots {
                        color: #ef4444;
                        font-size: 1.1rem;
                        letter-spacing: 0.18rem;
                        margin-bottom: 1.3rem;
                        opacity: 0.75;
                        animation:
                            dotsPulse
                            1.5s
                            ease-in-out
                            infinite;
                    }

                    @keyframes dotsPulse {
                        0%,
                        100% {
                            opacity: 0.3;
                        }

                        50% {
                            opacity: 1;
                        }
                    }

                    .loading-destination {
                        margin-top: 1.35rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        padding:
                            0.6rem 1rem;
                        border-radius: 999px;
                        background:
                            rgba(
                                239,
                                68,
                                68,
                                0.06
                            );
                        border:
                            1px solid
                            rgba(
                                239,
                                68,
                                68,
                                0.13
                            );
                        color:
                            var(--text-muted);
                        font-size: 0.9rem;
                    }

                    .loading-destination svg {
                        color: #ef4444;
                        animation:
                            sparkleRotate
                            2s
                            linear
                            infinite;
                    }

                    @keyframes sparkleRotate {
                        0% {
                            transform:
                                rotate(0deg)
                                scale(1);
                        }

                        50% {
                            transform:
                                rotate(180deg)
                                scale(1.15);
                        }

                        100% {
                            transform:
                                rotate(360deg)
                                scale(1);
                        }
                    }

                    .loading-tip {
                        margin-top: 0.9rem;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding:
                            0.7rem 1.1rem;
                        border-radius: 0.9rem;
                        background:
                            linear-gradient(
                                90deg,
                                rgba(
                                    239,
                                    68,
                                    68,
                                    0.08
                                ),
                                rgba(
                                    249,
                                    115,
                                    22,
                                    0.08
                                )
                            );
                        border:
                            1px solid
                            rgba(
                                239,
                                68,
                                68,
                                0.12
                            );
                        color:
                            var(--text-muted);
                        font-size: 0.9rem;
                    }

                    .loading-tip svg {
                        color: #ef4444;
                    }

                    .loading-tip strong {
                        color:
                            var(--text-main);
                    }

                    @media (max-width: 700px) {
                        .itinerary-loading-card {
                            height:
                                min(
                                    500px,
                                    calc(
                                        100vh - 120px
                                    )
                                );
                            min-height: 430px;
                            max-height: 500px;
                            padding:
                                4.5rem
                                1.2rem
                                2rem;
                        }

                        .loading-steps {
                            display: grid;
                            grid-template-columns:
                                repeat(
                                    2,
                                    1fr
                                );
                            gap: 1.5rem;
                        }

                        .loading-dots {
                            display: none;
                        }

                        .loading-step {
                            min-width: auto;
                        }

                        .loading-destination {
                            text-align: center;
                        }

                        .loading-tip {
                            text-align: center;
                        }
                    }

                    @media (max-width: 430px) {
                        .itinerary-loading-card {
                            height:
                                min(
                                    500px,
                                    calc(
                                        100vh - 100px
                                    )
                                );
                            min-height: 430px;
                            max-height: 500px;
                            padding:
                                4.2rem
                                0.8rem
                                1.5rem;
                        }

                        .loading-title {
                            font-size: 1.7rem;
                        }

                        .loading-description {
                            font-size: 0.9rem;
                        }

                        .loading-step {
                            font-size: 0.72rem;
                        }

                        .loading-step-icon {
                            width: 44px;
                            height: 44px;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default PlanTrip;

