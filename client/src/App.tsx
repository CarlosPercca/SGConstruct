import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Tasks } from './pages/Tasks';
import { Validations } from './pages/Validations';
import { Users } from './pages/Users';
import { Reports } from './pages/Reports';
import { Areas } from './pages/Areas';
import { Audit } from './pages/Audit';
import { Usuario } from './types';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  const [user, setUser] = useState<Usuario | null>(null);

  const handleLogin = (loggedInUser: Usuario) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <ToastProvider>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <HashRouter>
          <Layout user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/tasks" element={<Tasks user={user} />} />
              <Route path="/validations" element={<Validations user={user} />} />
              <Route path="/users" element={<Users currentUser={user} />} />
              <Route path="/areas" element={<Areas />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/audit" element={<Audit />} />
            </Routes>
          </Layout>
        </HashRouter>
      )}
    </ToastProvider>
  );
}