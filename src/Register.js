import { useState } from 'react';
import './Register.css';

function Register({ setUser }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [msg, setMsg] = useState('');
  const API_URL = process.env.REACT_APP_API_URL;

  const handleRegister = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password, role })
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setMsg('Registered! You can now login.');
          setUser({ id: data.id, name, username, role });
        } else {
          setMsg('Registration failed');
        }
      })
      .catch(() => setMsg('Server error'));
  };

  return (
    <div class="register-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input placeholder="Name" onChange={e => setName(e.target.value)} required />
        <br />
        <input placeholder="Username" onChange={e => setUsername(e.target.value)} required />
        <br />
        <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} required />
        <br />
        <select onChange={e => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="tutor">Tutor</option>
        </select>
        <br />
        <button type="submit">Register</button>
      </form>
      {msg && <div>{msg}</div>}
    </div>
  );
}

export default Register;
