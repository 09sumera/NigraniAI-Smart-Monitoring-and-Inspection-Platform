import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SurpriseInspectionsPage } from './pages/SurpriseInspectionsPage';
import { MobileWorkspacePage } from './pages/MobileWorkspacePage';
import { CCTVPage } from './pages/CCTVPage';
import { AIRiskAnalyticsPage } from './pages/AIRiskAnalyticsPage';
import { EvidenceRepositoryPage } from './pages/EvidenceRepositoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AttendanceAnalyticsPage } from './pages/AttendanceAnalyticsPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { VideoVerificationPage } from './pages/VideoVerificationPage';
import { CalendarPage } from './pages/CalendarPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/live-monitoring" element={<ProtectedRoute><LiveMonitoringPage /></ProtectedRoute>} />
          <Route path="/surprise-inspections" element={<ProtectedRoute><SurpriseInspectionsPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
          <Route path="/mobile-workspace" element={<ProtectedRoute><MobileWorkspacePage /></ProtectedRoute>} />
          <Route path="/cctv" element={<ProtectedRoute><CCTVPage /></ProtectedRoute>} />
          <Route path="/video-verification" element={<ProtectedRoute><VideoVerificationPage /></ProtectedRoute>} />
          <Route path="/ai-analytics" element={<ProtectedRoute><AIRiskAnalyticsPage /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AttendanceAnalyticsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/evidence" element={<ProtectedRoute><EvidenceRepositoryPage /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
