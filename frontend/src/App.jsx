import React, { useState, useEffect } from 'react';
import { api } from './api';
import ProfileSelect from './components/ProfileSelect';
import PinModal from './components/PinModal';
import StudentDashboard from './components/StudentDashboard';
import ModuleRunner from './components/ModuleRunner';
import AdminDashboard from './components/admin/AdminDashboard';

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUserForPin, setSelectedUserForPin] = useState(null);
  const [modules, setModules] = useState([]);
  const [activeModule, setActiveModule] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load profiles on startup
  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load student modules
  const loadModules = async (user) => {
    if (!user || user.role !== 'student') return;
    try {
      const res = await api.getModules(user.name.toLowerCase(), user.id, 'all');
      if (res.success) {
        setModules(res.modules);
      }
    } catch (err) {
      console.error('Failed to load modules:', err);
    }
  };

  // Check saved session
  useEffect(() => {
    const initApp = async () => {
      await loadUsers();
      const token = localStorage.getItem('belajar_token');
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setCurrentUser(res.user);
            if (res.user.role === 'student') {
              loadModules(res.user);
            }
          }
        } catch (err) {
          console.warn('Session expired, clearing token');
          localStorage.removeItem('belajar_token');
        }
      }
    };
    initApp();
  }, []);

  const handleSelectProfile = (user) => {
    setSelectedUserForPin(user);
  };

  const handlePinSuccess = async (userId, pin) => {
    const res = await api.login(userId, pin);
    if (res.success) {
      localStorage.setItem('belajar_token', res.token);
      setCurrentUser(res.user);
      setSelectedUserForPin(null);
      if (res.user.role === 'student') {
        loadModules(res.user);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('belajar_token');
    setCurrentUser(null);
    setActiveModule(null);
    loadUsers();
  };

  const handleStartModule = (mod) => {
    setActiveModule(mod);
  };

  const handleBackFromModule = () => {
    setActiveModule(null);
    if (currentUser) {
      loadModules(currentUser);
    }
  };

  const handleQuizFinished = (result) => {
    // Refresh user's stars in state
    if (result && result.totalStars != null) {
      setCurrentUser(prev => prev ? { ...prev, totalStars: result.totalStars } : prev);
    }
  };

  // If no user is logged in, show Profile Select + PIN Modal
  if (!currentUser) {
    return (
      <>
        <ProfileSelect
          users={users}
          onSelectUser={handleSelectProfile}
          loading={loading}
        />
        {selectedUserForPin && (
          <PinModal
            user={selectedUserForPin}
            isOpen={Boolean(selectedUserForPin)}
            onClose={() => setSelectedUserForPin(null)}
            onSuccess={handlePinSuccess}
          />
        )}
      </>
    );
  }

  // If Parent / Admin
  if (currentUser.role === 'parent') {
    return (
      <AdminDashboard
        user={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  // If Student and has an active module running
  if (activeModule) {
    return (
      <ModuleRunner
        user={currentUser}
        module={activeModule}
        onBack={handleBackFromModule}
        onQuizFinished={handleQuizFinished}
      />
    );
  }

  // Student Dashboard
  return (
    <StudentDashboard
      user={currentUser}
      modules={modules}
      onStartModule={handleStartModule}
      onLogout={handleLogout}
    />
  );
}
