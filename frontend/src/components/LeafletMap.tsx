import React from 'react';
import { Tag } from 'antd';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Report } from '../api';
import { useNavigate } from 'react-router-dom';

interface LeafletMapProps {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: [number, number] | null;
}

// Helper to get marker color based on report type and status
export const getReportColor = (report: Report): string => {
  if (report.status === 'Resolved') {
    return '#4CAF50'; // Green
  }
  switch (report.issue_type) {
    case 'Leak':
      return '#F44336'; // Red
    case 'Overflow':
      return '#FF9800'; // Orange
    case 'Damaged Tap':
    case 'Broken Valve':
      return '#FFD600'; // Yellow
    case 'Water Supply Issue':
      return '#1565C0'; // Blue
    default:
      return '#78909C'; // Grey (Other)
  }
};

// Create a custom Leaflet DivIcon
export const createCustomIcon = (color: string) => {
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            background-color: white;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `,
    className: 'custom-leaflet-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

// Event handler for selecting a location on the map
const MapClickHandler: React.FC<{ onMapClick?: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const LeafletMap: React.FC<LeafletMapProps> = ({
  reports,
  center = [30.2672, -97.7431], // Austin, TX default center
  zoom = 12,
  interactive = false,
  onLocationSelect,
  selectedLocation,
}) => {
  const navigate = useNavigate();

  const mapCenter = selectedLocation || center;

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', minHeight: '350px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {interactive && onLocationSelect && (
        <MapClickHandler onMapClick={onLocationSelect} />
      )}

      {selectedLocation && (
        <Marker 
          position={selectedLocation} 
          icon={createCustomIcon('#1565C0')}
        >
          <Popup>Selected Location</Popup>
        </Marker>
      )}

      {reports.map((report) => {
        const color = getReportColor(report);
        const icon = createCustomIcon(color);
        const dateStr = new Date(report.created_at).toLocaleDateString();
        
        return (
          <Marker 
            key={report.id} 
            position={[report.latitude, report.longitude]} 
            icon={icon}
          >
            <Popup minWidth={200}>
              <div className="map-popup-card">
                <h3>{report.issue_type}</h3>
                <p style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: report.status === 'Resolved' ? '#4CAF50' : '#F44336',
                  textTransform: 'uppercase',
                  marginBottom: '6px'
                }}>
                  {report.status} &bull; {report.report_code}
                </p>
                <p style={{ 
                  maxHeight: '60px', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {report.description || 'No description provided.'}
                </p>
                <div className="popup-meta">
                  <span>Date: {dateStr}</span>
                  <span>Verified: {report.verification_counts.confirmed}</span>
                </div>
                <button 
                  className="popup-btn"
                  onClick={() => navigate(`/report/${report.id}`)}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default LeafletMap;
