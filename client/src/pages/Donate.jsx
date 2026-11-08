import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const PRESETS = [5, 10, 25, 50];

export default function Donate() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(10);
  const [mode, setMode] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) api.get('/payments/config').then((r) => setMode(r.data.mode)).catch(() => {});
  }, [user]);

  const donate = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login', { state: { from: '/donate' } });
    setBusy(true);
    try {
      const res = await api.post('/payments/checkout', { type: 'donation', amount });
      window.location.href = res.data.url;
    } catch (err) {
      toast(errorMessage(err), 'error');
      setBusy(false);
    }
  };

  return (
    <div className="container page narrow">
      <form className="card donate" onSubmit={donate}>
        <span className="step-icon"><HeartHandshake size={24} /></span>
        <h1>Help pets get the care they need</h1>
        <p className="muted">Donations go towards food, vaccines and vet visits for pets waiting for a home.</p>
        <div className="amounts">
          {PRESETS.map((a) => (
            <button type="button" key={a} className={`pill ${amount === a ? 'active' : ''}`} onClick={() => setAmount(a)}>${a}</button>
          ))}
        </div>
        <label>Or enter an amount (USD)
          <input className="field" type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </label>
        <button className="btn btn-sun btn-block" disabled={busy || !amount || amount < 1}>{busy ? 'Redirecting...' : `Donate $${amount || 0}`}</button>
        {mode === 'demo' && <p className="notice small">Demo mode: no Stripe key is set, so no real money is charged.</p>}
        {!user && <p className="muted small center">You will be asked to log in first.</p>}
      </form>
    </div>
  );
}
