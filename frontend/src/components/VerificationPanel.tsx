import React, { useState } from 'react';
import { Card, Button, Space, message, Badge } from 'antd';
import { 
  CheckOutlined, 
  CopyOutlined, 
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { verifyReport, getSessionId, Report } from '../api';

interface VerificationPanelProps {
  report: Report;
  onUpdate: (updatedReport: Report) => void;
}

const VerificationPanel: React.FC<VerificationPanelProps> = ({ report, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleVote = async (type: 'Confirmed' | 'Duplicate' | 'Resolved') => {
    setLoading(true);
    const sessionId = getSessionId();

    try {
      const updated = await verifyReport(report.id, {
        verification_type: type,
        session_id: sessionId
      });
      onUpdate(updated);
      message.success(`Thanks for your feedback! Marked as ${type}.`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        message.warning(`You have already marked this report as ${type}.`);
      } else {
        message.error(err.response?.data?.detail || 'Failed to submit verification.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}><InfoCircleOutlined style={{ color: 'var(--primary-color)' }} /> Community Verification</div>}
      bodyStyle={{ padding: '20px' }}
      style={{ border: '1px solid var(--border-color)' }}
    >
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Help verify this report. If you are near this location, please confirm if this issue is active, resolved, or duplicate.
      </p>

      {/* Grid of Current Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ backgroundColor: '#E8F5E9', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>CONFIRMED</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success-color)' }}>
            {report.verification_counts.confirmed}
          </span>
        </div>
        <div style={{ backgroundColor: '#FFF3E0', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>DUPLICATE</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--warning-color)' }}>
            {report.verification_counts.duplicate}
          </span>
        </div>
        <div style={{ backgroundColor: '#E3F2FD', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>RESOLVED</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-color)' }}>
            {report.verification_counts.resolved}
          </span>
        </div>
      </div>

      {/* Verification Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Button 
          type="default" 
          icon={<CheckOutlined />} 
          loading={loading}
          disabled={report.status === 'Resolved'}
          onClick={() => handleVote('Confirmed')}
          style={{ 
            borderColor: 'var(--success-color)', 
            color: 'var(--success-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '40px',
            borderRadius: 'var(--radius-md)'
          }}
        >
          Confirm Issue Exists
        </Button>
        
        <Button 
          type="default" 
          icon={<CopyOutlined />} 
          loading={loading}
          disabled={report.status === 'Resolved'}
          onClick={() => handleVote('Duplicate')}
          style={{ 
            borderColor: 'var(--warning-color)', 
            color: 'var(--warning-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '40px',
            borderRadius: 'var(--radius-md)'
          }}
        >
          Mark as Duplicate
        </Button>

        <Button 
          type="default" 
          icon={<CheckCircleOutlined />} 
          loading={loading}
          onClick={() => handleVote('Resolved')}
          style={{ 
            borderColor: 'var(--primary-color)', 
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '40px',
            borderRadius: 'var(--radius-md)'
          }}
        >
          {report.status === 'Resolved' ? 'Verify Still Resolved' : 'Mark as Fixed / Resolved'}
        </Button>
      </div>
    </Card>
  );
};

export default VerificationPanel;
