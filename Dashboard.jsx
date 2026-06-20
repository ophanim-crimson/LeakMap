import React from 'react';
import { Card, Row, Col, Statistic, List, Badge, Typography, Button, Space } from 'antd';
import { 
  DashboardOutlined, 
  AlertOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined, 
  ArrowRightOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Dashboard = ({ reports = [], onSelectReport, onViewReportForm }) => {
  // 1. Calculate Metrics
  const totalReports = reports.length;
  const activeReports = reports.filter(r => r.status === 'Active').length;
  const resolvedReports = reports.filter(r => r.status === 'Resolved').length;
  const duplicateReports = reports.filter(r => r.status === 'Duplicate').length;

  // Calculate reports in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const reportsLast24h = reports.filter(r => new Date(r.created_date) > oneDayAgo).length;

  // 2. Aggregate counts by issue type
  const typeCounts = {
    'Leak': 0,
    'Overflow': 0,
    'Damaged Infrastructure': 0,
    'Supply Issue': 0
  };
  reports.forEach(r => {
    if (typeCounts[r.issue_type] !== undefined) {
      typeCounts[r.issue_type]++;
    }
  });

  const maxTypeCount = Math.max(...Object.values(typeCounts), 1); // Avoid division by zero

  // Emojis for list items
  const getIssueEmoji = (type) => {
    switch (type) {
      case 'Overflow': return '🌊';
      case 'Damaged Infrastructure': return '🔧';
      case 'Supply Issue': return '🚫';
      default: return '💧';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return <Badge status="success" text="Resolved" />;
      case 'Duplicate':
        return <Badge status="default" text="Duplicate" />;
      default:
        return <Badge status="processing" text="Active" />;
    }
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Introduction Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DashboardOutlined style={{ color: 'var(--primary)' }} />
            Infrastructure Dashboard
          </Title>
          <Text type="secondary">Real-time community metrics on local water infrastructure issues.</Text>
        </div>
        <Button type="primary" size="large" onClick={onViewReportForm} style={{ boxShadow: '0 4px 12px rgba(0, 119, 182, 0.25)' }}>
          ➕ Report Leak / Issue
        </Button>
      </div>

      {/* Grid of Key Metrics Cards */}
      <div className="dashboard-grid">
        <div className="glass-card stats-card">
          <div className="stats-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <AlertOutlined />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)' }}>Total Submissions</span>
            <span style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.2 }}>{totalReports}</span>
          </div>
        </div>

        <div className="glass-card stats-card">
          <div className="stats-icon" style={{ backgroundColor: 'hsl(355, 85%, 95%)', color: 'var(--color-leak)' }}>
            <InfoCircleOutlined />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)' }}>Active Issues</span>
            <span style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.2 }}>{activeReports}</span>
          </div>
        </div>

        <div className="glass-card stats-card">
          <div className="stats-icon" style={{ backgroundColor: 'hsl(145, 75%, 95%)', color: 'var(--color-resolved)' }}>
            <CheckCircleOutlined />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)' }}>Resolved Issues</span>
            <span style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.2 }}>{resolvedReports}</span>
          </div>
        </div>

        <div className="glass-card stats-card">
          <div className="stats-icon" style={{ backgroundColor: 'hsl(210, 85%, 95%)', color: 'var(--color-supply)' }}>
            <ClockCircleOutlined />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)' }}>Last 24 Hours</span>
            <span style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.2 }}>{reportsLast24h}</span>
          </div>
        </div>
      </div>

      {/* Charts & Lists Row */}
      <Row gutter={[24, 24]}>
        {/* Issue Type Distribution Custom SVG Chart */}
        <Col xs={24} lg={12}>
          <div className="glass-card" style={{ height: '100%' }}>
            <Title level={4} style={{ marginBottom: '20px' }}>Issue Type Distribution</Title>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
              {Object.entries(typeCounts).map(([type, count]) => {
                const percentage = (count / maxTypeCount) * 100;
                let color = 'var(--color-leak)';
                if (type === 'Overflow') color = 'var(--color-overflow)';
                else if (type === 'Damaged Infrastructure') color = 'var(--color-damaged)';
                else if (type === 'Supply Issue') color = 'var(--color-supply)';

                return (
                  <div key={type} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                      <Text strong>{getIssueEmoji(type)} {type}</Text>
                      <Text type="secondary">{count} ({totalReports > 0 ? Math.round((count / totalReports) * 100) : 0}%)</Text>
                    </div>
                    {/* Animated custom bar chart element */}
                    <div style={{ 
                      width: '100%', 
                      height: '14px', 
                      backgroundColor: '#e9ecef', 
                      borderRadius: '10px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${Math.max(percentage, 2)}%`, 
                        height: '100%', 
                        backgroundColor: color, 
                        borderRadius: '10px',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.05)'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Styled Pie Chart Fallback Legend */}
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-color)', marginTop: '24px', paddingTop: '16px', fontSize: '12px' }}>
              <span><Badge color="var(--color-leak)" /> Leaks</span>
              <span><Badge color="var(--color-overflow)" /> Overflows</span>
              <span><Badge color="var(--color-damaged)" /> Infrastructure</span>
              <span><Badge color="var(--color-supply)" /> Supply Interruptions</span>
            </div>
          </div>
        </Col>

        {/* Recently Reported Issues List */}
        <Col xs={24} lg={12}>
          <div className="glass-card" style={{ height: '100%' }}>
            <Title level={4} style={{ marginBottom: '20px' }}>Recent Reports</Title>
            
            <List
              itemLayout="horizontal"
              dataSource={reports.slice(0, 5)}
              renderItem={(report) => (
                <List.Item
                  actions={[
                    <Button 
                      type="text" 
                      icon={<ArrowRightOutlined />} 
                      onClick={() => onSelectReport(report.id)}
                    />
                  ]}
                  style={{ padding: '12px 0' }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong style={{ cursor: 'pointer' }} onClick={() => onSelectReport(report.id)}>
                          {getIssueEmoji(report.issue_type)} {report.issue_type}
                        </Text>
                        {getStatusBadge(report.status)}
                      </Space>
                    }
                    description={
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ color: 'var(--text-main)', margin: '2px 0' }}>
                          {report.description.substring(0, 80)}{report.description.length > 80 ? '...' : ''}
                        </div>
                        <Text type="secondary">
                          🕒 {new Date(report.created_date).toLocaleDateString()} at {new Date(report.created_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No reports submitted yet. Use the button above to report the first issue!</div> }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
