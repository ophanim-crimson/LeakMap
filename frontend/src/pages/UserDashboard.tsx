import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, PlusCircle, Activity, User, Map } from 'lucide-react';
import { getImageUrl, API_BASE_URL } from '../api';

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
  
  const [myReports, setMyReports] = useState<Report[]>(() => {
    try {
      const cached = sessionStorage.getItem('leakmap_user_reports');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [nearbyReports, setNearbyReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(myReports.length === 0);
  const [tab, setTab] = useState<'mine' | 'nearby'>('mine');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log('Location denied')
      );
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchMyReports();
    }
  }, [page, token]);

  useEffect(() => {
    if (userLocation && tab === 'nearby') {
      fetchNearbyReports();
    }
  }, [userLocation, tab]);

  const PAGE_SIZE = 4;

  const fetchMyReports = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/reports?page=${page}&limit=${PAGE_SIZE}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyReports(data);
      if (page === 1) {
        try { sessionStorage.setItem('leakmap_user_reports', JSON.stringify(data)); } catch {}
      }
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
        `${API_BASE_URL}/api/reports?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius_meters=100&page=1&limit=50&exclude_mine=true`,
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px 40px' }}>
      
      {/* Welcome Hero Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--primary-color) 0%, #1E3A8A 100%)', 
        borderRadius: '0 0 24px 24px', 
        padding: '40px 24px', 
        color: 'white',
        boxShadow: '0 10px 25px rgba(30, 58, 138, 0.2)',
        marginBottom: '32px',
        margin: '0 -16px 32px'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '64px', height: '64px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255,255,255,0.5)'
          }}>
            <User size={32} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-secondary)' }}>
              {t('Welcome back')},
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '15px', opacity: 0.9 }}>
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        
        {/* Report Action */}
        <div 
          onClick={() => navigate('/report')}
          style={{ 
            backgroundColor: 'var(--white)', padding: '24px', borderRadius: '16px', 
            border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px',
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ backgroundColor: '#EFF6FF', padding: '12px', borderRadius: '12px', color: 'var(--primary-color)' }}>
            <PlusCircle size={28} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{t('Report Issue')}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Help your community</p>
          </div>
        </div>

        {/* Global Map Action */}
        <div 
          onClick={() => navigate('/')}
          style={{ 
            backgroundColor: 'var(--white)', padding: '24px', borderRadius: '16px', 
            border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px',
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ backgroundColor: '#F0FDF4', padding: '12px', borderRadius: '12px', color: '#16A34A' }}>
            <Map size={28} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{t('View Map')}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>See all live reports</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', gap: '8px', marginBottom: '24px', 
        backgroundColor: '#F1F5F9', padding: '6px', borderRadius: '12px' 
      }}>
        <button 
          onClick={() => setTab('mine')}
          style={{ 
            flex: 1, padding: '12px', background: tab === 'mine' ? 'var(--white)' : 'transparent', 
            border: 'none', borderRadius: '8px',
            color: tab === 'mine' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: 700, cursor: 'pointer', fontSize: '14px',
            boxShadow: tab === 'mine' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Activity size={16} /> {t('My Reports')}
        </button>
        <button 
          onClick={() => setTab('nearby')}
          style={{ 
            flex: 1, padding: '12px', background: tab === 'nearby' ? 'var(--white)' : 'transparent', 
            border: 'none', borderRadius: '8px',
            color: tab === 'nearby' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: 700, cursor: 'pointer', fontSize: '14px',
            boxShadow: tab === 'nearby' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <MapPin size={16} /> {t('Reports within 100m')}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loader" style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{t('Loading...')}</p>
        </div>
      )}

      {/* Reports List */}
      {!loading && reports.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <MapPin size={32} color="#94A3B8" />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: 'var(--text-color)' }}>No reports found</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 24px' }}>You haven't submitted any reports yet.</p>
          <button 
            onClick={() => navigate('/report')}
            style={{ padding: '10px 24px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            Submit your first report
          </button>
        </div>
      )}

      {!loading && reports.map(report => (
        <div 
          key={report.id}
          onClick={() => navigate(`/report/${report.id}`)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', 
            backgroundColor: 'var(--white)', borderRadius: '12px', marginBottom: '12px', 
            border: '1px solid var(--border-color)', cursor: 'pointer',
            transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
            e.currentTarget.style.borderColor = '#BFDBFE';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          {/* Photo thumbnail */}
          {report.photos?.[0] ? (
            <img 
              src={getImageUrl(report.photos[0].image_url)}
              alt=""
              style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle color="#94A3B8" />
            </div>
          )}
          
          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-color)' }}>{report.report_code}</span>
              <span style={{ 
                padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                backgroundColor: report.status === 'Active' ? '#FEE2E2' : '#D1FAE5',
                color: report.status === 'Active' ? '#B91C1C' : '#065F46'
              }}>
                {report.status === 'Active' ? <AlertTriangle size={10} style={{ marginRight: '4px', display: 'inline' }} /> : <CheckCircle size={10} style={{ marginRight: '4px', display: 'inline' }} />}
                {t(report.status)}
              </span>
              {report.ai_urgency && (
                <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, backgroundColor: urgencyColor(report.ai_urgency) + '20', color: urgencyColor(report.ai_urgency) }}>
                  {t(report.ai_urgency)}
                </span>
              )}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <strong style={{ color: 'var(--text-color)' }}>{t(report.issue_type)}</strong> — {report.description || t('No description')}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={12} /> {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <ChevronRight color="#CBD5E1" />
        </div>
      ))}

      {/* Pagination (only for My Reports tab) */}
      {tab === 'mine' && reports.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1}
            style={{ 
              padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', 
              background: 'var(--white)', cursor: page === 1 ? 'not-allowed' : 'pointer', 
              opacity: page === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center' 
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-color)' }}>{t('Page')} {page}</span>
          <button 
            onClick={() => setPage(p => p + 1)} 
            disabled={myReports.length < PAGE_SIZE}
            style={{ 
              padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', 
              background: 'var(--white)', cursor: myReports.length < PAGE_SIZE ? 'not-allowed' : 'pointer', 
              opacity: myReports.length < PAGE_SIZE ? 0.5 : 1, display: 'flex', alignItems: 'center' 
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
      
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default UserDashboard;
