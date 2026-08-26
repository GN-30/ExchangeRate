import React, {
    useEffect,
    useState,
    useRef,
    useCallback
} from 'react';

import { Plane, Sun, Moon } from 'lucide-react';

import './ThemeFlightToggle.css';


/* ============================================================
   THEME FLIGHT TOGGLE
   — Plane sits on left edge with a speech-bubble notice.
   — Click → plane flies L→R → light theme activates at
     the moment it crosses screen centre.
   — In light mode the plane rests on the RIGHT with a
     "back to dark" notice; clicking flies it R→L.
   ============================================================ */

const ThemeFlightToggle = () => {

    /* ── theme state ── */

    const [isLight, setIsLight] = useState(() => {
        const saved = localStorage.getItem('voyage-theme');
        return saved === 'light';
    });

    /* ── animation phases ── */

    const [phase, setPhase] = useState('idle');
    // 'idle' | 'flying-to-light' | 'flying-to-dark'

    /* ── notice visibility ── */

    const [noticeVisible, setNoticeVisible] = useState(true);

    const timerRef = useRef([]);

    const clearTimers = () => {
        timerRef.current.forEach(clearTimeout);
        timerRef.current = [];
    };

    const addTimer = (fn, ms) => {
        const id = setTimeout(fn, ms);
        timerRef.current.push(id);
        return id;
    };

    /* ── cleanup on unmount ── */

    useEffect(() => {
        return () => clearTimers();
    }, []);


    /* ── helper: apply theme directly to DOM — no CSS cascade dependency ── */

    const applyTheme = useCallback((light) => {

        const html = document.documentElement;
        const body = document.body;

        /* 1. data-theme attribute (for component-level CSS selectors) */
        html.setAttribute('data-theme', light ? 'light' : 'dark');

        /* 2. color-scheme (browser chrome) */
        html.style.colorScheme = light ? 'light' : 'dark';

        /* 3. Toggle class on body — used by CSS */
        body.classList.toggle('light-mode', light);
        body.classList.toggle('dark-mode', !light);

        /* 4. Directly override background & colour on html + body
              so NO stylesheet can override us */
        if (light) {
            html.style.backgroundColor = '#f0f4ff';
            body.style.background =
                /* top-left — indigo aurora */
                'radial-gradient(ellipse at 0% 0%,   rgba(99,102,241,0.22) 0%, transparent 45%),' +
                /* top-right — violet bloom */
                'radial-gradient(ellipse at 100% 0%, rgba(139,92,246,0.18) 0%, transparent 40%),' +
                /* bottom-left — rose glow */
                'radial-gradient(ellipse at 0% 100%, rgba(236,72,153,0.14) 0%, transparent 40%),' +
                /* bottom-right — sky blue */
                'radial-gradient(ellipse at 100% 100%, rgba(14,165,233,0.12) 0%, transparent 40%),' +
                /* centre — soft white core */
                'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.60) 0%, transparent 70%),' +
                /* base */
                'linear-gradient(160deg, #f0f4ff 0%, #e8eeff 50%, #f5f0ff 100%)';
            body.style.color = '#0d1224';
        } else {
            html.style.backgroundColor = '#070b18';
            body.style.background =
                'radial-gradient(ellipse at 0% 0%,   rgba(99,102,241,0.15) 0%, transparent 50%),' +
                'radial-gradient(ellipse at 100% 100%, rgba(16,185,129,0.10) 0%, transparent 50%),' +
                '#020617';
            body.style.color = '#f8fafc';
        }

        /* 5. Persist */
        localStorage.setItem('voyage-theme', light ? 'light' : 'dark');

        /* 6. Update React state */
        setIsLight(light);

    }, []);


    /* ── sync on first mount ── */

    useEffect(() => {
        applyTheme(isLight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    /* ============================================================
       DARK → LIGHT  (plane flies left → right)
       ============================================================ */

    const flyToLight = () => {

        if (phase !== 'idle') return;

        clearTimers();
        setNoticeVisible(false);
        setPhase('flying-to-light');

        /*
         * Theme switches just as the plane passes screen centre
         * (~55% of the 2.6s animation ≈ 1 430 ms).
         */

        addTimer(() => applyTheme(true), 1430);

        /* Animation ends at 2.6s; add tiny buffer. */

        addTimer(() => {
            setPhase('idle');
            setNoticeVisible(true);
        }, 2750);

    };


    /* ============================================================
       LIGHT → DARK  (plane flies right → left)
       ============================================================ */

    const flyToDark = () => {

        if (phase !== 'idle') return;

        clearTimers();
        setNoticeVisible(false);
        setPhase('flying-to-dark');

        addTimer(() => applyTheme(false), 1430);

        addTimer(() => {
            setPhase('idle');
            setNoticeVisible(true);
        }, 2750);

    };


    const isFlying = phase !== 'idle';


    /* ============================================================
       RENDER
       ============================================================ */

    return (

        <div
            className={[
                'tft-root',
                isLight ? 'tft-light' : '',
                isFlying ? 'tft-flying' : '',
                phase === 'flying-to-dark' ? 'tft-reverse' : ''
            ]
                .filter(Boolean)
                .join(' ')}
        >

            {/* ================================================
                STATIC PLANE BUTTON + SPEECH BUBBLE
                — shown when NOT flying
               ================================================ */}

            {!isFlying && (

                <button
                    type="button"
                    className="tft-plane-btn"
                    onClick={isLight ? flyToDark : flyToLight}
                    aria-label={
                        isLight
                            ? 'Switch to dark mode'
                            : 'Fly to light mode'
                    }
                >

                    {/* glow ring */}

                    <span className="tft-btn-glow" />

                    {/* plane icon */}

                    <Plane
                        className="tft-btn-plane-icon"
                        size={38}
                        strokeWidth={2.5}
                        color="#ffffff"
                        style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.5))' }}
                    />

                    {/* flag waving notice below the button */}

                    {noticeVisible && (

                        <span className="tft-bubble tft-flag-banner">

                            {isLight ? (

                                <>
                                    <Moon size={14} className="tft-bubble-icon" color="#ffffff" />
                                    <span className="tft-wave-text">Dark mode</span>
                                </>

                            ) : (

                                <>
                                    <Sun size={14} className="tft-bubble-icon" color="#ffffff" />
                                    <span className="tft-wave-text">Light mode</span>
                                </>

                            )}

                        </span>

                    )}

                </button>

            )}


            {/* ================================================
                FLYING PLANE (full-screen overlay)
               ================================================ */}

            {isFlying && (

                <div className="tft-flight-overlay">

                    {/* clouds */}

                    <div className="tft-cloud tft-cloud-a" />
                    <div className="tft-cloud tft-cloud-b" />
                    <div className="tft-cloud tft-cloud-c" />

                    {/* contrails */}

                    <div className="tft-trail tft-trail-1" />
                    <div className="tft-trail tft-trail-2" />

                    {/* the plane */}

                    <Plane
                        className="tft-flying-plane"
                        size={54}
                        strokeWidth={1.6}
                    />

                </div>

            )}

        </div>

    );
};


export default ThemeFlightToggle;