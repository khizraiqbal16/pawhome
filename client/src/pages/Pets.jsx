
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  LocateFixed,
  X,
  LayoutGrid,
  Map as MapIcon,
} from 'lucide-react';

import api, { errorMessage } from '../api.js';
import PetCard from '../components/PetCard.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PetMap from '../components/PetMap.jsx';

const SPECIES = ['dog', 'cat', 'rabbit', 'bird', 'other'];

export default function Pets() {
  const toast = useToast();
  const [params] = useSearchParams();

  // All hooks must be inside the component
  const [view, setView] = useState('list');

  const [filters, setFilters] = useState({
    q: params.get('q') || '',
    species: params.get('species') || '',
    breed: '',
    gender: '',
    size: '',
    sort: 'newest',
  });

  const [place, setPlace] = useState(params.get('place') || '');
  const [radius, setRadius] = useState(50);
  const [coords, setCoords] = useState(null);
  const [page, setPage] = useState(1);

  const [data, setData] = useState({
    pets: [],
    total: 0,
    pages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  // Update filters
  const set = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));

    setPage(1);
  };

  // Fetch pets
  const fetchPets = useCallback(async () => {
    setLoading(true);

    try {
      const query = {
        ...filters,
        page: view === 'map' ? 1 : page,
        limit: view === 'map' ? 48 : 9,
      };

      Object.keys(query).forEach((key) => {
        if (query[key] === '') {
          delete query[key];
        }
      });

      if (coords) {
        Object.assign(query, {
          lat: coords.lat,
          lng: coords.lng,
          radius,
        });
      }

      const res = await api.get('/pets', {
        params: query,
      });

      setData(res.data);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, page, coords, radius, view, toast]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Search by city/place
  const applyPlace = async (e) => {
    e?.preventDefault();

    if (!place.trim()) {
      setCoords(null);
      setFilters((prev) => ({
        ...prev,
        sort: 'newest',
      }));
      setPage(1);
      return;
    }

    setLocating(true);

    try {
      const res = await api.get('/geo/geocode', {
        params: {
          q: place,
        },
      });

      setCoords(res.data);

      setFilters((prev) => ({
        ...prev,
        sort: 'nearest',
      }));

      setPage(1);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setLocating(false);
    }
  };

  // Apply location from homepage URL
  useEffect(() => {
    const initialPlace = params.get('place');

    if (initialPlace) {
      setPlace(initialPlace);
      applyPlace();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use current browser location
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast('Your browser does not support location', 'error');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'My location',
        });

        setPlace('My location');

        setFilters((prev) => ({
          ...prev,
          sort: 'nearest',
        }));

        setPage(1);
        setLocating(false);
      },
      () => {
        toast('Location permission was denied', 'error');
        setLocating(false);
      }
    );
  };

  // Clear location
  const clearPlace = () => {
    setCoords(null);
    setPlace('');

    setFilters((prev) => ({
      ...prev,
      sort: 'newest',
    }));

    setPage(1);
  };

  // Reset all filters
  const reset = () => {
    setFilters({
      q: '',
      species: '',
      breed: '',
      gender: '',
      size: '',
      sort: 'newest',
    });

    clearPlace();
    setPage(1);
  };

  return (
    <div className="container page">

      {/* Page Header */}
      <div className="page-head">
        <h1>Find a pet</h1>

        <p className="muted">
          {loading
            ? 'Searching...'
            : `${data.total} ${
                data.total === 1 ? 'pet' : 'pets'
              } available`}

          {coords &&
            ` within ${radius} km of ${
              coords.label?.split(',')[0] || 'your location'
            }`}
        </p>

        {/* List / Map Toggle */}
        <div className="view-toggle">
          <button
            type="button"
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            <LayoutGrid size={16} />
            List
          </button>

          <button
            type="button"
            className={view === 'map' ? 'active' : ''}
            onClick={() => setView('map')}
          >
            <MapIcon size={16} />
            Map
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">

        {/* Search */}
        <label className="field field-icon">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search name, breed or story"
            value={filters.q}
            onChange={(e) => set('q', e.target.value)}
          />
        </label>

        {/* Location Search */}
        <form className="location-box" onSubmit={applyPlace}>
          <label className="field field-icon">
            <MapPin size={18} />

            <input
              type="text"
              placeholder="Search near a city"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />

            {coords && (
              <button
                type="button"
                className="clear"
                onClick={clearPlace}
                aria-label="Clear location"
              >
                <X size={16} />
              </button>
            )}
          </label>

          <button
            type="submit"
            className="btn btn-dark"
            disabled={locating}
          >
            {locating ? 'Locating...' : 'Apply'}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={useMyLocation}
            disabled={locating}
          >
            <LocateFixed size={16} />
            Near me
          </button>

          <select
            value={radius}
            onChange={(e) => {
              setRadius(Number(e.target.value));
              setPage(1);
            }}
            className="select"
            aria-label="Distance"
          >
            {[10, 25, 50, 100, 250].map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
        </form>

        {/* Species Filters */}
        <div className="pill-row">
          <button
            type="button"
            className={`pill ${
              filters.species === '' ? 'active' : ''
            }`}
            onClick={() => set('species', '')}
          >
            All
          </button>

          {SPECIES.map((species) => (
            <button
              type="button"
              key={species}
              className={`pill ${
                filters.species === species ? 'active' : ''
              }`}
              onClick={() => set('species', species)}
            >
              {species}
            </button>
          ))}
        </div>

        {/* Additional Filters */}
        <div className="filter-row">

          <input
            type="text"
            className="select"
            placeholder="Breed"
            value={filters.breed}
            onChange={(e) => set('breed', e.target.value)}
            aria-label="Breed"
          />

          <select
            className="select"
            value={filters.gender}
            onChange={(e) => set('gender', e.target.value)}
            aria-label="Gender"
          >
            <option value="">Any gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <select
            className="select"
            value={filters.size}
            onChange={(e) => set('size', e.target.value)}
            aria-label="Size"
          >
            <option value="">Any size</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>

          <select
            className="select"
            value={filters.sort}
            onChange={(e) => set('sort', e.target.value)}
            aria-label="Sort"
          >
            <option value="newest">Newest first</option>
            <option value="youngest">Youngest first</option>
            <option value="oldest_pet">Oldest first</option>

            {coords && (
              <option value="nearest">Nearest first</option>
            )}
          </select>

          <button
            type="button"
            className="link-btn"
            onClick={reset}
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* Pet Results */}
      {loading ? (
        <div className="grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="skeleton" />
          ))}
        </div>
      ) : data.pets.length === 0 ? (
        <div className="empty">
          <p>
            No pets match these filters. Try a wider distance
            or fewer filters.
          </p>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={reset}
          >
            Reset filters
          </button>
        </div>
      ) : view === 'map' ? (
        <PetMap pets={data.pets} />
      ) : (
        <div className="grid">
          {data.pets.map((pet) => (
            <PetCard key={pet._id} pet={pet} />
          ))}
        </div>
      )}

      {/* Pagination - List View Only */}
      {view === 'list' && data.pages > 1 && (
        <div className="pager">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {data.pages}
          </span>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page >= data.pages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
}
