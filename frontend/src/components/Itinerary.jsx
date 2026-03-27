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
        <div className="scenery" />
        
        {/* Walking travelers */}
        <div className="walker walker-1">
          <div className="walker-body" style={{ color: 'var(--primary)' }}><User size={32} /></div>
        </div>
        <div className="walker walker-2">
          <div className="walker-body" style={{ color: 'var(--accent)' }}><User size={28} /></div>
        </div>
        <div className="walker walker-3">
          <div className="walker-body" style={{ color: '#ec4899' }}><User size={30} /></div>
        </div>

        {/* Hero Overlay Info */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.8))',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '3rem'
        }}>
           <div className="hero-footer-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem' }}>
                    <MapPin size={20} /> {destination}, {country}
                 </div>
                 <h2 className="hero-title-text" style={{ fontSize: '3.5rem', margin: 0 }}>Discovering {destination}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Trip Budget Balance</p>
                 <div style={{ fontSize: '1.5rem', fontWeight: '800', color: balance >= 0 ? 'var(--accent)' : '#ef4444' }}>
                    {currencySymbol}{balance.toLocaleString()} {balance < 0 ? '(Over Budget)' : 'Remaining'}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="main-content-layout">
        {/* Main List of Days */}
        <div className="days-list">
          {itinerary.map((day) => (
            <div key={day.day} className="day-itinerary-card fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    fontSize: '0.8rem', 
                    fontWeight: '800', 
                    color: 'var(--primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    marginBottom: '0.5rem'
                  }}>
                    <Calendar size={14} /> DAY {day.day}
                  </div>
                  <h3 style={{ fontSize: '1.75rem', margin: 0 }}>{day.title}</h3>
                </div>
                {day.costs && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Total Spend:</span> <span style={{ color: 'white', fontWeight: '800' }}>{currencySymbol}{(day.costs.food + day.costs.stay + day.costs.transport + (day.costs.activities || 0)).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {day.activities.map((activity, idx) => (
                  <div key={idx} className="activity-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: 'rgba(255,255,255,0.05)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--primary)'
                      }}>
                        {getActivityIcon(activity.text)}
                      </div>
                      <span style={{ fontWeight: '500' }}>{activity.text}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                      {currencySymbol}{activity.cost.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {day.costs && (
                <div className="cost-strip">
                    {[
                      { icon: Utensils, label: 'Food', value: day.costs.food, color: COST_COLORS[0], bg: 'rgba(99, 102, 241, 0.1)' },
                      { icon: Home, label: 'Stay', value: day.costs.stay, color: COST_COLORS[1], bg: 'rgba(16, 185, 129, 0.1)' },
                      { icon: Car, label: 'Transport', value: day.costs.transport, color: COST_COLORS[2], bg: 'rgba(245, 158, 11, 0.1)' },
                      { icon: Activity, label: 'Activities', value: day.costs.activities, color: COST_COLORS[3], bg: 'rgba(236, 72, 153, 0.1)' }
                    ].map((item, i) => (
                      <div key={i} style={{ 
                        padding: '1rem', 
                        background: item.bg, 
                        borderRadius: '16px', 
                        border: `1px solid ${item.color}22`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: item.color, fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                            <item.icon size={12} /> {item.label}
                         </div>
                         <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{currencySymbol}{item.value.toLocaleString()}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sticky Sidebar Info */}
        <div className="side-sticky-bar" style={{ position: 'sticky', top: '2rem' }}>
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
             <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <TrendingUp color="var(--primary)" /> Spend Analysis
             </h3>
             <div style={{ height: '300px', margin: '0 -1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={itinerary}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar name="Food" dataKey="costs.food" stackId="a" fill={COST_COLORS[0]} />
                    <Bar name="Stay" dataKey="costs.stay" stackId="a" fill={COST_COLORS[1]} />
                    <Bar name="Transport" dataKey="costs.transport" stackId="a" fill={COST_COLORS[2]} />
                    <Bar name="Activities" dataKey="costs.activities" stackId="a" fill={COST_COLORS[3]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
             <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                   <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Spent</div>
                   <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{currencySymbol}{totalSpent.toLocaleString()}</div>
                </div>
                <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                   <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Daily Avg</div>
                   <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{currencySymbol}{Math.round(totalSpent / itinerary.length).toLocaleString()}</div>
                </div>
             </div>
          </div>

          <div className="glass-card" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)' }}>
             <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '16px', 
                  background: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0
                }}>
                   <Sparkles size={24} />
                </div>
                <div>
                   <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Traveling to {firstLandmark || destination}?</h4>
                   <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4', margin: 0 }}>
                      We've calculated the best routes and local spots based on your {dailyBudget > 5000 ? 'Luxury' : 'Budget'} preferences.
                   </p>
                </div>
             </div>
             <button style={{ 
               width: '100%', 
               marginTop: '1.5rem', 
               background: 'rgba(255,255,255,0.1)', 
               backdropFilter: 'blur(10px)',
               border: '1px solid rgba(255,255,255,0.2)',
               padding: '1rem',
               borderRadius: '16px',
               fontWeight: '700'
             }}>
               <Navigation size={18} /> Open in Maps
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Itinerary;
