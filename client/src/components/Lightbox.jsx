import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Lightbox({ images, start = 0, onClose }) {
  const [i, setI] = useState(start);
  const prev = () => setI((x) => (x - 1 + images.length) % images.length);
  const next = () => setI((x) => (x + 1) % images.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose}>
      <button className="lb-btn lb-close" onClick={onClose} aria-label="Close"><X size={24} /></button>
      {images.length > 1 && (
        <>
          <button className="lb-btn lb-prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous photo"><ChevronLeft size={28} /></button>
          <button className="lb-btn lb-next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next photo"><ChevronRight size={28} /></button>
        </>
      )}
      <img src={images[i]} alt="" onClick={(e) => e.stopPropagation()} />
      <span className="lb-count">{i + 1} / {images.length}</span>
    </div>
  );
}
