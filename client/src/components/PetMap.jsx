import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { imgUrl } from '../api.js';
import { PLACEHOLDER } from './PetCard.jsx';

const icon = L.divIcon({
  className: 'pet-pin',
  html: '<span></span>',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -36],
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 12);
    else if (points.length > 1) map.fitBounds(points, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function PetMap({ pets }) {
  const located = pets.filter((p) => p.location?.geo?.coordinates?.length === 2);
  const points = located.map((p) => [p.location.geo.coordinates[1], p.location.geo.coordinates[0]]);

  if (located.length === 0) {
    return <div className="empty"><p>None of these pets have a map location yet.</p></div>;
  }

  return (
    <div className="map-wrap">
      <MapContainer center={points[0]} zoom={10} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {located.map((p) => (
          <Marker key={p._id} icon={icon} position={[p.location.geo.coordinates[1], p.location.geo.coordinates[0]]}>
            <Popup>
              <Link to={`/pets/${p._id}`} className="map-popup">
                <img src={imgUrl(p.images?.[0]) || PLACEHOLDER} alt={p.name} />
                <strong>{p.name}</strong>
                <span>{p.breed} · {p.location.city}</span>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
