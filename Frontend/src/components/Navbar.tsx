import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LogOut, LayoutDashboard, Shield, Globe } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ml' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      height: '64px',
      backgroundColor: 'var(--white)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: '0 2px 8px rgba(21,101,192,0.07)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Logo + Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <svg width="44" height="44" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 3C11.925 3 7 7.925 7 14C7 21.5 18 33 18 33C18 33 29 21.5 29 14C29 7.925 24.075 3 18 3Z"
              fill="#1565C0"
            />
            <path
              d="M18 9.5C18 9.5 22 13.5 22 16C22 18.2 20.2 20 18 20C15.8 20 14 18.2 14 16C14 13.5 18 9.5 18 9.5Z"
              fill="white"
            />
          </svg>

          <span style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--primary-color)',
            letterSpacing: '-0.5px'
          }}>
            {t('LeakMap')}
          </span>
        </Link>

        {/* Right-side nav items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            title={t('Toggle language')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--white)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <Globe size={14} />
            {i18n.language === 'en' ? 'ML' : 'EN'}
          </button>

          {user ? (
            <>
              {/* Dashboard link */}
              {user.role === 'admin' ? (
                <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1E40AF', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
                  <Shield size={14} />
                  {t('Admin Dashboard')}
                </Link>
              ) : (
                <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1E40AF', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
                  <LayoutDashboard size={14} />
                  {t('Dashboard')}
                </Link>
              )}

              {/* User email */}
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email.split('@')[0]}
              </span>

              {/* Logout */}
              <button 
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--white)', cursor: 'pointer', color: '#B91C1C', fontWeight: 500, fontSize: '13px' }}
              >
                <LogOut size={14} />
                {t('Logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
                {t('Login')}
              </Link>
              <Link to="/register" style={{ padding: '6px 16px', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
                {t('Register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
