import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Select, Spin, Empty, Typography, Tag } from 'antd';
import { SearchOutlined, ArrowLeftOutlined, FilterOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReportCard from '../components/ReportCard';
import { fetchPublicReports, fetchReports, fetchAdminReports, Report } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const { Option } = Select;

const PAGE_SIZE = 4;

const ReportsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user } = useAuth();

  const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    all:       { label: t('All Reports'),              color: '#1565C0', bg: '#E3F2FD' },
    Active:    { label: t('Active Issues'),             color: '#FF9800', bg: '#FFF3E0' },
    Confirmed: { label: t('Confirmed by Community'),    color: '#673AB7', bg: '#EDE7F6' },
    Resolved:  { label: t('Resolved Issues'),           color: '#4CAF50', bg: '#E8F5E9' },
  };

  const initialStatus = searchParams.get('status') || 'all';

  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    try {
      let reportsData: Report[] = [];
      if (!user) {
        reportsData = await fetchPublicReports();
      } else if (user.role === 'admin') {
        reportsData = await fetchAdminReports({ limit: 1000 });
      } else {
        reportsData = await fetchReports({ limit: 1000 });
      }
      setAllReports(reportsData);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedType, searchText]);

  // Client-side filtering
  const filteredReports = useMemo(() => {
    let result = allReports;

    if (selectedStatus !== 'all') {
      result = result.filter(r => r.status === selectedStatus);
    }

    if (selectedType !== 'all') {
      result = result.filter(r => r.issue_type === selectedType);
    }

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(r =>
        (r.report_code || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.issue_type || '').toLowerCase().includes(q) ||
        (r.district || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [allReports, selectedStatus, selectedType, searchText]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const paginatedReports = filteredReports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
          {t('Dashboard')}
        </Button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Title level={3} style={{ margin: 0, fontFamily: 'var(--font-secondary)', fontSize: '22px' }}>
          {meta.label}
        </Title>
        <Text style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {loading ? t('Loading…') : `${filteredReports.length} ${filteredReports.length === 1 ? t('report found') : t('reports found')}`}
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
          placeholder={t('Search reports by location or description…')}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ flex: 1, minWidth: '220px', borderRadius: '10px', height: '40px' }}
          allowClear
        />
        <Select
          value={selectedType}
          onChange={v => setSelectedType(v)}
          style={{ width: '170px', borderRadius: '10px', height: '40px' }}
          placeholder={<><FilterOutlined /> {t('Type')}</>}
        >
          <Option value="all">{t('All Types')}</Option>
          <Option value="Leak">💧 {t('Water Leak')}</Option>
          <Option value="Overflow">🌊 {t('Tap/Tank Overflow')}</Option>
          <Option value="Damaged Tap">🚰 {t('Damaged Tap')}</Option>
          <Option value="Broken Valve">⚙️ {t('Broken Valve')}</Option>
          <Option value="Water Supply Issue">🚫 {t('Supply Issue')}</Option>
          <Option value="Other">📌 {t('Other')}</Option>
        </Select>
      </div>

      {/* Report Count Badge */}
      {!loading && (
        <div style={{ marginBottom: '16px' }}>
          <Tag color={meta.color} style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '50px' }}>
            {filteredReports.length} {filteredReports.length === 1 ? t('report') : t('reports')}
          </Tag>
        </div>
      )}

      {/* Reports Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : filteredReports.length === 0 ? (
        <Empty
          description={t('No reports found for this filter')}
          style={{ padding: '60px 0' }}
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {paginatedReports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '28px' }}>
              <Button
                icon={<LeftOutlined />}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ borderRadius: '8px', height: '36px' }}
              />
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-color)' }}>
                {t('Page')} {currentPage} / {totalPages}
              </span>
              <Button
                icon={<RightOutlined />}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ borderRadius: '8px', height: '36px' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsList;
