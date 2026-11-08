import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, LocateFixed, X } from 'lucide-react';
import api, { errorMessage, imgUrl } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const empty = {
  name: '', species: 'dog', breed: '', age: 1, gender: 'male', size: 'medium', description: '',
  city: '', adoptionFee: 0, vaccinated: false, neutered: false, status: 'available',
};

export default function PetForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({ ...empty, city: user?.city || '' });
  const [coords, setCoords] = useState(null);
  const [existing, setExisting] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/pets/${id}`).then((r) => {
      const p = r.data;
      if (String(p.owner._id) !== String(user._id)) return navigate('/dashboard');
      setForm({
        name: p.name, species: p.species, breed: p.breed, age: p.age, gender: p.gender, size: p.size,
        description: p.description, city: p.location.city, adoptionFee: p.adoptionFee,
        vaccinated: p.vaccinated, neutered: p.neutered, status: p.status,
      });
      setExisting(p.images || []);
    }).catch((e) => toast(errorMessage(e), 'error'));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const addFiles = (e) => {
    const picked = [...e.target.files];
    if (existing.length + files.length + picked.length > 5) return toast('You can add up to 5 photos', 'error');
    setFiles([...files, ...picked]);
    e.target.value = '';
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast('Your browser does not support location', 'error');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); toast('Exact location saved for this listing'); },
      () => toast('Location permission was denied', 'error')
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (coords) { fd.append('lat', coords.lat); fd.append('lng', coords.lng); }
      if (editing) fd.append('existingImages', JSON.stringify(existing));
      files.forEach((f) => fd.append('images', f));
      const res = editing ? await api.put(`/pets/${id}`, fd) : await api.post('/pets', fd);
      toast(editing ? 'Listing updated' : 'Pet listed. Nearby users will be notified.');
      navigate(`/pets/${res.data._id}`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page narrow">
      <h1>{editing ? 'Edit listing' : 'List a pet for adoption'}</h1>
      <form className="card form" onSubmit={submit}>
        <div className="form-grid">
          <label>Name<input className="field" required value={form.name} onChange={set('name')} /></label>
          <label>Species
            <select className="field" value={form.species} onChange={set('species')}>
              {['dog', 'cat', 'rabbit', 'bird', 'other'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>Breed<input className="field" value={form.breed} onChange={set('breed')} placeholder="Mixed" /></label>
          <label>Age (years)<input className="field" type="number" min="0" max="40" value={form.age} onChange={set('age')} /></label>
          <label>Gender
            <select className="field" value={form.gender} onChange={set('gender')}><option value="male">Male</option><option value="female">Female</option></select>
          </label>
          <label>Size
            <select className="field" value={form.size} onChange={set('size')}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select>
          </label>
          <label>City<input className="field" required value={form.city} onChange={set('city')} /></label>
          <label>Adoption fee (USD, 0 for free)<input className="field" type="number" min="0" value={form.adoptionFee} onChange={set('adoptionFee')} /></label>
        </div>

        <button type="button" className="btn btn-ghost btn-sm self-start" onClick={useMyLocation}><LocateFixed size={16} /> {coords ? 'Location saved' : 'Use my exact location'}</button>

        <label>Description
          <textarea className="field" required rows={5} value={form.description} onChange={set('description')} placeholder="Personality, habits, health, and what kind of home would suit this pet." />
        </label>

        <div className="checks">
          <label className="check"><input type="checkbox" checked={form.vaccinated} onChange={set('vaccinated')} /> Vaccinated</label>
          <label className="check"><input type="checkbox" checked={form.neutered} onChange={set('neutered')} /> Neutered / spayed</label>
        </div>

        {editing && (
          <label>Status
            <select className="field" value={form.status} onChange={set('status')}><option value="available">Available</option><option value="pending">Pending</option><option value="adopted">Adopted</option></select>
          </label>
        )}

        <div>
          <span className="label">Photos (up to 5)</span>
          <div className="upload-grid">
            {existing.map((src) => (
              <div key={src} className="upload-thumb">
                <img src={imgUrl(src)} alt="" />
                <button type="button" onClick={() => setExisting(existing.filter((x) => x !== src))} aria-label="Remove photo"><X size={14} /></button>
              </div>
            ))}
            {files.map((f, i) => (
              <div key={i} className="upload-thumb">
                <img src={URL.createObjectURL(f)} alt="" />
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove photo"><X size={14} /></button>
              </div>
            ))}
            {existing.length + files.length < 5 && (
              <label className="upload-add"><ImagePlus size={22} /><span>Add photo</span><input type="file" accept="image/*" multiple hidden onChange={addFiles} /></label>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Publish listing'}</button>
        </div>
      </form>
    </div>
  );
}
