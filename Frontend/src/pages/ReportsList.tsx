import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Spin, Empty, Typography, Tag } from 'antd';
import { SearchOutlined, ArrowLeftOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReportCard from '../components/ReportCard';
import { fetchReports, Report } from '../api';

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  all:       { label: 'All Reports',              color: '#1565C0', bg: '#E3F2FD' },
  Active:    { label: 'Active Issues',             color: '#FF9800', bg: '#FFF3E0' },
  Confirmed: { label: 'Confirmed by Community',    color: '#673AB7', bg: '#EDE7F6' },
  Resolved:  { label: 'Resolved Issues',           color: '#4CAF50', bg: '#E8F5E9' },
};

const ReportsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialStatus = searchParams.get('status') || 'all';

  const [reports, setReports] = useState<Report[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);

  const loadData = async () => {
    setLoading(true);
    try {
      const reportsData = await fetchReports({
        page: 1,
        limit: 100,
        ...(searchText.trim() ? { q: searchText } : {}),
        ...(selectedType !== 'all' ? { issue_type: selectedType } : {}),
        ...(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
      });
      setReports(reportsData);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedType, selectedStatus]);

  const meta = STATUS_META[selectedStatus] || STATUS_META['all'];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>

      {/* Back Button */}
      <div style={{ marginBottom: '16px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{
            borderRadius: '10px',
            height: '40px',
            padding: '0 20px',
            fontWeight: 600,
            border: '1px solid var(--border-color)',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary-color)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary-color)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)';
            (e.currentTarget as HTMLButtonElement).style.color = 'inherit';
          }}
        >
          Dashboard
        </Button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Title level={3} style={{ margin: 0, fontFamily: 'var(--font-secondary)', fontSize: '22px' }}>
          {meta.label}
        </Title>
        <Text style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {loading ? 'Loading…' : `${reports.length} ${reports.length === 1 ? 'report' : 'reports'} found`}
        </Text>
      </div>

      {/* Status Tab Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        {Object.entries(STATUS_META).map(([key, m]) => (
          <div
            key={key}
            onClick={() => setSelectedStatus(key)}
            style={{
              padding: '6px 16px',
              borderRadius: '50px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: selectedStatus === key ? m.color : m.bg,
              color: selectedStatus === key ? '#fff' : m.color,
              border: `2px solid ${m.color}`,
              transition: 'all 0.2s ease',
              userSelect: 'none',
            }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          placeholder="Search reports by location or description…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onPressEnter={loadData}
          style={{ flex: 1, minWidth: '220px', borderRadius: '10px', height: '40px' }}
          allowClear
        />
        <Select
          value={selectedType}
          onChange={v => setSelectedType(v)}
          style={{ width: '170px', borderRadius: '10px', height: '40px' }}
          placeholder={<><FilterOutlined /> Type</>}
        >
          <Option value="all">All Types</Option>
          <Option value="Leak">💧 Water Leak</Option>
          <Option value="Overflow">🌊 Overflow</Option>
          <Option value="Damaged Tap">🚰 Damaged Tap</Option>
          <Option value="Broken Valve">⚙️ Broken Valve</Option>
          <Option value="Water Supply Issue">🚫 Supply Issue</Option>
          <Option value="Other">📌 Other</Option>
        </Select>
        <Button
          type="primary"
          onClick={loadData}
          style={{ borderRadius: '10px', height: '40px', padding: '0 20px', fontWeight: 600 }}
        >
          Search
        </Button>
      </div>

      {/* Report Count Badge */}
      {!loading && (
        <div style={{ marginBottom: '16px' }}>
          <Tag color={meta.color} style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '50px' }}>
            {reports.length} {reports.length === 1 ? 'report' : 'reports'}
          </Tag>
        </div>
      )}

      {/* Reports Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : reports.length === 0 ? (
        <Empty
          description="No reports found for this filter"
          style={{ padding: '60px 0' }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {reports.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsList;
