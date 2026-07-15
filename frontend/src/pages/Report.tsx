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

const STEP_LABELS = ['Location', 'Issue Type', 'Details', 'Photos', 'Review'];

const Report: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [location, setLocation] = useState<[number, number] | null>(null);
  const [issueType, setIssueType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [createdReport, setCreatedReport] = useState<APIReport | null>(null);

  const next = () => setCurrentStep(s => s + 1);
  const prev = () => setCurrentStep(s => s - 1);

  const handleSubmit = async () => {
    if (!location) { setSubmitError('Location is required.'); return; }
    if (!issueType) { setSubmitError('Issue type is required.'); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await createReport({
        issue_type: issueType,
        description: description.trim() || undefined,
        latitude: location[0],
        longitude: location[1],
        photos: photos.map(p => ({ image_url: p.image_url, file_size: p.file_size, display_order: p.display_order }))
      });
      setCreatedReport(res);
      setCurrentStep(5);
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const issueTypes = [
    { type: 'Leak', label: 'Water Leak', desc: 'Cracked pipes, bursting joints, leaking mains', icon: '💧' },
    { type: 'Overflow', label: 'Tap/Tank Overflow', desc: 'Public taps left running, overflowing tanks', icon: '🌊' },
    { type: 'Damaged Tap', label: 'Damaged Tap', desc: 'Broken faucet handles, missing valves', icon: '🚰' },
    { type: 'Broken Valve', label: 'Broken Valve', desc: 'Stuck gates, leaking regulators, rusty shutoffs', icon: '⚙️' },
    { type: 'Water Supply Issue', label: 'Supply Issue', desc: 'Low pressure, brownish water, shortages', icon: '🚫' },
    { type: 'Other', label: 'Other', desc: 'Sprinkler issues, open inspection chambers', icon: '📌' },
  ];

  /* ── Step Progress Bar ── */
  const renderProgress = () => {
    if (currentStep === 5) return null;
    return (
      <div style={{ marginBottom: '20px' }}>
        {/* Numbered dots row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {STEP_LABELS.map((label, idx) => {
            const done = currentStep > idx;
            const active = currentStep === idx;
            return (
              <React.Fragment key={idx}>
                {/* dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '48px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    transition: 'all 0.25s',
                    background: done ? '#52c41a' : active ? 'var(--primary-color)' : '#e8edf4',
                    color: done || active ? '#fff' : '#94a3b8',
                    boxShadow: active ? '0 0 0 3px rgba(21,101,192,0.15)' : 'none',
                  }}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: active ? 700 : 500,
                    color: done ? '#52c41a' : active ? 'var(--primary-color)' : '#94a3b8',
                    marginTop: '4px',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                </div>
                {/* connector line */}
                {idx < STEP_LABELS.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    background: done ? '#52c41a' : '#e8edf4',
                    transition: 'all 0.25s',
                    marginBottom: '18px',
                    maxWidth: '40px',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── Nav button row (always safe on mobile) ── */
  const NavRow = ({ onBack, onNext, nextLabel, nextDisabled = false, nextLoading = false, nextIcon = <RightOutlined />, backLabel = 'Back' }: {
    onBack?: () => void;
    onNext: () => void;
    nextLabel: string;
    nextDisabled?: boolean;
    nextLoading?: boolean;
    nextIcon?: React.ReactNode;
    backLabel?: string;
  }) => (
    <div style={{
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
      flexDirection: 'row',
      flexWrap: 'wrap',
    }}>
      {onBack && (
        <Button
          icon={<LeftOutlined />}
          onClick={onBack}
          disabled={nextLoading}
          style={{
            flex: '1 1 120px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            minWidth: 0,
          }}
        >
          {backLabel}
        </Button>
      )}
      <Button
        type="primary"
        icon={nextIcon}
        onClick={onNext}
        disabled={nextDisabled}
        loading={nextLoading}
        style={{
          flex: '2 1 150px',
          height: '44px',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          minWidth: 0,
        }}
      >
        {nextLabel}
      </Button>
    </div>
  );

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '16px 12px 40px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Title level={2} style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-secondary)', marginBottom: '4px' }}>
          Report Water Issue
        </Title>
        <Paragraph style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>
          Help your local community by recording water system damage.
        </Paragraph>
      </div>

      {renderProgress()}

      {submitError && (
        <Alert message={submitError} type="error" showIcon style={{ marginBottom: '16px', borderRadius: 'var(--radius-md)' }} />
      )}

      <Card
        styles={{ body: { padding: '20px 16px' } }}
        style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-lg)' }}
      >

        {/* Step 0: Location */}
        {currentStep === 0 && (
          <div>
            <Title level={4} style={{ fontSize: '17px', marginBottom: '14px', fontFamily: 'var(--font-secondary)' }}>
              📍 Set Location
            </Title>
            <LocationPicker onLocationSelected={(lat, lng) => setLocation([lat, lng])} selectedLocation={location} />
            <NavRow
              onNext={next}
              nextLabel="Choose Issue Type"
              nextDisabled={!location}
            />
          </div>
        )}

        {/* Step 1: Issue Type */}
        {currentStep === 1 && (
          <div>
            <Title level={4} style={{ fontSize: '17px', marginBottom: '14px', fontFamily: 'var(--font-secondary)' }}>
              🔍 Select Issue Type
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {issueTypes.map((item) => {
                const isSelected = issueType === item.type;
                return (
                  <div
                    key={item.type}
                    onClick={() => setIssueType(item.type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid #52c41a' : '1.5px solid var(--border-color)',
                      backgroundColor: isSelected ? '#f6ffed' : 'var(--white)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 0 3px rgba(82,196,26,0.12)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '26px', flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: isSelected ? '#389e0d' : 'var(--text-primary)', display: 'block' }}>
                        {item.label}
                      </span>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'normal' }}>
                        {item.desc}
                      </p>
                    </div>
                    {/* Radio circle */}
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? '#52c41a' : '#cbd5e1'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: isSelected ? '#52c41a' : 'transparent',
                      transition: 'all 0.2s',
                    }}>
                      {isSelected && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <NavRow onBack={prev} backLabel="Change Location" onNext={next} nextLabel="Add Details" nextDisabled={!issueType} />
          </div>
        )}

        {/* Step 2: Details */}
        {currentStep === 2 && (
          <div>
            <Title level={4} style={{ fontSize: '17px', marginBottom: '6px', fontFamily: 'var(--font-secondary)' }}>
              📝 Add Details <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
            </Title>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Extra details help volunteers and authorities verify and fix the issue faster.
            </p>
            <TextArea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe the issue.\n\nExample:\nWater has been leaking continuously near the bus stop for the past two days.`}
              maxLength={500}
              style={{ borderRadius: 'var(--radius-md)', fontSize: '14px' }}
            />
            <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {description.length} / 500
            </div>
            <NavRow onBack={prev} backLabel="Change Type" onNext={next} nextLabel="Add Photos" />
          </div>
        )}

        {/* Step 3: Photos */}
        {currentStep === 3 && (
          <div>
            <Title level={4} style={{ fontSize: '17px', marginBottom: '6px', fontFamily: 'var(--font-secondary)' }}>
              📷 Attach Photos <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
            </Title>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Upload up to 5 photos showing the issue from different angles.
            </p>
            <PhotoUpload photos={photos} onChange={setPhotos} />
            <NavRow onBack={prev} backLabel="Edit Details" onNext={next} nextLabel="Review & Submit" />
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div>
            <Title level={4} style={{ fontSize: '17px', marginBottom: '16px', fontFamily: 'var(--font-secondary)' }}>
              ✅ Confirm Report Details
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' }}>
              {[
                { label: 'LOCATION COORDINATES', value: location ? `${location[0].toFixed(6)}, ${location[1].toFixed(6)}` : 'Not selected' },
                { label: 'ISSUE TYPE', value: issueType || '—' },
                { label: 'DESCRIPTION', value: description.trim() || 'No description provided' },
              ].map(({ label, value }) => (
                <div key={label} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px', background: 'var(--background-color)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>{label}</span>
                  <Text style={{ fontSize: '14px', fontWeight: 500 }}>{value}</Text>
                </div>
              ))}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px', background: 'var(--background-color)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>ATTACHED PHOTOS</span>
                {photos.length === 0 ? (
                  <Text style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No photos attached</Text>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {photos.map((p, idx) => {
                      const apiBase = import.meta.env.VITE_API_URL || '';
                      const imgUrl = p.image_url.startsWith('http') ? p.image_url : `${apiBase}${p.image_url}`;
                      return <img key={p.image_url} src={imgUrl} alt={`Photo ${idx + 1}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} />;
                    })}
                  </div>
                )}
              </div>
            </div>
            <NavRow
              onBack={prev}
              backLabel="Manage Photos"
              onNext={handleSubmit}
              nextLabel="Submit Report"
              nextLoading={submitting}
              nextIcon={<CheckCircleOutlined />}
            />
          </div>
        )}

        {/* Step 5: Success */}
        {currentStep === 5 && createdReport && (
          <Result
            status="success"
            title="Report Filed Successfully!"
            subTitle={
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <p>Report Code: <strong>{createdReport.report_code}</strong></p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Submitted on {new Date(createdReport.created_at).toLocaleString()}
                </p>
              </div>
            }
            extra={
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                <Button
                  type="primary"
                  style={{ borderRadius: '20px', flex: '1 1 130px', maxWidth: '200px', height: '40px' }}
                  onClick={() => navigate(`/report/${createdReport.id}`)}
                >
                  View Report
                </Button>
                <Button
                  style={{ borderRadius: '20px', flex: '1 1 130px', maxWidth: '200px', height: '40px' }}
                  onClick={() => navigate('/')}
                >
                  Return Home
                </Button>
              </div>
            }
          />
        )}

      </Card>
    </div>
  );
};

export default Report;
