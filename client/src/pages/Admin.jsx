import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PetImage } from '../components/PetCard.jsx';

export default function Admin() {
  const { user } = useAuth();
  const toast = useToast();
  const [reports, setReports] = useState(null);

  const load = () => api.get('/reports').then((r) => setReports(r.data)).catch((e) => toast(errorMessage(e), 'error'));
  useEffect(() => { if (user.role === 'admin') load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (user.role !== 'admin') return <Navigate to="/" replace />;

  const resolve = async (id) => {
    await api.patch(`/reports/${id}/resolve`);
    load();
  };

  const removePet = async (report) => {
    if (!window.confirm(`Delete the listing for ${report.pet.name}?`)) return;
    try {
      await api.delete(`/pets/${report.pet._id}`);
      await api.patch(`/reports/${report._id}/resolve`);
      toast('Listing removed');
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Reported listings</h1>
        <p className="muted">Review reports and remove listings that break the rules.</p>
      </div>
      {reports === null ? (
        <div className="page-loader">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="empty"><p>No reports. Everything looks good.</p></div>
      ) : (
        <div className="list">
          {reports.map((r) => (
            <div key={r._id} className="list-row wrap">
              <div className="thumb">{r.pet && <PetImage pet={r.pet} />}</div>
              <div className="list-main">
                {r.pet ? <Link to={`/pets/${r.pet._id}`}><strong>{r.pet.name}</strong></Link> : <strong>Listing already removed</strong>}
                <p className="quote">{r.reason}</p>
                <span className="muted small">Reported by {r.reporter?.name} ({r.reporter?.email})</span>
              </div>
              <span className={`status-pill ${r.status === 'open' ? 'status-pending' : 'status-approved'}`}>{r.status}</span>
              <div className="list-actions">
                {r.status === 'open' && <button className="btn btn-ghost btn-sm" onClick={() => resolve(r._id)}>Dismiss</button>}
                {r.pet && r.status === 'open' && <button className="btn btn-primary btn-sm" onClick={() => removePet(r)}>Remove listing</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
