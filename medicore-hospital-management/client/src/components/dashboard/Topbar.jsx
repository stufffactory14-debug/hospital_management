function Topbar({ title, user, onLogout, onMenuToggle }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="menu-button" type="button" aria-label="Open navigation" onClick={onMenuToggle}>☰</button>
        <div>
          <p className="section-label">Overview</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="user-actions">
        <div className="user-summary">
          <span className="user-avatar" aria-hidden="true">{user.name?.charAt(0).toUpperCase()}</span>
          <span>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </span>
        </div>
        <button className="logout-button" type="button" onClick={onLogout}>Log out</button>
      </div>
    </header>
  );
}

export default Topbar;
