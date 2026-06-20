import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon path issues in bundle builders
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = ({ 
  reports = [], 
  onSelectReport, 
  selectedReport = null, 
  interactive = false, 
  onLocationSelect, 
  tempMarkerCoords = null,
  height = '500px'
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const tempMarkerRef = useRef(null);

  // Helper to create custom colored divIcon markers
  const createCustomIcon = (type) => {
    let colorClass = 'pin-leak';
    let iconChar = '💧'; // Default for Leak
    
    if (type === 'Overflow') {
      colorClass = 'pin-overflow';
      iconChar = '🌊';
    } else if (type === 'Damaged Infrastructure') {
      colorClass = 'pin-damaged';
      iconChar = '🔧';
    } else if (type === 'Supply Issue') {
      colorClass = 'pin-supply';
      iconChar = '🚫';
    }

    return L.divIcon({
      className: '',
      html: `<div class="custom-pin ${colorClass}"><div class="custom-pin-inner">${iconChar}</div></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -32]
    });
  };

  // 1. Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use Kochi/Ernakulam area or a default central location
    const defaultCenter = [9.9816, 76.2999]; 
    const defaultZoom = 13;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView(defaultCenter, defaultZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;

    // Handle map clicks when interactive
    if (interactive) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [interactive]);

  // 2. Render report markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Don't render markers if we are in interactive submission pin-placement mode
    if (interactive) return;

    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return;

      const marker = L.marker([report.latitude, report.longitude], {
        icon: createCustomIcon(report.issue_type)
      });

      // Bind simple popup
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; color: #0077B6;">${report.issue_type}</h4>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #555;">${report.description.substring(0, 60)}${report.description.length > 60 ? '...' : ''}</p>
          <button id="btn-popup-${report.id}" style="
            background: #0077B6; color: white; border: none; 
            padding: 4px 8px; border-radius: 4px; cursor: pointer; 
            font-size: 11px; width: 100%; font-weight: bold;
          ">View Details</button>
        </div>
      `);

      marker.addTo(map);
      markersRef.current.push(marker);

      // Trigger detail view on click
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${report.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            if (onSelectReport) onSelectReport(report.id);
            map.closePopup();
          });
        }
      });
    });
  }, [reports, interactive, onSelectReport]);

  // 3. Render manual temporary marker (for manual pin-drop during report submission)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !interactive) return;

    if (tempMarkerRef.current) {
      map.removeLayer(tempMarkerRef.current);
      tempMarkerRef.current = null;
    }

    if (tempMarkerCoords) {
      const marker = L.marker([tempMarkerCoords.lat, tempMarkerCoords.lng], {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: `<div class="custom-pin pin-leak"><div class="custom-pin-inner">📍</div></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36]
        })
      });

      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      });

      marker.addTo(map);
      tempMarkerRef.current = marker;
      map.panTo([tempMarkerCoords.lat, tempMarkerCoords.lng]);
    }
  }, [tempMarkerCoords, interactive]);

  // 4. Center map on selected report
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedReport) return;

    map.setView([selectedReport.latitude, selectedReport.longitude], 15);
    
    // Find and open popup of the selected report marker
    const marker = markersRef.current.find(m => {
      const latlng = m.getLatLng();
      return Math.abs(latlng.lat - selectedReport.latitude) < 0.00001 && 
             Math.abs(latlng.lng - selectedReport.longitude) < 0.00001;
    });

    if (marker) {
      marker.openPopup();
    }
  }, [selectedReport]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: height, width: '100%' }}
      className="map-container"
    />
  );
};

export default MapView;
