import { useState } from 'react';
import { Facebook, Twitter, Linkedin, MessageCircle, Link2, Share2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../context/ToastContext.jsx';

export default function ShareButtons({ pet }) {
  const toast = useToast();
  const [showQr, setShowQr] = useState(false);
  const url = window.location.href;
  const text = `Meet ${pet.name}, a ${pet.breed} looking for a home in ${pet.location?.city}.`;
  const enc = encodeURIComponent;

  const links = [
    { label: 'Facebook', icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: 'X', icon: Twitter, href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${enc(`${text} ${url}`)}` },
    { label: 'LinkedIn', icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch {
      toast('Could not copy the link', 'error');
    }
  };

  const nativeShare = () => navigator.share({ title: `Adopt ${pet.name}`, text, url }).catch(() => {});

  return (
    <div className="share-wrap">
      <div className="share">
        <span className="share-label">Share {pet.name}</span>
        <div className="share-row">
          {links.map(({ label, icon: Icon, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="share-btn" aria-label={`Share on ${label}`} title={label}>
              <Icon size={18} />
            </a>
          ))}
          <button className="share-btn" onClick={copy} aria-label="Copy link" title="Copy link"><Link2 size={18} /></button>
          <button className="share-btn" onClick={() => setShowQr(!showQr)} aria-label="Show QR code" title="QR code" aria-expanded={showQr}><QrCode size={18} /></button>
          {navigator.share && <button className="share-btn" onClick={nativeShare} aria-label="More sharing options" title="More"><Share2 size={18} /></button>}
        </div>
      </div>
      {showQr && (
        <div className="qr-box">
          <QRCodeSVG value={url} size={150} level="M" includeMargin />
          <p className="muted small">Scan to open {pet.name}'s page, great for posters and flyers.</p>
        </div>
      )}
    </div>
  );
}