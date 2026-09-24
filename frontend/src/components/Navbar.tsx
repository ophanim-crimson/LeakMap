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
    navigate('/login');
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 20px',
      minHeight: '64px',
      boxSizing: 'border-box',
      backgroundColor: 'var(--white)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: '0 2px 8px rgba(21,101,192,0.07)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1200px', margin: '0 auto', flexWrap: 'wrap', gap: '10px' }}>

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
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--primary-color)',
            letterSpacing: '-0.5px',
            lineHeight: '1.2',
            display: 'inline-flex',
            alignItems: 'center'
          }}>
            {t('LeakMap')}
          </span>
        </Link>

        {/* Right-side nav items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 1, minWidth: 0, justifyContent: 'flex-end' }}>
          {/* Language Toggle option */}
          <button
            onClick={toggleLanguage}
            title={t('Toggle language')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid var(--primary-color)',
              backgroundColor: '#EFF6FF',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--primary-color)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Globe size={13} />
            {i18n.language === 'en' ? 'ML' : 'EN'}
          </button>

          {user ? (
            <>
              {/* Admin Badge / User Dashboard */}
              {user.role === 'admin' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1565C0', fontWeight: 700, fontSize: '12px', border: '1px solid #BFDBFE', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <Shield size={13} />
                  {t('Admin')}
                </span>
              ) : (
                <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1E40AF', textDecoration: 'none', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <LayoutDashboard size={13} />
                  {t('Dashboard')}
                </Link>
              )}

              {/* User email - truncated */}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1, minWidth: 0 }}>
                {user.email.split('@')[0]}
              </span>

              {/* Logout */}
              <button 
                onClick={handleLogout}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--white)', cursor: 'pointer', color: '#B91C1C', fontWeight: 500, fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <LogOut size={13} />
                {t('Logout')}
              </button>
            </>
          ) : (
            null
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
