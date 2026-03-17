import React from 'react';
import { MapPin, Clock, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Itinerary = ({ itinerary, currencySymbol }) => {
  if (!itinerary || itinerary.length === 0) return null;

  const COST_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="glass-card fade-in" style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MapPin size={24} color="var(--primary)" /> Smart Travel Itinerary & Daily Expense Plan
      </h3>
      
      <div style={{ display: 'grid', gap: '3rem', position: 'relative' }}>
        {/* Timeline Line */}
        <div style={{ 
          position: 'absolute', 
          left: '11px', 
          top: '20px', 
          bottom: '20px', 
          width: '2px', 
          background: 'linear-gradient(to bottom, var(--primary), transparent)',
          opacity: 0.3
        }}></div>

        {itinerary.map((day, idx) => {
          const dailyChartData = day.costs ? [
            { name: 'Food', value: day.costs.food },
            { name: 'Stay', value: day.costs.stay },
            { name: 'Transport', value: day.costs.transport },
            { name: 'Activities', value: day.costs.activities || 0 }
          ] : [];

          return (
            <div key={idx} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
              {/* Timeline Dot */}
              <div style={{ 
                width: '24px', 
                height: '24px', 
                background: 'var(--bg-dark)', 
                border: '2px solid var(--primary)', 
                borderRadius: '50%', 
                zIndex: 2, 
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                color: 'var(--primary)'
              }}>
                {day.day}
              </div>

              <div style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem' }}>
                {/* Activities Column */}
                <div>
                  <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.2rem' }}>{day.title}</h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {day.activities.map((activity, aIdx) => (
                      <div key={aIdx} style={{ 
                        background: 'rgba(255,255,255,0.03)', 
                        padding: '1rem', 
                        borderRadius: '0.75rem',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                          <Clock size={16} style={{ marginTop: '0.2rem', color: 'var(--text-muted)' }} />
                          <span style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>{activity.text}</span>
                        </div>
                        {activity.cost > 0 && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginLeft: '2.5rem' }}>
                            Cost: {currencySymbol}{activity.cost}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Cost Chart Column */}
                <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', alignSelf: 'start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    <Wallet size={16} color="var(--primary)" /> Daily Split ({currencySymbol})
                  </div>
                  <div style={{ height: '140px', marginBottom: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyChartData}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {dailyChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COST_COLORS[index % COST_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '4px' }}>
                      <span style={{ color: COST_COLORS[0] }}>Food:</span> <span style={{ fontWeight: 'bold' }}>{currencySymbol}{day.costs.food}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '4px' }}>
                      <span style={{ color: COST_COLORS[1] }}>Stay:</span> <span style={{ fontWeight: 'bold' }}>{currencySymbol}{day.costs.stay}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '4px' }}>
                      <span style={{ color: COST_COLORS[2] }}>Transport:</span> <span style={{ fontWeight: 'bold' }}>{currencySymbol}{day.costs.transport}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem', background: 'rgba(236, 72, 153, 0.05)', borderRadius: '4px' }}>
                      <span style={{ color: COST_COLORS[3] }}>Activities:</span> <span style={{ fontWeight: 'bold' }}>{currencySymbol}{day.costs.activities || 0}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                    Total Day ${day.day}: {currencySymbol}{day.costs.food + day.costs.stay + day.costs.transport + (day.costs.activities || 0)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Itinerary;
