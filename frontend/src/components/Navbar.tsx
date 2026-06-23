import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'between',
      padding: '16px 24px',
      backgroundColor: 'var(--white)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--light-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Water droplet SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.69C12 2.69 19 9.5 19 14C19 17.87 15.87 21 12 21C8.13 21 5 17.87 5 14C5 9.5 12 2.69 12 2.69Z" fill="var(--primary-color)" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--primary-color)',
            letterSpacing: '-0.5px'
          }}>
            LeakMap
          </span>
        </Link>

        <div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/report')}
            style={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: '24px',
              padding: '8px 20px',
              height: 'auto',
              boxShadow: '0 4px 12px rgba(21, 101, 192, 0.2)'
            }}
          >
            Report Issue
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
