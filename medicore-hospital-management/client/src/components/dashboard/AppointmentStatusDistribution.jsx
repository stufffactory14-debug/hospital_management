const statuses = ['scheduled', 'completed', 'cancelled'];

function AppointmentStatusDistribution({ appointments, loading }) {
  const total = appointments.length;

  return (
    <section className="content-card distribution-card" aria-labelledby="distribution-title">
      <div className="section-heading">
        <div>
          <p className="section-label">Current workload</p>
          <h2 id="distribution-title">Appointment Status</h2>
        </div>
      </div>
      {loading ? <p className="data-state">Loading distribution…</p> : total === 0 ? <p className="data-state">No appointment data available.</p> : (
        <div className="distribution-list">
          {statuses.map((status) => {
            const count = appointments.filter((appointment) => appointment.status === status).length;
            const percentage = Math.round((count / total) * 100);
            return <div className="distribution-item" key={status}><div><span className={`status-dot status-dot-${status}`} /><b>{status}</b><small>{count} appointments</small></div><strong>{percentage}%</strong><span className="distribution-track"><span className={`distribution-fill distribution-fill-${status}`} style={{ width: `${percentage}%` }} /></span></div>;
          })}
        </div>
      )}
    </section>
  );
}

export default AppointmentStatusDistribution;
