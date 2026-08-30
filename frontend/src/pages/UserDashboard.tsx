import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

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
}

const UserDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [nearbyReports, setNearbyReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'mine' | 'nearby'>('mine');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    // Get user location for nearby reports
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log('Location denied')
      );
    }
  }, []);

  useEffect(() => {
    fetchMyReports();
  }, [page, token]);

  useEffect(() => {
    if (userLocation && tab === 'nearby') {
      fetchNearbyReports();
    }
  }, [userLocation, tab]);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:8000/api/reports?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyReports = async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `http://localhost:8000/api/reports?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius_meters=100&page=1&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNearbyReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const reports = tab === 'mine' ? myReports : nearbyReports;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-color)', marginBottom: '8px' }}>
          {t('Dashboard')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Welcome, {user?.email}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid var(--border-color)' }}>
        <button 
          onClick={() => setTab('mine')}
          style={{ 
            padding: '12px 24px', 
            background: 'none', 
            border: 'none', 
            borderBottom: tab === 'mine' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: tab === 'mine' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: 600, 
            cursor: 'pointer',
            marginBottom: '-2px',
            fontSize: '14px'
          }}
        >
          {t('My Reports')}
        </button>
        <button 
          onClick={() => setTab('nearby')}
          style={{ 
            padding: '12px 24px', 
            background: 'none', 
            border: 'none', 
            borderBottom: tab === 'nearby' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: tab === 'nearby' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: 600, 
            cursor: 'pointer',
            marginBottom: '-2px',
            fontSize: '14px'
          }}
        >
          📍 {t('Reports within 100m')}
        </button>
      </div>

      {/* Report a new issue button */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/report')}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: 'var(--primary-color)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 600, 
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + {t('Submit a Report')}
        </button>
      </div>

      {/* Loading */}
      {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p>}

      {/* Reports List */}
      {!loading && reports.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <MapPin size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>{t('No reports found.')}</p>
        </div>
      )}

      {!loading && reports.map(report => (
        <div 
          key={report.id}
          onClick={() => navigate(`/report/${report.id}`)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            padding: '16px', 
            backgroundColor: 'var(--white)', 
            borderRadius: '10px', 
            marginBottom: '12px', 
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          {/* Photo thumbnail */}
          {report.photos?.[0] && (
            <img 
              src={`http://localhost:8000${report.photos[0].image_url}`}
              alt=""
              style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
            />
          )}
          
          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-color)' }}>{report.report_code}</span>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '11px', 
                fontWeight: 600,
                backgroundColor: report.status === 'Active' ? '#FEE2E2' : '#D1FAE5',
                color: report.status === 'Active' ? '#B91C1C' : '#065F46'
              }}>
                {report.status === 'Active' ? <AlertTriangle size={10} style={{ marginRight: '4px', display: 'inline' }} /> : <CheckCircle size={10} style={{ marginRight: '4px', display: 'inline' }} />}
                {report.status}
              </span>
              {report.ai_urgency && (
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: urgencyColor(report.ai_urgency) + '20', color: urgencyColor(report.ai_urgency) }}>
                  {report.ai_urgency}
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {report.issue_type} — {report.description || 'No description'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}

      {/* Pagination (only for My Reports tab) */}
      {tab === 'mine' && !loading && (
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
            disabled={myReports.length < 10}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--white)', cursor: myReports.length < 10 ? 'not-allowed' : 'pointer', opacity: myReports.length < 10 ? 0.5 : 1 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
