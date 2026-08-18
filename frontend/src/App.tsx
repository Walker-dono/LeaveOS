import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { HRDashboard } from './pages/HRDashboard';
import { DashboardLayout } from './layouts/DashboardLayout';
import { UserRole } from './types';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeRoleView, setActiveRoleView] = useState<UserRole>('EMPLOYEE');

  useEffect(() => {
    if (user) {
      setActiveRoleView(user.role);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Loading LeaveOS...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={(role) => setActiveRoleView(role)} />;
  }

  return (
    <DashboardLayout
      activeRoleTab={activeRoleView}
      onRoleChange={(role) => setActiveRoleView(role)}
    >
      {activeRoleView === 'EMPLOYEE' && <EmployeeDashboard />}
      {activeRoleView === 'MANAGER' && <ManagerDashboard />}
      {activeRoleView === 'HR_ADMIN' && <HRDashboard />}
    </DashboardLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
