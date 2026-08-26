import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

/* ============================================================
   THEME CONTEXT
   Provides isLight state + applyTheme function to all
   components so they can render theme-aware inline styles.
   ============================================================ */

export const ThemeContext = createContext({
    isLight: false,
    applyTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {

    const [isLight, setIsLight] = useState(() =>
        localStorage.getItem('voyage-theme') === 'light'
    );

    const timerRef = useRef([]);

    const applyTheme = useCallback((light) => {

        const html = document.documentElement;
        const body = document.body;

        /* 1. data-theme on <html> for CSS selectors */
        html.setAttribute('data-theme', light ? 'light' : 'dark');
        html.style.colorScheme = light ? 'light' : 'dark';

        /* 2. Class on body for CSS fallback */
        body.classList.toggle('light-mode', light);
        body.classList.toggle('dark-mode', !light);

        /* 3. Aurora background inline — overrides all CSS */
        if (light) {
            html.style.backgroundColor = '#f0f4ff';
            body.style.background =
                'radial-gradient(ellipse at 0%   0%,   rgba(99,102,241,0.22) 0%, transparent 45%),' +
                'radial-gradient(ellipse at 100% 0%,   rgba(139,92,246,0.18) 0%, transparent 40%),' +
                'radial-gradient(ellipse at 0%   100%, rgba(236,72,153,0.14) 0%, transparent 40%),' +
                'radial-gradient(ellipse at 100% 100%, rgba(14,165,233,0.12) 0%, transparent 40%),' +
                'radial-gradient(ellipse at 50%  50%,  rgba(255,255,255,0.60) 0%, transparent 70%),' +
                'linear-gradient(160deg, #f0f4ff 0%, #e8eeff 50%, #f5f0ff 100%)';
            body.style.color = '#0d1224';
        } else {
            html.style.backgroundColor = '#070b18';
            body.style.background =
                'radial-gradient(ellipse at 0%   0%,   rgba(99,102,241,0.15) 0%, transparent 50%),' +
                'radial-gradient(ellipse at 100% 100%, rgba(16,185,129,0.10) 0%, transparent 50%),' +
                '#020617';
            body.style.color = '#f8fafc';
        }

        /* 4. Persist */
        localStorage.setItem('voyage-theme', light ? 'light' : 'dark');

        /* 5. React state update — triggers re-render of subscribed components */
        setIsLight(light);

    }, []);

    /* Apply saved theme on first mount */
    useEffect(() => {
        applyTheme(isLight);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ThemeContext.Provider value={{ isLight, applyTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
