import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Shield, Flag, User, ChevronLeft, ChevronRight, CheckCircle, 
  RefreshCw, Trash2, Users, AlertOctagon, CheckSquare, Layers, UserX
} from 'lucide-react';
import { Tabs, Table, Button, Tag, Space, message, Popconfirm, Modal, Input } from 'antd';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  fetchUsers, updateUserRole, purgeUserReports, bulkRegisterUsers,
  fetchAdminReports, UserRecord, Report, BulkUserEntry, getImageUrl
} from '../api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const URGENCY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Pending: 4 };

const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [page, setPage] = useState(1);
  const [limitPerPage, setLimitPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'urgency'>('priority');

  // Bulk register modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; failed: number; results: { email: string; success: boolean; message: string }[] } | null>(null);

  useEffect(() => { loadReports(); }, [page, limitPerPage, statusFilter, districtFilter, searchQuery, token]);
  useEffect(() => { loadUsers(); }, [token]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try { setUsers(await fetchUsers()); }
    catch { message.error('Failed to load users'); }
    finally { setUsersLoading(false); }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminReports({
        page,
        limit: limitPerPage,
        status: statusFilter || undefined,
        district: districtFilter !== 'All' ? districtFilter : undefined,
        search: searchQuery.trim() || undefined
      });
      setReports(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      message.success(`Role updated to ${newRole}`);
      loadUsers();
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Failed to update role');
    }
  };

  const handlePurgeReports = async (userId: number, email: string) => {
    try {
      const res = await purgeUserReports(userId);
      message.success(res.detail || `Purged reports for ${email}`);
      loadUsers();
      loadReports();
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Failed to purge reports');
    }
  };

  const handleToggleStatus = async (reportId: number, currentStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = currentStatus === 'Active' ? 'Resolved' : 'Active';
    try {
      await axios.patch(
        `${API_BASE_URL}/api/reports/${reportId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success(`Report status updated to ${newStatus}`);
      loadReports();
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleDeleteReport = async (reportId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`${API_BASE_URL}/api/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Report deleted successfully');
      loadReports();
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Failed to delete report');
    }
  };

  const handleBulkRegister = async () => {
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const entries: BulkUserEntry[] = [];
      for (const line of bulkText.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(/[\t,]/);
        if (parts.length >= 2) {
          entries.push({ email: parts[0].trim(), password: parts[1].trim() });
        }
      }
      if (entries.length === 0) {
        message.warning('No valid entries found. Format: email,password (one per line)');
        return;
      }
      const result = await bulkRegisterUsers(entries);
      setBulkResult(result);
      message.success(`Created ${result.created}, failed ${result.failed}`);
      loadUsers();
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Bulk register failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const urgencyColor = (u: string | null) => {
    if (u === 'Critical') return '#DC2626';
    if (u === 'High') return '#EA580C';
    if (u === 'Medium') return '#D97706';
    return '#16A34A';
  };

  const markerColor = (r: Report) => r.status === 'Resolved' ? '#16A34A' : urgencyColor(r.ai_urgency || null);

  const sorted = [...reports].sort((a, b) => {
    if (sortBy === 'priority') return (b.priority_score || 0) - (a.priority_score || 0);
    if (sortBy === 'urgency') return (URGENCY_ORDER[a.ai_urgency || 'Pending'] ?? 4) - (URGENCY_ORDER[b.ai_urgency || 'Pending'] ?? 4);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const pill = (text: string, bg: string, color: string) => (
    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: bg, color, letterSpacing: '0.3px', display: 'inline-block' }}>{text}</span>
  );

  // Admin KPI metrics
  const activeCount = reports.filter(r => r.status === 'Active').length;
  const resolvedCount = reports.filter(r => r.status === 'Resolved').length;
  const criticalHighCount = reports.filter(r => r.ai_urgency === 'Critical' || r.ai_urgency === 'High').length;
  const flaggedUsersCount = users.filter(u => u.is_flagged).length;

  const userColumns = [
    { title: t('ID'), dataIndex: 'id', key: 'id', width: 60 },
    { title: t('Email'), dataIndex: 'email', key: 'email' },
    {
      title: t('Role'), dataIndex: 'role', key: 'role',
      render: (role: string) => <Tag color={role === 'admin' ? 'blue' : 'default'}>{role === 'admin' ? t('Admin') : t('User')}</Tag>
    },
    {
      title: t('Flagged'), dataIndex: 'is_flagged', key: 'is_flagged',
      render: (f: boolean) => f ? <Tag color="error">{t('Yes')}</Tag> : <Tag color="success">{t('No')}</Tag>
    },
    {
      title: t('Joined'), dataIndex: 'created_at', key: 'created_at',
      render: (d: string) => new Date(d).toLocaleDateString()
    },
    {
      title: t('Actions'), key: 'actions',
      render: (_: any, rec: UserRecord) => (
        <Space>
          {rec.role !== 'admin'
            ? <Button size="small" type="primary" onClick={() => handleRoleChange(rec.id, 'admin')}>{t('Make Admin')}</Button>
            : <Button size="small" danger onClick={() => handleRoleChange(rec.id, 'user')}>{t('Revoke Admin')}</Button>
          }
          {rec.is_flagged && (
            <Popconfirm
              title={t('Purge pending reports?')}
              description={t('This will delete all non-resolved reports for this user and clear the flag.')}
              onConfirm={() => handlePurgeReports(rec.id, rec.email)}
              okText={t('Yes, Purge')}
              cancelText={t('Cancel')}
              okButtonProps={{ danger: true, size: 'small' }}
            >
              <Button size="small" danger>{t('Purge Reports')}</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Admin Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1565C0' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('Total Reports')}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>{reports.length}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
            <AlertOctagon size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('Active Issues')}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#DC2626' }}>{activeCount}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <CheckSquare size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('Resolved')}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669' }}>{resolvedCount}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('Registered Users')}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>{users.length}</div>
          </div>
        </div>
      </div>

      <Tabs defaultActiveKey="reports">

        {/* ── TAB 1: Reports Table ── */}
        <Tabs.TabPane tab={`📋 ${t('Reports Management')}`} key="reports">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={t('Search code, issue or description...')}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', minWidth: '220px', outline: 'none' }}
            />
            <select value={districtFilter} onChange={e => { setDistrictFilter(e.target.value); setPage(1); }}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', cursor: 'pointer', backgroundColor: 'white' }}>
              <option value="All">{t('All Districts')}</option>
              <option value="Kasaragod">Kasaragod</option>
              <option value="Kannur">Kannur</option>
              <option value="Wayanad">Wayanad</option>
              <option value="Kozhikode">Kozhikode</option>
              <option value="Malappuram">Malappuram</option>
              <option value="Palakkad">Palakkad</option>
              <option value="Thrissur">Thrissur</option>
              <option value="Ernakulam">Ernakulam</option>
              <option value="Idukki">Idukki</option>
              <option value="Kottayam">Kottayam</option>
              <option value="Alappuzha">Alappuzha</option>
              <option value="Pathanamthitta">Pathanamthitta</option>
              <option value="Kollam">Kollam</option>
              <option value="Thiruvananthapuram">Thiruvananthapuram</option>
            </select>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', cursor: 'pointer', backgroundColor: 'white' }}>
              <option value="">{t('All Statuses')}</option>
              <option value="Active">{t('Active')}</option>
              <option value="Resolved">{t('Resolved')}</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'priority' | 'date' | 'urgency')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', cursor: 'pointer', backgroundColor: 'white' }}>
              <option value="priority">{t('Sort by Priority')}</option>
              <option value="urgency">{t('Sort by Urgency')}</option>
              <option value="date">{t('Sort by Date')}</option>
            </select>
            <select value={limitPerPage} onChange={e => { setLimitPerPage(Number(e.target.value)); setPage(1); }}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', cursor: 'pointer', backgroundColor: 'white' }}>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{sorted.length} {t('Reports').toLowerCase()}</span>
          </div>

          {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>{t('Loading reports...')}</p>}

          {!loading && (
            <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', backgroundColor: '#F8FAFC' }}>
                    {[
                      t('Report Code'), 
                      t('Photo'), 
                      t('Issue Type'), 
                      t('District'), 
                      t('Description'), 
                      t('Submitter'), 
                      t('Date'), 
                      t('Priority'), 
                      t('Urgency'), 
                      t('Status'), 
                      t('Actions')
                    ].map(h => (
                      <th key={h} style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(r => (
                    <tr key={r.id} onClick={() => navigate(`/report/${r.id}`)}
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--primary-color)' }}>{r.report_code}</td>
                      <td style={{ padding: '12px 10px' }}>
                        {r.photos?.[0]
                          ? <img src={getImageUrl(r.photos[0].image_url)} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>{t(r.issue_type) || r.issue_type}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 600 }}>
                          {r.district || 'Kasaragod'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '—'}</td>
                      <td style={{ padding: '12px 10px' }}>
                        {r.user ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {r.user?.is_flagged && <Flag size={12} style={{ color: '#DC2626' }} />}
                            <User size={12} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: r.user?.is_flagged ? '#DC2626' : 'var(--text-color)' }}>
                              {r.user.email}
                            </span>
                          </div>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, backgroundColor: '#F1F5F9', color: '#64748B', fontSize: 11, fontWeight: 600 }}>
                            <User size={11} /> {t('Registered User')}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', minWidth: 24, padding: '2px 8px',
                          borderRadius: 12, fontSize: 12, fontWeight: 700,
                          backgroundColor: r.priority_score > 0 ? '#FEF3C7' : '#F1F5F9',
                          color: r.priority_score > 0 ? '#92400E' : '#94A3B8'
                        }}>
                          {r.priority_score || 0}
                        </span>
                      </td>
                      {/* Urgency and Status moved to the RIGHT side */}
                      <td style={{ padding: '12px 10px' }}>
                        {pill(t(r.ai_urgency || 'Pending'), urgencyColor(r.ai_urgency || null) + '20', urgencyColor(r.ai_urgency || null))}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {pill(t(r.status), r.status === 'Active' ? '#FEE2E2' : '#D1FAE5', r.status === 'Active' ? '#B91C1C' : '#065F46')}
                      </td>
                      <td style={{ padding: '12px 10px' }} onClick={e => e.stopPropagation()}>
                        <Space size="small">
                          <Button
                            size="small"
                            type={r.status === 'Active' ? 'primary' : 'default'}
                            style={{
                              backgroundColor: r.status === 'Active' ? '#16A34A' : undefined,
                              borderColor: r.status === 'Active' ? '#16A34A' : undefined,
                              fontSize: '11px',
                            }}
                            icon={r.status === 'Active' ? <CheckCircle size={12} /> : <RefreshCw size={12} />}
                            onClick={e => handleToggleStatus(r.id, r.status, e)}
                          >
                            {r.status === 'Active' ? t('Resolve') : t('Reopen')}
                          </Button>
                          <Popconfirm
                            title={t('Delete report?')}
                            description={t('Are you sure you want to permanently delete this report?')}
                            onConfirm={e => handleDeleteReport(r.id, e as any)}
                            okText={t('Yes, Delete')}
                            cancelText={t('No')}
                            okButtonProps={{ danger: true, size: 'small' }}
                            cancelButtonProps={{ size: 'small' }}
                          >
                            <Button size="small" danger icon={<Trash2 size={12} />} />
                          </Popconfirm>
                        </Space>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p>{t('No reports found.')}</p>
            </div>
          )}

          {!loading && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {t('Page')} <strong>{page}</strong> | {t('Showing')} {reports.length} {t('records')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'white',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.5 : 1,
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <ChevronLeft size={16} /> {t('Previous')}
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={reports.length < limitPerPage}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'white',
                    cursor: reports.length < limitPerPage ? 'not-allowed' : 'pointer',
                    opacity: reports.length < limitPerPage ? 0.5 : 1,
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {t('Next')} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </Tabs.TabPane>

        {/* ── TAB 2: Map View ── */}
        <Tabs.TabPane tab={`🗺️ ${t('Map View')}`} key="map">
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t('Legend:')}</span>
            {[
              { label: 'Critical', color: '#DC2626' },
              { label: 'High', color: '#EA580C' },
              { label: 'Medium', color: '#D97706' },
              { label: 'Low / Pending', color: '#16A34A' },
              { label: 'Resolved', color: '#16A34A', faded: true },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: item.color, opacity: item.faded ? 0.4 : 1, border: item.faded ? '2px solid #16A34A' : 'none' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t(item.label)}</span>
              </div>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
              {reports.length} {t('report(s) • Click any pin for details')}
            </span>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>{t('Loading map...')}</p>
          ) : (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', height: 560 }}>
              <MapContainer center={[10.8505, 76.2711]} zoom={7} style={{ width: '100%', height: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {reports.map(r => (
                  <CircleMarker
                    key={r.id}
                    center={[r.latitude, r.longitude]}
                    radius={r.status === 'Resolved' ? 7 : Math.max(9, 9 + (r.priority_score || 0) * 2)}
                    pathOptions={{
                      color: markerColor(r),
                      fillColor: markerColor(r),
                      fillOpacity: r.status === 'Resolved' ? 0.35 : 0.85,
                      weight: 2,
                    }}
                  >
                    <Popup minWidth={240}>
                      <div style={{ fontSize: 13 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#1E3A5F' }}>{r.report_code}</div>
                        {r.priority_score > 0 && (
                          <div style={{ marginBottom: 8, padding: '4px 8px', background: '#FEF3C7', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#92400E' }}>
                            ⚡ Priority Score: {r.priority_score} ({r.priority_score} other report{r.priority_score !== 1 ? 's' : ''} nearby)
                          </div>
                        )}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                          <tbody>
                            <tr>
                              <td style={{ color: '#666', paddingRight: 8, paddingBottom: 4, whiteSpace: 'nowrap' }}>{t('Issue:')}</td>
                              <td style={{ fontWeight: 500, paddingBottom: 4 }}>{t(r.issue_type) || r.issue_type}</td>
                            </tr>
                            <tr>
                              <td style={{ color: '#666', paddingRight: 8, paddingBottom: 4, whiteSpace: 'nowrap' }}>{t('District:')}</td>
                              <td style={{ fontWeight: 500, paddingBottom: 4 }}>{r.district || 'Kasaragod'}</td>
                            </tr>
                            <tr>
                              <td style={{ color: '#666', paddingRight: 8, paddingBottom: 4, whiteSpace: 'nowrap' }}>{t('Submitter:')}</td>
                              <td style={{ fontWeight: 500, paddingBottom: 4, color: r.user?.is_flagged ? '#DC2626' : 'inherit', wordBreak: 'break-all' }}>
                                {r.user?.email || t('Registered User')}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ color: '#666', paddingRight: 8, paddingBottom: 4 }}>{t('Status:')}</td>
                              <td style={{ paddingBottom: 4 }}>
                                {pill(t(r.status), r.status === 'Active' ? '#FEE2E2' : '#D1FAE5', r.status === 'Active' ? '#B91C1C' : '#065F46')}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ color: '#666', paddingRight: 8, paddingBottom: 4 }}>{t('Urgency:')}</td>
                              <td style={{ fontWeight: 600, paddingBottom: 4, color: urgencyColor(r.ai_urgency || null) }}>
                                {t(r.ai_urgency || 'Pending')}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                          <button
                            onClick={() => handleToggleStatus(r.id, r.status)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: r.status === 'Active' ? '#16A34A' : '#2563EB',
                              color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer',
                              fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                            }}
                          >
                            {r.status === 'Active' ? t('✓ Mark as Resolved') : t('↺ Reopen Report')}
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(t('Are you sure you want to permanently delete this report?'))) {
                                handleDeleteReport(r.id);
                              }
                            }}
                            style={{
                              padding: '5px 10px', backgroundColor: '#DC2626', color: 'white',
                              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                            }}
                          >
                            {t('🗑 Delete Report')}
                          </button>
                          <button
                            onClick={() => navigate(`/report/${r.id}`)}
                            style={{
                              padding: '5px 10px', backgroundColor: '#F1F5F9', color: '#334155',
                              border: '1px solid #CBD5E1', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600
                            }}
                          >
                            {t('View Full Details →')}
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          )}
        </Tabs.TabPane>

        {/* ── TAB 3: Manage Users ── */}
        <Tabs.TabPane tab={`👥 ${t('Manage Users')}`} key="users">
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={() => { setBulkModalOpen(true); setBulkResult(null); setBulkText(''); }}>
              + {t('Bulk Register Users')}
            </Button>
          </div>
          <Table
            columns={userColumns}
            dataSource={users}
            rowKey="id"
            loading={usersLoading}
            pagination={{ pageSize: 20 }}
            rowClassName={(rec: UserRecord) => rec.is_flagged ? 'flagged-row' : ''}
          />
        </Tabs.TabPane>

      </Tabs>

      {/* Bulk Register Modal */}
      <Modal
        title={t('Bulk Register Users')}
        open={bulkModalOpen}
        onCancel={() => setBulkModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setBulkModalOpen(false)}>{t('Close')}</Button>,
          <Button key="submit" type="primary" loading={bulkLoading} onClick={handleBulkRegister}>{t('Register All')}</Button>
        ]}
        width={560}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
          {t('Enter one account per line in the format')}: <code>email,password</code>
        </p>
        <Input.TextArea
          rows={8}
          value={bulkText}
          onChange={e => setBulkText(e.target.value)}
          placeholder={'alice@example.com,SecurePass1\nbob@example.com,Pass1234\n...'}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
        {bulkResult && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontWeight: 600 }}>
              ✅ Created: {bulkResult.created} &nbsp; ❌ Failed: {bulkResult.failed}
            </p>
            <div style={{ maxHeight: 160, overflowY: 'auto', fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 6, padding: 8 }}>
              {bulkResult.results.map((r, i) => (
                <div key={i} style={{ color: r.success ? '#16A34A' : '#DC2626', marginBottom: 2 }}>
                  {r.success ? '✓' : '✗'} {r.email} — {r.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
