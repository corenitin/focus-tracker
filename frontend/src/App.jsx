import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import NewSession from './pages/NewSession';
import ActiveSession from './pages/ActiveSession';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: '100px' }} />;
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <main className={user ? 'main-content' : ''}>
        <Routes>
          {/* Public routes */}
          <Route path="/welcome"   element={<Landing />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />

          {/* Root: logged-in → dashboard, guest → landing */}
          <Route path="/" element={
            user ? <Dashboard /> : <Landing />
          } />

          {/* Protected routes */}
          <Route path="/new"            element={<PrivateRoute><NewSession /></PrivateRoute>} />
          <Route path="/session/:id"    element={<PrivateRoute><ActiveSession /></PrivateRoute>} />
          <Route path="/history"        element={<PrivateRoute><History /></PrivateRoute>} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
