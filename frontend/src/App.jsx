import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PatientRegisterPage from './pages/PatientRegisterPage';
import DoctorRegisterPage from './pages/DoctorRegisterPage';
import PatientDashboard from './pages/Patient-Dashboard';
import DoctorDashboard from './pages/Doctor-Dashboard';
import AdminDashboard from './pages/Admin-Dashboard';

function App() {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem('smartdoc_auth_session');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (payload) => {
    const nextSession = { token: payload.token, user: payload.user };
    setSession(nextSession);
    localStorage.setItem('smartdoc_auth_session', JSON.stringify(nextSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('smartdoc_auth_session');
  };

  return (
    <div className="min-h-screen">
      <Header session={session} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register/patient" element={<PatientRegisterPage onLogin={handleLogin} />} />
        <Route path="/register/doctor" element={<DoctorRegisterPage onLogin={handleLogin} />} />
        <Route
          path="/dashboard/patient"
          element={
            session?.user?.role === 'patient' ? (
              <PatientDashboard session={session} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/dashboard/doctor"
          element={
            session?.user?.role === 'doctor' ? (
              <DoctorDashboard session={session} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            session?.user?.role === 'admin' ? (
              <AdminDashboard session={session} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;
