import React, { useState } from 'react';
import { Card, Button, Input, Typography, Alert, Result } from 'antd';
import { 
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import PhotoUpload, { PhotoItem } from '../components/PhotoUpload';
import { createReport, Report as APIReport } from '../api';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const Report: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Form State
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [issueType, setIssueType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  
  // Result State
  const [createdReport, setCreatedReport] = useState<APIReport | null>(null);
  const [hoveredIssueIndex, setHoveredIssueIndex] = useState<number | null>(null);

  const handleLocationSelect = (lat: number, lng: number) => {
    setLocation([lat, lng]);
  };

  const next = () => setCurrentStep(currentStep + 1);
  const prev = () => setCurrentStep(currentStep - 1);

  const handleSubmit = async () => {
    if (!location) {
      setSubmitError('Location is required. Please set your coordinates.');
      return;
    }
    if (!issueType) {
      setSubmitError('Issue Type is required. Please select one.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await createReport({
        issue_type: issueType,
        description: description.trim() || undefined,
        latitude: location[0],
        longitude: location[1],
        photos: photos.map(p => ({
          image_url: p.image_url,
          file_size: p.file_size,
          display_order: p.display_order
        }))
      });
      setCreatedReport(res);
      setCurrentStep(5); // Success step
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const flowSections = [
    { label: 'Enter Location', index: 0 },
    { label: 'Issue Type', index: 1 },
    { label: 'Details', index: 2 },
    { label: 'Photos', index: 3 },
    { label: 'Submit Report', index: 4 }
  ];

  const renderFlowIndicator = () => {
    // Hide flow indicator on success step
    if (currentStep === 5) return null;
    return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'center',
        marginBottom: '24px'
      }}>
        {flowSections.map((sec) => {
          const isCompleted = currentStep > sec.index;
          const isCurrent = currentStep === sec.index;
          
          return (
            <div
              key={sec.index}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isCurrent ? 'var(--light-blue)' : 'var(--white)',
                border: isCurrent 
                  ? '2px solid var(--primary-color)' 
                  : '1px solid var(--border-color)',
                color: isCurrent 
                  ? 'var(--primary-color)' 
                  : (isCompleted ? 'var(--success-color)' : 'var(--text-muted)'),
                fontWeight: isCurrent || isCompleted ? 600 : 500,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isCurrent ? '0 4px 12px rgba(21, 101, 192, 0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {isCompleted ? '✓ ' : ''}{sec.label}
            </div>
          );
        })}
      </div>
    );
  };

  const issueTypes = [
    { type: 'Leak', label: 'Water Leak', desc: 'Cracked pipes, bursting joints, leaking mains', color: '#F44336', icon: '💧' },
    { type: 'Overflow', label: 'Tap/Tank Overflow', desc: 'Public taps left running, overflowing tanks', color: '#FF9800', icon: '🌊' },
    { type: 'Damaged Tap', label: 'Damaged Tap', desc: 'Broken faucet handles, missing valves', color: '#FFD600', icon: '🚰' },
    { type: 'Broken Valve', label: 'Broken Valve', desc: 'Stuck gates, leaking regulators, rusty shutoffs', color: '#FFD600', icon: '⚙️' },
    { type: 'Water Supply Issue', label: 'Supply Issue', desc: 'Low water pressure, brownish water, shortages', color: '#1565C0', icon: '🚫' },
    { type: 'Other', label: 'Other', desc: 'Sprinkler issues, open inspection chambers', color: '#78909C', icon: '📌' }
  ];

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-secondary)', marginBottom: '8px' }}>
          Report Water Issue
        </Title>
        <Paragraph style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Help your local community by recording water system damage.
        </Paragraph>
      </div>

      {/* Progress Custom Sections */}
      {renderFlowIndicator()}

      {submitError && (
        <Alert message={submitError} type="error" showIcon style={{ marginBottom: '20px' }} />
      )}

      {/* Steps Content Card */}
      <Card 
        bodyStyle={{ padding: '24px' }} 
        style={{ 
          border: '1px solid var(--border-color)', 
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        
        {/* Step 0: Enter Location */}
        {currentStep === 0 && (
          <div>
            <Title level={4} style={{ fontSize: '18px', marginBottom: '16px', fontFamily: 'var(--font-secondary)' }}>
              Set Location
            </Title>
            <LocationPicker 
              onLocationSelected={handleLocationSelect} 
              selectedLocation={location} 
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button 
                type="primary" 
                onClick={next} 
                disabled={!location}
                icon={<RightOutlined />}
                style={{ borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', width: '170px', height: '40px', justifyContent: 'center' }}
              >
                Choose Issue Type
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Issue Type */}
        {currentStep === 1 && (
          <div>
            <Title level={4} style={{ fontSize: '18px', marginBottom: '16px', fontFamily: 'var(--font-secondary)' }}>
              Select Issue Type
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {issueTypes.map((item, index) => {
                const isSelected = issueType === item.type;
                const isHovered = hoveredIssueIndex === index;
                return (
                <div 
                  key={item.type}
                  onClick={() => setIssueType(item.type)}
                  onMouseEnter={() => setHoveredIssueIndex(index)}
                  onMouseLeave={() => setHoveredIssueIndex(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected
                      ? `2px solid ${item.color}` 
                      : '1px solid var(--border-color)',
                    backgroundColor: isSelected
                      ? `${item.color}08`
                      : isHovered
                        ? `${item.color}0A`
                        : 'var(--white)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                      {item.label}
                    </span>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: `2px solid ${issueType === item.type ? item.color : '#CBD5E1'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {issueType === item.type && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: item.color
                      }}></div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <Button 
                onClick={prev}
                icon={<LeftOutlined />}
                style={{ borderRadius: 'var(--radius-md)', width: '170px', height: '40px' }}
              >
                Change Location
              </Button>
              <Button 
                type="primary" 
                onClick={next} 
                disabled={!issueType}
                icon={<RightOutlined />}
                style={{ borderRadius: 'var(--radius-md)', width: '170px', height: '40px' }}
              >
                Add Details
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {currentStep === 2 && (
          <div>
            <Title level={4} style={{ fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-secondary)' }}>
              Add Details (Optional)
            </Title>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Provide additional details about the problem to help verify it.
            </p>
            <TextArea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe the issue.\n\nExample:\nWater has been leaking continuously near the bus stop for the past two days.`}
              maxLength={500}
              style={{ borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '14px' }}
            />
            <div style={{ textAlign: 'right', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {description.length} / 500 Characters
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <Button 
                onClick={prev}
                icon={<LeftOutlined />}
                style={{ borderRadius: 'var(--radius-md)', width: '170px', height: '40px' }}
              >
                Change Issue Type
              </Button>
              <Button 
                type="primary" 
                onClick={next}
                icon={<RightOutlined />}
                style={{ borderRadius: 'var(--radius-md)', width: '170px', height: '40px' }}
              >
                Add Photos
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {currentStep === 3 && (
          <div>
            <Title level={4} style={{ fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-secondary)' }}>
              Attach Photos (Optional)
            </Title>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Upload up to 5 photos showing the issue from different angles to provide better evidence.
            </p>
            
            <PhotoUpload 
              photos={photos} 
              onChange={setPhotos} 
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <Button 
                onClick={prev}
                icon={<LeftOutlined />}
                style={{ borderRadius: 'var(--radius-md)', width: '170px', height: '40px' }}
              >
                Edit Details
              </Button>
              <Button 
                type="primary" 
                onClick={next}
                icon={<RightOutlined />}
                style={{ borderRadius: 'var(--radius-md)', width: '170px', height: '40px' }}
              >
                Review & Submit
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Submit Report Summary */}
        {currentStep === 4 && (
          <div>
            <Title level={4} style={{ fontSize: '18px', marginBottom: '16px', fontFamily: 'var(--font-secondary)' }}>
              Confirm Report Details
            </Title>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: 'var(--background-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>LOCATION COORDINATES</span>
                <Text style={{ fontSize: '14px', fontWeight: 500 }}>
                  {location ? `${location[0].toFixed(6)}, ${location[1].toFixed(6)}` : 'Not selected'}
                </Text>
              </div>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: 'var(--background-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>ISSUE TYPE</span>
                <Text style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)' }}>
                  {issueType}
                </Text>
              </div>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: 'var(--background-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>DESCRIPTION</span>
                <Text style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {description.trim() || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description provided</span>}
                </Text>
              </div>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: 'var(--background-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>ATTACHED PHOTOS</span>
                {photos.length === 0 ? (
                  <Text style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No photos attached</Text>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {photos.map((p, idx) => {
                      const apiBase = import.meta.env.VITE_API_URL || '';
                      const imgUrl = p.image_url.startsWith('http') ? p.image_url : `${apiBase}${p.image_url}`;
                      return (
                        <img 
                          key={p.image_url} 
                          src={imgUrl} 
                          alt={`Review ${idx + 1}`}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <Button 
                onClick={prev}
                icon={<LeftOutlined />}
                style={{ borderRadius: 'var(--radius-md)', width: '170px', height: '40px' }}
                disabled={submitting}
              >
                Manage Photos
              </Button>
              <Button 
                type="primary" 
                onClick={handleSubmit}
                loading={submitting}
                icon={<CheckCircleOutlined />}
                style={{ borderRadius: 'var(--radius-md)', width: '170px', height: '40px' }}
              >
                Submit Report
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Success Screen */}
        {currentStep === 5 && createdReport && (
          <Result
            status="success"
            title="Report Filed Successfully"
            subTitle={
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <p>Report Code: <strong>{createdReport.report_code}</strong></p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Submitted on {new Date(createdReport.created_at).toLocaleString()}
                </p>
              </div>
            }
            extra={[
              <Button 
                type="primary" 
                key="details"
                style={{ borderRadius: '20px' }}
                onClick={() => navigate(`/report/${createdReport.id}`)}
              >
                View Report
              </Button>,
              <Button 
                key="home"
                style={{ borderRadius: '20px' }}
                onClick={() => navigate('/')}
              >
                Return Home
              </Button>,
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default Report;
