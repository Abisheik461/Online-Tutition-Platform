import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import StudentDashboard from './StudentDashboard';
import TutorDashboard from './TutorDashboard';
const { v4: uuidv4 } = require('uuid');


function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return (
      <div>
        <h1>Online Tuition Platform</h1>
        <Login setUser={setUser} />
        <hr />
        <Register setUser={setUser} />
      </div>
    );
  }

  if (user.role === 'tutor') {
    return <TutorDashboard user={user} setUser={setUser} />;
  }

  return <StudentDashboard user={user} setUser={setUser} />;
}

export default App;
