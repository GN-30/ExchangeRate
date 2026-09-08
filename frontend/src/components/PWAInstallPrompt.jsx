import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Wifi, Zap } from 'lucide-react';

/**
 * PWAInstallPrompt
 * ─────────────────────────────────────────────────────────────
 * Shows a beautiful, premium install popup when:
 *   1. The browser fires the `beforeinstallprompt` event (Chrome/Edge/Android)
 *   2. The user is on iOS Safari (manual install instructions shown instead)
 *   3. The app is NOT already installed (standalone mode)
 *
 * Dismissed state is persisted in localStorage so it does not
 * re-appear within 7 days of dismissal.
 */

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // Don't show if dismissed within the last 7 days
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    // iOS detection
    const iosDetected =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !window.MSStream;
    setIsIOS(iosDetected);

    if (iosDetected) {
      // Show after a short delay on iOS too
      const t = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(t);
    }

    // Chrome/Edge/Android: capture the beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const t = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(t);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Track when the app gets installed
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setIsInstalling(false);
    if (outcome === 'accepted') {
      setInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 99998,
          animation: 'pwaFadeIn 0.3s ease'
        }}
      />

      {/* Install Card */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          padding: '0 1rem 1.5rem',
          animation: 'pwaSlideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            background: 'linear-gradient(145deg, rgba(10,10,25,0.97) 0%, rgba(20,10,40,0.97) 100%)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            borderRadius: '1.75rem',
            padding: '2rem',
            boxShadow: `
              0 -4px 6px rgba(0,0,0,0.1),
              0 25px 50px rgba(0,0,0,0.6),
              0 0 40px rgba(0,229,255,0.12),
              inset 0 1px 0 rgba(255,255,255,0.08)
            `,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Ambient glow blobs */}
          <div style={{
            position: 'absolute', top: '-30px', right: '-30px',
            width: '120px', height: '120px',
            background: 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', bottom: '-20px', left: '-20px',
            width: '100px', height: '100px',
            background: 'radial-gradient(circle, rgba(176,38,255,0.12) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none'
          }} />

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              color: 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            <X size={16} />
          </button>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* App Icon */}
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #00E5FF 0%, #B026FF 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 6px 20px rgba(0,229,255,0.35)'
            }}>
              <span style={{ fontSize: '1.6rem' }}>✈️</span>
            </div>

            <div>
              <h3 style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: '800',
                color: '#ffffff',
                letterSpacing: '-0.02em'
              }}>
                Install VoyageAI
              </h3>
              <p style={{
                margin: '0.2rem 0 0',
                fontSize: '0.82rem',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: '500'
              }}>
                Add to your home screen for the best experience
              </p>
            </div>
          </div>

          {/* Feature pills */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {[
              { icon: <Wifi size={12} />, label: 'Works Offline' },
              { icon: <Zap size={12} />, label: 'Instant Load' },
              { icon: <Smartphone size={12} />, label: 'Native Feel' }
            ].map(f => (
              <span
                key={f.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.3rem 0.75rem',
                  background: 'rgba(0,229,255,0.08)',
                  border: '1px solid rgba(0,229,255,0.2)',
                  borderRadius: '2rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#00E5FF',
                  letterSpacing: '0.02em'
                }}
              >
                {f.icon}{f.label}
              </span>
            ))}
          </div>

          {/* iOS Instructions */}
          {isIOS ? (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '1rem',
              padding: '1rem 1.25rem',
              marginBottom: '1rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                Tap the <strong style={{ color: '#00E5FF' }}>Share</strong> button{' '}
                <span style={{ fontSize: '1rem' }}>⬆️</span> in Safari, then select{' '}
                <strong style={{ color: '#00E5FF' }}>"Add to Home Screen"</strong>{' '}
                <span style={{ fontSize: '1rem' }}>➕</span>
              </p>
            </div>
          ) : (
            /* Install button */
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              style={{
                width: '100%',
                padding: '0.9rem 1.5rem',
                background: isInstalling
                  ? 'rgba(0,229,255,0.2)'
                  : 'linear-gradient(135deg, #00E5FF 0%, #B026FF 100%)',
                border: 'none',
                borderRadius: '1rem',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: isInstalling ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                letterSpacing: '0.02em',
                boxShadow: isInstalling
                  ? 'none'
                  : '0 8px 24px rgba(0,229,255,0.3)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                if (!isInstalling) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isInstalling ? (
                <>
                  <span style={{
                    width: '18px', height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'pwaSpin 0.7s linear infinite',
                    display: 'inline-block'
                  }} />
                  Installing…
                </>
              ) : (
                <>
                  <Download size={18} />
                  Install App — It's Free
                </>
              )}
            </button>
          )}

          {/* "Maybe later" link */}
          {!isIOS && (
            <button
              onClick={handleDismiss}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.35)',
                fontSize: '0.82rem',
                fontWeight: '500',
                cursor: 'pointer',
                letterSpacing: '0.01em',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              Maybe later
            </button>
          )}
        </div>
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes pwaFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pwaSlideUp {
          from { opacity: 0; transform: translateY(60px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pwaSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default PWAInstallPrompt;
