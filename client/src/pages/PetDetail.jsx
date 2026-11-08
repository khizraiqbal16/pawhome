import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapPin, Syringe, Scissors, MessageCircle, Heart, HandCoins, Pencil, Ruler, CalendarDays } from 'lucide-react';
import api, { errorMessage, imgUrl } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ShareButtons from '../components/ShareButtons.jsx';
import PetCard, { PLACEHOLDER, ageLabel } from '../components/PetCard.jsx';
import Lightbox from '../components/Lightbox.jsx';

export default function PetDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [reqStatus, setReqStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    setPet(null);
    api.get(`/pets/${id}`).then((r) => setPet(r.data)).catch((e) => setError(errorMessage(e)));
  }, [id]);

  useEffect(() => {
    api.get(`/pets/${id}/similar`).then((r) => setSimilar(r.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (user) api.get(`/requests/pet/${id}/status`).then((r) => setReqStatus(r.data.status)).catch(() => {});
  }, [id, user]);

  if (error) return <div className="container page"><div className="empty"><p>{error}</p><Link to="/pets" className="btn btn-primary">Back to pets</Link></div></div>;
  if (!pet) return <div className="page-loader">Loading...</div>;

  const isOwner = user && String(pet.owner._id) === String(user._id);
  const images = pet.images?.length ? pet.images.map(imgUrl) : [PLACEHOLDER];
  const canRequest = pet.status === 'available' && !isOwner;
  const requested = reqStatus && reqStatus !== 'cancelled';

  const needLogin = () => navigate('/login', { state: { from: `/pets/${id}` } });

  const report = async () => {
    if (!user) return needLogin();
    const reason = window.prompt('What is wrong with this listing?');
    if (!reason || reason.trim().length < 5) return;
    try {
      await api.post(`/reports/pet/${id}`, { reason });
      toast('Report sent. Thank you for helping keep PawHome safe.');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const sendRequest = async (e) => {
    e.preventDefault();
    if (!user) return needLogin();
    setBusy(true);
    try {
      await api.post(`/requests/pet/${id}`, { message });
      setReqStatus('pending');
      toast('Request sent. The owner has been notified.');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const pay = async (type, amount) => {
    if (!user) return needLogin();
    try {
      const res = await api.post('/payments/checkout', { type, amount, petId: pet._id });
      window.location.href = res.data.url;
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="container page">
      <div className="detail">
        <div className="gallery">
          <div className="gallery-main zoomable" onClick={() => setZoom(true)}>
            <img src={images[active]} alt={`${pet.name}, ${pet.breed}`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }} />
            <span className={`status status-${pet.status}`}>{pet.status}</span>
          </div>
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((src, i) => (
                <button key={i} className={i === active ? 'active' : ''} onClick={() => setActive(i)} aria-label={`Photo ${i + 1}`}><img src={src} alt="" /></button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <div className="detail-title">
            <div>
              <h1>{pet.name}</h1>
              <p className="muted">{pet.breed} · {pet.gender}</p>
            </div>
            <span className="fee fee-lg">{pet.adoptionFee > 0 ? `$${pet.adoptionFee} fee` : 'No fee'}</span>
          </div>

          <ul className="facts">
            <li><CalendarDays size={18} /> {ageLabel(pet.age)}</li>
            <li><Ruler size={18} /> {pet.size} size</li>
            <li><MapPin size={18} /> {pet.location.city}</li>
            <li><Syringe size={18} /> {pet.vaccinated ? 'Vaccinated' : 'Not vaccinated'}</li>
            <li><Scissors size={18} /> {pet.neutered ? 'Neutered / spayed' : 'Not neutered'}</li>
          </ul>

          <h2 className="h3">About {pet.name}</h2>
          <p className="story">{pet.description}</p>

          <div className="owner-card">
            <span className="avatar avatar-lg">{pet.owner.name.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{pet.owner.name}</strong>
              <p className="muted small">{pet.owner.city || pet.location.city} · on PawHome since {new Date(pet.owner.createdAt).getFullYear()}</p>
            </div>
            {!isOwner && (
              <button className="btn btn-ghost btn-sm" onClick={() => (user ? navigate(`/messages?to=${pet.owner._id}&pet=${pet._id}`) : needLogin())}>
                <MessageCircle size={16} /> Message
              </button>
            )}
          </div>

          {isOwner ? (
            <div className="panel">
              <p>This is your listing.</p>
              <Link to={`/pets/${pet._id}/edit`} className="btn btn-primary"><Pencil size={16} /> Edit listing</Link>
            </div>
          ) : canRequest ? (
            <form className="panel" onSubmit={sendRequest}>
              <h2 className="h3">Adopt {pet.name}</h2>
              {requested ? (
                <p className="notice">Your request is <strong>{reqStatus}</strong>. Check your dashboard for updates.</p>
              ) : (
                <>
                  <textarea className="field" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Tell ${pet.owner.name} a little about your home and why you'd like ${pet.name}.`} />
                  <button className="btn btn-primary" disabled={busy}><Heart size={16} /> {busy ? 'Sending...' : 'Send adoption request'}</button>
                </>
              )}
              <div className="pay-row">
                {pet.adoptionFee > 0 && <button type="button" className="btn btn-ghost" onClick={() => pay('adoption_fee', pet.adoptionFee)}><HandCoins size={16} /> Pay ${pet.adoptionFee} adoption fee</button>}
                <button type="button" className="btn btn-ghost" onClick={() => pay('donation', 10)}><HandCoins size={16} /> Donate $10 for {pet.name}</button>
              </div>
            </form>
          ) : (
            <div className="panel"><p className="muted">{pet.name} is not accepting requests right now.</p></div>
          )}

          <ShareButtons pet={pet} />
          {!isOwner && <button className="link-btn muted small" onClick={report}>Report this listing</button>}
        </div>
      </div>

      {zoom && <Lightbox images={images} start={active} onClose={() => setZoom(false)} />}

      {similar.length > 0 && (
        <section className="similar">
          <h2>More pets like {pet.name}</h2>
          <div className="grid">{similar.map((p) => <PetCard key={p._id} pet={p} />)}</div>
        </section>
      )}
    </div>
  );
}
