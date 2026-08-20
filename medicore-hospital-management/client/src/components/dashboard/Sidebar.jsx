const navigationGroups = [
  { label: 'Overview', items: [{ label: 'Dashboard', icon: '▦', path: '/app' }] },
  { label: 'Clinical', items: [{ label: 'Patients', icon: '♙', path: '/app/patients' }, { label: 'Doctors', icon: '✚', path: '/app/doctors' }, { label: 'Appointments', icon: '◷', path: '/app/appointments' }, { label: 'Queue', icon: '▤', path: '/app/queue' }, { label: 'Prescriptions', icon: '▤', path: '/app/prescriptions' }] },
  { label: 'Operations', items: [{ label: 'Billing', icon: '◈', path: '/app/billing' }, { label: 'Reports & Analytics', icon: '▥', path: '/app/reports' }] },
  { label: 'System', items: [{ label: 'User Management', icon: '♙', path: '/app/users', adminOnly: true }] },
];

function Sidebar({ activeItem, isOpen, onClose, onSelect, userRole }) {
  return (
    <>
      {isOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} aria-label="Main navigation">
        <div className="brand" aria-label="MediCore hospital management">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span><b>MediCore</b><small>Hospital operations</small></span>
        </div>

        <nav className="sidebar-nav">
          {navigationGroups.map((group) => <section className="nav-group" key={group.label}><p>{group.label}</p>{group.items.filter((item) => !item.adminOnly || userRole === 'admin').map((item) => <button className={`nav-item ${activeItem === item.label ? 'nav-item-active' : ''} ${item.comingSoon ? 'nav-item-disabled' : ''}`} type="button" key={item.label} onClick={() => !item.comingSoon && onSelect(item)} disabled={item.comingSoon} aria-label={item.comingSoon ? `${item.label}, coming soon` : item.label}><span aria-hidden="true">{item.icon}</span><span>{item.label}</span>{item.comingSoon && <em>Soon</em>}</button>)}</section>)}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" aria-hidden="true" />
          System operational
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
