/** Fictional, noninteractive illustration: no appointment or customer records are read. */
export function BookingLayoutPreview() {
  return (
    <div className="premium-preview-layout booking-layout-preview">
      <div className="premium-preview-heading">
        <div>
          <p className="premium-preview-kicker">Illustrative booking preview</p>
          <h2>Your appointment calendar</h2>
        </div>
        <span className="premium-preview-primary">Google Calendar sync</span>
      </div>
      <div className="premium-preview-tabs">
        <span data-active>Calendar</span>
        <span>Requests</span>
        <span>History</span>
        <span>Setup</span>
      </div>
      <div className="booking-preview-toolbar">
        <strong>This week</strong>
        <span>Day · Week · Month · Agenda</span>
      </div>
      <div className="booking-preview-week">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
          <section key={day}>
            <header>
              {day}
              <strong>{12 + i}</strong>
            </header>
            <div className="booking-preview-times">
              <span>9 AM</span>
              <span>10 AM</span>
              <span>11 AM</span>
              <span>12 PM</span>
              <span>1 PM</span>
            </div>
            <article style={{ top: 115 + (i % 3) * 80 }}>
              <small>{i % 2 ? "11:00 AM" : "10:00 AM"}</small>
              <strong>{i % 2 ? "Project review" : "Consultation"}</strong>
              <span>Example appointment</span>
            </article>
          </section>
        ))}
      </div>
    </div>
  );
}
