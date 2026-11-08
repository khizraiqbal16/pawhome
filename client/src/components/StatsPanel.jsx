import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../api.js';

const COLORS = { available: '#0e5a4a', pending: '#ffc24b', adopted: '#9aa8a3' };

export default function StatsPanel() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/stats/overview').then((r) => setS(r.data)); }, []);

  if (!s) return <div className="page-loader">Loading stats...</div>;

  const statusData = ['available', 'pending', 'adopted']
    .map((k) => ({ name: k, value: s.listings[k] || 0 }))
    .filter((d) => d.value > 0);

  const cards = [
    { label: 'Total listings', value: s.totalListings },
    { label: 'Adopted', value: s.listings.adopted || 0 },
    { label: 'Pending requests', value: s.requests.pending || 0 },
    { label: 'Received (USD)', value: `$${s.moneyReceived}` },
  ];

  return (
    <>
      <div className="stat-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <strong>{c.value}</strong>
            <span className="muted">{c.label}</span>
          </div>
        ))}
      </div>

      {s.totalListings === 0 ? (
        <div className="empty"><p>Charts will appear once you list your first pet.</p></div>
      ) : (
        <div className="chart-grid">
          <div className="card chart-card">
            <h3>Listings by status</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} label>
                  {statusData.map((d) => <Cell key={d.name} fill={COLORS[d.name]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card chart-card">
            <h3>Listings by species</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={s.species}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0e5a4a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}
