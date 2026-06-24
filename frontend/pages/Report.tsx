import React, { useState } from 'react';
import { Card, Steps, Button, Input, Space, Typography, Alert, Result } from 'antd';
import { 
  EnvironmentOutlined, 
  UnorderedListOutlined, 
  FileTextOutlined, 
  CameraOutlined, 
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
  CompassOutlined,
  AlertOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../src/components/LocationPicker';
import PhotoUpload from '../src/components/PhotoUpload';
import { createReport, uploadPhoto, Report } from '../src/api';


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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  // Result State
  const [createdReport, setCreatedReport] = useState<APIReport | null>(null);

  const handleLocationSelect = (lat: number, lng: number) => {
    setLocation([lat, lng]);
  };

  const next = () => setCurrentStep(currentStep + 1);
  const prev = () => setCurrentStep(currentStep - 1);

  const handleSubmit = async () => {
    if (!location) {
      setSubmitError('Location is required. Please set your coordinates in Step 1.');
      return;
    }
    if (!issueType) {
      setSubmitError('Issue Type is required. Please select one in Step 2.');
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
        photo_url: photoUrl || undefined
      });
      setCreatedReport(res);
      next(); // Go to step 5 (success)
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { title: 'Location', icon: <EnvironmentOutlined /> },
    { title: 'Issue Type', icon: <UnorderedListOutlined /> },
    { title: 'Details', icon: <FileTextOutlined /> },
    { title: 'Photo', icon: <CameraOutlined /> },
    { title: 'Submit', icon: <CheckCircleOutlined /> }
  ];

  const issueTypes = [
    { type: 'Leak', label: 'Water Leak', desc: 'Cracked pipes, bursting joints, leaking mains', color: '#F44336', icon: '💧' },
    { type: 'Overflow', label: 'Tap/Tank Overflow', desc: 'Public taps left running, overflowing tanks', color: '#FF9800', icon: '🌊' },
    { type: 'Damaged Tap', label: 'Damaged Tap', desc: 'Broken faucet handles, missing valves', color: '#FFD600', icon: '🚰' },
    { type: 'Broken Valve', label: 'Broken Valve', desc: 'Stuck gates, leaking regulators, rusty shutoffs', color: '#FFD600', icon: '⚙️' },
    { type: 'Water Supply Issue', label: 'Supply Issue', desc: 'Low water pressure, brownish water, shortages', color: '#1565C0', icon: '🚫' },
    { type: 'Other', label: 'Other', desc: 'Sprinkler issues, open inspection chambers', color: '#78909C', icon: '📌' }
  ];

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-secondary)' }}>
          Report Water Issue
        </Title>
        <Paragraph style={{ color: 'var(--text-secondary)' }}>
          Follow these simple steps to document water infrastructure damage.
        </Paragraph>
      </div>

      {/* Progress Steps for Desktop, simple count for Mobile */}
      <div style={{ marginBottom: '24px' }}>
        {/* Responsive display: Steps component hides on tiny screens via standard layout or we can style it */}
        <Steps 
          current={currentStep} 
          size="small" 
          responsive 
          style={{ marginBottom: '20px' }}
          items={steps.map(item => ({
            title: item.title,
            icon: item.icon
          }))}
        />
      </div>

      {submitError && (
        <Alert message={submitError} type="error" showIcon style={{ marginBottom: '20px' }} />
      )}

      {/* Steps Content Card */}
      <Card bodyStyle={{ padding: '24px' }} style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Step 1: Location */}
        {currentStep === 0 && (
          <div>
            <Title level={4} style={{ fontSize: '18px', marginBottom: '16px', fontFamily: 'var(--font-secondary)' }}>
              Step 1: Set Location
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
                style={{ borderRadius: '20px', height: 'auto', display: 'flex', alignItems: 'center' }}
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Issue Type */}
        {currentStep === 1 && (
          <div>
            <Title level={4} style={{ fontSize: '18px', marginBottom: '16px', fontFamily: 'var(--font-secondary)' }}>
              Step 2: Select Issue Type
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {issueTypes.map((item) => (
                <div 
                  key={item.type}
                  onClick={() => setIssueType(item.type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: issueType === item.type 
                      ? `2px solid ${item.color}` 
                      : '1px solid var(--border-color)',
                    backgroundColor: issueType === item.type 
                      ? `${item.color}08` // 5% transparency
                      : 'var(--white)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
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
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <Button 
                onClick={prev}
                icon={<LeftOutlined />}
                style={{ borderRadius: '20px' }}
              >
                Back
              </Button>
              <Button 
                type="primary" 
                onClick={next} 
                disabled={!issueType}
                icon={<RightOutlined />}
                style={{ borderRadius: '20px' }}
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Description */}
        {currentStep === 2 && (
          <div>
            <Title level={4} style={{ fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-secondary)' }}>
              Step 3: Description (Optional)
            </Title>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Add details that can help identify the issue. (Max 500 characters)
            </p>
            <TextArea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., The pipeline valve is leaking near the hydrant. Clean drinking water is pooling across the bike path..."
              maxLength={500}
              showCount
              style={{ borderRadius: 'var(--radius-md)' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <Button 
                onClick={prev}
                icon={<LeftOutlined />}
                style={{ borderRadius: '20px' }}
              >
                Back
              </Button>
              <Button 
                type="primary" 
                onClick={next}
                icon={<RightOutlined />}
                style={{ borderRadius: '20px' }}
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Photo Upload */}
        {currentStep === 3 && (
          <div>
            <Title level={4} style={{ fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-secondary)' }}>
              Step 4: Attach a Photo (Optional)
            </Title>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Take a live photo or select one from your camera roll to verify the problem.
            </p>
            
            <PhotoUpload 
              onPhotoUploaded={setPhotoUrl} 
              uploadedUrl={photoUrl} 
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <Button 
                onClick={prev}
                icon={<LeftOutlined />}
                style={{ borderRadius: '20px' }}
                disabled={submitting}
              >
                Back
              </Button>
              
              <Button 
                type="primary" 
                onClick={handleSubmit}
                loading={submitting}
                icon={<CheckCircleOutlined />}
                style={{ borderRadius: '20px' }}
              >
                Submit Report
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Success Screen */}
        {currentStep === 4 && createdReport && (
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
