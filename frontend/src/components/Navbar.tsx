import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LogOut, LayoutDashboard, Shield, Globe, User } from 'lucide-react';

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
      backgroundColor: 'var(--white)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: '0 2px 8px rgba(21,101,192,0.07)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '10px 16px',
        boxSizing: 'border-box',
        gap: '8px',
      }}>

        {/* Logo + Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--primary-color)',
            letterSpacing: '-0.5px',
          }}>
            {t('LeakMap')}
          </span>
        </Link>

        {/* Right-side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

          {/* Language Toggle - icon-only style */}
          <button
            onClick={toggleLanguage}
            title={t('Toggle language')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #DBEAFE',
              backgroundColor: '#EFF6FF',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--primary-color)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <Globe size={14} />
            {i18n.language === 'en' ? 'ML' : 'EN'}
          </button>

          {user ? (
            <>
              {/* User info pill: role + name */}
              {user.role === 'admin' ? (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                }}>
                  <Shield size={13} color="#1565C0" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1565C0' }}>{t('Admin')}</span>
                  <span style={{ width: '1px', height: '14px', backgroundColor: '#BFDBFE' }} />
                  <span style={{ fontSize: '11px', color: '#64748B', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email.split('@')[0]}
                  </span>
                </div>
              ) : (
                <Link to="/dashboard" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  textDecoration: 'none',
                }}>
                  <User size={13} color="#1E40AF" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E40AF', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email.split('@')[0]}
                  </span>
                </Link>
              )}

              {/* Logout - icon button */}
              <button
                onClick={handleLogout}
                title={t('Logout')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  borderRadius: '8px',
                  border: '1px solid #FECACA',
                  backgroundColor: '#FEF2F2',
                  cursor: 'pointer',
                  color: '#DC2626',
                  transition: 'all 0.2s ease',
                }}
              >
                <LogOut size={15} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
