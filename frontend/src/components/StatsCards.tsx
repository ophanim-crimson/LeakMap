import React, { useState } from 'react';
import { Statistics } from '../api';
import {
  FileTextOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';

interface StatsCardsProps {
  stats: Statistics | null;
  loading: boolean;
  onCardClick?: (type: 'total' | 'active' | 'confirmed' | 'resolved') => void;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading, onCardClick }) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const cardItems = [
    {
      key: 'total',
      title: 'Total Reports',
      value: stats?.total ?? 0,
      icon: <FileTextOutlined style={{ fontSize: '22px' }} />,
      color: '#1565C0',
      bgColor: '#E3F2FD'
    },
    {
      key: 'active',
      title: 'Active Issues',
      value: stats?.active ?? 0,
      icon: <AlertOutlined style={{ fontSize: '22px' }} />,
      color: '#FF9800',
      bgColor: '#FFF3E0'
    },
    {
      key: 'confirmed',
      title: 'Confirmed',
      value: stats?.confirmed ?? 0,
      icon: <SafetyCertificateOutlined style={{ fontSize: '22px' }} />,
      color: '#673AB7',
      bgColor: '#EDE7F6'
    },
    {
      key: 'resolved',
      title: 'Resolved',
      value: stats?.resolved ?? 0,
      icon: <CheckCircleOutlined style={{ fontSize: '22px' }} />,
      color: '#4CAF50',
      bgColor: '#E8F5E9'
    }
  ];

  return (
    <div className="stats-grid">
      {cardItems.map((item) => {
        const isHovered = hoveredKey === item.key;
        return (
          <div
            key={item.key}
            onClick={() => onCardClick?.(item.key as any)}
            onMouseEnter={() => setHoveredKey(item.key)}
            onMouseLeave={() => setHoveredKey(null)}
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
              border: `2px solid ${isHovered ? item.color : '#E2E8F0'}`,
              cursor: onCardClick ? 'pointer' : 'default',
              transform: isHovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
              boxShadow: isHovered
                ? `0 8px 20px ${item.color}25`
                : '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
              userSelect: 'none',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: isHovered ? item.color : item.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s ease',
                }}
              >
                {React.cloneElement(item.icon as React.ReactElement<{ style: React.CSSProperties }>, {
                  style: { fontSize: '18px', color: isHovered ? '#fff' : item.color }
                })}
              </div>
              {onCardClick && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isHovered ? item.color : '#A0AEC0',
                  transition: 'color 0.2s',
                  letterSpacing: '0.02em'
                }}>
                  View →
                </span>
              )}
            </div>
            <p style={{
              fontSize: '13px',
              color: '#718096',
              marginBottom: '4px',
              fontWeight: 500
            }}>
              {item.title}
            </p>
            <h2 style={{
              fontSize: '30px',
              fontWeight: 700,
              color: isHovered ? item.color : '#1A202C',
              fontFamily: 'var(--font-secondary)',
              lineHeight: '1.1',
              transition: 'color 0.2s',
              margin: 0
            }}>
              {loading ? '—' : item.value}
            </h2>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
