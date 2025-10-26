import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import StudentDashboard from './StudentDashboard';
import TutorDashboard from './TutorDashboard';
import Navbar from './Navbar';
const { v4: uuidv4 } = require('uuid');


function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("login");

  // ✅ If user is logged in, show dashboard
  if (user) {
    if (user.role === "tutor") {
      return <TutorDashboard user={user} setUser={setUser} />;
    } else {
      return <StudentDashboard user={user} setUser={setUser} />;
    }
  }

  // ✅ Otherwise show login/register UI
  return (
    <div class="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content */}
      <div class="mt-10 bg-white p-8 rounded-xl shadow-md w-96">
        {activeTab === "login" ? (
          <Login setUser={setUser} />
        ) : (
          <Register setUser={setUser} />
        )}
      </div>
    </div>
  );
}

export default App;