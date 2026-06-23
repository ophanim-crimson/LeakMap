import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tag, Button, Spin, Typography, Result, Space, Image } from 'antd';
import { 
  ArrowLeftOutlined, 
  CalendarOutlined, 
  EnvironmentOutlined,
  TagOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CameraOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LeafletMap from '../components/LeafletMap';
import VerificationPanel from '../components/VerificationPanel';
import UpdateFeed from '../components/UpdateFeed';
import { fetchReportById, Report } from '../api';

const { Title, Paragraph, Text } = Typography;

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReportById(parseInt(id, 10));
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Report not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  const handleUpdate = (updatedReport: Report) => {
    setReport(updatedReport);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 16px' }}>
        <Result
          status="warning"
          title="Error Loading Report"
          subTitle={error || "The report you are looking for does not exist or has been removed."}
          extra={
            <Button type="primary" onClick={() => navigate('/')} style={{ borderRadius: '20px' }}>
              Return Home
            </Button>
          }
        />
      </div>
    );
  }

  const dateStr = new Date(report.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* Back Button & Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          style={{ borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        />
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
            REPORT DETAIL • {report.report_code}
          </span>
          <Title level={3} style={{ margin: 0, fontFamily: 'var(--font-secondary)', fontWeight: 700 }}>
            {report.issue_type}
          </Title>
        </div>
      </div>

      {/* Detail Layout Grid */}
      <Row gutter={[24, 24]}>
        
        {/* Left Column: Info, Photo, Map */}
        <Col xs={24} md={14}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            {/* Core Info Card */}
            <Card bodyStyle={{ padding: '24px' }} style={{ border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <CalendarOutlined /> {dateStr}
                </span>
                
                {report.status === 'Resolved' ? (
                  <Tag color="success" style={{ borderRadius: '12px', padding: '2px 10px', fontSize: '13px' }}>Resolved</Tag>
                ) : (
                  <Tag color="error" style={{ borderRadius: '12px', padding: '2px 10px', fontSize: '13px' }}>Active</Tag>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  DESCRIPTION
                </span>
                <Paragraph style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                  {report.description || 'No description provided for this report.'}
                </Paragraph>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    COORDINATES
                  </span>
                  <Text style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                  </Text>
                </div>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    REPORT CODE
                  </span>
                  <Text style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {report.report_code}
                  </Text>
                </div>
              </div>
            </Card>

            {/* Attached Photo Card (If it exists) */}
            {report.photos && report.photos.length > 0 && (
              <Card 
                title={<div style={{ fontSize: '15px' }}><CameraOutlined /> Attached Photo</div>}
                bodyStyle={{ padding: '0', display: 'flex', justifyContent: 'center', backgroundColor: '#000', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}
                style={{ border: '1px solid var(--border-color)', overflow: 'hidden' }}
              >
                <Image
                  src={report.photos[0].image_url.startsWith('http') ? report.photos[0].image_url : `http://localhost:8000${report.photos[0].image_url}`}
                  alt={report.issue_type}
                  style={{ maxHeight: '400px', objectFit: 'contain', width: '100%' }}
                />
              </Card>
            )}

            {/* Location Map Preview */}
            <Card 
              title={<div style={{ fontSize: '15px' }}><EnvironmentOutlined /> Location Map</div>}
              bodyStyle={{ padding: 0, height: '300px', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}
              style={{ border: '1px solid var(--border-color)', overflow: 'hidden' }}
            >
              <LeafletMap
                reports={[report]}
                center={[report.latitude, report.longitude]}
                selectedLocation={[report.latitude, report.longitude]}
                zoom={15}
              />
            </Card>

          </Space>
        </Col>

        {/* Right Column: Verification & Updates */}
        <Col xs={24} md={10}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            {/* Verification Panel */}
            <VerificationPanel report={report} onUpdate={handleUpdate} />

            {/* Community Update Feed */}
            <UpdateFeed report={report} onUpdate={handleUpdate} />

          </Space>
        </Col>

      </Row>

    </div>
  );
};

export default ReportDetail;
