import React from "react";
import "./Navbar.css"; // import custom CSS

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav class="navbar">
      <h1 class="navbar-title">Online Tuition Platform</h1>

      <div class="navbar-buttons">
        <button
          class={`nav-btn ${activeTab === "login" ? "active" : ""}`}
          onClick={() => setActiveTab("login")}
        >
          Login
        </button>
        <button
          class={`nav-btn ${activeTab === "register" ? "active" : ""}`}
          onClick={() => setActiveTab("register")}
        >
          Register
        </button>
      </div>
    </nav>
  );
}
