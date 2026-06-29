import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Space, Row, Col, Spin, Empty, Typography } from 'antd';
import { SearchOutlined, FilterOutlined, SyncOutlined, AimOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StatsCards from '../components/StatsCards';
import LeafletMap from '../components/LeafletMap';
import ReportCard from '../components/ReportCard';
import { fetchReports, fetchStatistics, Report, Statistics } from '../api';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Search & Filter state
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('Active');

  const loadData = async () => {
    setLoadingReports(true);
    setLoadingStats(true);
    try {
      // Load stats
      const statsData = await fetchStatistics();
      setStats(statsData);
      setLoadingStats(false);

      // Load reports
      const filterParams: any = {
        page: 1,
        limit: 50, // Grab up to 50 for the map
      };
      if (searchText.trim()) filterParams.q = searchText;
      if (selectedType !== 'all') filterParams.issue_type = selectedType;
      if (selectedStatus !== 'all') filterParams.status = selectedStatus;

      const reportsData = await fetchReports(filterParams);
      setReports(reportsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoadingReports(false);
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedType, selectedStatus]);

  const handleSearch = () => {
    loadData();
  };

  const handleStatsCardClick = (type: 'total' | 'active' | 'confirmed' | 'resolved') => {
    if (type === 'total') {
      setSelectedStatus('all');
    } else if (type === 'active') {
      setSelectedStatus('Active');
    } else if (type === 'resolved') {
      setSelectedStatus('Resolved');
    } else if (type === 'confirmed') {
      setSelectedStatus('Active');
    }
    
    // Smooth scroll to explore/list section
    const element = document.getElementById('map-explore-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* Hero Section - Compact & Economical layout */}
      <div style={{
        textAlign: 'center',
        padding: '20px 16px',
        backgroundColor: 'var(--white)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #E3F2FD 100%)',
        border: '1px solid var(--border-color)'
      }}>
        <Title level={1} style={{ 
          fontSize: '26px', 
          fontWeight: 800, 
          color: 'var(--primary-color)', 
          fontFamily: 'var(--font-secondary)',
          marginBottom: '6px'
        }}>
          Community Water Intelligence
        </Title>
        <Paragraph style={{ 
          fontSize: '14px', 
          color: 'var(--text-secondary)', 
          maxWidth: '550px', 
          margin: '0 auto 16px auto',
          lineHeight: '1.5'
        }}>
          Help identify, verify, and monitor water leaks, supply shortages, and broken taps in your local community.
        </Paragraph>
        <Space size="middle">
          <Button 
            type="primary" 
            size="middle" 
            style={{ borderRadius: '24px', padding: '6px 20px' }}
            onClick={() => navigate('/report')}
          >
            Report Issue
          </Button>
          <Button 
            type="default" 
            size="middle" 
            style={{ borderRadius: '24px', padding: '6px 20px' }}
            onClick={() => {
              const element = document.getElementById('map-explore-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Explore Map
          </Button>
        </Space>
      </div>

      {/* Statistics Section */}
      <StatsCards stats={stats} loading={loadingStats} onCardClick={handleStatsCardClick} />

      {/* Main Dashboard Section */}
      <div id="map-explore-section" style={{ marginTop: '32px' }}>
        
        {/* Filter Controls Header */}
        <div style={{
          backgroundColor: 'var(--white)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1, minWidth: '280px' }}>
            <Input
              placeholder="Search reports by code or description..."
              prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: '100%', maxWidth: '280px', borderRadius: '8px' }}
            />
            
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: '160px' }}
              dropdownStyle={{ borderRadius: '8px' }}
            >
              <Option value="all">All Issue Types</Option>
              <Option value="Leak">Leaks</Option>
              <Option value="Overflow">Overflows</Option>
              <Option value="Damaged Tap">Damaged Taps</Option>
              <Option value="Broken Valve">Broken Valves</Option>
              <Option value="Water Supply Issue">Supply Issues</Option>
              <Option value="Other">Other</Option>
            </Select>

            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: '140px' }}
            >
              <Option value="all">All Statuses</Option>
              <Option value="Active">Active Only</Option>
              <Option value="Resolved">Resolved Only</Option>
            </Select>

            <Button 
              type="primary" 
              onClick={handleSearch}
              icon={<SearchOutlined />}
              style={{ padding: '4px 16px', height: 'auto', borderRadius: '8px' }}
            >
              Search
            </Button>
          </div>

          <Button 
            type="default" 
            icon={<SyncOutlined />} 
            onClick={loadData}
            style={{ borderRadius: '8px' }}
          >
            Refresh
          </Button>
        </div>

        {/* Dashboard Grid */}
        <Row gutter={[24, 24]}>
          {/* Map Column */}
          <Col xs={24} lg={16}>
            <div style={{ 
              height: '500px', 
              borderRadius: 'var(--radius-md)', 
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-color)',
              position: 'relative'
            }}>
              {loadingReports ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  backgroundColor: '#ECEFF1'
                }}>
                  <Spin size="large" />
                </div>
              ) : (
                <LeafletMap reports={reports} />
              )}
            </div>
          </Col>

          {/* Feed Column */}
          <Col xs={24} lg={8}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '500px',
            }}>
              <Title level={4} style={{ 
                fontSize: '18px', 
                marginBottom: '16px',
                fontFamily: 'var(--font-secondary)',
                fontWeight: 600
              }}>
                Recent Reports ({reports.length > 10 ? '10+' : reports.length})
              </Title>
              
              <div style={{ 
                overflowY: 'auto', 
                flex: 1, 
                paddingRight: '4px' 
              }}>
                {loadingReports ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <Spin />
                  </div>
                ) : reports.length === 0 ? (
                  <Empty description="No reports found matching filters." style={{ backgroundColor: 'var(--white)', padding: '40px 20px', borderRadius: 'var(--radius-md)' }} />
                ) : (
                  reports.slice(0, 10).map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))
                )}
              </div>
            </div>
          </Col>
        </Row>
      </div>

    </div>
  );
};

export default Home;
