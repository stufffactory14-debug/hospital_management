const formatActivityTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date);
};

function RecentActivity({ appointments, loading }) {
  const activities = appointments.filter((appointment) => appointment.createdAt).slice(0, 4);

  return (
    <section className="content-card activity-card" aria-labelledby="activity-title">
      <div className="section-heading"><div><p className="section-label">Record timeline</p><h2 id="activity-title">Recent Activity</h2></div></div>
      {loading ? <p className="data-state">Loading activity…</p> : activities.length === 0 ? <p className="data-state">Recent activity will appear as appointment records are created.</p> : <ol className="activity-list">{activities.map((appointment) => <li key={appointment._id}><span className="activity-marker" aria-hidden="true" /><div><b>Appointment record created</b><p>{appointment.patientName} · {appointment.reason || 'No reason provided'}</p><small>{formatActivityTime(appointment.createdAt)}</small></div></li>)}</ol>}
    </section>
  );
}

export default RecentActivity;
