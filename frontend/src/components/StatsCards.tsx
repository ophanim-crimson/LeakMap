import React from 'react';
import { Card, Statistic } from 'antd';
import { 
  FileTextOutlined, 
  AlertOutlined, 
  CheckCircleOutlined, 
  SafetyCertificateOutlined 
} from '@ant-design/icons';
import { Statistics } from '../api';

interface StatsCardsProps {
  stats: Statistics | null;
  loading: boolean;
  onCardClick?: (type: 'total' | 'active' | 'confirmed' | 'resolved') => void;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading, onCardClick }) => {
  const cardItems = [
    {
      key: 'total',
      title: 'Total Reports',
      value: stats?.total ?? 0,
      icon: <FileTextOutlined style={{ fontSize: '24px', color: 'var(--primary-color)' }} />,
      color: 'var(--primary-color)',
      bgColor: '#E3F2FD'
    },
    {
      key: 'active',
      title: 'Active Issues',
      value: stats?.active ?? 0,
      icon: <AlertOutlined style={{ fontSize: '24px', color: 'var(--warning-color)' }} />,
      color: 'var(--warning-color)',
      bgColor: '#FFF3E0'
    },
    {
      key: 'confirmed',
      title: 'Confirmed by Community',
      value: stats?.confirmed ?? 0,
      icon: <SafetyCertificateOutlined style={{ fontSize: '24px', color: '#673AB7' }} />,
      color: '#673AB7',
      bgColor: '#EDE7F6'
    },
    {
      key: 'resolved',
      title: 'Resolved Issues',
      value: stats?.resolved ?? 0,
      icon: <CheckCircleOutlined style={{ fontSize: '24px', color: 'var(--success-color)' }} />,
      color: 'var(--success-color)',
      bgColor: '#E8F5E9'
    }
  ];

  return (
    <div className="stats-grid">
      {cardItems.map((item, idx) => (
        <Card 
          key={idx} 
          loading={loading}
          bodyStyle={{ padding: '20px' }}
          style={{ 
            border: 'none',
            cursor: onCardClick ? 'pointer' : 'default',
            transition: 'all 0.2s ease'
          }}
          onClick={() => onCardClick?.(item.key as any)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--text-secondary)', 
                marginBottom: '4px',
                fontWeight: 500
              }}>
                {item.title}
              </p>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: 700, 
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-secondary)',
                lineHeight: '1.2'
              }}>
                {item.value}
              </h2>
            </div>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              backgroundColor: item.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {item.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
