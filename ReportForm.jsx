import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Upload, Alert, Radio, Space, message } from 'antd';
import { EnvironmentOutlined, CameraOutlined, UploadOutlined, CompassOutlined } from '@ant-design/icons';
import MapView from './MapView';
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;

const ReportForm = ({ onCancel, onSuccess, apiBaseUrl = 'http://localhost:8000' }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [locationMode, setLocationMode] = useState('auto'); // 'auto' or 'manual'
  const [coords, setCoords] = useState(null); // { lat, lng, accuracy }
  const [fileList, setFileList] = useState([]);
  const [geoError, setGeoError] = useState(null);

  // 1. Auto detect location on load
  useEffect(() => {
    if (locationMode === 'auto') {
      detectLocation();
    }
  }, [locationMode]);

  const detectLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      setLocationMode('manual');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setCoords(newCoords);
        form.setFieldsValue({
          latitude: newCoords.lat.toFixed(6),
          longitude: newCoords.lng.toFixed(6),
        });
      },
      (error) => {
        let msg = "Could not fetch GPS location. Please try manually placing a pin.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please switch to manual pin placement.";
        }
        setGeoError(msg);
        setLocationMode('manual');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleManualLocation = (lat, lng) => {
    const newCoords = { lat, lng };
    setCoords(newCoords);
    form.setFieldsValue({
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    });
  };

  // Image handling
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList.slice(-1)); // Only keep the single latest file
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('Image must be smaller than 10MB!');
    }
    return isImage && isLt10M ? Upload.LIST_IGNORE : false;
  };

  // Form submission
  const handleSubmit = async (values) => {
    if (!coords) {
      message.error("Please specify a location using GPS or map pin placement.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('issue_type', values.issue_type);
      formData.append('description', values.description);
      formData.append('latitude', coords.lat);
      formData.append('longitude', coords.lng);
      
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      const response = await axios.post(`${apiBaseUrl}/api/reports`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      message.success('Water infrastructure issue reported successfully!');
      if (onSuccess) {
        onSuccess(response.data);
      }
      form.resetFields();
      setFileList([]);
      setCoords(null);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.detail || 'Failed to submit report. Please check connections.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '650px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CompassOutlined style={{ color: 'var(--primary)' }} />
        Report Water Infrastructure Issue
      </h2>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ issue_type: 'Leak' }}
      >
        <Form.Item
          name="issue_type"
          label="What is the issue?"
          rules={[{ required: true, message: 'Please select an issue type' }]}
        >
          <Select size="large">
            <Option value="Leak">💧 Major Leak</Option>
            <Option value="Overflow">🌊 Overflowing Public Tap/Tank</Option>
            <Option value="Damaged Infrastructure">🔧 Damaged Valve/Asset</Option>
            <Option value="Supply Issue">🚫 Water Supply Interruption</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Describe the issue"
          rules={[
            { required: true, message: 'Please provide a short description' },
            { min: 10, message: 'Description should be at least 10 characters' }
          ]}
        >
          <TextArea 
            rows={3} 
            placeholder="e.g. Water is bubbling up through the cracked sidewalk near the bus shelter..." 
          />
        </Form.Item>

        <div style={{ marginBottom: '16px' }}>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Geotag Location</span>
          
          <Radio.Group 
            value={locationMode} 
            onChange={(e) => setLocationMode(e.target.value)}
            style={{ marginBottom: '12px' }}
          >
            <Radio.Button value="auto">
              <CompassOutlined /> Use Browser GPS
            </Radio.Button>
            <Radio.Button value="manual">
              <EnvironmentOutlined /> Manual Map Pin-Drop
            </Radio.Button>
          </Radio.Group>

          {locationMode === 'auto' && geoError && (
            <Alert 
              message={geoError} 
              type="warning" 
              showIcon 
              style={{ marginBottom: '12px' }} 
            />
          )}

          {locationMode === 'manual' && (
            <Alert 
              message="Click on the map below or drag the marker to pin the exact leak location." 
              type="info" 
              showIcon 
              style={{ marginBottom: '12px' }} 
            />
          )}

          <MapView 
            interactive={locationMode === 'manual'} 
            onLocationSelect={handleManualLocation}
            tempMarkerCoords={coords}
            height="240px"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <Form.Item
              name="latitude"
              label="Latitude"
              rules={[{ required: true, message: 'Latitude is required' }]}
            >
              <Input disabled placeholder="Fetch via GPS or Map" />
            </Form.Item>
            
            <Form.Item
              name="longitude"
              label="Longitude"
              rules={[{ required: true, message: 'Longitude is required' }]}
            >
              <Input disabled placeholder="Fetch via GPS or Map" />
            </Form.Item>
          </div>
        </div>

        <Form.Item label="Attach Photograph (Optional)">
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleUploadChange}
            beforeUpload={beforeUpload}
            customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
          >
            {fileList.length >= 1 ? null : (
              <div>
                <CameraOutlined style={{ fontSize: '20px' }} />
                <div style={{ marginTop: 8 }}>Take Photo / Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <Button onClick={onCancel} size="large">
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading} size="large">
            Submit Report
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default ReportForm;
