import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { timeAgo } from '../components/Navbar.jsx';

export default function Messages() {
  const { user, socket, refreshCounts } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [convs, setConvs] = useState([]);
  const [active, setActive] = useState(null); // { userId, name, petId, petName }
  const [thread, setThread] = useState([]);
  const [text, setText] = useState('');
  const bottom = useRef();
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const typingTimer = useRef();
  const activeRef = useRef(null);
  activeRef.current = active;

  const loadConvs = useCallback(async () => {
    const res = await api.get('/messages/conversations');
    setConvs(res.data);
    return res.data;
  }, []);

  const openThread = useCallback(async (a) => {
    setActive(a);
    const res = await api.get(`/messages/thread/${a.userId}`, { params: a.petId ? { pet: a.petId } : {} });
    setThread(res.data);
    refreshCounts();
    loadConvs();
  }, [refreshCounts, loadConvs]);

  // Initial load, and deep link from ?to=<userId>&pet=<petId>
  useEffect(() => {
    (async () => {
      try {
        const list = await loadConvs();
        const to = params.get('to');
        const petId = params.get('pet') || null;
        if (to) {
          const found = list.find((c) => c.other._id === to && (c.pet?._id || null) === petId);
          if (found) return openThread({ userId: to, name: found.other.name, petId, petName: found.pet?.name });
          const [u, p] = await Promise.all([api.get(`/auth/users/${to}`), petId ? api.get(`/pets/${petId}`) : Promise.resolve(null)]);
          openThread({ userId: to, name: u.data.name, petId, petName: p?.data.name });
        }
      } catch (err) { toast(errorMessage(err), 'error'); }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Live incoming messages
  useEffect(() => {
    if (!socket) return;
    const onMsg = (m) => {
      const a = activeRef.current;
      if (a && m.sender === a.userId && (m.pet || null) === (a.petId || null)) {
        setThread((t) => [...t, m]);
        api.get(`/messages/thread/${a.userId}`, { params: a.petId ? { pet: a.petId } : {} }).then(refreshCounts);
      }
      loadConvs();
    };
    socket.on('message:new', onMsg);
    return () => socket.off('message:new', onMsg);
  }, [socket, loadConvs, refreshCounts]);

  useEffect(() => {
    if (!socket || !active) return;
    setTyping(false);
    setOnline(false);
    socket.emit('presence:check', active.userId, setOnline);

    const onTyping = ({ from, typing: t }) => from === active.userId && setTyping(t);
    const onPresence = ({ userId, online: o }) => userId === active.userId && setOnline(o);
    socket.on('typing', onTyping);
    socket.on('presence:update', onPresence);
    return () => {
      socket.off('typing', onTyping);
      socket.off('presence:update', onPresence);
    };
  }, [socket, active?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread]);

  const onType = (e) => {
    setText(e.target.value);
    if (!socket || !active) return;
    socket.emit('typing', { to: active.userId, typing: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('typing', { to: active.userId, typing: false }), 1500);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    try {
      const res = await api.post('/messages', { recipient: active.userId, pet: active.petId || undefined, text });
      setThread((t) => [...t, res.data]);
      setText('');
      loadConvs();
    } catch (err) { toast(errorMessage(err), 'error'); }
  };

  const select = (c) => {
    const a = { userId: c.other._id, name: c.other.name, petId: c.pet?._id || null, petName: c.pet?.name };
    setParams({ to: a.userId, ...(a.petId ? { pet: a.petId } : {}) });
    openThread(a);
  };

  const back = () => { setActive(null); setParams({}); };

  return (
    <div className="container page">
      <h1>Messages</h1>
      <div className={`chat ${active ? 'chat-open' : ''}`}>
        <aside className="chat-list">
          {convs.length === 0 && !active && <p className="muted pad">No conversations yet. Open a pet and tap Message to start one.</p>}
          {convs.map((c) => {
            const isActive = active && active.userId === c.other._id && (active.petId || null) === (c.pet?._id || null);
            return (
              <button key={c.key} className={`conv ${isActive ? 'active' : ''}`} onClick={() => select(c)}>
                <span className="avatar">{c.other.name.charAt(0).toUpperCase()}</span>
                <span className="conv-main">
                  <strong>{c.other.name}{c.pet && <span className="muted"> · {c.pet.name}</span>}</strong>
                  <span className="conv-last">{c.lastMessage.text}</span>
                </span>
                <span className="conv-meta">
                  <span className="small muted">{timeAgo(c.lastMessage.createdAt)}</span>
                  {c.unread > 0 && <span className="badge static">{c.unread}</span>}
                </span>
              </button>
            );
          })}
        </aside>

        <section className="chat-pane">
          {!active ? (
            <div className="chat-empty muted">Select a conversation to start chatting.</div>
          ) : (
            <>
              <header className="chat-head">
                <button className="icon-btn back-btn" onClick={back} aria-label="Back to conversations"><ArrowLeft size={20} /></button>
                <span className="avatar">{active.name.charAt(0).toUpperCase()}</span>
                <div><strong>{active.name}</strong><p className="muted small">
                    <span className={`dot ${online ? 'on' : ''}`} />
                    {typing ? 'typing...' : online ? 'Online' : 'Offline'}
                    {active.petName && ` · About ${active.petName}`}
                  </p></div>
              </header>
              <div className="chat-body">
                {thread.length === 0 && <p className="muted center">Say hello and ask about {active.petName || 'the pet'}.</p>}
                {thread.map((m) => (
                  <div key={m._id} className={`bubble ${m.sender === user._id ? 'mine' : 'theirs'}`}>
                    <p>{m.text}</p>
                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
                <div ref={bottom} />
              </div>
              <form className="chat-input" onSubmit={send}>
                <input className="field" value={text} onChange={onType} placeholder="Write a message" maxLength={2000} aria-label="Message" />
                <button className="btn btn-primary" disabled={!text.trim()}><Send size={16} /> Send</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
