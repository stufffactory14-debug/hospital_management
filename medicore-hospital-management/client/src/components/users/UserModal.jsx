import UserForm from './UserForm';
import './UserForm.css';

function UserModal({ user, doctors, onClose, onSubmit, saving, error }) { return <div className="users-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}><section className="users-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title"><div className="users-modal-header"><div><p className="section-label">Staff access</p><h2 id="user-modal-title">{user ? 'Edit user' : 'Create user'}</h2></div><button className="users-modal-close" type="button" aria-label="Close user form" onClick={onClose} disabled={saving}>×</button></div><UserForm user={user} doctors={doctors} onSubmit={onSubmit} saving={saving} error={error} /></section></div>; }

export default UserModal;
