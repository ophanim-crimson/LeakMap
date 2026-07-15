import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Logo + Brand — centered, no extra buttons */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          {/* Map pin with water drop SVG */}
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
            LeakMap
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
