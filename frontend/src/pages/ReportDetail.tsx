import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tag, Button, Spin, Typography, Result, Space } from 'antd';
import { 
  ArrowLeftOutlined, 
  CalendarOutlined, 
  EnvironmentOutlined,
  CameraOutlined,
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import LeafletMap from '../components/LeafletMap';
import VerificationPanel from '../components/VerificationPanel';
import UpdateFeed from '../components/UpdateFeed';
import ExpandableText from '../components/ExpandableText';
import { fetchReportById, Report } from '../api';

const { Title, Paragraph, Text } = Typography;

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fullscreen Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);

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

  // Fullscreen controls
  const handleNextPhoto = () => {
    if (!report || !report.photos || report.photos.length === 0) return;
    setActivePhotoIndex((prev) => (prev + 1) % report.photos.length);
    setZoomScale(1);
  };

  const handlePrevPhoto = () => {
    if (!report || !report.photos || report.photos.length === 0) return;
    setActivePhotoIndex((prev) => (prev - 1 + report.photos.length) % report.photos.length);
    setZoomScale(1);
  };

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(prev + 0.5, 3.0));
  };

  const handleZoomOut = () => {
    setZoomScale(prev => Math.max(prev - 0.5, 1.0));
  };

  // Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    if (diff > 50) {
      handleNextPhoto();
      setTouchStart(null);
    } else if (diff < -50) {
      handlePrevPhoto();
      setTouchStart(null);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!viewerOpen) return;
      if (e.key === 'ArrowRight') handleNextPhoto();
      else if (e.key === 'ArrowLeft') handlePrevPhoto();
      else if (e.key === 'Escape') {
        setViewerOpen(false);
        setZoomScale(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerOpen, report]);

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
          onClick={() => navigate(-1)}
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

              {/* AI Urgency Assessment */}
              {report.ai_urgency && report.ai_urgency !== 'Pending' && (
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '12px 16px', 
                  borderRadius: '8px',
                  background: report.ai_urgency === 'Critical' ? 'linear-gradient(135deg, rgba(255,77,79,0.1), rgba(255,77,79,0.05))' 
                    : report.ai_urgency === 'High' ? 'linear-gradient(135deg, rgba(250,173,20,0.1), rgba(250,173,20,0.05))'
                    : report.ai_urgency === 'Medium' ? 'linear-gradient(135deg, rgba(24,144,255,0.1), rgba(24,144,255,0.05))'
                    : 'linear-gradient(135deg, rgba(82,196,26,0.1), rgba(82,196,26,0.05))',
                  border: `1px solid ${report.ai_urgency === 'Critical' ? 'rgba(255,77,79,0.3)' 
                    : report.ai_urgency === 'High' ? 'rgba(250,173,20,0.3)'
                    : report.ai_urgency === 'Medium' ? 'rgba(24,144,255,0.3)'
                    : 'rgba(82,196,26,0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '20px' }}>
                    {report.ai_urgency === 'Critical' && '🔴'}
                    {report.ai_urgency === 'High' && '🟠'}
                    {report.ai_urgency === 'Medium' && '🟡'}
                    {report.ai_urgency === 'Low' && '🟢'}
                  </span>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                      AI URGENCY ASSESSMENT
                    </span>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: 700, 
                      color: report.ai_urgency === 'Critical' ? '#ff4d4f' 
                        : report.ai_urgency === 'High' ? '#faad14'
                        : report.ai_urgency === 'Medium' ? '#1890ff'
                        : '#52c41a'
                    }}>
                      {report.ai_urgency} Priority
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  DESCRIPTION
                </span>
                <Paragraph style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                  {report.description ? (
                    <ExpandableText text={report.description} wordLimit={40} />
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description provided for this report.</span>
                  )}
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
                title={<div style={{ fontSize: '15px' }}><CameraOutlined /> Attached Photos ({report.photos.length})</div>}
                bodyStyle={{ padding: '16px', backgroundColor: 'var(--white)' }}
                style={{ border: '1px solid var(--border-color)', overflow: 'hidden' }}
              >
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  scrollbarWidth: 'thin'
                }}>
                  {report.photos.map((photo, index) => {
                    const apiBase = import.meta.env.VITE_API_URL || '';
                    const imgUrl = photo.image_url.startsWith('http') ? photo.image_url : `${apiBase}${photo.image_url}`;
                    const isPrimary = index === 0;

                    return (
                      <div 
                        key={photo.id}
                        onClick={() => {
                          setActivePhotoIndex(index);
                          setViewerOpen(true);
                        }}
                        style={{
                          flexShrink: 0,
                          width: '150px',
                          height: '110px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: isPrimary ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={`Report Photo ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {isPrimary && (
                          <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            backgroundColor: 'var(--primary-color)',
                            color: '#FFF',
                            fontSize: '8px',
                            fontWeight: 700,
                            padding: '2px 4px',
                            borderRadius: '2px'
                          }}>
                            PRIMARY
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Location Map Preview */}
            <Card 
              title={<div style={{ fontSize: '15px' }}><EnvironmentOutlined /> Location Map</div>}
              extra={
                <Button 
                  type="text" 
                  icon={isMapFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
                  onClick={() => setIsMapFullscreen(!isMapFullscreen)} 
                  title={isMapFullscreen ? "Minimize Map" : "Enlarge Map"}
                />
              }
              bodyStyle={{ 
                padding: isMapFullscreen ? 0 : '16px', 
                height: isMapFullscreen ? '100%' : 'auto',
                backgroundColor: 'var(--white)'
              }}
              style={isMapFullscreen ? {
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9999,
                width: '100vw', height: '100vh',
                margin: 0, borderRadius: 0
              } : { border: '1px solid var(--border-color)', overflow: 'hidden' }}
            >
              <div style={{
                width: isMapFullscreen ? '100%' : '50%',
                margin: '0 auto',
                height: isMapFullscreen ? '100%' : '300px',
                borderRadius: isMapFullscreen ? '0' : 'var(--radius-md)',
                overflow: 'hidden'
              }}>
                <LeafletMap
                  reports={[report]}
                  center={[report.latitude, report.longitude]}
                  selectedLocation={[report.latitude, report.longitude]}
                  zoom={15}
                />
              </div>
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

      {/* Fullscreen Viewer Overlay */}
      {viewerOpen && report.photos && report.photos.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            userSelect: 'none'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {/* Close button top right */}
          <Button
            type="text"
            icon={<CloseOutlined style={{ fontSize: '24px', color: '#FFF' }} />}
            onClick={() => {
              setViewerOpen(false);
              setZoomScale(1);
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 10000
            }}
          />

          {/* Photo viewer body */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '80%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
          }}>
            {/* Left Button */}
            {report.photos.length > 1 && (
              <Button
                type="text"
                shape="circle"
                icon={<LeftOutlined style={{ fontSize: '24px', color: '#FFF' }} />}
                onClick={handlePrevPhoto}
                style={{
                  position: 'absolute',
                  left: '20px',
                  zIndex: 10000,
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }}
              />
            )}

            {/* Image Container with Zoom */}
            <div style={{
              transform: `scale(${zoomScale})`,
              transition: 'transform 0.2s ease-in-out',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              maxWidth: '90%',
              maxHeight: '90%'
            }}>
              <img
                src={report.photos[activePhotoIndex].image_url.startsWith('http') 
                  ? report.photos[activePhotoIndex].image_url 
                  : `${import.meta.env.VITE_API_URL || ''}${report.photos[activePhotoIndex].image_url}`
                }
                alt="Fullscreen View"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                }}
              />
            </div>

            {/* Right Button */}
            {report.photos.length > 1 && (
              <Button
                type="text"
                shape="circle"
                icon={<RightOutlined style={{ fontSize: '24px', color: '#FFF' }} />}
                onClick={handleNextPhoto}
                style={{
                  position: 'absolute',
                  right: '20px',
                  zIndex: 10000,
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }}
              />
            )}
          </div>

          {/* Control Bar (Zoom buttons, index counter) */}
          <div style={{
            position: 'absolute',
            bottom: '30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            color: '#FFF'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>
              {activePhotoIndex + 1} / {report.photos.length}
            </div>
            <div style={{ display: 'flex', gap: '16px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: '20px' }}>
              <Button type="link" onClick={handleZoomOut} disabled={zoomScale <= 1} style={{ color: '#FFF', padding: 0 }}>Zoom Out</Button>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
              <Button type="link" onClick={handleZoomIn} disabled={zoomScale >= 3} style={{ color: '#FFF', padding: 0 }}>Zoom In</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportDetail;
