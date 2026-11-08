import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const refreshCounts = useCallback(async () => {
    try {
      const [n, m] = await Promise.all([api.get('/notifications'), api.get('/messages/unread-count')]);
      setNotifications(n.data);
      setUnreadMessages(m.data.count);
    } catch {
      /* ignore */
    }
  }, []);

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return setLoading(false);
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  // Real-time connection while logged in
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadMessages(0);
      return;
    }
    refreshCounts();
    const s = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    s.on('notification:new', (n) => {
      setNotifications((prev) => [n, ...prev]);
      toast(n.title, 'info');
    });
    s.on('message:new', () => refreshCounts());
    setSocket(s);
    return () => {
      s.close();
      setSocket(null);
    };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const authenticate = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const login = async (email, password) => authenticate((await api.post('/auth/login', { email, password })).data);
  const register = async (form) => authenticate((await api.post('/auth/register', form)).data);
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  const updateProfile = async (patch) => setUser((await api.put('/auth/me', patch)).data);
  const toggleFavorite = async (petId) => {
    const res = await api.post(`/favorites/${petId}`);
    setUser((u) => ({ ...u, favorites: res.data.favorites }));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };
  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    api.patch(`/notifications/${id}/read`).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, socket, notifications, unreadMessages, refreshCounts, login, register, logout, updateProfile, toggleFavorite, markAllRead, markRead }}
    >
      {children}
    </AuthContext.Provider>
  );
}
