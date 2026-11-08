import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Trash2, Check, X, MessageCircle, Plus } from 'lucide-react';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PetImage } from '../components/PetCard.jsx';
import StatsPanel from '../components/StatsPanel.jsx';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'listings', label: 'My listings' },
  { key: 'received', label: 'Requests received' },
  { key: 'sent', label: 'Requests sent' },
  { key: 'payments', label: 'Payments' },
  { key: 'settings', label: 'Settings' },
];

export default function Dashboard() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'listings';
  const [listings, setListings] = useState([]);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || '', city: user.city || '' });

  const load = useCallback(async () => {
    try {
      const [a, b, c, d] = await Promise.all([
        api.get('/pets/mine'),
        api.get('/requests/mine', { params: { role: 'received' } }),
        api.get('/requests/mine', { params: { role: 'sent' } }),
        api.get('/payments/mine'),
      ]);
      setListings(a.data); setReceived(b.data); setSent(c.data); setPayments(d.data);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const removePet = async (pet) => {
    if (!window.confirm(`Delete the listing for ${pet.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/pets/${pet._id}`);
      toast('Listing deleted');
      load();
    } catch (err) { toast(errorMessage(err), 'error'); }
  };

  const decide = async (id, status) => {
    try {
      await api.patch(`/requests/${id}`, { status });
      toast(status === 'approved' ? 'Request approved' : status === 'rejected' ? 'Request declined' : 'Request cancelled');
      load();
    } catch (err) { toast(errorMessage(err), 'error'); }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try { await updateProfile(profile); toast('Profile saved'); } catch (err) { toast(errorMessage(err), 'error'); }
  };

  const pendingCount = received.filter((r) => r.status === 'pending').length;

  return (
    <div className="container page">
      <div className="page-head row">
        <div>
          <h1>Hi, {user.name.split(' ')[0]}</h1>
          <p className="muted">{listings.length} listing{listings.length !== 1 && 's'} · {pendingCount} pending request{pendingCount !== 1 && 's'}</p>
        </div>
        <Link to="/pets/new" className="btn btn-primary"><Plus size={16} /> List a pet</Link>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'active' : ''} onClick={() => setParams({ tab: t.key })}>
            {t.label}{t.key === 'received' && pendingCount > 0 && <span className="count">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {loading ? <div className="page-loader">Loading...</div> : (
        <>
          {tab === 'overview' && <StatsPanel />}

          {tab === 'listings' && (
            listings.length === 0 ? (
              <div className="empty"><p>You have not listed any pets yet.</p><Link to="/pets/new" className="btn btn-primary">List your first pet</Link></div>
            ) : (
              <div className="list">
                {listings.map((p) => (
                  <div key={p._id} className="list-row">
                    <Link to={`/pets/${p._id}`} className="thumb"><PetImage pet={p} /></Link>
                    <div className="list-main">
                      <Link to={`/pets/${p._id}`}><strong>{p.name}</strong></Link>
                      <span className="muted small">{p.breed} · {p.location.city}</span>
                    </div>
                    <span className={`status-pill status-${p.status}`}>{p.status}</span>
                    <div className="list-actions">
                      <Link to={`/pets/${p._id}/edit`} className="icon-btn" aria-label={`Edit ${p.name}`}><Pencil size={18} /></Link>
                      <button className="icon-btn danger" onClick={() => removePet(p)} aria-label={`Delete ${p.name}`}><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'received' && (
            received.length === 0 ? <div className="empty"><p>No adoption requests yet. They will appear here as soon as someone applies.</p></div> : (
              <div className="list">
                {received.map((r) => (
                  <div key={r._id} className="list-row wrap">
                    <Link to={`/pets/${r.pet?._id}`} className="thumb">{r.pet && <PetImage pet={r.pet} />}</Link>
                    <div className="list-main">
                      <strong>{r.requester.name} <span className="muted">wants {r.pet?.name}</span></strong>
                      {r.message && <p className="quote">{r.message}</p>}
                      <span className="muted small">{r.requester.city || 'No city'}{r.requester.phone && ` · ${r.requester.phone}`}</span>
                    </div>
                    <span className={`status-pill status-${r.status}`}>{r.status}</span>
                    <div className="list-actions">
                      <Link to={`/messages?to=${r.requester._id}&pet=${r.pet?._id}`} className="icon-btn" aria-label="Message requester"><MessageCircle size={18} /></Link>
                      {r.status === 'pending' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => decide(r._id, 'approved')}><Check size={16} /> Approve</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => decide(r._id, 'rejected')}><X size={16} /> Decline</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'sent' && (
            sent.length === 0 ? <div className="empty"><p>You have not sent any requests.</p><Link to="/pets" className="btn btn-primary">Find a pet</Link></div> : (
              <div className="list">
                {sent.map((r) => (
                  <div key={r._id} className="list-row">
                    <Link to={`/pets/${r.pet?._id}`} className="thumb">{r.pet && <PetImage pet={r.pet} />}</Link>
                    <div className="list-main">
                      <strong>{r.pet?.name}</strong>
                      <span className="muted small">Owner: {r.owner?.name} · {new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className={`status-pill status-${r.status}`}>{r.status}</span>
                    <div className="list-actions">
                      <Link to={`/messages?to=${r.owner?._id}&pet=${r.pet?._id}`} className="icon-btn" aria-label="Message owner"><MessageCircle size={18} /></Link>
                      {r.status === 'pending' && <button className="btn btn-ghost btn-sm" onClick={() => decide(r._id, 'cancelled')}>Cancel</button>}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'payments' && (
            payments.length === 0 ? <div className="empty"><p>No payments yet.</p><Link to="/donate" className="btn btn-primary">Make a donation</Link></div> : (
              <div className="list">
                {payments.map((p) => (
                  <div key={p._id} className="list-row">
                    <div className="list-main">
                      <strong>{p.type === 'donation' ? 'Donation' : 'Adoption fee'}{p.pet && ` · ${p.pet.name}`}</strong>
                      <span className="muted small">{new Date(p.createdAt).toLocaleString()}{p.mode === 'demo' && ' · demo payment'}</span>
                    </div>
                    <strong>${p.amount}</strong>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'settings' && (
            <form className="card form narrow-card" onSubmit={saveProfile}>
              <label>Name<input className="field" required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
              <label>City<input className="field" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></label>
              <label>Phone<input className="field" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
              <label className="check">
                <input type="checkbox" checked={user.notifyNewPets} onChange={(e) => updateProfile({ notifyNewPets: e.target.checked })} />
                Notify me when new pets are listed
              </label>
              <button className="btn btn-primary self-start">Save profile</button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
