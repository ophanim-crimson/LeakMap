import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Spin, Typography } from 'antd';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StatsCards from '../components/StatsCards';
import LeafletMap from '../components/LeafletMap';

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
    if (type === 'total') navigate('/reports');
    else if (type === 'active') navigate('/reports?status=Active');
    else if (type === 'resolved') navigate('/reports?status=Resolved');
    else if (type === 'confirmed') navigate('/reports?status=Confirmed');
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
        <Button
            type="primary"
            size="large"
            onClick={() => navigate('/report')}
            style={{
              borderRadius: '50px',
              padding: '10px 28px',
              height: '44px',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'var(--font-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '160px',
              margin: '0 auto',
              backgroundColor: 'var(--primary-color)',
              borderColor: 'var(--primary-color)',
              boxShadow: '0 4px 14px rgba(21, 101, 192, 0.25)',
              transition: 'all 0.25s ease',
            }}
          >
            Report Issue
          </Button>

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
              style={{ width: '100%', maxWidth: '280px', borderRadius: '8px', height: '40px' }}
            />

            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: '160px', height: '40px', borderRadius: '8px' }}
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
              style={{ width: '140px', height: '40px', borderRadius: '8px' }}
            >
              <Option value="all">All Statuses</Option>
              <Option value="Active">Active Only</Option>
              <Option value="Resolved">Resolved Only</Option>
            </Select>

            <Button
              type="primary"
              onClick={handleSearch}
              icon={<SearchOutlined />}
              style={{ padding: '0 20px', height: '40px', borderRadius: '8px' }}
            >
              Search
            </Button>
          </div>

          <Button
            type="default"
            icon={<SyncOutlined />}
            onClick={loadData}
            style={{ borderRadius: '8px', height: '40px' }}
          >
            Refresh
          </Button>
        </div>

        {/* Full-width Map */}
        <div style={{
          height: '520px',
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
      </div>


    </div>
  );
};

export default Home;
