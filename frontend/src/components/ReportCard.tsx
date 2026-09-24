import React from 'react';
import { Tag } from 'antd';
import { CalendarOutlined, ArrowRightOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Report, getImageUrl } from '../api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ReportCardProps {
  report: Report;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const dateStr = new Date(report.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const primaryPhoto = report.photos && report.photos.length > 0 ? report.photos[0] : null;
  const hasPhoto = !!primaryPhoto;
  const imgUrl = primaryPhoto ? getImageUrl(primaryPhoto.image_url) : '';

  const urgencyColor = (u?: string) => {
    if (u === 'Critical') return '#DC2626';
    if (u === 'High') return '#EA580C';
    if (u === 'Medium') return '#D97706';
    return '#16A34A';
  };

  return (
    <div 
      onClick={() => navigate(`/report/${report.id}`)}
      style={{ 
        marginBottom: '12px',
        backgroundColor: 'var(--white)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#93C5FD';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-color)', fontFamily: 'var(--font-secondary)' }}>
              {t(report.issue_type) || report.issue_type}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {report.report_code}
            </span>
            {report.district && (
              <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: 4, backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>
                {report.district}
              </span>
            )}
          </div>

          <p style={{ 
            fontSize: '13px', 
            color: 'var(--text-secondary)', 
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '1.4'
          }}>
            {report.description || t('No description provided.')}
          </p>
        </div>

        {/* Right side tags & optional photo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ 
              padding: '2px 8px', 
              borderRadius: '4px', 
              fontSize: '11px', 
              fontWeight: 700,
              backgroundColor: report.status === 'Active' ? '#FEE2E2' : '#D1FAE5',
              color: report.status === 'Active' ? '#B91C1C' : '#065F46'
            }}>
              {t(report.status)}
            </span>
            {report.ai_urgency && report.ai_urgency !== 'Pending' && (
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '11px', 
                fontWeight: 600,
                backgroundColor: urgencyColor(report.ai_urgency) + '18',
                color: urgencyColor(report.ai_urgency)
              }}>
                {t(report.ai_urgency)}
              </span>
            )}
          </div>

          {hasPhoto && (
            <div style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <img 
                src={imgUrl} 
                alt="" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        fontSize: '12px', 
        color: 'var(--text-muted)',
        borderTop: '1px solid #F1F5F9',
        paddingTop: '8px'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CalendarOutlined /> {dateStr}
        </span>
        <span style={{ color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
          {t('View Details')} <ArrowRightOutlined style={{ fontSize: '10px' }} />
        </span>
      </div>
    </div>
  );
};

export default ReportCard;
