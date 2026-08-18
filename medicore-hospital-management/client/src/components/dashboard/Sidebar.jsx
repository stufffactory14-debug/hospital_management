const navigationItems = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Patients', icon: '♙' },
  { label: 'Doctors', icon: '✚' },
  { label: 'Appointments', icon: '◷' },
  { label: 'Prescriptions', icon: '▤' },
  { label: 'Billing', icon: '◈' },
  { label: 'Settings', icon: '⚙' },
];

function Sidebar({ activeItem, isOpen, onClose, onSelect }) {
  return (
    <>
      {isOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} aria-label="Main navigation">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">✚</span>
          <span>MediCore</span>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              className={`nav-item ${activeItem === item.label ? 'nav-item-active' : ''}`}
              type="button"
              key={item.label}
              onClick={() => onSelect(item.label)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
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
