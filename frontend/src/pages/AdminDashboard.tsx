import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Shield, Flag, User } from 'lucide-react';
import { Tabs, Table, Button, Tag, Space, message } from 'antd';
import { fetchUsers, updateUserRole } from '../api';

interface ReportUser {
  id: number;
  email: string;
  role: string;
  is_flagged: boolean;
}

interface Report {
  id: number;
  report_code: string;
  issue_type: string;
  description: string | null;
  latitude: number;
  longitude: number;
  status: string;
  ai_urgency: string | null;
  created_at: string;
  photos: { image_url: string }[];
  comments: { id: number; text: string; user: ReportUser | null; created_at: string }[];
  user: ReportUser | null;
}

const URGENCY_ORDER: Record<string, number> = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Pending': 4 };

const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<ReportUser[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'urgency'>('urgency');

  useEffect(() => {
    fetchReports();
  }, [page, statusFilter, token]);

  useEffect(() => {
    loadUsers();
  }, [token]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      message.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      message.success(`User role updated to ${newRole}`);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.detail || 'Failed to update user role');
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:8000/api/reports?page=${page}&limit=20`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (reportId: number, newStatus: string) => {
    try {
      // Use updates endpoint to change status
      await axios.post(`http://localhost:8000/api/reports/${reportId}/updates`, 
        { update_text: `Status changed to ${newStatus}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const urgencyColor = (u: string | null) => {
    switch(u) {
      case 'Critical': return '#DC2626';
      case 'High': return '#EA580C';
      case 'Medium': return '#D97706';
      default: return '#16A34A';
    }
  };

  // Sort reports
  const sortedReports = [...reports].sort((a, b) => {
    if (sortBy === 'urgency') {
      return (URGENCY_ORDER[a.ai_urgency || 'Pending'] || 4) - (URGENCY_ORDER[b.ai_urgency || 'Pending'] || 4);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const userColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'blue' : 'default'}>{role}</Tag>
      ),
    },
    {
      title: 'Flagged',
      dataIndex: 'is_flagged',
      key: 'is_flagged',
      render: (is_flagged: boolean) => (
        is_flagged ? <Tag color="error">Yes</Tag> : <Tag color="success">No</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ReportUser) => (
        <Space size="middle">
          {record.role !== 'admin' ? (
            <Button size="small" type="primary" onClick={() => handleRoleChange(record.id, 'admin')}>
              Make Admin
            </Button>
          ) : (
            <Button size="small" danger onClick={() => handleRoleChange(record.id, 'user')}>
              Revoke Admin
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Shield size={28} style={{ color: 'var(--primary-color)' }} />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-color)', margin: 0 }}>
            {t('Admin Dashboard')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Manage all community reports and users</p>
        </div>
      </div>

      <Tabs defaultActiveKey="reports">
        <Tabs.TabPane tab="Reports" key="reports">
          {/* Controls */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select 
              value={statusFilter} 
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', cursor: 'pointer' }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as 'date' | 'urgency')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', cursor: 'pointer' }}
            >
              <option value="urgency">Sort: AI Priority</option>
              <option value="date">Sort: Newest First</option>
            </select>
          </div>

          {/* Loading */}
          {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p>}

          {/* Data Grid */}
          {!loading && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>Code</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>Photo</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('Issue Type')}</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('Description')}</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>Submitter</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('Status')}</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('Urgency')}</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('Date')}</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('Comments')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReports.map(report => (
                    <tr 
                      key={report.id} 
                      onClick={() => navigate(`/report/${report.id}`)}
                      style={{ 
                        borderBottom: '1px solid var(--border-color)', 
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--primary-color)' }}>{report.report_code}</td>
                      <td style={{ padding: '12px 8px' }}>
                        {report.photos?.[0] ? (
                          <img src={`http://localhost:8000${report.photos[0].image_url}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px' }}>{report.issue_type}</td>
                      <td style={{ padding: '12px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {report.description || '—'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {report.user?.is_flagged && <Flag size={12} style={{ color: '#DC2626' }} />}
                          <User size={12} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontSize: '12px', color: report.user?.is_flagged ? '#DC2626' : 'var(--text-muted)' }}>
                            {report.user?.email?.split('@')[0] || 'anonymous'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          padding: '3px 10px', 
                          borderRadius: '5px', 
                          fontSize: '11px', 
                          fontWeight: 600,
                          backgroundColor: report.status === 'Active' ? '#FEE2E2' : '#D1FAE5',
                          color: report.status === 'Active' ? '#B91C1C' : '#065F46'
                        }}>
                          {report.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          padding: '3px 10px', 
                          borderRadius: '5px', 
                          fontSize: '11px', 
                          fontWeight: 600,
                          backgroundColor: urgencyColor(report.ai_urgency) + '20',
                          color: urgencyColor(report.ai_urgency)
                        }}>
                          {report.ai_urgency || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '10px', 
                          fontSize: '11px', 
                          fontWeight: 600,
                          backgroundColor: report.comments.length > 0 ? '#DBEAFE' : '#F1F5F9',
                          color: report.comments.length > 0 ? '#1E40AF' : 'var(--text-muted)'
                        }}>
                          {report.comments.length}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {!loading && sortedReports.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p>{t('No reports found.')}</p>
            </div>
          )}

          {/* Pagination */}
          {!loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--white)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Page {page}</span>
              <button 
                onClick={() => setPage(p => p + 1)} 
                disabled={reports.length < 20}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--white)', cursor: reports.length < 20 ? 'not-allowed' : 'pointer', opacity: reports.length < 20 ? 0.5 : 1 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </Tabs.TabPane>

        <Tabs.TabPane tab="Manage Users" key="users">
          <Table 
            columns={userColumns} 
            dataSource={users} 
            rowKey="id" 
            loading={usersLoading} 
            pagination={{ pageSize: 20 }}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
