import React, { useState, useEffect } from 'react';
import { Button, Typography, Spin, Row, Col, Empty } from 'antd';
import { AlertOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StatsCards from '../components/StatsCards';
import ReportCard from '../components/ReportCard';
import LeafletMap from '../components/LeafletMap';
import { fetchMyStatistics, fetchPublicReports, Statistics, Report } from '../api';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [stats, setStats] = useState<Statistics | null>(() => {
    try {
      const cached = sessionStorage.getItem('leakmap_my_stats');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loadingStats, setLoadingStats] = useState(!stats);

  const [recentReports, setRecentReports] = useState<Report[]>(() => {
    try {
      const cached = sessionStorage.getItem('leakmap_public_reports');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [loadingReports, setLoadingReports] = useState(recentReports.length === 0);

  const loadData = async () => {
    try {
      const [statsData, reportsData] = await Promise.all([
        fetchMyStatistics(),
        fetchPublicReports()
      ]);
      setStats(statsData);
      setRecentReports(reportsData);
      try {
        sessionStorage.setItem('leakmap_my_stats', JSON.stringify(statsData));
        sessionStorage.setItem('leakmap_public_reports', JSON.stringify(reportsData));
      } catch { /* storage full fallback */ }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoadingStats(false);
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatsCardClick = (type: 'total' | 'active' | 'confirmed' | 'resolved') => {
    if (type === 'total') navigate('/reports');
    else if (type === 'active') navigate('/reports?status=Active');
    else if (type === 'resolved') navigate('/reports?status=Resolved');
    else if (type === 'confirmed') navigate('/reports?status=Confirmed');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>

      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        padding: '28px 16px',
        backgroundColor: 'var(--white)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #E3F2FD 100%)',
        border: '1px solid var(--border-color)',
        minHeight: '210px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Title level={1} style={{
          fontSize: '28px',
          fontWeight: 800,
          color: 'var(--primary-color)',
          fontFamily: 'var(--font-secondary)',
          marginBottom: '8px',
          lineHeight: '1.3'
        }}>
          {t('Community Water Intelligence') || 'Community Water Intelligence'}
        </Title>
        <Paragraph style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          maxWidth: '550px',
          margin: '0 auto 20px auto',
          lineHeight: '1.6',
          minHeight: '48px'
        }}>
          {t('Help identify, verify, and monitor water leaks, supply shortages, and broken taps in your local community.') || 'Help identify, verify, and monitor water leaks, supply shortages, and broken taps in your local community.'}
        </Paragraph>
        <Button
          type="primary"
          size="large"
          icon={<AlertOutlined />}
          onClick={() => navigate('/report')}
          style={{
            borderRadius: '50px',
            padding: '10px 28px',
            height: '46px',
            fontSize: '15px',
            fontWeight: 600,
            fontFamily: 'var(--font-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--primary-color)',
            borderColor: 'var(--primary-color)',
            boxShadow: '0 4px 14px rgba(21, 101, 192, 0.25)',
          }}
        >
          {t('Report Issue') || 'Report Issue'}
        </Button>
      </div>

      {/* Statistics Section */}
      <StatsCards stats={stats} loading={loadingStats} onCardClick={handleStatsCardClick} />

      {/* Full Width Live Issue Map Section */}
      <div style={{
        marginTop: '24px',
        background: 'var(--white)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        minHeight: '520px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#F8FAFC'
        }}>
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-secondary)',
              margin: 0
            }}>
              🗺️ {t('Community Issue Map')}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {t('Live water infrastructure issue reports across Kerala')}
            </span>
          </div>
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/reports')}
            style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '8px' }}
          >
            {t('View All Reports')}
          </Button>
        </div>
        <div style={{ flex: 1, minHeight: '480px' }}>
          <LeafletMap
            reports={recentReports}
            center={[10.8505, 76.2711]}
            zoom={8}
          />
        </div>
      </div>

    </div>
  );
};

export default Home;
