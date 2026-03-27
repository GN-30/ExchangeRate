import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Sparkles, TrendingUp, Lightbulb } from 'lucide-react';
import Itinerary from './Itinerary';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

const Dashboard = ({ data }) => {
  if (!data) return null;

  const chartData = [
    { name: `Food (${data.currencySymbol})`, value: Math.round(data.breakdown.food) },
    { name: `Stay (${data.currencySymbol})`, value: Math.round(data.breakdown.stay) },
    { name: `Transport (${data.currencySymbol})`, value: Math.round(data.breakdown.transport) },
    { name: `Activities (${data.currencySymbol})`, value: Math.round(data.breakdown.activities) },
  ];

  return (
    <div className="fade-in" style={{ display: 'grid', gap: '2rem' }}>
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Trip Budget</p>
          <h3 style={{ fontSize: '2.5rem' }}>
            {data.currencySymbol}{Math.round(data.convertedBudget).toLocaleString()}
          </h3>
          {!data.isIndia && (
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Converted from ₹{Number(data.budgetINR).toLocaleString()} INR
            </p>
          )}
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Daily Spending</p>
          <h3 style={{ fontSize: '2rem', color: 'var(--accent)' }}>
            {data.currencySymbol}{Math.round(data.dailyBudget).toLocaleString()}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Per day in {data.currencyCode}
          </p>
        </div>
        <div style={{ display: data.isIndia ? 'none' : 'block' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Rate (1 INR to {data.currencyCode})</p>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
            {data.rate.toFixed(4)} {data.currencySymbol}
          </h3>
        </div>
        {data.isIndia && (
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Trip Mode</p>
            <h3 style={{ fontSize: '1.5rem', color: '#10b981' }}>Domestic (INR)</h3>
          </div>
        )}
      </div>

      <div className="grid">
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={24} color="var(--primary)" /> Budget Breakdown
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb size={24} color="#f59e0b" /> AI Smart Suggestions
          </h3>
          <ul style={{ listStyle: 'none', display: 'grid', gap: '1rem' }}>
            {data.suggestions.map((s, i) => (
              <li key={i} style={{ 
                background: 'rgba(255,255,255,0.05)', 
                padding: '1rem', 
                borderRadius: '0.75rem',
                borderLeft: '4px solid var(--primary)',
                lineHeight: '1.5'
              }}>
                {s}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={24} color="#ec4899" /> Smart Payment Advice
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
              <strong>Cash (20%)</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Keep {data.currencySymbol}{Math.round(data.convertedBudget * 0.2)} in local currency for street vendors, tips, and small purchases.</p>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
              <strong>Forex Card (60%)</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Load {data.currencySymbol}{Math.round(data.convertedBudget * 0.6)} for core expenses like hotels and shopping to avoid high conversion fees.</p>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
              <strong>Credit Card (20%)</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Keep {data.currencySymbol}{Math.round(data.convertedBudget * 0.2)} buffer on a zero-markup credit card for emergencies or deposits.</p>
            </div>
          </div>
        </div>
      </div>

      <Itinerary 
        itinerary={data.itinerary} 
        currencySymbol={data.currencySymbol} 
        destination={data.destination}
        country={data.country}
        dailyBudget={data.dailyBudget}
        totalBudget={data.convertedBudget}
      />
    </div>
  );
};

export default Dashboard;
