import { useNavigate } from 'react-router-dom';
import { Bell, PawPrint, Heart, HandCoins } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { timeAgo } from '../components/Navbar.jsx';

const icons = { new_pet: PawPrint, adoption_request: Heart, request_update: Bell, payment: HandCoins };

export default function Notifications() {
  const { notifications, markAllRead, markRead } = useAuth();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="container page narrow">
      <div className="page-head row">
        <h1>Notifications</h1>
        {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all as read</button>}
      </div>
      {notifications.length === 0 ? (
        <div className="empty"><p>You're all caught up. New pets, adoption requests and payments will appear here.</p></div>
      ) : (
        <div className="list">
          {notifications.map((n) => {
            const Icon = icons[n.type] || Bell;
            return (
              <button key={n._id} className={`list-row notif-row ${n.read ? '' : 'unread'}`} onClick={() => { markRead(n._id); navigate(n.link); }}>
                <span className="step-icon sm"><Icon size={18} /></span>
                <span className="list-main">
                  <strong>{n.title}</strong>
                  {n.body && <span className="muted small">{n.body}</span>}
                </span>
                <span className="muted small">{timeAgo(n.createdAt)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
