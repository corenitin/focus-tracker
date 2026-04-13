import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewSession from './pages/NewSession';
import ActiveSession from './pages/ActiveSession';
import History from './pages/History';
import Analytics from './pages/Analytics';
import PomodoroTimer from './pages/PomodoroTimer';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import OAuthSuccess from './pages/OAuthSuccess';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: '100px' }} />;
  return user ? children : <Navigate to="/login" />;
}

function AppLayout() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/oauth/success"   element={<OAuthSuccess />} />
        <Route path="/welcome"         element={<Landing />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp"      element={<VerifyOTP />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="*"                element={<Landing />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-content">
        <div className="mobile-topbar-spacer" />
        <main className="main-content">
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/analytics"     element={<Analytics />} />
            <Route path="/history"       element={<History />} />
            <Route path="/pomodoro"      element={<PomodoroTimer />} />
            <Route path="/new"           element={<NewSession />} />
            <Route path="/session/:id"   element={<ActiveSession />} />
            <Route path="/oauth/success" element={<OAuthSuccess />} />
            <Route path="*"              element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <AppLayout />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
