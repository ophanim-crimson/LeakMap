import React, { useState, useEffect } from 'react';
import { Button, Radio, Alert, Space, Tag } from 'antd';
import { AimOutlined, EnvironmentOutlined } from '@ant-design/icons';
import LeafletMap from './LeafletMap';

interface LocationPickerProps {
  onLocationSelected: (lat: number, lng: number, accuracy?: number) => void;
  selectedLocation: [number, number] | null;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelected, selectedLocation }) => {
  const [mode, setMode] = useState<'gps' | 'map'>('gps');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc } = position.coords;
        setAccuracy(acc);
        onLocationSelected(latitude, longitude, acc);
        setGpsLoading(false);
      },
      (err) => {
        let msg = 'Failed to retrieve location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Permission denied. Please allow location access or select on map.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Request to get user location timed out.';
        }
        setErrorMsg(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
            <AimOutlined /> Use GPS
          </Radio.Button>
          <Radio.Button value="map" style={{ width: '50%' }}>
            <EnvironmentOutlined /> Tap on Map
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
                Location Captured Successfully
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Latitude: <strong>{selectedLocation[0].toFixed(6)}</strong><br />
                Longitude: <strong>{selectedLocation[1].toFixed(6)}</strong>
                {accuracy !== null && (
                  <>
                    <br />
                    Accuracy: <strong>±{accuracy.toFixed(0)}m</strong>
                  </>
                )}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Click button below to grab your current GPS coordinates.
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
            {selectedLocation ? 'Recapture Location' : 'Get GPS Location'}
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
              Tap anywhere on the map to set report marker.
            </Tag>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
