import React, { useState, useEffect } from 'react';
import { Button, Radio, Alert, Space, Tag } from 'antd';
import { AimOutlined, EnvironmentOutlined } from '@ant-design/icons';
import LeafletMap from './LeafletMap';
import { useTranslation } from 'react-i18next';

interface LocationPickerProps {
  onLocationSelected: (lat: number, lng: number, accuracy?: number) => void;
  selectedLocation: [number, number] | null;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelected, selectedLocation }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'gps' | 'map'>('gps');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg(t('Geolocation is not supported by your browser. Please select location on the map.'));
      setMode('map');
      return;
    }

    setGpsLoading(true);
    setErrorMsg(null);

    // Fast high accuracy attempt with fast 3.5s timeout, falling back to network positioning
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc } = position.coords;
        setAccuracy(acc);
        onLocationSelected(latitude, longitude, acc);
        setGpsLoading(false);
      },
      (_err) => {
        // Fallback to coarse accuracy if high-precision satellite lock times out
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => {
            const { latitude, longitude, accuracy: acc } = fallbackPos.coords;
            setAccuracy(acc);
            onLocationSelected(latitude, longitude, acc);
            setGpsLoading(false);
          },
          (finalErr) => {
            let msg = t('Failed to retrieve GPS location.');
            if (finalErr.code === finalErr.PERMISSION_DENIED) {
              msg = t('Location permission denied. You can tap your location directly on the map below.');
            } else if (finalErr.code === finalErr.POSITION_UNAVAILABLE) {
              msg = t('GPS unavailable. Please tap your location on the map.');
            } else if (finalErr.code === finalErr.TIMEOUT) {
              msg = t('GPS timed out. Please tap your location on the map.');
            }
            setErrorMsg(msg);
            setGpsLoading(false);
            setMode('map');
          },
          { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 3500, maximumAge: 30000 }
    );
  };

  // Run automatically when switching to GPS mode if location is not set yet
  useEffect(() => {
    if (mode === 'gps' && !selectedLocation) {
      handleGetCurrentLocation();
    }
  }, [mode]);

  const handleMapClick = (lat: number, lng: number) => {
    setAccuracy(null);
    onLocationSelected(lat, lng);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Radio.Group 
          value={mode} 
          onChange={(e) => setMode(e.target.value)} 
          buttonStyle="solid"
          style={{ width: '100%', textAlign: 'center' }}
        >
          <Radio.Button value="gps" style={{ width: '50%' }}>
            <AimOutlined /> {t('Use GPS')}
          </Radio.Button>
          <Radio.Button value="map" style={{ width: '50%' }}>
            <EnvironmentOutlined /> {t('Tap on Map')}
          </Radio.Button>
        </Radio.Group>
      </div>

      {errorMsg && (
        <Alert message={errorMsg} type="warning" showIcon closable onClose={() => setErrorMsg(null)} />
      )}

      {mode === 'gps' ? (
        <div style={{
          backgroundColor: 'var(--white)',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <AimOutlined style={{ fontSize: '40px', color: 'var(--primary-color)' }} />
          
          {selectedLocation ? (
            <div>
              <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {t('Location Captured Successfully')}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {t('Latitude')}: <strong>{selectedLocation[0].toFixed(6)}</strong><br />
                {t('Longitude')}: <strong>{selectedLocation[1].toFixed(6)}</strong>
                {accuracy !== null && (
                  <>
                    <br />
                    {t('Accuracy')}: <strong>±{accuracy.toFixed(0)}m</strong>
                  </>
                )}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {t('Click button below to grab your current GPS coordinates.')}
            </p>
          )}

          <Button 
            type={selectedLocation ? 'default' : 'primary'} 
            onClick={handleGetCurrentLocation} 
            loading={gpsLoading}
            style={{ 
              borderRadius: '20px',
              backgroundColor: selectedLocation ? '#E3F2FD' : undefined,
              color: selectedLocation ? 'var(--primary-color)' : undefined,
              borderColor: selectedLocation ? '#E3F2FD' : undefined,
              fontWeight: selectedLocation ? 600 : 400
            }}
          >
            {selectedLocation ? t('Recapture Location') : t('Get GPS Location')}
          </Button>
        </div>
      ) : (
        <div style={{ height: '350px', position: 'relative' }}>
          <LeafletMap
            reports={[]}
            interactive={true}
            onLocationSelect={handleMapClick}
            selectedLocation={selectedLocation}
            zoom={selectedLocation ? 16 : 12}
          />
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            zIndex: 1000,
            pointerEvents: 'none'
          }}>
            <Tag color="processing" style={{ padding: '4px 8px', fontSize: '12px' }}>
              {t('Tap anywhere on the map to set report marker.')}
            </Tag>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
