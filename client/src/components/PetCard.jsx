import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Syringe, Heart } from 'lucide-react';
import { imgUrl, errorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23E3EFEA'/><text x='200' y='175' font-size='90' text-anchor='middle'>🐾</text></svg>";

export const ageLabel = (age) => (age < 1 ? 'Under 1 year' : age === 1 ? '1 year' : `${age} years`);

export function PetImage({ pet, className = '' }) {
  return (
    <img
      className={className}
      src={imgUrl(pet.images?.[0]) || PLACEHOLDER}
      alt={`${pet.name}, ${pet.breed}`}
      loading="lazy"
      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
    />
  );
}

export default function PetCard({ pet, matchPercent }) {
  const { user, toggleFavorite } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const saved = !!user?.favorites?.includes(pet._id);

  const onHeart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login', { state: { from: '/pets' } });
    try {
      await toggleFavorite(pet._id);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <Link to={`/pets/${pet._id}`} className="pet-card">
      <div className="pet-card-img">
        <PetImage pet={pet} />
        {pet.status !== 'available' && <span className={`status status-${pet.status}`}>{pet.status}</span>}
        {matchPercent !== undefined && <span className="match-badge">{matchPercent}% match</span>}
        <span className="chip chip-species">{pet.species}</span>
        <button className={`heart-btn ${saved ? 'saved' : ''}`} onClick={onHeart} aria-label={saved ? 'Remove from saved pets' : 'Save pet'} aria-pressed={saved}>
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="pet-card-body">
        <div className="pet-card-top">
          <h3>{pet.name}</h3>
          <span className="fee">{pet.adoptionFee > 0 ? `$${pet.adoptionFee}` : 'Free'}</span>
        </div>
        <p className="muted">{pet.breed} · {ageLabel(pet.age)} · {pet.gender}</p>
        <div className="pet-card-meta">
          <span><MapPin size={14} /> {pet.location?.city}{pet.distanceKm !== undefined && ` · ${pet.distanceKm} km`}</span>
          {pet.vaccinated && <span><Syringe size={14} /> Vaccinated</span>}
        </div>
      </div>
    </Link>
  );
}