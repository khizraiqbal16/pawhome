import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PetCard from '../components/PetCard.jsx';

export default function Favorites() {
  const { user } = useAuth();
  const [pets, setPets] = useState(null);

  // Refetch whenever a pet is saved or removed
  useEffect(() => {
    api.get('/favorites').then((r) => setPets(r.data));
  }, [user.favorites?.length]);

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Saved pets</h1>
        <p className="muted">Pets you have marked with a heart.</p>
      </div>
      {pets === null ? (
        <div className="page-loader">Loading...</div>
      ) : pets.length === 0 ? (
        <div className="empty">
          <p>You have not saved any pets yet. Tap the heart on a pet to keep it here.</p>
          <Link to="/pets" className="btn btn-primary">Find a pet</Link>
        </div>
      ) : (
        <div className="grid">{pets.map((p) => <PetCard key={p._id} pet={p} />)}</div>
      )}
    </div>
  );
}