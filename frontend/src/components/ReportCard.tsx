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
        marginBottom: '16px',
        height: '40px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}>
        {report.description || 'No description provided.'}
      </p>

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
