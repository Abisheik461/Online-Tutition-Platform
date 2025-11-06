import React, { useState, useEffect } from 'react';

function formatAsLocal(dtStr) {
  if (!dtStr) return '';
  return new Date(dtStr.replace(' ', 'T')).toLocaleString();
}

function StudentDashboard({ user, setUser }) {
  // Profile state
  const [profile, setProfile] = useState(user);
  const [profileMsg, setProfileMsg] = useState('');
  const [editing, setEditing] = useState(false);

  // Tutors and slots state
  const [tutors, setTutors] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [slotMsg, setSlotMsg] = useState('');

  // History state
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // 👇 Use environment variable
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  // Fetch history function
  const fetchHistory = () => {
    fetch(`${API_URL}/api/student-history?studentId=${user.id}`)
      .then(res => res.json())
      .then(setHistory);
    setShowHistory(true);
  };

  // Fetch tutors and booked slots on mount
  useEffect(() => {
    fetch(`${API_URL}/api/tutors`)
      .then(res => res.json())
      .then(setTutors);

    fetchBookedSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch booked slots function
  const fetchBookedSlots = () => {
    fetch(`${API_URL}/api/student-slots?studentId=${user.id}`)
      .then(res => res.json())
      .then(setBookedSlots);
  };

  // Profile update handler
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/users/${profile.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profile.name, username: profile.username })
    })
      .then(res => res.json())
      .then(() => {
        setProfileMsg('Profile updated!');
        setEditing(false);
        setUser({ ...profile });
      });
  };

  // Show tutor's available slots modal and fetch data
  const showTutorDetails = (tutor) => {
    setSelectedTutor(tutor);
    setDetailLoading(true);
    fetch(`${API_URL}/api/tutor-available-slots?tutorId=${tutor.id}`)
      .then(res => res.json())
      .then((slots) => {
        setAvailableSlots(slots);
        setDetailLoading(false);
      });
  };

  // Cancel booking handler
  const cancelBooking = (bookingId) => {
    fetch(`${API_URL}/api/cancel-booking/${bookingId}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchBookedSlots();
        } else {
          alert('Failed to cancel booking');
        }
      });
  };

  // Booking a slot
  const bookSlot = (slotId) => {
    setSlotMsg('');
    fetch(`${API_URL}/api/book-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: user.id, slotId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSlotMsg('Slot booked!');
          fetchBookedSlots();
          setAvailableSlots(availableSlots.filter(s => s.id !== slotId));
        } else {
          setSlotMsg('Booking failed.');
        }
      });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Student Dashboard</h2>
        <button onClick={() => setUser(null)}>Logout</button>
      </div>

      {/* Profile Section */}
      <div className="profile-section">
        <h3>Profile Settings</h3>
        {!editing ? (
          <div>
            <p><b>Name:</b> {profile.name}</p>
            <p><b>Username:</b> {profile.username}</p>
            <button onClick={() => setEditing(true)}>Edit Profile</button>
            {profileMsg && <div className="profile-message">{profileMsg}</div>}
          </div>
        ) : (
          <form onSubmit={handleProfileUpdate}>
            <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
            <input value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} required />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </form>
        )}
      </div>

      {/* Tutors List */}
      <div className="tutors-section">
        <h3>All Tutors</h3>
        {tutors.length === 0
          ? <p>No tutors found.</p>
          : tutors.map(tutor => (
            <div key={tutor.id} className="tutor-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><b>{tutor.name}</b> ({tutor.username})</span>
              <button onClick={() => showTutorDetails(tutor)}>Details</button>
            </div>
          ))
        }
      </div>

      {/* Tutor slots modal */}
      {selectedTutor && (
        <div className="modal">
          <div className="modal-content">
            <h4>Available Slots for {selectedTutor.name}</h4>
            {detailLoading ? <p>Loading...</p> :
              availableSlots.length === 0 ? <p>No available slots</p> :
                availableSlots.map(slot => (
                  <div key={slot.id} className="slot-item" style={{ marginBottom: 10 }}>
                    <b>
                      {formatAsLocal(slot.startDatetime)} -{' '}
                      {new Date(slot.endDatetime.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </b>
                    <div>Topic: {slot.topic}</div>
                    <button onClick={() => bookSlot(slot.id)}>Book</button>
                  </div>
                ))
            }
            {slotMsg && <div style={{ marginTop: 10, color: '#2563eb' }}>{slotMsg}</div>}
            <button onClick={() => { setSelectedTutor(null); setAvailableSlots([]); setSlotMsg(''); }}>Close</button>
          </div>
        </div>
      )}

      {/* Booked Slots Section */}
      <div className="slots-section">
        <h3>Booked Slots</h3>
        {bookedSlots.length ? bookedSlots.map(slot => {
          const now = new Date();
          const slotStart = new Date(slot.startDatetime.replace(' ', 'T'));
          const diffMinutes = (slotStart - now) / (1000 * 60);

          // Show meeting link if within 5 minutes before start time or later
          const showMeetingLink = slot.meetingLink && diffMinutes <= 5 && diffMinutes >= 0;

          return (
            <div key={slot.id} className="slot-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b>{formatAsLocal(slot.startDatetime)} - {new Date(slot.endDatetime.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b> | Tutor: {slot.tutorName}
                <div>Topic: {slot.topic}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {showMeetingLink && (
                  <a href={slot.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                    Join Meeting
                  </a>
                )}
                <button onClick={() => cancelBooking(slot.bookingId)}>Cancel</button>
              </div>
            </div>
          );
        }) : <p>No slots booked.</p>}
      </div>

      {/* History Section */}
      <div style={{ marginTop: 30 }}>
        <button onClick={fetchHistory}>View History</button>
        {showHistory && (
          <div className="history-section" style={{ marginTop: 20 }}>
            <h3>Booking History</h3>
            {history.length ? history.map(slot => (
              <div key={slot.bookingId} className="slot-item" style={{ opacity: 0.7 }}>
                <b>{formatAsLocal(slot.startDatetime)} - {new Date(slot.endDatetime.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b> | Tutor: {slot.tutorName}
                <div>Topic: {slot.topic}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Archived: {formatAsLocal(slot.archived_at)}</div>
              </div>
            )) : <p>No history found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
