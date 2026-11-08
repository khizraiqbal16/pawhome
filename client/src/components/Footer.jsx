import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <Link to="/" className="brand"><span className="brand-mark"><PawPrint size={18} /></span>PawHome</Link>
          <p className="muted small">Connecting pets with people who will love them.</p>
        </div>
        <div className="footer-links">
          <Link to="/pets">Find a pet</Link>
          <Link to="/pets/new">List a pet</Link>
          <Link to="/donate">Donate</Link>
        </div>
      </div>
    </footer>
  );
}
