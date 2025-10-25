import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function formatAsLocal(dtStr) {
  // Expects MySQL DATETIME string "YYYY-MM-DD HH:MM:SS"
  // Converts to "YYYY-MM-DDTHH:MM:SS" for JS Date local parse
  if (!dtStr) return '';
  return new Date(dtStr.replace(' ', 'T')).toLocaleString();
}

function TutorDashboard({ user, setUser }) {
  const [profile, setProfile] = useState(user);
  const [editing, setEditing] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Slots state
  const [slots, setSlots] = useState([]);
  const [slotDate, setSlotDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [topic, setTopic] = useState('');
  const [slotMsg, setSlotMsg] = useState('');

  // History state
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch slots on user change
  useEffect(() => {
    fetch(`http://localhost:4000/api/tutor-slots?tutorId=${user.id}`)
      .then(res => res.json())
      .then(setSlots);
  }, [user]);

  // Fetch history function
  const fetchHistory = () => {
    fetch(`http://localhost:4000/api/tutor-history?tutorId=${user.id}`)
      .then(res => res.json())
      .then(setHistory);
    setShowHistory(true);
  };

  // Profile update
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    fetch(`http://localhost:4000/api/users/${profile.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    })
      .then(res => res.json())
      .then(() => {
        setProfileMsg('Profile updated!');
        setEditing(false);
        setUser({ ...profile });
      });
  };

  // Slot add with validation
  const handleAddSlot = (e) => {
    e.preventDefault();
    setSlotMsg('');
    const localStart = `${slotDate}T${startTime}:00`;
    const localEnd = `${slotDate}T${endTime}:00`;
    const start = new Date(localStart);
    const end = new Date(localEnd);
    const now = new Date();

    if (isNaN(start) || isNaN(end)) {
      setSlotMsg('Please provide valid start and end times.');
      return;
    }
    if (start <= now) {
      setSlotMsg('Start time must be in the future.');
      return;
    }
    const diffMs = end - start;
    const diffMin = diffMs / (1000 * 60);
    if (diffMin <= 0) {
      setSlotMsg('End time must be after start time.');
      return;
    }
    if (diffMin > 60) {
      setSlotMsg('Slot duration cannot exceed 1 hour.');
      return;
    }
    if (!topic.trim()) {
      setSlotMsg('Topic is required.');
      return;
    }

    const startDatetime = `${slotDate} ${startTime}:00`;
    const endDatetime = `${slotDate} ${endTime}:00`;

    fetch('http://localhost:4000/api/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tutorId: user.id,
        startDatetime,
        endDatetime,
        topic
      })
    }).then(res => res.json())
      .then(data => {
        if (data.success) {
          setSlotMsg('Slot added!');
          setSlotDate('');
          setStartTime('');
          setEndTime('');
          setTopic('');
          fetch(`http://localhost:4000/api/tutor-slots?tutorId=${user.id}`)
            .then(res => res.json())
            .then(setSlots);
        } else {
          setSlotMsg(data.error || 'Failed to add slot');
        }
      });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Tutor Dashboard</h2>
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

      {/* Add Slot Section */}
      <div className="slot-add-section" style={{ marginBottom: 30, marginTop: 30 }}>
        <h3>Add New Slot (max 1 hour)</h3>
        <form onSubmit={handleAddSlot}>
          <label>
            Date:
            <input type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} required />
          </label>
          <label>
            Start Time:
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
          </label>
          <label>
            End Time:
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
          </label>
          <label>
            Topic:
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required />
          </label>
          <button type="submit">Add Slot</button>
        </form>
        {slotMsg && <div style={{ marginTop: 10, color: slotMsg.includes('added') ? 'green' : '#e00' }}>{slotMsg}</div>}
      </div>

      {/* Current Slots Section */}
      <div className="slots-section">
        <h3>Your Slots and Bookings</h3>
        {slots.length ? slots.map(slot => (
          <div key={slot.id} className="slot-item">
            <b>{formatAsLocal(slot.startDatetime)} - {formatAsLocal(slot.endDatetime)}</b>
            <div>Topic: {slot.topic}</div>
            <div>Booked by: {slot.studentName || <span style={{ color: '#888' }}>None</span>}</div>

            {/* Meeting link display */}
            {slot.meetingLink && (
              <a href={slot.meetingLink} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '10px' }}>
                Join Meeting
              </a>
            )}
          </div>
        )) : <p>No slots added yet.</p>}
      </div>

      {/* History Section */}
      <div style={{ marginTop: 30 }}>
        <button onClick={fetchHistory}>View History</button>
        {showHistory && (
          <div className="history-section" style={{ marginTop: 20 }}>
            <h3>Archived Slots History</h3>
            {history.length ? history.map(slot => (
              <div key={slot.id} className="slot-item" style={{ opacity: 0.7 }}>
                <b>{formatAsLocal(slot.startDatetime)} - {formatAsLocal(slot.endDatetime)}</b>
                <div>Topic: {slot.topic}</div>
                <div>Booked by: {slot.studentName || <span style={{ color: '#888' }}>None</span>}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Archived: {formatAsLocal(slot.archived_at)}</div>
              </div>
            )) : <p>No history found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default TutorDashboard;
