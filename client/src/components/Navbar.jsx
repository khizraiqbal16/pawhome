import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, PawPrint, Menu, X, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};
export { timeAgo };

function Bell_() {
  const { notifications, markAllRead, markRead } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="bell" ref={ref}>
      <button className="icon-btn" aria-label="Notifications" onClick={() => setOpen(!open)}>
        <Bell size={20} />
        {unread > 0 && <span className="badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="dropdown">
          <div className="dropdown-head">
            <strong>Notifications</strong>
            {unread > 0 && <button className="link-btn" onClick={markAllRead}>Mark all read</button>}
          </div>
          <div className="dropdown-list">
            {notifications.length === 0 && <p className="muted pad">Nothing yet. New pets and requests will show up here.</p>}
            {notifications.slice(0, 6).map((n) => (
              <button
                key={n._id}
                className={`notif ${n.read ? '' : 'unread'}`}
                onClick={() => {
                  markRead(n._id);
                  setOpen(false);
                  navigate(n.link);
                }}
              >
                <span className="notif-title">{n.title}</span>
                {n.body && <span className="notif-body">{n.body}</span>}
                <span className="notif-time">{timeAgo(n.createdAt)}</span>
              </button>
            ))}
          </div>
          <Link to="/notifications" className="dropdown-foot" onClick={() => setOpen(false)}>See all notifications</Link>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout, unreadMessages } = useAuth();
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  const close = () => setMenu(false);

  // Lock page scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menu]);

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark"><PawPrint size={20} /></span>
          PawHome
        </Link>

        <nav className={`nav-links ${menu ? 'open' : ''}`}>
          <div className="drawer-head">
            <span className="drawer-title">Menu</span>
            <button className="icon-btn" onClick={close} aria-label="Close menu"><X size={22} /></button>
          </div>

          <NavLink to="/pets" onClick={close}>Find a pet</NavLink>
          <NavLink to="/match" onClick={close}>Pet match</NavLink>
          <NavLink to="/stories" onClick={close}>Stories</NavLink>
          <NavLink to="/donate" onClick={close}>Donate</NavLink>
          {user && <NavLink to="/dashboard" onClick={close}>Dashboard</NavLink>}
          {user && <NavLink to="/favorites" onClick={close}>Saved</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
          {!user && (
            <div className="nav-auth-mobile">
              <Link to="/login" className="btn btn-ghost" onClick={close}>Log in</Link>
              <Link to="/register" className="btn btn-primary" onClick={close}>Sign up</Link>
            </div>
          )}
        </nav>
        {menu && <div className="drawer-backdrop" onClick={close} />}

        <div className="nav-actions">
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/pets/new" className="btn btn-primary btn-sm hide-sm"><Plus size={16} /> List a pet</Link>
              <Link to="/messages" className="icon-btn" aria-label="Messages">
                <MessageCircle size={20} />
                {unreadMessages > 0 && <span className="badge">{unreadMessages > 9 ? '9+' : unreadMessages}</span>}
              </Link>
              <Bell_ />
              <button className="avatar" title="Log out" onClick={() => { logout(); navigate('/'); }}>
                {user.name.charAt(0).toUpperCase()}
              </button>
            </>
          ) : (
            <div className="hide-sm nav-auth">
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </div>
          )}
          <button className="icon-btn menu-btn" aria-label="Menu" onClick={() => setMenu(!menu)}>
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}