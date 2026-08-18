const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date);
};

function UpcomingAppointments({ appointments, loading }) {
  return (
    <section className="content-card upcoming-card" aria-labelledby="upcoming-title">
      <div className="section-heading"><div><p className="section-label">Next in line</p><h2 id="upcoming-title">Upcoming Appointments</h2></div></div>
      {loading ? <p className="data-state">Loading upcoming appointments…</p> : appointments.length === 0 ? <p className="data-state">No upcoming appointments.</p> : <ul className="upcoming-list">{appointments.map((appointment) => <li key={appointment._id}><span className="upcoming-time">{formatDateTime(appointment.dateTime)}</span><span><b>{appointment.patientName}</b><small>{appointment.doctorName}</small></span><em className={`appointment-status status-${appointment.status}`}>{appointment.status}</em></li>)}</ul>}
    </section>
  );
}

export default UpcomingAppointments;
