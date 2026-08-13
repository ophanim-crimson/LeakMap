import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Report from './pages/Report';
import ReportDetail from './pages/ReportDetail';
import ReportsList from './pages/ReportsList';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          backgroundColor: 'var(--background-color)' 
        }}>
          <Navbar />

          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              <Route path="/reports" element={<ReportsList />} />
              <Route path="/report" element={<Report />} />
              <Route path="/report/:id" element={<ReportDetail />} />
            </Routes>
          </main>

          <footer style={{
            padding: '20px 16px',
            textAlign: 'center',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--white)',
            color: 'var(--text-muted)',
            fontSize: '13px',
            marginTop: '40px'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <p style={{ fontWeight: 600, color: 'var(--primary-color)', marginBottom: '4px' }}>LeakMap</p>
              <p>Community-Powered Water Infrastructure Intelligence • MVP Demo</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
