import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Quote } from 'lucide-react';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PetImage } from '../components/PetCard.jsx';

export default function Stories() {
  const { user } = useAuth();
  const toast = useToast();
  const [stories, setStories] = useState(null);
  const [eligible, setEligible] = useState([]);
  const [form, setForm] = useState({ petId: '', title: '', text: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/stories').then((r) => setStories(r.data)), []);

  useEffect(() => {
    load();
    if (user) api.get('/stories/eligible').then((r) => setEligible(r.data)).catch(() => {});
  }, [user, load]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/stories', form);
      toast('Story shared. Thank you!');
      setForm({ petId: '', title: '', text: '' });
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Happy endings</h1>
        <p className="muted">Stories from people whose pets found a home through PawHome.</p>
      </div>

      {user && eligible.length > 0 && (
        <form className="card form story-form" onSubmit={submit}>
          <h2 className="h3">Share your story</h2>
          <label>Pet
            <select className="field" required value={form.petId} onChange={(e) => setForm({ ...form, petId: e.target.value })}>
              <option value="">Choose a pet</option>
              {eligible.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </label>
          <label>Title<input className="field" required maxLength={100} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Your story<textarea className="field" required rows={4} minLength={20} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></label>
          <button className="btn btn-primary self-start" disabled={busy}>{busy ? 'Sharing...' : 'Share story'}</button>
        </form>
      )}

      {stories === null ? (
        <div className="page-loader">Loading...</div>
      ) : stories.length === 0 ? (
        <div className="empty"><p>No stories yet. Once a pet is adopted, the owner or the new family can share one here.</p><Link to="/pets" className="btn btn-primary">Find a pet</Link></div>
      ) : (
        <div className="story-grid">
          {stories.map((s) => (
            <article key={s._id} className="story-card">
              <div className="story-photo">{s.pet && <PetImage pet={s.pet} />}</div>
              <div className="story-body">
                <Quote size={20} className="story-quote" />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <span className="muted small">{s.author?.name} · {s.pet?.name} the {s.pet?.breed?.toLowerCase()}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
