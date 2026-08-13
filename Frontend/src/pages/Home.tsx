import React, { useState, useEffect } from 'react';
import { Button, Typography, Spin, Row, Col, Empty } from 'antd';
import { AlertOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StatsCards from '../components/StatsCards';
import ReportCard from '../components/ReportCard';
import LeafletMap from '../components/LeafletMap';
import { fetchStatistics, fetchPublicReports, Statistics, Report } from '../api';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [stats, setStats] = useState<Statistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const loadData = async () => {
    setLoadingStats(true);
    setLoadingReports(true);
    try {
      const [statsData, reportsData] = await Promise.all([
        fetchStatistics(),
        fetchPublicReports()
      ]);
      setStats(statsData);
      setRecentReports(reportsData);
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
        border: '1px solid var(--border-color)'
      }}>
        <Title level={1} style={{
          fontSize: '28px',
          fontWeight: 800,
          color: 'var(--primary-color)',
          fontFamily: 'var(--font-secondary)',
          marginBottom: '8px'
        }}>
          {t('Community Water Intelligence') || 'Community Water Intelligence'}
        </Title>
        <Paragraph style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          maxWidth: '550px',
          margin: '0 auto 20px auto',
          lineHeight: '1.6'
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

      {/* Desktop Two-Column Section: Recent Reports + Map */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>

        {/* Recent Reports Column */}
        <Col xs={24} lg={12}>
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            height: '100%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-secondary)',
                margin: 0
              }}>
                🕐 {t('Recent Anonymous Reports')}
              </h3>
              <Button
                type="link"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate('/reports')}
                style={{ padding: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                View All
              </Button>
            </div>

            {loadingReports ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Spin />
              </div>
            ) : recentReports.length === 0 ? (
              <Empty description="No reports yet. Be the first to report an issue!" />
            ) : (
              <div>
                {recentReports.map(report => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            )}
          </div>
        </Col>

        {/* Map Column — desktop only */}
        <Col xs={0} lg={12}>
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            height: '100%',
            minHeight: '480px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-secondary)',
                margin: 0
              }}>
                🗺️ {t('Issue Map') || 'Issue Map'}
              </h3>
              <Button
                type="link"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate('/reports')}
                style={{ padding: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                View All
              </Button>
            </div>
            <div style={{ flex: 1 }}>
              <LeafletMap
                reports={recentReports}
                center={[9.9312, 76.2673]}
                zoom={10}
              />
            </div>
          </div>
        </Col>

      </Row>

    </div>
  );
};

export default Home;
