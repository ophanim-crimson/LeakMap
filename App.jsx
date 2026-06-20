import React, { useState, useEffect } from 'react';
import { Layout, Select, Space, Button, Alert, Spin, Typography, Card } from 'antd';
import { EnvironmentOutlined, DashboardOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

import MapView from './components/MapView';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import ReportDetails from './components/ReportDetails';

const { Header, Content } = Layout;
const { Option } = Select;
const { Title, Text } = Typography;

const API_BASE_URL = 'http://localhost:8000';

// High-fidelity fallback/mock data if backend is offline
const MOCK_REPORTS = [
  {
    id: 1,
    issue_type: 'Leak',
    description: 'Major main line pipe burst under the pavement. Water is gushing onto the main road.',
    latitude: 9.9892,
    longitude: 76.3022,
    image_url: null,
    status: 'Active',
    created_date: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 2,
    issue_type: 'Overflow',
    description: 'Public overhead reservoir valve failed. Tank is overflowing continuously for 4 hours.',
    latitude: 9.9658,
    longitude: 76.2418,
    image_url: null,
    status: 'Resolved',
    created_date: new Date(Date.now() - 25 * 3600 * 1000).toISOString()
  },
  {
    id: 3,
    issue_type: 'Damaged Infrastructure',
    description: 'Damaged sluice valve cover is broken. Dirt and refuse falling into public supply connection.',
    latitude: 9.9678,
    longitude: 76.2945,
    image_url: null,
    status: 'Active',
    created_date: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    id: 4,
    issue_type: 'Supply Issue',
    description: 'No water supply in the entire residential colony block since yesterday morning.',
    latitude: 10.0104,
    longitude: 76.3608,
    image_url: null,
    status: 'Active',
    created_date: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  }
];

function App() {
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'report_form', 'report_details'
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Filters state
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch all reports from backend
  const fetchReports = async (type = typeFilter, status = statusFilter) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/reports`;
      const params = {};
      if (type) params.issue_type = type;
      if (status) params.status = status;
      
      const response = await axios.get(url, { params });
      setReports(response.data);
      setIsDemoMode(false);
    } catch (error) {
      console.warn("Backend unavailable, falling back to local demo mode:", error);
      // Fallback to client-side filtering of mock data
      let filteredMock = [...MOCK_REPORTS];
      if (type) {
        filteredMock = filteredMock.filter(r => r.issue_type === type);
      }
      if (status) {
        filteredMock = filteredMock.filter(r => r.status === status);
      }
      setReports(filteredMock);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [typeFilter, statusFilter]);

  const handleSelectReport = (id) => {
    setSelectedReportId(id);
    setActiveView('report_details');
  };

  const handleReportSuccess = (newReport) => {
    fetchReports();
    setActiveView('dashboard');
  };

  const handleLogoClick = () => {
    setTypeFilter('');
    setStatusFilter('');
    setSelectedReportId(null);
    setActiveView('dashboard');
  };

  return (
    <div className="leakmap-app">
      {/* Brand Header */}
      <Header className="leakmap-header">
        <div className="brand" onClick={handleLogoClick}>
          <div className="brand-logo">LM</div>
          <div>
            <span className="brand-name">LeakMap</span>
            <span style={{ display: 'none' }} className="brand-tag">Community</span>
          </div>
        </div>
        
        <Space size="middle">
          {activeView !== 'dashboard' && (
            <Button 
              type="text" 
              icon={<DashboardOutlined />} 
              onClick={() => setActiveView('dashboard')}
              style={{ fontWeight: 500 }}
            >
              Dashboard & Map
            </Button>
          )}
          
          {activeView === 'dashboard' && (
            <Button 
              type="primary" 
              icon={<EnvironmentOutlined />} 
              onClick={() => setActiveView('report_form')}
              style={{ fontWeight: 600 }}
            >
              Report Issue
            </Button>
          )}
        </Space>
      </Header>

      <Content className="leakmap-content">
        {/* Connection Mode Alert */}
        {isDemoMode && (
          <Alert
            message={
              <span>
                <strong>Operating in Offline Demo Mode:</strong> Connection to backend at <code>{API_BASE_URL}</code> failed. 
                Using client-side mock data. Submitting reports and comments will only update the UI temporarily.
              </span>
            }
            type="warning"
            showIcon
            closable
            style={{ marginBottom: '20px', borderRadius: 'var(--radius-sm)' }}
          />
        )}

        {/* Dashboard Home View */}
        {activeView === 'dashboard' && (
          <div>
            {/* Map Area */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <EnvironmentOutlined style={{ color: 'var(--primary)' }} />
                  Interactive Water Infrastructure Map
                </Title>
                
                {/* Filter Panel */}
                <Space wrap>
                  <Select 
                    value={typeFilter} 
                    onChange={setTypeFilter} 
                    style={{ width: 170 }}
                    placeholder="Filter Issue Type"
                  >
                    <Option value="">All Issue Types</Option>
                    <Option value="Leak">💧 Leaks</Option>
                    <Option value="Overflow">🌊 Overflows</Option>
                    <Option value="Damaged Infrastructure">🔧 Infrastructure</Option>
                    <Option value="Supply Issue">🚫 Supply Issues</Option>
                  </Select>

                  <Select 
                    value={statusFilter} 
                    onChange={setStatusFilter} 
                    style={{ width: 150 }}
                    placeholder="Filter Status"
                  >
                    <Option value="">All Statuses</Option>
                    <Option value="Active">🟢 Active</Option>
                    <Option value="Resolved">🔵 Resolved</Option>
                    <Option value="Duplicate">⚪ Duplicate</Option>
                  </Select>

                  <Button 
                    type="default" 
                    icon={<ReloadOutlined />} 
                    onClick={() => fetchReports()} 
                    loading={loading}
                  />
                </Space>
              </div>

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px', backgroundColor: '#fff', borderRadius: 'var(--radius-md)' }}>
                  <Spin size="large" tip="Loading map records..." />
                </div>
              ) : (
                <MapView 
                  reports={reports} 
                  onSelectReport={handleSelectReport} 
                  height="500px"
                />
              )}
            </div>

            {/* Dashboard Statistics & Metrics */}
            <Dashboard 
              reports={reports} 
              onSelectReport={handleSelectReport}
              onViewReportForm={() => setActiveView('report_form')}
            />
          </div>
        )}

        {/* Create Submission View */}
        {activeView === 'report_form' && (
          <ReportForm 
            onCancel={() => setActiveView('dashboard')}
            onSuccess={handleReportSuccess}
            apiBaseUrl={API_BASE_URL}
          />
        )}

        {/* View Details View */}
        {activeView === 'report_details' && (
          <ReportDetails 
            reportId={selectedReportId}
            onBack={() => setActiveView('dashboard')}
            apiBaseUrl={API_BASE_URL}
          />
        )}
      </Content>
    </div>
  );
}

export default App;
