import React from 'react';
import { Card, Tag, Button } from 'antd';
import { EnvironmentOutlined, CalendarOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { Report } from '../api';
import { useNavigate } from 'react-router-dom';

interface ReportCardProps {
  report: Report;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const navigate = useNavigate();
  const dateStr = new Date(report.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Get tag color based on status
  const getStatusTag = () => {
    if (report.status === 'Resolved') {
      return <Tag color="success" style={{ borderRadius: '12px', padding: '2px 10px' }}>Resolved</Tag>;
    }
    return <Tag color="error" style={{ borderRadius: '12px', padding: '2px 10px' }}>Active</Tag>;
  };

  const hasPhoto = report.photos && report.photos.length > 0;
  const primaryPhoto = hasPhoto ? report.photos[0] : null;
  const apiBase = import.meta.env.VITE_API_URL || '';
  const imgUrl = primaryPhoto ? (primaryPhoto.image_url.startsWith('http') ? primaryPhoto.image_url : `${apiBase}${primaryPhoto.image_url}`) : '';

  return (
    <Card 
      bodyStyle={{ padding: '16px' }}
      style={{ 
        marginBottom: '16px',
        backgroundColor: 'var(--white)',
        cursor: 'pointer'
      }}
      onClick={() => navigate(`/report/${report.id}`)}
    >
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: 'var(--primary-color)',
                fontFamily: 'var(--font-secondary)',
                marginBottom: '2px'
              }}>
                {report.issue_type}
              </h4>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {report.report_code}
              </span>
            </div>
            {getStatusTag()}
          </div>

          <p style={{ 
            fontSize: '14px', 
            color: 'var(--text-secondary)', 
            margin: 0,
            height: '40px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {report.description || 'No description provided.'}
          </p>
        </div>

        {hasPhoto && (
          <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <img 
              src={imgUrl} 
              alt={report.issue_type} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        fontSize: '12px', 
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '12px'
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CalendarOutlined /> {dateStr}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircleOutlined /> Confirmed: {report.verification_counts.confirmed}
          </span>
        </div>
        
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          style={{ padding: 0, height: 'auto', fontSize: '13px', display: 'flex', alignItems: 'center' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/report/${report.id}`);
          }}
        >
          View Details
        </Button>
      </div>
    </Card>
  );
};

export default ReportCard;
