import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from '../pages/Home';
import Report from '../pages/Report';
import ReportDetail from '../pages/ReportDetail';


const App: React.FC = () => {
  return (
    <Router>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        backgroundColor: 'var(--background-color)' 
      }}>
        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<Report />} />
            <Route path="/report/:id" element={<ReportDetail />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer style={{
          padding: '24px 16px',
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
  );
};

export default App;
