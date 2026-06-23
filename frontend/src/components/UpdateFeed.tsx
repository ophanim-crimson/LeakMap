import React, { useState } from 'react';
import { Card, Input, Button, Timeline, message, Empty } from 'antd';
import { CommentOutlined, SendOutlined } from '@ant-design/icons';
import { addReportUpdate, Report } from '../api';

const { TextArea } = Input;

interface UpdateFeedProps {
  report: Report;
  onUpdate: (updatedReport: Report) => void;
}

const UpdateFeed: React.FC<UpdateFeedProps> = ({ report, onUpdate }) => {
  const [newUpdate, setNewUpdate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitUpdate = async () => {
    if (!newUpdate.trim()) {
      message.warning('Please enter a comment.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await addReportUpdate(report.id, {
        update_text: newUpdate.trim()
      });
      onUpdate(updated);
      setNewUpdate('');
      message.success('Comment submitted successfully.');
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Failed to submit update.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTimelineItems = () => {
    return report.updates.map((update) => {
      const dateStr = new Date(update.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        children: (
          <div style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              {update.update_text}
            </p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {dateStr}
            </span>
          </div>
        ),
        color: 'var(--primary-color)'
      };
    });
  };

  return (
    <Card 
      title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}><CommentOutlined style={{ color: 'var(--primary-color)' }} /> Community Updates</div>}
      bodyStyle={{ padding: '20px' }}
      style={{ border: '1px solid var(--border-color)' }}
    >
      {/* Submit Update Form */}
      <div style={{ marginBottom: '24px' }}>
        <TextArea
          rows={3}
          value={newUpdate}
          onChange={(e) => setNewUpdate(e.target.value)}
          placeholder="Share progress or changes (e.g., municipal crew arrived, leak has worsened, tap replaced)..."
          maxLength={1000}
          style={{ borderRadius: 'var(--radius-md)', marginBottom: '10px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={submitting}
            onClick={handleSubmitUpdate}
            style={{ 
              borderRadius: '20px', 
              padding: '6px 20px',
              display: 'flex',
              alignItems: 'center',
              height: 'auto'
            }}
          >
            Post Update
          </Button>
        </div>
      </div>

      {/* Updates Timeline */}
      <div>
        {report.updates.length === 0 ? (
          <Empty 
            description="No updates posted yet. Be the first to share details!" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        ) : (
          <Timeline items={getTimelineItems()} style={{ marginTop: '10px' }} />
        )}
      </div>
    </Card>
  );
};

export default UpdateFeed;
