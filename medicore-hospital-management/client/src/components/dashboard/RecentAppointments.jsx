const formatDateTime = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

function RecentAppointments({ appointments, loading, error }) {
  return (
    <section className="content-card appointments-card" aria-labelledby="appointments-title">
      <div className="section-heading">
        <div>
          <p className="section-label">Latest appointment records</p>
          <h2 id="appointments-title">Recent Appointments</h2>
        </div>
      </div>

      {loading && <p className="data-state">Loading appointments…</p>}
      {!loading && error && <p className="data-state">Appointments are unavailable right now.</p>}
      {!loading && !error && appointments.length === 0 && <p className="data-state">No appointments found.</p>}

      {!loading && !error && appointments.length > 0 && (
        <div className="appointments-table" role="table" aria-label="Recent appointments">
          <div className="appointment-row appointment-head" role="row">
            <span>Patient</span><span>Doctor</span><span>Date & time</span><span>Status</span>
          </div>
          {appointments.map((appointment) => {
            const status = appointment.status || 'Unavailable';
            const statusClass = status.toLowerCase().replace(/\s+/g, '-');

            return (
              <div className="appointment-row" role="row" key={appointment._id}>
                <span className="patient-cell"><b>{appointment.patientName}</b><small>{appointment.reason || 'Reason unavailable'}</small></span>
                <span>{appointment.doctorName}</span>
                <span>{formatDateTime(appointment.dateTime)}</span>
                <span><em className={`appointment-status status-${statusClass}`}>{status}</em></span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RecentAppointments;
