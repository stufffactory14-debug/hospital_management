import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';

function Topbar({ title, user, onLogout, onMenuToggle }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const { theme, setTheme } = useTheme();

  const loadNotifications = async (includeList = false) => {
    try {
      setNotificationsError('');
      if (includeList) setNotificationsLoading(true);
      const requests = [api.get('/notifications/unread-count')];
      if (includeList) requests.push(api.get('/notifications'));
      const [countResponse, listResponse] = await Promise.all(requests);
      setUnreadCount(countResponse.data?.data?.count || 0);
      if (listResponse) setNotifications(Array.isArray(listResponse.data?.data) ? listResponse.data.data : []);
    } catch (error) {
      setNotificationsError(error.response?.data?.message || 'Notifications could not be loaded.');
    } finally { setNotificationsLoading(false); }
  };

  useEffect(() => { loadNotifications(); const timer = window.setInterval(() => loadNotifications(), 60000); return () => window.clearInterval(timer); }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && setIsMenuOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isMenuOpen]);

  const openNotifications = () => { setNotificationsOpen((open) => !open); if (!notificationsOpen) loadNotifications(true); };
  const markNotificationRead = async (notification) => { if (notification.read) return; try { await api.put(`/notifications/${notification._id}/read`); setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, read: true } : item)); setUnreadCount((count) => Math.max(0, count - 1)); } catch (error) { setNotificationsError(error.response?.data?.message || 'Notification could not be updated.'); } };
  const markAllNotificationsRead = async () => { try { await api.put('/notifications/read-all'); setNotifications((current) => current.map((item) => ({ ...item, read: true }))); setUnreadCount(0); } catch (error) { setNotificationsError(error.response?.data?.message || 'Notifications could not be updated.'); } };

  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="menu-button" type="button" aria-label="Open navigation" onClick={onMenuToggle}>☰</button>
        <div>
          <p className="breadcrumb">MediCore <span>/</span> {title}</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="user-actions">
        <div className="notification-wrap"><button className="notification-button" type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={openNotifications}><span aria-hidden="true">◔</span>{unreadCount > 0 && <b className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</b>}</button>{notificationsOpen && <div className="notification-panel" role="dialog" aria-label="Notifications"><div className="notification-panel-header"><strong>Notifications</strong>{unreadCount > 0 && <button type="button" onClick={markAllNotificationsRead}>Mark all read</button>}</div>{notificationsLoading ? <p className="notification-state">Loading notifications…</p> : notificationsError ? <p className="notification-state notification-error">{notificationsError}</p> : !notifications.length ? <p className="notification-state">You’re all caught up.</p> : <div className="notification-list">{notifications.map((notification) => <button className={`notification-item ${notification.read ? '' : 'notification-unread'}`} type="button" key={notification._id} onClick={() => markNotificationRead(notification)}><span className="notification-dot" aria-hidden="true" /><span><strong>{notification.title}</strong><small>{notification.message}</small><time>{new Date(notification.createdAt).toLocaleString('en-IN')}</time></span></button>)}</div>}</div>}</div>
        <div className="profile-menu-wrap">
          <button className="user-summary" type="button" aria-label="Open account menu" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>
            <span className="user-avatar" aria-hidden="true">{user.name?.charAt(0).toUpperCase()}</span>
            <span className="user-details">
            <strong>{user.name}</strong>
            <small>{user.role}</small>
            </span>
          </button>
          {isMenuOpen && <div className="profile-menu" role="menu"><p>Signed in as <b>{user.role}</b></p><label className="theme-control">Theme<select value={theme} onChange={(event) => setTheme(event.target.value)} aria-label="Theme"><option value="light">☀ Light</option><option value="dark">🌙 Dark</option><option value="system">🖥 System</option></select></label><button type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); onLogout(); }}>Log out</button></div>}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
