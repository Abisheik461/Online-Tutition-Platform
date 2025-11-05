const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());

const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

con.connect(err => {
  if (err) throw err;
  console.log('MySQL connected');
});

// Get all courses
app.get('/api/courses', (req, res) => {
  con.query(
    'SELECT courses.*, users.name AS tutorName FROM courses JOIN users ON courses.tutor_id = users.id',
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

// Add a new user (for simplicity, no registration system)
app.post('/api/users', (req, res) => {
  const { name, username, password, role } = req.body;
  con.query(
    'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)', 
    [name, username, password, role],
    (err, results) => {
      if (err) throw err;
      res.json({ id: results.insertId });
    }
  );
});
app.get('/api', (req, res) => {
  res.send('API is running!');
});

// Enroll student
app.post('/api/enroll', (req, res) => {
  const { courseId, studentId } = req.body;
  con.query(
    'INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)', 
    [courseId, studentId],
    (err) => {
      if (err) throw err;
      res.json({ message: 'Enrolled' });
    }
  );
});

// Start server
app.listen(4000, () => {
  console.log('Server running on port 4000');
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  con.query(
    'SELECT * FROM users WHERE username = ? AND password = ?', 
    [username, password],
    (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        res.json({ success: true, user: results[0] });
      } else {
        res.json({ success: false, message: 'Invalid credentials' });
      }
    }
  );
});

// Update user profile
app.put('/api/users/:id', (req, res) => {
  const { name, username } = req.body;
  con.query(
    'UPDATE users SET name=?, username=? WHERE id=?',
    [name, username, req.params.id],
    (err) => {
      if (err) throw err;
      res.json({ success: true });
    }
  );
});

// Get student's booked slots and their tutor
app.get('/api/student-slots', (req, res) => {
  const { studentId } = req.query;
  con.query(
    `SELECT bookings.id AS bookingId, slots.id, slots.topic, slots.startDatetime, slots.endDatetime, users.name as tutorName, bookings.meetingLink 
     FROM bookings 
     JOIN slots ON bookings.slotId = slots.id 
     JOIN users ON slots.tutorId = users.id
     WHERE bookings.studentId=?`,
    [studentId],
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});





// List all tutors
app.get('/api/tutors', (req, res) => {
  con.query(
    'SELECT id, name, username FROM users WHERE role="tutor"',
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

// Create slot (tutor adds)
app.post('/api/slots', (req, res) => {
  const { tutorId, startDatetime, endDatetime, topic } = req.body;
  con.query(
    'INSERT INTO slots (tutorId, startDatetime, endDatetime, topic) VALUES (?, ?, ?, ?)',
    [tutorId, startDatetime, endDatetime, topic],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});


// Get tutor's slots with booking info (who booked the slot)
app.get('/api/tutor-slots', (req, res) => {
  const { tutorId } = req.query;
  const sql = `
  SELECT slots.id, slots.startDatetime, slots.endDatetime, slots.topic, users.name AS studentName, bookings.meetingLink
  FROM slots
  LEFT JOIN bookings ON bookings.slotId = slots.id
  LEFT JOIN users ON bookings.studentId = users.id
  WHERE slots.tutorId = ?
  ORDER BY slots.startDatetime ASC
`;
  con.query(sql, [tutorId], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Get available slots for a tutor (not yet booked)
app.get('/api/tutor-available-slots', (req, res) => {
  const { tutorId } = req.query;
  con.query(
    `SELECT s.id, s.topic, s.startDatetime, s.endDatetime
     FROM slots s
     LEFT JOIN bookings b ON b.slotId = s.id
     WHERE s.tutorId = ? AND b.id IS NULL
     ORDER BY s.startDatetime ASC`,
    [tutorId],
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

// Endpoint for student to book a slot
app.post('/api/book-slot', (req, res) => {
  const { studentId, slotId } = req.body;
  const roomUUID = uuidv4();
  const meetingLink = `https://meet.jit.si/tuition_room_${roomUUID}`;

  con.query(
    'INSERT INTO bookings (slotId, studentId, meetingLink) VALUES (?, ?, ?)',
    [slotId, studentId, meetingLink],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true, meetingLink });
    }
  );
});


// Cancel a booking by deleting it
app.delete('/api/cancel-booking/:bookingId', (req, res) => {
  const bookingId = req.params.bookingId;
  con.query('DELETE FROM bookings WHERE id = ?', [bookingId], (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err });
    }
    res.json({ success: true });
  });
});


// Get archived slots for tutor (history)
app.get('/api/tutor-history', (req, res) => {
  const { tutorId } = req.query;
  con.query(
    `SELECT sa.id, sa.startDatetime, sa.endDatetime, sa.topic, sa.archived_at, u.name AS studentName, ba.meetingLink
     FROM slots_archive sa
     LEFT JOIN bookings_archive ba ON ba.slotId = sa.id
     LEFT JOIN users u ON ba.studentId = u.id
     WHERE sa.tutorId = ?
     ORDER BY sa.archived_at DESC`,
    [tutorId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});

// Get archived bookings for student (history)
app.get('/api/student-history', (req, res) => {
  const { studentId } = req.query;
  con.query(
    `SELECT ba.id AS bookingId, sa.topic, sa.startDatetime, sa.endDatetime, ba.archived_at, u.name AS tutorName, ba.meetingLink
     FROM bookings_archive ba
     JOIN slots_archive sa ON ba.slotId = sa.id
     JOIN users u ON sa.tutorId = u.id
     WHERE ba.studentId = ?
     ORDER BY ba.archived_at DESC`,
    [studentId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});


