import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Heart, MessageCircle, Home as HomeIcon } from 'lucide-react';
import api from '../api.js';
import PetCard, { PLACEHOLDER } from '../components/PetCard.jsx';

const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=80`;
const hero = [U('photo-1552053831-71594a27632d'), U('photo-1514888286974-6c03e2ca1dba'), U('photo-1543466835-00a7907e9de1')];
const species = [
  { key: 'dog', label: 'Dogs', emoji: '🐕' },
  { key: 'cat', label: 'Cats', emoji: '🐈' },
  { key: 'rabbit', label: 'Rabbits', emoji: '🐇' },
  { key: 'bird', label: 'Birds', emoji: '🦜' },
];

export default function Home() {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    api.get('/pets', { params: { limit: 6 } }).then((r) => setPets(r.data.pets)).finally(() => setLoading(false));
  }, []);

  const search = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (city) p.set('place', city);
    navigate(`/pets?${p.toString()}`);
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>Somebody near you is waiting to come home.</h1>
            <p className="lead">Browse adoptable dogs, cats and more from people in your area. Send a request, chat with the owner and bring your new friend home.</p>
            <form className="hero-search" onSubmit={search}>
              <label className="hero-field">
                <Search size={18} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Breed or name" aria-label="Breed or name" />
              </label>
              <label className="hero-field">
                <MapPin size={18} />
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" aria-label="City" />
              </label>
              <button className="btn btn-primary" type="submit">Search pets</button>
            </form>
            <div className="hero-species">
              {species.map((s) => (
                <Link key={s.key} to={`/pets?species=${s.key}`} className="pill">{s.emoji} {s.label}</Link>
              ))}
            </div>
          </div>
          <div className="hero-photos" aria-hidden="true">
            {hero.map((src, i) => (
              <img key={i} src={src} alt="" className={`hero-photo hp-${i}`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Newest arrivals</h2>
            <Link to="/pets" className="link-arrow">See all pets <ArrowRight size={16} /></Link>
          </div>
          {loading ? (
            <div className="grid">{[...Array(3)].map((_, i) => <div key={i} className="skeleton" />)}</div>
          ) : pets.length ? (
            <div className="grid">{pets.map((p) => <PetCard key={p._id} pet={p} />)}</div>
          ) : (
            <div className="empty">
              <p>No pets listed yet.</p>
              <Link to="/pets/new" className="btn btn-primary">List the first pet</Link>
            </div>
          )}
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <h2>How adoption works</h2>
          <ol className="steps">
            <li><span className="step-icon"><Search size={22} /></span><h3>Find a match</h3><p>Filter by species, breed and distance to see pets close to home.</p></li>
            <li><span className="step-icon"><Heart size={22} /></span><h3>Send a request</h3><p>Tell the owner about your home. They get notified straight away.</p></li>
            <li><span className="step-icon"><MessageCircle size={22} /></span><h3>Talk to the owner</h3><p>Use built-in messages to ask questions and plan a meeting.</p></li>
            <li><span className="step-icon"><HomeIcon size={22} /></span><h3>Welcome them home</h3><p>Once approved, pay any adoption fee online and bring your pet home.</p></li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container cta">
          <div>
            <h2>Can't adopt right now?</h2>
            <p>Your donation helps owners and shelters cover food, vaccines and vet visits.</p>
          </div>
          <Link to="/donate" className="btn btn-sun">Donate</Link>
        </div>
      </section>
    </>
  );
}
