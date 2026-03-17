import React, { useMemo } from 'react';
import { 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Utensils, 
  Home, 
  Car, 
  Camera, 
  Landmark, 
  Compass, 
  Sparkles,
  Info,
  Clock,
  Wallet,
  Activity,
  CheckCircle2,
  ChevronRight,
  Navigation,
  User
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const Itinerary = ({ itinerary, dailyBudget, totalBudget, currencySymbol, destination, country }) => {
  if (!itinerary || !itinerary.length) return null;

  const COST_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];
  
  // Calculate financials based on itinerary data
  const { totalSpent, balance } = useMemo(() => {
    const spent = itinerary.reduce((acc, day) => {
      const dayTotal = (day.costs?.food || 0) + 
                       (day.costs?.stay || 0) + 
                       (day.costs?.transport || 0) + 
                       (day.costs?.activities || 0);
      return acc + dayTotal;
    }, 0);
    return {
      totalSpent: Math.round(spent),
      balance: Math.round((totalBudget || 0) - spent)
    };
  }, [itinerary, totalBudget]);

  const firstLandmark = useMemo(() => {
    for (const day of itinerary) {
      if (day.activities && day.activities.length > 0) {
        const stayRegex = /hotel|stay|resort|lodge|villas|check-in|inn|palace|grand|palace hotel/i;
        const landmarkAct = day.activities.find(act => 
          (act.text.includes(': Visit ') || act.text.includes('landmark')) && 
          !stayRegex.test(act.text.toLowerCase())
        );
        if (landmarkAct) {
          const part = landmarkAct.text.includes(': Visit ') ? landmarkAct.text.split(': Visit ')[1] : landmarkAct.text;
          return part.trim();
        }
      }
    }
    return null;
  }, [itinerary]);

  const getActivityIcon = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('museum') || lower.includes('gallery') || lower.includes('art')) return <Landmark size={18} />;
    if (lower.includes('camera') || lower.includes('view') || lower.includes('photo')) return <Camera size={18} />;
    if (lower.includes('park') || lower.includes('nature') || lower.includes('garden') || lower.includes('beach')) return <Compass size={18} />;
    if (lower.includes('temple') || lower.includes('church') || lower.includes('shrine') || lower.includes('mosque')) return <Sparkles size={18} />;
    if (lower.includes('eat') || lower.includes('food') || lower.includes('dinner') || lower.includes('lunch')) return <Utensils size={18} />;
    return <Activity size={18} />;
  };

  return (
    <div className="itinerary-root fade-in" style={{ marginTop: '2rem' }}>
      <style>{`
        .itinerary-root {
          display: grid;
          gap: 2rem;
          width: 100%;
          color: white;
        }
        .animated-hero {
          position: relative;
          height: 400px;
          width: 100%;
          border-radius: 28px;
          overflow: hidden;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        /* City Skyline / Scenery Placeholder */
        .scenery {
          position: absolute;
          bottom: 120px;
          left: 0;
          width: 200%;
          height: 150px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 100' preserveAspectRatio='none'%3E%3Cpath d='M0,100 L0,80 Q50,70 100,85 T200,80 T300,90 T400,75 T500,85 T600,70 T700,90 T800,80 T900,85 T1000,75 L1000,100 Z' fill='rgba(255,255,255,0.03)'/%3E%3C/svg%3E");
          background-repeat: repeat-x;
          animation: slide 60s linear infinite;
        }

        /* Walking Animation */
        .walker {
          position: absolute;
          bottom: 100px;
          width: 40px;
          height: 40px;
          animation: walk-across 15s linear infinite;
          opacity: 0.6;
        }
        .walker-2 { animation-delay: -5s; animation-duration: 18s; }
        .walker-3 { animation-delay: -10s; animation-duration: 22s; }

        @keyframes walk-across {
          0% { left: -50px; }
          100% { left: 100%; }
        }

        @keyframes slide {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .walker-body {
          animation: bob 0.6s ease-in-out infinite;
        }

        .main-content-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 2.5rem;
          align-items: start;
        }
        .day-itinerary-card {
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 2.5rem;
          margin-bottom: 2rem;
          position: relative;
        }
        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }
        .activity-item:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(5px);
        }
        .cost-strip {
           display: grid;
           grid-template-columns: repeat(4, 1fr);
           gap: 1rem;
           margin-top: 2rem;
           padding-top: 2rem;
           border-top: 1px solid rgba(255,255,255,0.06);
        }
        @media (max-width: 1150px) {
          .main-content-layout {
            grid-template-columns: 1fr;
          }
          .side-sticky-bar {
            position: relative !important;
            top: 0 !important;
          }
        }
        @media (max-width: 768px) {
          .animated-hero { height: 320px; }
          .hero-footer-content { 
            flex-direction: column; 
            align-items: flex-start !important; 
            gap: 2rem; 
            padding: 2rem !important;
          }
          .hero-title-text { font-size: 2.25rem !important; }
          .cost-strip { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Animated Hero Section */}
      <div className="animated-hero">
        <div className="scenery"></div>
        
        {/* Walking People Animation */}
        <div className="walker walker-1">
          <div className="walker-body" style={{ color: 'var(--primary)' }}><User size={32} /></div>
        </div>
        <div className="walker walker-2">
          <div className="walker-body" style={{ color: '#10b981' }}><User size={28} /></div>
        </div>
        <div className="walker walker-3">
          <div className="walker-body" style={{ color: '#f59e0b' }}><User size={30} /></div>
        </div>

        <div className="hero-footer-content" style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '3rem', 
          background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.98))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          zIndex: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'var(--primary)', padding: '4px 14px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '800', color: 'white', letterSpacing: '1px' }}>EXPLORER MODE</div>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', fontWeight: '500' }}>{destination}{country ? `, ${country}` : ''}</span>
            </div>
            <h2 className="hero-title-text" style={{ margin: 0, fontSize: '3.75rem', fontWeight: '900', color: 'white', textShadow: '0 4px 12px rgba(0,0,0,0.4)', lineHeight: 1.1 }}>
              {destination}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', color: 'rgba(255,255,255,0.9)', marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Calendar size={22} className="text-secondary" />
                <span style={{ fontWeight: '500' }}>{itinerary.length} Day Trip</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Navigation size={22} className="text-secondary" />
                <span style={{ fontWeight: '500' }}>{firstLandmark || 'Iconic Sightseeing'}</span>
              </div>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem 2.5rem', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.25rem' }}>Avg Daily Budget</span>
            <span style={{ fontSize: '2.25rem', fontWeight: '900', color: 'white' }}>{currencySymbol}{Math.round(dailyBudget).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="main-content-layout">
        
        {/* Itinerary Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem', padding: '0 0.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass className="text-primary" size={28} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.75rem', color: 'white', fontWeight: '800' }}>Your Itinerary</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Day-by-day sightseeing and cost guide</p>
            </div>
          </div>

          {itinerary.map((day) => (
            <div key={day.day} className="day-itinerary-card">
              <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', fontSize: '7rem', fontWeight: '900', color: 'rgba(255,255,255,0.02)', pointerEvents: 'none', lineHeight: 1 }}>
                {day.day < 10 ? `0${day.day}` : day.day}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                  <h4 style={{ margin: 0, fontSize: '1.6rem', color: 'white', fontWeight: '700' }}>{day.title}</h4>
                </div>
                {day.costs && (
                  <div style={{ padding: '8px 20px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '30px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.95rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Total Spend:</span> <span style={{ color: 'white', fontWeight: '800' }}>{currencySymbol}{(day.costs.food + day.costs.stay + day.costs.transport + (day.costs.activities || 0)).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                {day.activities.map((activity, idx) => (
                  <div key={idx} className="activity-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '14px', 
                        background: 'rgba(99, 102, 241, 0.15)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        flexShrink: 0,
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                      }}>
                        {getActivityIcon(activity.text)}
                      </div>
                      <span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.95)', fontWeight: '500' }}>{activity.text}</span>
                    </div>
                    {day.costs && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white' }}>
                          {currencySymbol}{activity.cost.toLocaleString()}
                        </span>
                        <ChevronRight size={18} className="text-muted" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {day.costs && (
                <div className="cost-strip">
                  {[
                    { icon: Utensils, label: 'Food', value: day.costs.food, color: COST_COLORS[0], bg: 'rgba(99, 102, 241, 0.1)' },
                    { icon: Home, label: 'Stay', value: day.costs.stay, color: COST_COLORS[1], bg: 'rgba(16, 185, 129, 0.1)' },
                    { icon: Car, label: 'Transport', value: day.costs.transport, color: COST_COLORS[2], bg: 'rgba(245, 158, 11, 0.1)' },
                    { icon: Activity, label: 'Leisure', value: day.costs.activities, color: COST_COLORS[3], bg: 'rgba(236, 72, 153, 0.1)' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                        <item.icon size={14} style={{ color: item.color }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>{item.label}</div>
                      <div style={{ fontWeight: '900', color: 'white', fontSize: '1.2rem', marginTop: '0.25rem' }}>{currencySymbol}{item.value.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Analytics & Summary */}
        <div className="side-sticky-bar" style={{ position: 'sticky', top: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="day-itinerary-card" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
              <TrendingUp size={28} className="text-secondary" />
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'white', fontWeight: '800' }}>Cost Analytics</h3>
            </div>
            
            <div style={{ height: '340px', width: '100%', marginBottom: '2rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={itinerary} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" hide />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{ 
                      background: '#0f172a', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      borderRadius: '20px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                      padding: '1.25rem',
                      backdropFilter: 'blur(16px)'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="top" height={45} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '20px', opacity: 0.8 }} />
                  <Bar name="Food" dataKey="costs.food" stackId="a" fill={COST_COLORS[0]} />
                  <Bar name="Stay" dataKey="costs.stay" stackId="a" fill={COST_COLORS[1]} />
                  <Bar name="Transport" dataKey="costs.transport" stackId="a" fill={COST_COLORS[2]} />
                  <Bar name="Activity" dataKey="costs.activities" stackId="a" fill={COST_COLORS[3]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ borderTop: '2px solid rgba(255,255,255,0.06)', paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ 
                padding: '2.25rem', 
                background: balance >= 0 ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)', 
                borderRadius: '28px', 
                border: `1px solid ${balance >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                boxShadow: balance >= 0 ? '0 10px 30px -10px rgba(16, 185, 129, 0.2)' : '0 10px 30px -10px rgba(239, 68, 68, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: balance >= 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '5px solid rgba(255,255,255,0.1)' }}>
                    <CheckCircle2 size={26} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: '800' }}>Balance Statement</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Trip Financial Summary</p>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
                    <span>Total Estimated Spend</span>
                    <span style={{ color: 'white', fontWeight: '900' }}>{currencySymbol}{totalSpent.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
                    <span>Remaining Wallet</span>
                    <span style={{ color: balance >= 0 ? '#10b981' : '#ef4444', fontWeight: '900', fontSize: '1.1rem' }}>
                      {balance < 0 ? '-' : ''}{currencySymbol}{Math.abs(balance).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.5rem', height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden', padding: '2px' }}>
                    <div style={{ 
                      width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%`, 
                      height: '100%', 
                      background: totalSpent > totalBudget ? '#ef4444' : '#10b981',
                      borderRadius: '4px',
                      transition: 'width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}></div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '1.75rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '24px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                  <Sparkles size={22} />
                  <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>Smart Advice</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.7', color: 'rgba(255,255,255,0.75)' }}>
                  {balance >= 0 
                    ? `Great job! Your plan is well-optimized. You have a surplus of ${currencySymbol}${balance.toLocaleString()} for leisure.`
                    : `Your plan is ${currencySymbol}${Math.abs(balance).toLocaleString()} over budget. Consider adjustments for Day ${itinerary.length}.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Itinerary;
