import React, { useMemo, useState } from 'react';

import {
    MapPin,
    CalendarDays,
    Wallet,
    Hotel,
    Utensils,
    Car,
    Ticket,
    CircleDollarSign,
    Clock,
    Navigation,
    Lightbulb,
    Plane,
    Map,
    Sparkles,
    Compass,
    ChevronDown,
    Route
} from 'lucide-react';


// ============================================================
// VOYAGE AI — PREMIUM ITINERARY DASHBOARD
// ============================================================

const Dashboard = ({ data }) => {

    const [expandedDay, setExpandedDay] = useState(0);


    // ============================================================
    // BASIC DATA
    // ============================================================

    const destination =
        data?.destination ||
        data?.itinerary?.destination ||
        'Your Destination';

    const country =
        data?.country ||
        '';

    const days =
        Number(data?.days) ||
        data?.itinerary?.days?.length ||
        0;

    const budgetINR =
        Number(data?.budgetINR) ||
        Number(data?.breakdown?.total) ||
        0;

    const currencyCode =
        data?.currencyCode ||
        'INR';

    const currencySymbol =
        data?.currencySymbol ||
        '₹';

    const exchangeRate =
        Number(data?.rate) ||
        1;

    const travelType =
        data?.travelType ||
        'budget';


    // ============================================================
    // BUDGET BREAKDOWN
    // ============================================================

    const breakdown =
        data?.breakdown ||
        {};

    const accommodation =
        Number(breakdown.accommodation) ||
        0;

    const food =
        Number(breakdown.food) ||
        0;

    const transport =
        Number(breakdown.transport) ||
        0;

    const activities =
        Number(breakdown.activities) ||
        0;

    const miscellaneous =
        Number(breakdown.miscellaneous) ||
        0;

    const total =
        Number(breakdown.total) ||
        budgetINR;


    // ============================================================
    // ITINERARY
    // ============================================================

    const itinerary =
        data?.itinerary ||
        {};

    const itineraryDays =
        Array.isArray(itinerary.days)
            ? itinerary.days
            : [];


    // ============================================================
    // SIX TRAVEL NOTES
    // ============================================================

    const defaultTips = [

        `Start your day early while exploring ${destination} to enjoy popular attractions with fewer crowds.`,

        `Keep some flexibility in your schedule so you can spend extra time at places you enjoy.`,

        `Wear comfortable footwear because several attractions may involve walking and sightseeing.`,

        `Keep some cash available for small shops, local transport, snacks and entry fees.`,

        `Check the local weather before heading out, especially for outdoor attractions and sightseeing.`,

        `Keep your important documents, phone and valuables secure throughout your journey.`

    ];


    /*
     * Preserve AI-generated tips first.
     * If Gemini gives fewer than 6 tips,
     * automatically fill the remaining spaces.
     */

    const aiTips =
        Array.isArray(itinerary.tips)
            ? itinerary.tips.filter(
                tip =>
                    typeof tip === 'string' &&
                    tip.trim().length > 0
            )
            : [];


    const tips = [
        ...aiTips,
        ...defaultTips
    ].slice(0, 6);


    // ============================================================
    // LANDMARKS
    // ============================================================

    const landmarks =
        Array.isArray(data?.landmarks)
            ? data.landmarks
            : [];


    // ============================================================
    // HERO IMAGE
    // ============================================================

    const HERO_IMAGE =
        '/travel-itinerary-hero.png';


    // ============================================================
    // CURRENCY FUNCTIONS
    // ============================================================

    const formatINR = (amount) => {

        return new Intl.NumberFormat(
            'en-IN',
            {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }
        ).format(
            Number(amount) || 0
        );
    };


    const formatLocalCurrency = (amount) => {

        if (currencyCode === 'INR') {
            return formatINR(amount);
        }

        return (
            `${currencySymbol}` +
            `${Number(amount || 0).toFixed(2)}`
        );
    };


    const convertToLocal = (amount) => {

        return (
            Number(amount || 0) *
            exchangeRate
        );
    };


    // ============================================================
    // BUDGET ITEMS
    // ============================================================

    const budgetItems = useMemo(() => [

        {
            title: 'Stay',
            value: accommodation,
            icon: <Hotel size={18} />,
        },

        {
            title: 'Food',
            value: food,
            icon: <Utensils size={18} />,
        },

        {
            title: 'Transport',
            value: transport,
            icon: <Car size={18} />,
        },

        {
            title: 'Experiences',
            value: activities,
            icon: <Ticket size={18} />,
        },

        {
            title: 'Misc',
            value: miscellaneous,
            icon: <CircleDollarSign size={18} />,
        }

    ], [
        accommodation,
        food,
        transport,
        activities,
        miscellaneous
    ]);


    const getPercentage = (value) => {

        if (!total) {
            return 0;
        }

        return Math.round(
            (value / total) * 100
        );
    };


    // ============================================================
    // CSS
    // ============================================================

    const styles = `

        /* ========================================================
           ROOT
        ======================================================== */

        .voyage-dashboard {

            --vd-text: #f8fafc;
            --vd-muted: #94a3b8;

            --vd-purple: #8b5cf6;
            --vd-pink: #ec4899;
            --vd-blue: #38bdf8;
            --vd-cyan: #22d3ee;
            --vd-green: #34d399;
            --vd-yellow: #fbbf24;

            width: 100%;

            position: relative;

            color: var(--vd-text);

            font-family:
                Inter,
                ui-sans-serif,
                system-ui,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;

            isolation: isolate;

            overflow: hidden;

            padding-bottom: 20px;
        }


        /* ========================================================
           AMBIENT BACKGROUND
        ======================================================== */

        .voyage-dashboard::before {

            content: "";

            position: absolute;

            width: 520px;
            height: 520px;

            left: -260px;
            top: 8%;

            border-radius: 50%;

            background:
                radial-gradient(
                    circle,
                    rgba(124,58,237,0.17),
                    transparent 68%
                );

            filter: blur(70px);

            pointer-events: none;

            z-index: -2;

            animation:
                vdAmbientLeft 12s ease-in-out infinite;
        }


        .voyage-dashboard::after {

            content: "";

            position: absolute;

            width: 500px;
            height: 500px;

            right: -260px;
            bottom: 5%;

            border-radius: 50%;

            background:
                radial-gradient(
                    circle,
                    rgba(236,72,153,0.13),
                    transparent 68%
                );

            filter: blur(80px);

            pointer-events: none;

            z-index: -2;

            animation:
                vdAmbientRight 15s ease-in-out infinite;
        }


        /* ========================================================
           GLASS CARD
        ======================================================== */

        .vd-glass {

            position: relative;

            background:
                linear-gradient(
                    145deg,
                    rgba(255,255,255,0.085),
                    rgba(255,255,255,0.025)
                );

            border:
                1px solid rgba(255,255,255,0.10);

            border-radius: 24px;

            backdrop-filter:
                blur(24px);

            -webkit-backdrop-filter:
                blur(24px);

            box-shadow:
                0 22px 60px rgba(0,0,0,0.20),
                inset 0 1px 0 rgba(255,255,255,0.07);

            overflow: hidden;

            isolation: isolate;

            transition:
                transform 0.45s cubic-bezier(.2,.8,.2,1),
                border-color 0.45s ease,
                box-shadow 0.45s ease,
                background 0.45s ease;
        }


        .vd-glass::after {

            content: "";

            position: absolute;

            inset: 0;

            pointer-events: none;

            background:
                linear-gradient(
                    125deg,
                    rgba(255,255,255,0.06),
                    transparent 30%,
                    transparent 70%,
                    rgba(139,92,246,0.04)
                );

            opacity: 0.8;

            z-index: -1;
        }


        /* ========================================================
           DARK MODE HOVER LINE
        ======================================================== */

        .vd-glass::before {

            content: "";

            position: absolute;

            left: 7%;

            bottom: 0;

            width: 86%;

            height: 3px;

            border-radius: 999px;

            background:
                linear-gradient(
                    90deg,
                    #6366f1,
                    #8b5cf6,
                    #ec4899,
                    #22d3ee
                );

            transform:
                scaleX(0);

            transform-origin:
                center;

            opacity: 0;

            transition:
                transform 0.5s cubic-bezier(.2,.8,.2,1),
                opacity 0.35s ease,
                box-shadow 0.5s ease;

            z-index: 30;
        }


        .vd-glass:hover {

            transform:
                translateY(-6px);

            border-color:
                rgba(167,139,250,0.38);

            background:
                linear-gradient(
                    145deg,
                    rgba(139,92,246,0.14),
                    rgba(236,72,153,0.065),
                    rgba(34,211,238,0.035)
                );

            box-shadow:
                0 30px 75px rgba(0,0,0,0.30),
                0 0 40px rgba(139,92,246,0.08),
                inset 0 1px 0 rgba(255,255,255,0.11);
        }


        .vd-glass:hover::before {

            transform:
                scaleX(1);

            opacity:
                1;

            box-shadow:
                0 0 15px rgba(139,92,246,0.65),
                0 0 30px rgba(236,72,153,0.25);
        }


        /* ========================================================
           STAT ICONS
        ======================================================== */

        .vd-stat-icon {

            width: 46px;
            height: 46px;

            display: flex;

            align-items: center;
            justify-content: center;

            border-radius: 14px;

            margin-bottom: 15px;

            color: #ffffff;

            background:
                linear-gradient(
                    135deg,
                    #6366f1,
                    #8b5cf6 55%,
                    #ec4899
                );

            border:
                1px solid rgba(255,255,255,0.18);

            box-shadow:
                0 8px 24px rgba(99,102,241,0.30),
                inset 0 1px 0 rgba(255,255,255,0.25);

            transition:
                transform 0.4s cubic-bezier(.2,.8,.2,1),
                box-shadow 0.4s ease;
        }


        .vd-stat-icon svg {

            display: block;

            width: 21px;
            height: 21px;

            stroke:
                #ffffff;

            stroke-width:
                2.2;
        }


        .vd-stat:hover .vd-stat-icon {

            transform:
                translateY(-2px)
                rotate(-5deg)
                scale(1.08);

            box-shadow:
                0 13px 32px rgba(99,102,241,0.42),
                0 0 20px rgba(139,92,246,0.20);
        }


        /* ========================================================
           STAT CARDS
        ======================================================== */

        .vd-stat {

            padding: 22px;

            min-height: 145px;

            display: flex;

            flex-direction: column;

            justify-content: center;

            animation:
                vdFadeUp 0.7s ease both;
        }


        .vd-stat-label {

            color:
                var(--vd-muted);

            font-size: 0.78rem;

            font-weight: 650;

            margin-bottom: 5px;
        }


        .vd-stat-value {

            font-size: 1.35rem;

            font-weight: 850;

            letter-spacing: -0.03em;

            color:
                var(--vd-text);
        }


        /* ========================================================
           HERO
        ======================================================== */

        .vd-hero {

            position: relative;

            width: 100%;

            aspect-ratio: 3 / 2;

            overflow: hidden;

            display: flex;

            align-items: flex-end;

            padding:
                clamp(25px, 4vw, 55px);

            border-radius: 30px;

            border:
                1px solid rgba(255,255,255,0.16);

            background:
                #07111f;

            box-shadow:
                0 35px 100px rgba(0,0,0,0.42),
                0 0 80px rgba(99,102,241,0.07);

            isolation: isolate;
        }


        .vd-hero-image {

            position: absolute;

            inset: 0;

            width: 100%;
            height: 100%;

            object-fit: fill;

            opacity: 0.92;

            transition:
                transform 1.8s ease;
        }


        .vd-hero:hover .vd-hero-image {

            transform:
                scale(1.018);
        }


        .vd-hero-overlay {

            position: absolute;

            inset: 0;

            z-index: 1;

            pointer-events: none;

            background:
                linear-gradient(
                    90deg,
                    rgba(3,7,18,0.88) 0%,
                    rgba(3,7,18,0.63) 26%,
                    rgba(3,7,18,0.20) 57%,
                    rgba(3,7,18,0.03) 100%
                ),

                linear-gradient(
                    0deg,
                    rgba(3,7,18,0.76) 0%,
                    rgba(3,7,18,0.18) 44%,
                    rgba(3,7,18,0) 78%
                );
        }


        .vd-hero-content {

            position: relative;

            z-index: 5;

            max-width: 760px;

            animation:
                vdHeroReveal 0.9s ease both;
        }


        .vd-eyebrow {

            display: inline-flex;

            align-items: center;

            gap: 8px;

            padding: 9px 15px;

            border-radius: 999px;

            border:
                1px solid rgba(255,255,255,0.22);

            background:
                rgba(7,12,28,0.58);

            backdrop-filter:
                blur(18px);

            color:
                #ddd6fe;

            font-size: 0.76rem;

            font-weight: 850;

            letter-spacing: 0.08em;

            text-transform: uppercase;

            margin-bottom: 20px;
        }


        .vd-title {

            margin: 0;

            font-size:
                clamp(3rem, 7vw, 6rem);

            line-height: 0.94;

            letter-spacing: -0.065em;

            font-weight: 900;

            background:
                linear-gradient(
                    110deg,
                    #ffffff 5%,
                    #ede9fe 48%,
                    #f9a8d4 90%
                );

            -webkit-background-clip: text;

            background-clip: text;

            -webkit-text-fill-color: transparent;

            filter:
                drop-shadow(0 8px 30px rgba(0,0,0,0.45));
        }


        .vd-subtitle {

            max-width: 650px;

            margin: 20px 0 0;

            color:
                #e2e8f0;

            font-size: 1.02rem;

            line-height: 1.7;

            text-shadow:
                0 2px 12px rgba(0,0,0,0.55);
        }


        .vd-hero-meta {

            display: flex;

            flex-wrap: wrap;

            gap: 10px;

            margin-top: 26px;
        }


        .vd-pill {

            display: inline-flex;

            align-items: center;

            gap: 8px;

            padding: 10px 15px;

            border-radius: 999px;

            border:
                1px solid rgba(255,255,255,0.18);

            background:
                rgba(5,10,25,0.55);

            backdrop-filter:
                blur(16px);

            color:
                #f1f5f9;

            font-size: 0.82rem;

            font-weight: 700;

            box-shadow:
                0 8px 25px rgba(0,0,0,0.18);
        }


        /* ========================================================
           SUMMARY
        ======================================================== */

        .vd-summary-grid {

            display: grid;

            grid-template-columns:
                repeat(4, minmax(0, 1fr));

            gap: 15px;

            margin-top: 18px;
        }


        /* ========================================================
           SECTIONS
        ======================================================== */

        .vd-section {

            margin-top: 30px;
        }


        .vd-section-header {

            display: flex;

            align-items: flex-end;

            justify-content: space-between;

            gap: 15px;

            margin-bottom: 15px;
        }


        .vd-section-title {

            margin: 0;

            font-size: 1.55rem;

            letter-spacing: -0.04em;

            font-weight: 850;

            background:
                linear-gradient(
                    100deg,
                    var(--vd-text),
                    #a78bfa,
                    #f9a8d4
                );

            -webkit-background-clip: text;

            background-clip: text;

            -webkit-text-fill-color: transparent;
        }


        .vd-section-description {

            color:
                var(--vd-muted);

            margin: 6px 0 0;

            font-size: 0.87rem;

            line-height: 1.55;
        }


        /* ========================================================
           BUDGET
        ======================================================== */

        .vd-budget {

            padding: 28px;
        }


        .vd-budget-layout {

            display: grid;

            grid-template-columns:
                250px 1fr;

            gap: 34px;

            align-items: center;
        }


        .vd-budget-circle {

            width: 195px;
            height: 195px;

            border-radius: 50%;

            margin: auto;

            display: flex;

            align-items: center;
            justify-content: center;

            position: relative;

            background:
                conic-gradient(
                    #6366f1 0deg,
                    #8b5cf6 80deg,
                    #ec4899 155deg,
                    #38bdf8 230deg,
                    #34d399 310deg,
                    #6366f1 360deg
                );

            box-shadow:
                0 0 75px rgba(139,92,246,0.20);
        }


        .vd-budget-circle::after {

            content: "";

            position: absolute;

            inset: 10px;

            border-radius: 50%;

            background:
                #0b1020;

            box-shadow:
                inset 0 0 35px rgba(0,0,0,0.45);
        }


        .vd-budget-circle-content {

            position: relative;

            z-index: 2;

            text-align: center;
        }


        .vd-budget-total {

            font-size: 1.55rem;

            font-weight: 900;

            letter-spacing: -0.04em;
        }


        .vd-budget-caption {

            color:
                var(--vd-muted);

            font-size: 0.72rem;

            margin-top: 5px;
        }


        .vd-budget-list {

            display: grid;

            gap: 14px;
        }


        .vd-budget-row {

            display: grid;

            grid-template-columns:
                42px 1fr auto;

            align-items: center;

            gap: 12px;

            padding: 10px;

            border-radius: 15px;

            transition:
                background 0.3s ease,
                transform 0.3s ease;
        }


        .vd-budget-row:hover {

            background:
                rgba(139,92,246,0.055);

            transform:
                translateX(5px);
        }


        .vd-budget-icon {

            width: 42px;
            height: 42px;

            border-radius: 13px;

            display: flex;

            align-items: center;
            justify-content: center;

            color:
                #ffffff;

            background:
                linear-gradient(
                    135deg,
                    #4f46e5,
                    #7c3aed
                );

            border:
                1px solid rgba(255,255,255,0.18);

            box-shadow:
                0 7px 20px rgba(79,70,229,0.28),
                inset 0 1px 0 rgba(255,255,255,0.20);

            transition:
                transform 0.35s ease,
                box-shadow 0.35s ease;
        }


        .vd-budget-icon svg {

            width: 19px;
            height: 19px;

            stroke:
                #ffffff;

            stroke-width:
                2.2;
        }


        .vd-budget-row:hover .vd-budget-icon {

            transform:
                rotate(-5deg)
                scale(1.08);

            box-shadow:
                0 10px 28px rgba(99,102,241,0.38);
        }


        .vd-budget-name {

            font-size: 0.85rem;

            color:
                var(--vd-text);

            font-weight: 700;
        }


        .vd-budget-bar {

            height: 7px;

            margin-top: 7px;

            border-radius: 999px;

            background:
                rgba(148,163,184,0.12);

            overflow: hidden;
        }


        .vd-budget-fill {

            height: 100%;

            border-radius: inherit;

            background:
                linear-gradient(
                    90deg,
                    #6366f1,
                    #8b5cf6,
                    #ec4899
                );

            box-shadow:
                0 0 12px rgba(139,92,246,0.25);

            transition:
                width 1.1s cubic-bezier(.2,.8,.2,1);
        }


        .vd-budget-amount {

            font-size: 0.85rem;

            font-weight: 800;

            color:
                var(--vd-text);

            white-space: nowrap;
        }


        /* ========================================================
           ITINERARY
        ======================================================== */

        .vd-timeline {

            position: relative;
        }


        .vd-day {

            position: relative;

            margin-bottom: 16px;

            animation:
                vdFadeUp 0.7s ease both;
        }


        .vd-day-button {

            width: 100%;

            display: flex;

            align-items: center;

            gap: 15px;

            padding: 18px;

            border:
                1px solid rgba(255,255,255,0.08);

            border-radius: 21px;

            background:
                linear-gradient(
                    135deg,
                    rgba(255,255,255,0.055),
                    rgba(255,255,255,0.018)
                );

            color:
                var(--vd-text);

            cursor: pointer;

            text-align: left;

            box-shadow:
                0 14px 40px rgba(0,0,0,0.13);

            transition:
                transform 0.35s ease,
                border-color 0.35s ease,
                background 0.35s ease,
                box-shadow 0.35s ease;
        }


        .vd-day-button:hover {

            transform:
                translateX(5px);

            border-color:
                rgba(167,139,250,0.34);

            background:
                linear-gradient(
                    135deg,
                    rgba(139,92,246,0.11),
                    rgba(236,72,153,0.045)
                );
        }


        .vd-day-number {

            flex: 0 0 auto;

            width: 50px;
            height: 50px;

            border-radius: 16px;

            display: flex;

            align-items: center;
            justify-content: center;

            font-weight: 900;

            color:
                #ffffff;

            background:
                linear-gradient(
                    135deg,
                    #4f46e5,
                    #7c3aed 50%,
                    #db2777
                );

            border:
                1px solid rgba(255,255,255,0.20);

            box-shadow:
                0 10px 30px rgba(99,102,241,0.30),
                inset 0 1px 0 rgba(255,255,255,0.22);

            transition:
                transform 0.35s ease,
                box-shadow 0.35s ease;
        }


        .vd-day-button:hover .vd-day-number {

            transform:
                rotate(-4deg)
                scale(1.07);

            box-shadow:
                0 14px 35px rgba(139,92,246,0.42);
        }


        .vd-day-main {

            flex: 1;
        }


        .vd-day-title {

            font-size: 1rem;

            font-weight: 800;

            margin: 0 0 4px;
        }


        .vd-day-meta {

            color:
                var(--vd-muted);

            font-size: 0.78rem;
        }


        .vd-day-cost {

            color:
                #6ee7b7;

            font-size: 0.78rem;

            font-weight: 800;
        }


        .vd-chevron {

            flex: 0 0 auto;

            color:
                var(--vd-muted);

            transition:
                transform 0.35s ease,
                color 0.35s ease;
        }


        .vd-chevron.open {

            transform:
                rotate(180deg);

            color:
                #c4b5fd;
        }


        .vd-activities {

            margin:
                9px 0 14px 25px;

            padding:
                12px 0 6px 32px;

            border-left:
                1px dashed rgba(167,139,250,0.30);

            animation:
                vdExpand 0.35s ease both;
        }


        .vd-activity {

            position: relative;

            display: grid;

            grid-template-columns:
                78px 1fr;

            gap: 15px;

            padding: 17px;

            margin-bottom: 10px;

            border:
                1px solid rgba(255,255,255,0.065);

            background:
                rgba(255,255,255,0.025);

            border-radius: 17px;

            transition:
                transform 0.35s ease,
                border-color 0.35s ease,
                background 0.35s ease;
        }


        .vd-activity::before {

            content: "";

            position: absolute;

            width: 10px;
            height: 10px;

            border-radius: 50%;

            left: -38px;

            top: 24px;

            background:
                #a78bfa;

            box-shadow:
                0 0 0 5px #0b1020,
                0 0 18px rgba(167,139,250,0.65);
        }


        .vd-activity:hover {

            transform:
                translateX(6px);

            border-color:
                rgba(167,139,250,0.28);

            background:
                rgba(139,92,246,0.065);
        }


        .vd-activity-time {

            color:
                #a78bfa;

            font-size: 0.78rem;

            font-weight: 800;
        }


        .vd-activity-title {

            margin: 0;

            font-size: 0.96rem;

            font-weight: 800;
        }


        .vd-activity-description {

            margin: 6px 0;

            color:
                var(--vd-muted);

            line-height: 1.55;

            font-size: 0.83rem;
        }


        .vd-activity-meta {

            display: flex;

            flex-wrap: wrap;

            gap: 10px;

            color:
                var(--vd-muted);

            font-size: 0.72rem;
        }


        .vd-activity-meta span {

            display: inline-flex;

            align-items: center;

            gap: 4px;

            padding:
                4px 7px;

            border-radius: 999px;

            background:
                rgba(148,163,184,0.06);
        }


        /* ========================================================
           PLACES
        ======================================================== */

        .vd-places-grid {

            display: grid;

            grid-template-columns:
                repeat(3, minmax(0,1fr));

            gap: 14px;
        }


        .vd-place {

            padding: 20px;

            min-height: 145px;

            position: relative;

            transition:
                transform 0.4s ease,
                border-color 0.4s ease,
                box-shadow 0.4s ease;
        }


        .vd-place:hover {

            transform:
                translateY(-8px);

            border-color:
                rgba(56,189,248,0.36);

            box-shadow:
                0 28px 65px rgba(0,0,0,0.25),
                0 0 35px rgba(56,189,248,0.06);
        }


        .vd-place-index {

            display: inline-flex;

            align-items: center;

            justify-content: center;

            min-width: 28px;
            height: 28px;

            padding: 0 7px;

            border-radius: 9px;

            font-size: 0.68rem;

            color:
                #c4b5fd;

            background:
                rgba(139,92,246,0.11);

            border:
                1px solid rgba(139,92,246,0.14);

            font-weight: 850;

            margin-bottom: 16px;
        }


        .vd-place-name {

            display: flex;

            align-items: flex-start;

            gap: 8px;

            font-weight: 800;

            font-size: 0.92rem;

            line-height: 1.45;

            color:
                var(--vd-text);
        }


        .vd-place-type {

            color:
                var(--vd-muted);

            font-size: 0.72rem;

            margin-top: 9px;

            text-transform: capitalize;
        }


        /* ========================================================
           TRAVEL NOTES
        ======================================================== */

        .vd-tips {

            display: grid;

            grid-template-columns:
                repeat(3, minmax(0,1fr));

            gap: 14px;
        }


        .vd-tip {

            padding: 20px;

            min-height: 155px;

            display: flex;

            flex-direction: column;

            justify-content: space-between;

            transition:
                transform 0.4s ease,
                border-color 0.4s ease,
                box-shadow 0.4s ease;
        }


        .vd-tip:hover {

            transform:
                translateY(-7px);

            border-color:
                rgba(251,191,36,0.32);

            box-shadow:
                0 25px 55px rgba(0,0,0,0.22);
        }


        .vd-tip-number {

            width: 34px;
            height: 34px;

            display: flex;

            align-items: center;
            justify-content: center;

            border-radius: 11px;

            background:
                linear-gradient(
                    135deg,
                    rgba(251,191,36,0.18),
                    rgba(236,72,153,0.10)
                );

            border:
                1px solid rgba(251,191,36,0.15);

            color:
                #fbbf24;

            font-weight: 850;

            font-size: 0.75rem;

            margin-bottom: 13px;
        }


        .vd-tip-text {

            color:
                var(--vd-text);

            font-size: 0.84rem;

            line-height: 1.65;

            margin: 0;
        }


        /* ========================================================
           FOOTER
        ======================================================== */

        .vd-footer {

            margin-top: 30px;

            padding: 30px;

            text-align: center;

            border-radius: 25px;

            background:
                linear-gradient(
                    135deg,
                    rgba(139,92,246,0.13),
                    rgba(236,72,153,0.08),
                    rgba(14,165,233,0.06)
                );

            border:
                1px solid rgba(139,92,246,0.20);

            box-shadow:
                0 25px 70px rgba(0,0,0,0.15);

            position: relative;

            overflow: hidden;
        }


        .vd-footer-icon {

            width: 54px;
            height: 54px;

            display: flex;

            align-items: center;
            justify-content: center;

            margin:
                0 auto 13px;

            border-radius: 16px;

            background:
                linear-gradient(
                    135deg,
                    #6366f1,
                    #ec4899
                );

            color:
                #ffffff;

            box-shadow:
                0 12px 35px rgba(139,92,246,0.25);
        }


        .vd-footer-title {

            margin: 0;

            font-size: 1.05rem;

            font-weight: 850;
        }


        .vd-footer-text {

            color:
                var(--vd-muted);

            margin: 7px 0 0;

            font-size: 0.78rem;

            line-height: 1.6;
        }


        /* ========================================================
           LIGHT MODE
        ======================================================== */

        [data-theme="light"] .voyage-dashboard {

            --vd-text: #111827;
            --vd-muted: #475569;

            background:
                radial-gradient(
                    circle at 5% 5%,
                    rgba(37,99,235,0.08),
                    transparent 30%
                ),

                radial-gradient(
                    circle at 95% 20%,
                    rgba(239,68,68,0.07),
                    transparent 30%
                ),

                radial-gradient(
                    circle at 50% 100%,
                    rgba(13,148,136,0.06),
                    transparent 35%
                );
        }


        [data-theme="light"] .vd-glass {

            background:
                linear-gradient(
                    145deg,
                    rgba(255,255,255,0.97),
                    rgba(248,250,252,0.94)
                );

            border:
                1px solid rgba(71,85,105,0.14);

            box-shadow:
                0 18px 45px rgba(15,23,42,0.09),
                0 3px 12px rgba(37,99,235,0.045),
                inset 0 1px 0 rgba(255,255,255,0.95);
        }


        [data-theme="light"] .vd-glass:hover {

            background:
                linear-gradient(
                    145deg,
                    #ffffff,
                    #f8fbff
                );

            border-color:
                rgba(37,99,235,0.30);

            box-shadow:
                0 28px 65px rgba(15,23,42,0.13),
                0 0 35px rgba(37,99,235,0.08);
        }


        /* ========================================================
           LIGHT MODE — BLUE + CYAN + TEAL + RED
        ======================================================== */

        [data-theme="light"] .vd-glass::before {

            background:
                linear-gradient(
                    90deg,
                    #2563eb,
                    #0891b2,
                    #0d9488,
                    #ef4444
                );
        }


        [data-theme="light"] .vd-glass:hover::before {

            transform:
                scaleX(1);

            opacity:
                1;

            box-shadow:
                0 0 12px rgba(37,99,235,0.38),
                0 0 22px rgba(13,148,136,0.20),
                0 0 30px rgba(239,68,68,0.12);
        }


        /* ========================================================
           LIGHT MODE ICONS
        ======================================================== */

        [data-theme="light"] .vd-stat-icon {

            color:
                #ffffff;

            background:
                linear-gradient(
                    135deg,
                    #4338ca,
                    #2563eb,
                    #0891b2
                );

            border-color:
                rgba(37,99,235,0.20);

            box-shadow:
                0 8px 22px rgba(37,99,235,0.22);
        }


        [data-theme="light"] .vd-stat-icon svg {

            stroke:
                #ffffff;
        }


        [data-theme="light"] .vd-budget-icon {

            color:
                #ffffff;

            background:
                linear-gradient(
                    135deg,
                    #4338ca,
                    #2563eb,
                    #0891b2,
                    #ef4444
                );

            border-color:
                rgba(37,99,235,0.18);

            box-shadow:
                0 7px 20px rgba(37,99,235,0.20);
        }


        [data-theme="light"] .vd-budget-icon svg {

            stroke:
                #ffffff;
        }


        [data-theme="light"] .vd-day-number {

            color:
                #ffffff;

            background:
                linear-gradient(
                    135deg,
                    #4338ca,
                    #2563eb,
                    #0891b2,
                    #ef4444
                );

            box-shadow:
                0 9px 28px rgba(37,99,235,0.25);
        }


        /* ========================================================
           LIGHT MODE TEXT
        ======================================================== */

        [data-theme="light"] .vd-stat-label {

            color:
                #64748b;
        }


        [data-theme="light"] .vd-stat-value {

            color:
                #111827;
        }


        [data-theme="light"] .vd-budget-name {

            color:
                #1e293b;
        }


        [data-theme="light"] .vd-budget-amount {

            color:
                #111827;
        }


        [data-theme="light"] .vd-budget-bar {

            background:
                rgba(71,85,105,0.12);
        }


        [data-theme="light"] .vd-budget-fill {

            background:
                linear-gradient(
                    90deg,
                    #2563eb,
                    #0891b2,
                    #0d9488,
                    #ef4444
                );

            box-shadow:
                0 0 10px rgba(37,99,235,0.18);
        }


        /* ========================================================
           LIGHT MODE ITINERARY
        ======================================================== */

        [data-theme="light"] .vd-day-button {

            background:
                linear-gradient(
                    135deg,
                    #ffffff,
                    #f8fafc
                );

            border-color:
                rgba(71,85,105,0.13);

            color:
                #111827;

            box-shadow:
                0 12px 30px rgba(15,23,42,0.07);
        }


        [data-theme="light"] .vd-day-button:hover {

            background:
                linear-gradient(
                    135deg,
                    #ffffff,
                    #f5f9ff
                );

            border-color:
                rgba(37,99,235,0.30);
        }


        [data-theme="light"] .vd-activity {

            background:
                rgba(248,250,252,0.95);

            border-color:
                rgba(71,85,105,0.10);
        }


        [data-theme="light"] .vd-activity:hover {

            background:
                #ffffff;

            border-color:
                rgba(37,99,235,0.23);
        }


        [data-theme="light"] .vd-activity-description,
        [data-theme="light"] .vd-activity-meta {

            color:
                #526175;
        }


        [data-theme="light"] .vd-place-type {

            color:
                #526175;
        }


        [data-theme="light"] .vd-tip-text {

            color:
                #263449;
        }


        [data-theme="light"] .vd-section-description {

            color:
                #526175;
        }


        [data-theme="light"] .vd-budget-circle::after {

            background:
                #ffffff;

            box-shadow:
                inset 0 0 25px rgba(37,99,235,0.08);
        }


        [data-theme="light"] .vd-budget-caption {

            color:
                #64748b;
        }


        /* ========================================================
           ANIMATIONS
        ======================================================== */

        @keyframes vdFadeUp {

            from {
                opacity: 0;
                transform: translateY(18px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }


        @keyframes vdHeroReveal {

            from {
                opacity: 0;
                transform: translateY(30px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }


        @keyframes vdAmbientLeft {

            0%,
            100% {
                transform:
                    translate(0,0);
            }

            50% {
                transform:
                    translate(80px,40px);
            }
        }


        @keyframes vdAmbientRight {

            0%,
            100% {
                transform:
                    translate(0,0);
            }

            50% {
                transform:
                    translate(-70px,-40px);
            }
        }


        @keyframes vdExpand {

            from {
                opacity: 0;
                transform: translateY(-8px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }


        /* ========================================================
           RESPONSIVE
        ======================================================== */

        @media (max-width: 1000px) {

            .vd-summary-grid {

                grid-template-columns:
                    repeat(2, 1fr);
            }


            .vd-places-grid {

                grid-template-columns:
                    repeat(2, 1fr);
            }


            .vd-tips {

                grid-template-columns:
                    repeat(2, 1fr);
            }
        }


        @media (max-width: 750px) {

            .vd-hero {

                min-height: 390px;

                aspect-ratio:
                    auto;

                padding:
                    25px;
            }


            .vd-title {

                font-size:
                    2.8rem;
            }


            .vd-summary-grid {

                grid-template-columns:
                    1fr 1fr;
            }


            .vd-budget-layout {

                grid-template-columns:
                    1fr;
            }


            .vd-budget-circle {

                width: 165px;
                height: 165px;
            }


            .vd-places-grid {

                grid-template-columns:
                    1fr;
            }


            .vd-tips {

                grid-template-columns:
                    1fr;
            }


            .vd-activity {

                grid-template-columns:
                    70px 1fr;
            }
        }


        @media (max-width: 500px) {

            .vd-summary-grid {

                grid-template-columns:
                    1fr;
            }


            .vd-hero {

                min-height: 420px;

                padding:
                    20px;
            }


            .vd-title {

                font-size:
                    2.35rem;
            }


            .vd-subtitle {

                font-size:
                    0.9rem;
            }


            .vd-budget {

                padding:
                    18px;
            }


            .vd-day-button {

                padding:
                    14px;
            }


            .vd-day-number {

                width: 43px;
                height: 43px;

                border-radius:
                    13px;
            }


            .vd-activities {

                margin-left:
                    8px;

                padding-left:
                    22px;
            }


            .vd-activity {

                grid-template-columns:
                    1fr;

                gap:
                    6px;
            }


            .vd-activity::before {

                left:
                    -28px;
            }


            .vd-hero-meta {

                gap:
                    7px;
            }


            .vd-pill {

                padding:
                    8px 10px;

                font-size:
                    0.70rem;
            }


            .vd-tip {

                min-height:
                    135px;
            }
        }

    `;


    // ============================================================
    // RENDER ACTIVITY
    // ============================================================

    const renderActivity = (
        activity,
        index
    ) => {

        const cost =
            Number(
                activity?.estimatedCost
            ) || 0;

        return (

            <div
                className="vd-activity"
                key={index}
            >

                <div
                    className="vd-activity-time"
                >
                    {activity?.time ||
                        'Flexible'}
                </div>


                <div>

                    <h4
                        className="vd-activity-title"
                    >
                        {activity?.place ||
                            activity?.name ||
                            'Explore location'}
                    </h4>


                    <p
                        className="vd-activity-description"
                    >
                        {activity?.activity ||
                            activity?.description ||
                            'Explore this location and enjoy the experience.'}
                    </p>


                    <div
                        className="vd-activity-meta"
                    >

                        {activity?.duration && (

                            <span>
                                <Clock size={12} />
                                {activity.duration}
                            </span>

                        )}


                        {activity?.distanceFromPrevious && (

                            <span>
                                <Map size={12} />
                                {activity.distanceFromPrevious}
                            </span>

                        )}


                        {activity?.travelTimeFromPrevious && (

                            <span>
                                <Navigation size={12} />
                                {activity.travelTimeFromPrevious}
                            </span>

                        )}


                        {cost > 0 && (

                            <span
                                style={{
                                    color:
                                        '#34d399',
                                    fontWeight:
                                        800
                                }}
                            >
                                ₹{cost}
                            </span>

                        )}

                    </div>

                </div>

            </div>

        );
    };


    // ============================================================
    // DASHBOARD
    // ============================================================

    return (

        <div
            className="voyage-dashboard"
        >

            <style>
                {styles}
            </style>


            {/* ==================================================
                HERO
            ================================================== */}

            <section
                className="vd-hero"
            >

                <img
                    className="vd-hero-image"
                    src={HERO_IMAGE}
                    alt={`${destination} travel itinerary`}
                />


                <div
                    className="vd-hero-overlay"
                />


                <div
                    className="vd-hero-content"
                >

                    <div
                        className="vd-eyebrow"
                    >

                        <Sparkles
                            size={14}
                        />

                        AI Crafted Journey

                    </div>


                    <h1
                        className="vd-title"
                    >
                        {destination}
                    </h1>


                    <p
                        className="vd-subtitle"
                    >
                        A carefully organized {days}-day
                        journey with real locations,
                        smart geographic grouping and a
                        budget designed around your travel style.
                    </p>


                    <div
                        className="vd-hero-meta"
                    >

                        <span
                            className="vd-pill"
                        >

                            <CalendarDays
                                size={15}
                            />

                            {days} Days

                        </span>


                        <span
                            className="vd-pill"
                        >

                            <Wallet
                                size={15}
                            />

                            {formatINR(total)}

                        </span>


                        <span
                            className="vd-pill"
                        >

                            <Plane
                                size={15}
                            />

                            {travelType}

                        </span>


                        <span
                            className="vd-pill"
                        >

                            <Compass
                                size={15}
                            />

                            {landmarks.length}
                            {' '}
                            real places

                        </span>

                    </div>

                </div>

            </section>


            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div
                className="vd-summary-grid"
            >

                <div
                    className="vd-glass vd-stat"
                >

                    <div
                        className="vd-stat-icon"
                    >
                        <Wallet size={20} />
                    </div>

                    <div
                        className="vd-stat-label"
                    >
                        Total Budget
                    </div>

                    <div
                        className="vd-stat-value"
                    >
                        {formatINR(total)}
                    </div>

                </div>


                <div
                    className="vd-glass vd-stat"
                >

                    <div
                        className="vd-stat-icon"
                    >
                        <CalendarDays size={20} />
                    </div>

                    <div
                        className="vd-stat-label"
                    >
                        Duration
                    </div>

                    <div
                        className="vd-stat-value"
                    >
                        {days} days
                    </div>

                </div>


                <div
                    className="vd-glass vd-stat"
                >

                    <div
                        className="vd-stat-icon"
                    >
                        <CircleDollarSign size={20} />
                    </div>

                    <div
                        className="vd-stat-label"
                    >
                        Exchange Rate
                    </div>

                    <div
                        className="vd-stat-value"
                    >
                        1 INR = {exchangeRate} {currencyCode}
                    </div>

                </div>


                <div
                    className="vd-glass vd-stat"
                >

                    <div
                        className="vd-stat-icon"
                    >
                        <MapPin size={20} />
                    </div>

                    <div
                        className="vd-stat-label"
                    >
                        Places Found
                    </div>

                    <div
                        className="vd-stat-value"
                    >
                        {landmarks.length}
                    </div>

                </div>

            </div>


            {/* ==================================================
                BUDGET
            ================================================== */}

            <section
                className="vd-section"
            >

                <div
                    className="vd-section-header"
                >

                    <div>

                        <h2
                            className="vd-section-title"
                        >
                            Your Trip Budget
                        </h2>

                        <p
                            className="vd-section-description"
                        >
                            Smart allocation based on your
                            travel preferences.
                        </p>

                    </div>

                </div>


                <div
                    className="vd-glass vd-budget"
                >

                    <div
                        className="vd-budget-layout"
                    >

                        <div
                            className="vd-budget-circle"
                        >

                            <div
                                className="vd-budget-circle-content"
                            >

                                <div
                                    className="vd-budget-total"
                                >
                                    {formatINR(total)}
                                </div>

                                <div
                                    className="vd-budget-caption"
                                >
                                    estimated trip
                                </div>

                            </div>

                        </div>


                        <div
                            className="vd-budget-list"
                        >

                            {budgetItems.map(
                                (item, index) => {

                                    const percentage =
                                        getPercentage(
                                            item.value
                                        );

                                    return (

                                        <div
                                            className="vd-budget-row"
                                            key={index}
                                        >

                                            <div
                                                className="vd-budget-icon"
                                            >
                                                {item.icon}
                                            </div>


                                            <div>

                                                <div
                                                    className="vd-budget-name"
                                                >

                                                    {item.title}

                                                    <span
                                                        style={{
                                                            color:
                                                                '#64748b',
                                                            marginLeft:
                                                                '6px',
                                                            fontSize:
                                                                '0.72rem'
                                                        }}
                                                    >
                                                        {percentage}%
                                                    </span>

                                                </div>


                                                <div
                                                    className="vd-budget-bar"
                                                >

                                                    <div
                                                        className="vd-budget-fill"
                                                        style={{
                                                            width:
                                                                `${percentage}%`
                                                        }}
                                                    />

                                                </div>

                                            </div>


                                            <div
                                                className="vd-budget-amount"
                                            >
                                                {formatINR(
                                                    item.value
                                                )}
                                            </div>

                                        </div>

                                    );
                                }
                            )}

                        </div>

                    </div>


                    {currencyCode !== 'INR' && (

                        <div
                            style={{
                                marginTop: '25px',
                                padding: '14px 17px',
                                borderRadius: '15px',
                                background:
                                    'linear-gradient(135deg, rgba(52,211,153,0.09), rgba(34,211,238,0.05))',
                                border:
                                    '1px solid rgba(52,211,153,0.16)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '15px',
                                flexWrap: 'wrap'
                            }}
                        >

                            <span
                                style={{
                                    color:
                                        'var(--vd-muted)',
                                    fontSize:
                                        '0.8rem'
                                }}
                            >
                                Approximate local value
                            </span>


                            <strong
                                style={{
                                    color:
                                        '#10b981',
                                    fontSize:
                                        '0.95rem'
                                }}
                            >
                                {formatLocalCurrency(
                                    convertToLocal(total)
                                )}
                            </strong>

                        </div>

                    )}

                </div>

            </section>


            {/* ==================================================
                ITINERARY
            ================================================== */}

            <section
                className="vd-section"
            >

                <div
                    className="vd-section-header"
                >

                    <div>

                        <h2
                            className="vd-section-title"
                        >
                            Your Journey
                        </h2>

                        <p
                            className="vd-section-description"
                        >
                            Nearby places are grouped
                            together first, with the
                            journey gradually expanding
                            outward.
                        </p>

                    </div>


                    <div
                        className="vd-pill"
                    >

                        <Route size={14} />

                        {itineraryDays.length}
                        {' '}
                        stops

                    </div>

                </div>


                <div
                    className="vd-timeline"
                >

                    {itineraryDays.map(
                        (day, index) => {

                            const activities =
                                Array.isArray(
                                    day?.activities
                                )
                                    ? day.activities
                                    : [];

                            const isOpen =
                                expandedDay === index;

                            return (

                                <div
                                    className="vd-day"
                                    key={
                                        day?.day ||
                                        index
                                    }
                                >

                                    <button
                                        type="button"
                                        className="vd-day-button"
                                        onClick={() =>
                                            setExpandedDay(
                                                isOpen
                                                    ? -1
                                                    : index
                                            )
                                        }
                                    >

                                        <div
                                            className="vd-day-number"
                                        >
                                            {day?.day ||
                                                index + 1}
                                        </div>


                                        <div
                                            className="vd-day-main"
                                        >

                                            <div
                                                className="vd-day-title"
                                            >
                                                {day?.title ||
                                                    `Day ${index + 1}`}
                                            </div>


                                            <div
                                                className="vd-day-meta"
                                            >
                                                {activities.length}
                                                {' '}
                                                experiences
                                            </div>

                                        </div>


                                        {day?.dailyEstimatedCost && (

                                            <div
                                                className="vd-day-cost"
                                            >
                                                ₹
                                                {
                                                    day.dailyEstimatedCost
                                                }
                                            </div>

                                        )}


                                        <ChevronDown
                                            className={
                                                `vd-chevron ${
                                                    isOpen
                                                        ? 'open'
                                                        : ''
                                                }`
                                            }
                                            size={19}
                                        />

                                    </button>


                                    {isOpen && (

                                        <div
                                            className="vd-activities"
                                        >

                                            {activities.length > 0

                                                ? activities.map(
                                                    (
                                                        activity,
                                                        activityIndex
                                                    ) =>
                                                        renderActivity(
                                                            activity,
                                                            activityIndex
                                                        )
                                                )

                                                : (

                                                    <div
                                                        className="vd-glass"
                                                        style={{
                                                            padding:
                                                                '18px',
                                                            color:
                                                                'var(--vd-muted)',
                                                            fontSize:
                                                                '0.85rem'
                                                        }}
                                                    >
                                                        No activities
                                                        were returned
                                                        for this day.
                                                    </div>

                                                )}

                                        </div>

                                    )}

                                </div>

                            );

                        }
                    )}

                </div>

            </section>


            {/* ==================================================
                PLACES
            ================================================== */}

            {landmarks.length > 0 && (

                <section
                    className="vd-section"
                >

                    <div
                        className="vd-section-header"
                    >

                        <div>

                            <h2
                                className="vd-section-title"
                            >
                                Places Worth Exploring
                            </h2>

                            <p
                                className="vd-section-description"
                            >
                                Real locations retrieved
                                for {destination}.
                            </p>

                        </div>


                        <div
                            className="vd-pill"
                        >

                            <MapPin
                                size={14}
                            />

                            Verified locations

                        </div>

                    </div>


                    <div
                        className="vd-places-grid"
                    >

                        {landmarks
                            .slice(0, 15)
                            .map(
                                (place, index) => (

                                    <div
                                        className="vd-glass vd-place"
                                        key={
                                            `${place?.name || 'place'}-${index}`
                                        }
                                    >

                                        <div
                                            className="vd-place-index"
                                        >
                                            {String(
                                                index + 1
                                            ).padStart(2, '0')}
                                        </div>


                                        <div
                                            className="vd-place-name"
                                        >

                                            <MapPin
                                                size={15}
                                                color="#a78bfa"
                                            />

                                            {place?.name ||
                                                'Interesting place'}

                                        </div>


                                        {place?.type && (

                                            <div
                                                className="vd-place-type"
                                            >
                                                {place.type}
                                            </div>

                                        )}

                                    </div>

                                )
                            )}

                    </div>

                </section>

            )}


            {/* ==================================================
                SMART TRAVEL NOTES — ALWAYS SIX
            ================================================== */}

            <section
                className="vd-section"
            >

                <div
                    className="vd-section-header"
                >

                    <div>

                        <h2
                            className="vd-section-title"
                        >
                            Smart Travel Notes
                        </h2>

                        <p
                            className="vd-section-description"
                        >
                            Useful things to keep in mind
                            during your journey.
                        </p>

                    </div>


                    <Lightbulb
                        size={22}
                        color="#fbbf24"
                    />

                </div>


                <div
                    className="vd-tips"
                >

                    {tips.map(
                        (tip, index) => (

                            <div
                                className="vd-glass vd-tip"
                                key={index}
                            >

                                <div
                                    className="vd-tip-number"
                                >
                                    {String(
                                        index + 1
                                    ).padStart(2, '0')}
                                </div>


                                <p
                                    className="vd-tip-text"
                                >
                                    {tip}
                                </p>

                            </div>

                        )
                    )}

                </div>

            </section>


            {/* ==================================================
                FOOTER
            ================================================== */}

            <div
                className="vd-footer"
            >

                <div
                    className="vd-footer-icon"
                >

                    <Sparkles
                        size={22}
                    />

                </div>


                <h3
                    className="vd-footer-title"
                >
                    Your journey is ready.
                </h3>


                <p
                    className="vd-footer-text"
                >
                    Built from real locations,
                    smart geographic grouping
                    and AI-assisted planning.
                </p>

            </div>

        </div>
    );
};


export default Dashboard;