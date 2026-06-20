import React, { useState, useEffect } from 'react';
import { Button, Input, Space, Divider, Row, Col, Badge, List, message, Spin, Typography } from 'antd';
import { 
  ArrowLeftOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  FlagOutlined, 
  CommentOutlined, 
  CalendarOutlined, 
  EnvironmentOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Text, Title, Paragraph } = Typography;

const ReportDetails = ({ reportId, onBack, apiBaseUrl = 'http://localhost:8000' }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [votingType, setVotingType] = useState(null); // 'Confirmed', 'Duplicate', 'Resolved'

  const fetchReportDetails = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/reports/${reportId}`);
      setReport(response.data);
    } catch (error) {
      console.error(error);
      message.error("Failed to load report details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchReportDetails();
    }
  }, [reportId]);

  const handleVote = async (type) => {
    setVotingType(type);
    try {
      await axios.post(`${apiBaseUrl}/api/reports/${reportId}/verify`, { vote_type: type });
      message.success(`Voted: "${type}" successfully!`);
      // Refresh report details to update counts and possibly status
      await fetchReportDetails();
    } catch (error) {
      console.error(error);
      message.error("Failed to submit verification vote.");
    } finally {
      setVotingType(null);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentInput.trim()) {
      message.warning("Comment text cannot be empty.");
      return;
    }
    setSubmittingComment(true);
    try {
      await axios.post(`${apiBaseUrl}/api/reports/${reportId}/updates`, { comment: commentInput });
      message.success("Community update added.");
      setCommentInput('');
      // Refresh details
      await fetchReportDetails();
    } catch (error) {
      console.error(error);
      message.error("Failed to add community update.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return <span className="badge badge-resolved">Resolved</span>;
      case 'Duplicate':
        return <span className="badge badge-duplicate">Duplicate</span>;
      default:
        return <span className="badge badge-active">Active</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" tip="Loading leak details..." />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h3>Report Not Found</h3>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginTop: '16px' }}>Back to Map</Button>
      </div>
    );
  }

  // Format date
  const formattedDate = new Date(report.created_date).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={onBack} 
        style={{ marginBottom: '20px' }}
      >
        Back to Map
      </Button>

      <Row gutter={[24, 24]}>
        {/* Left Column: Details & Images */}
        <Col xs={24} md={14}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Report ID: LM-{report.id}
              </span>
              <Title level={2} style={{ margin: '4px 0 8px 0' }}>{report.issue_type}</Title>
            </div>
            <div>
              {getStatusBadge(report.status)}
            </div>
          </div>

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '13px' }}>
              <span><CalendarOutlined /> Reported: {formattedDate}</span>
              <span><EnvironmentOutlined /> Coords: {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>
            </div>

            <div>
              <Title level={4}>Description</Title>
              <Paragraph style={{ fontSize: '15px', whiteSpace: 'pre-line' }}>{report.description}</Paragraph>
            </div>

            {/* Photo Section */}
            <div>
              <Title level={4}>Photograph</Title>
              {report.image_url ? (
                <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', width: '100%', maxHeight: '380px' }}>
                  <img 
                    src={`${apiBaseUrl}${report.image_url}`} 
                    alt="Leak Photograph" 
                    style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '380px', objectFit: 'contain', background: '#f0f2f5' }}
                  />
                </div>
              ) : (
                <div style={{ background: '#f5f7fa', borderRadius: 'var(--radius-md)', padding: '40px 20px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                  <span style={{ fontSize: '42px', display: 'block', marginBottom: '10px' }}>📷</span>
                  <Text type="secondary">No photograph was attached to this report.</Text>
                </div>
              )}
            </div>

            {/* Verification Voting */}
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <Title level={4} style={{ marginBottom: '16px' }}>Community Verification</Title>
              <Paragraph type="secondary" style={{ fontSize: '13px' }}>
                Verify this report to assist water utilities and fellow citizens. Submissions with 3 or more "Resolved" or "Duplicate" votes automatically update the system status.
              </Paragraph>
              
              <Row gutter={[12, 12]} style={{ marginTop: '12px' }}>
                <Col xs={8}>
                  <Button 
                    type="default" 
                    icon={<CheckCircleOutlined style={{ color: 'var(--color-active)' }} />} 
                    onClick={() => handleVote('Confirmed')}
                    loading={votingType === 'Confirmed'}
                    block
                  >
                    Confirm ({report.verifications?.confirmed || 0})
                  </Button>
                </Col>
                <Col xs={8}>
                  <Button 
                    type="default" 
                    icon={<FlagOutlined style={{ color: 'var(--color-overflow)' }} />} 
                    onClick={() => handleVote('Duplicate')}
                    loading={votingType === 'Duplicate'}
                    block
                  >
                    Duplicate ({report.verifications?.duplicate || 0})
                  </Button>
                </Col>
                <Col xs={8}>
                  <Button 
                    type="default" 
                    icon={<CheckCircleOutlined style={{ color: 'var(--color-resolved)' }} />} 
                    onClick={() => handleVote('Resolved')}
                    loading={votingType === 'Resolved'}
                    block
                  >
                    Resolved ({report.verifications?.resolved || 0})
                  </Button>
                </Col>
              </Row>
            </div>
          </Space>
        </Col>

        {/* Right Column: Community Comments/Updates */}
        <Col xs={24} md={10}>
          <Title level={3} style={{ borderBottom: '2px solid var(--primary-light)', paddingBottom: '8px', marginBottom: '16px' }}>
            <CommentOutlined /> Community Updates
          </Title>

          {/* Add comment Form */}
          <div style={{ marginBottom: '24px' }}>
            <Input.TextArea
              rows={3}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Provide an update (e.g. 'Leak has stopped but road is still muddy' or 'Utility crew spotted fixing this')"
              style={{ marginBottom: '10px' }}
            />
            <Button 
              type="primary" 
              onClick={handleCommentSubmit} 
              loading={submittingComment}
              block
            >
              Post Update
            </Button>
          </div>

          {/* Comment list */}
          <List
            header={<Text strong>{report.updates?.length || 0} updates shared</Text>}
            itemLayout="horizontal"
            dataSource={report.updates || []}
            renderItem={(item) => (
              <List.Item style={{ padding: '12px 0' }}>
                <List.Item.Meta
                  title={
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      🕒 {new Date(item.timestamp).toLocaleString()}
                    </span>
                  }
                  description={
                    <span style={{ color: 'var(--text-main)', fontSize: '14px', whiteSpace: 'pre-line' }}>
                      {item.comment}
                    </span>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No updates posted yet. Be the first to share additional details!</div> }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ReportDetails;
