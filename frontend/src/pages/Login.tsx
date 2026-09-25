import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, UserPlus, LogIn } from 'lucide-react';
import { API_BASE_URL } from '../api';

function parseJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

interface AuthPageProps {
  initialTab?: 'login' | 'register';
}

const Login: React.FC<AuthPageProps> = ({ initialTab = 'login' }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    location.pathname === '/register' ? 'register' : initialTab
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { t } = useTranslation();

  // If already logged in, navigate directly to dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  // Sync tab with route if location changes
  useEffect(() => {
    if (location.pathname === '/register') {
      setActiveTab('register');
    } else if (location.pathname === '/login') {
      setActiveTab('login');
    }
    setError('');
    setSuccess('');
  }, [location.pathname]);

  const handleTabSwitch = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const { data } = await axios.post(`${API_BASE_URL}/api/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      login(data.access_token);
      
      const payload = parseJwt(data.access_token);
      if (payload?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail;
      setError(detail ? `Login failed: ${detail}` : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/register`, { email, password });
      setSuccess('Account created! Logging in...');
      
      // Auto-login after register
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      const { data } = await axios.post(`${API_BASE_URL}/api/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      login(data.access_token);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '48px auto', padding: '28px', backgroundColor: 'var(--white)', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid var(--border-color)' }}>
      
      {/* Tab Switcher Header */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: '#F1F5F9', 
        borderRadius: '10px', 
        padding: '4px', 
        marginBottom: '24px' 
      }}>
        <button
          type="button"
          onClick={() => handleTabSwitch('login')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 0',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'login' ? 'var(--white)' : 'transparent',
            color: activeTab === 'login' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: activeTab === 'login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <LogIn size={16} />
          {t('Login')}
        </button>
        <button
          type="button"
          onClick={() => handleTabSwitch('register')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 0',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'register' ? 'var(--white)' : 'transparent',
            color: activeTab === 'register' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: activeTab === 'register' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <UserPlus size={16} />
          {t('Register')}
        </button>
      </div>

      {error && <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
      {success && <div style={{ padding: '12px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{success}</div>}

      {/* LOGIN TAB */}
      {activeTab === 'login' && (
        <form onSubmit={handleLoginSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>{t('Email')}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
                placeholder="name@example.com"
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>{t('Password')}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 700, 
              cursor: loading ? 'not-allowed' : 'pointer', 
              opacity: loading ? 0.7 : 1,
              fontSize: '15px',
              boxShadow: '0 4px 12px rgba(21,101,192,0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? t('Logging in...') : t('Login')}
          </button>

          <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--text-muted)' }}>
            {t("Don't have an account?")}{' '}
            <span 
              onClick={() => handleTabSwitch('register')} 
              style={{ color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer' }}
            >
              {t('Register')}
            </span>
          </p>
        </form>
      )}

      {/* REGISTER TAB */}
      {activeTab === 'register' && (
        <form onSubmit={handleRegisterSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>{t('Email')}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
                placeholder="name@example.com"
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>{t('Password')}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>{t('Confirm Password')}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 700, 
              cursor: loading ? 'not-allowed' : 'pointer', 
              opacity: loading ? 0.7 : 1,
              fontSize: '15px',
              boxShadow: '0 4px 12px rgba(21,101,192,0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? t('Creating account...') : t('Register')}
          </button>

          <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--text-muted)' }}>
            {t('Already have an account?')}{' '}
            <span 
              onClick={() => handleTabSwitch('login')} 
              style={{ color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer' }}
            >
              {t('Login')}
            </span>
          </p>
        </form>
      )}
    </div>
  );
};

export default Login;
