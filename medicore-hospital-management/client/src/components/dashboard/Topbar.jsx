import { useState } from 'react';

function Topbar({ title, user, onLogout, onMenuToggle }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <button className="notification-button" type="button" aria-label="Notifications"><span aria-hidden="true">◔</span><i /></button>
        <div className="profile-menu-wrap">
          <button className="user-summary" type="button" aria-label="Open account menu" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>
            <span className="user-avatar" aria-hidden="true">{user.name?.charAt(0).toUpperCase()}</span>
            <span className="user-details">
            <strong>{user.name}</strong>
            <small>{user.role}</small>
            </span>
          </button>
          {isMenuOpen && <div className="profile-menu" role="menu"><p>Signed in as <b>{user.role}</b></p><button type="button" role="menuitem" onClick={onLogout}>Log out</button></div>}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
