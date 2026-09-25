import React, { useState, useRef } from 'react';
import { Button, Alert, Spin, Tooltip } from 'antd';
import { 
  CameraOutlined, 
  UploadOutlined, 
  DeleteOutlined, 
  LeftOutlined, 
  RightOutlined,
  PlusOutlined,
  LoadingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { uploadPhoto, getImageUrl } from '../api';
import { useTranslation } from 'react-i18next';

export interface PhotoItem {
  image_url: string;
  file_size: number;
  display_order: number;
  ai_description?: string;
}

interface PhotoUploadProps {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ photos, onChange }) => {
  const { t } = useTranslation();
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMsg('Invalid file type. Please upload a JPG, PNG, or WEBP image.');
        resolve(file);
        return;
      }

      setCompressing(true);
      setErrorMsg(null);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setCompressing(false);
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              setCompressing(false);
              if (blob) {
                const webpFile = new File(
                  [blob], 
                  file.name.substring(0, file.name.lastIndexOf('.')) + '.webp', 
                  { type: 'image/webp', lastModified: Date.now() }
                );
                resolve(webpFile);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            0.8
          );
        };
      };
      reader.onerror = () => {
        setCompressing(false);
        resolve(file);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesToUpload: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      if (photos.length + filesToUpload.length >= 3) {
        setErrorMsg('Maximum of 3 photos allowed per report.');
        break;
      }
      const file = fileList[i];
      const filename = file.name ? file.name.toLowerCase() : '';
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const isAllowed = allowedExtensions.some(ext => filename.endsWith(ext));
      if (!isAllowed) {
        setErrorMsg('Invalid file type. Only JPG, JPEG, PNG, and WEBP formats are supported.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image file size exceeds the 5MB limit.');
        continue;
      }
      filesToUpload.push(file);
    }

    if (filesToUpload.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    try {
      // Process and upload all selected files concurrently
      const uploadedItems = await Promise.all(
        filesToUpload.map(async (file, idx) => {
          const compressed = await compressImage(file);
          const res = await uploadPhoto(compressed);
          return {
            image_url: res.image_url,
            file_size: res.file_size || compressed.size,
            display_order: photos.length + idx + 1,
            ai_description: res.ai_description
          } as PhotoItem;
        })
      );

      onChange([...photos, ...uploadedItems]);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, idx) => idx !== index);
    newPhotos.forEach((p, idx) => {
      p.display_order = idx + 1;
    });
    onChange(newPhotos);
    setErrorMsg(null);
  };

  const moveLeft = (index: number) => {
    if (index === 0) return;
    const newPhotos = [...photos];
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[index - 1];
    newPhotos[index - 1] = temp;
    newPhotos.forEach((p, idx) => {
      p.display_order = idx + 1;
    });
    onChange(newPhotos);
  };

  const moveRight = (index: number) => {
    if (index === photos.length - 1) return;
    const newPhotos = [...photos];
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[index + 1];
    newPhotos[index + 1] = temp;
    newPhotos.forEach((p, idx) => {
      p.display_order = idx + 1;
    });
    onChange(newPhotos);
  };

  const triggerGallery = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  const isProcessing = compressing || uploading;
  const totalSize = photos.reduce((acc, p) => acc + p.file_size, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {errorMsg && (
        <Alert message={errorMsg} type="error" showIcon closable onClose={() => setErrorMsg(null)} />
      )}

      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        style={{ display: 'none' }}
      />

      {/* Horizontal Gallery Wrapper */}
      <div style={{ 
        border: '1px solid var(--border-color)', 
        borderRadius: 'var(--radius-md)', 
        padding: '16px',
        backgroundColor: '#FCFDFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '12px', 
          alignItems: 'center' 
        }}>
          {photos.map((photo, index) => {
            const imgUrl = getImageUrl(photo.image_url);
            const isPrimary = index === 0;

            return (
              <div 
                key={photo.image_url} 
                style={{
                  position: 'relative',
                  width: '120px',
                  height: '140px',
                  borderRadius: '8px',
                  border: isPrimary ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  overflow: 'hidden',
                  backgroundColor: '#000',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s'
                }}
              >
                {/* Photo Preview Container */}
                <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                  <img 
                    src={imgUrl} 
                    alt={`Preview ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Primary Badge */}
                  {isPrimary && (
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '4px',
                      backgroundColor: 'var(--primary-color)',
                      color: '#FFF',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      <CheckCircleOutlined style={{ fontSize: '9px' }} /> {t('PRIMARY')}
                    </div>
                  )}

                  {/* Delete Button */}
                  <Button
                    type="primary"
                    danger
                    shape="circle"
                    icon={<DeleteOutlined style={{ fontSize: '10px' }} />}
                    onClick={() => removePhoto(index)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '22px',
                      height: '22px',
                      minWidth: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  />
                </div>

                {/* Footer Controls & Info */}
                <div style={{ 
                  backgroundColor: '#FFF', 
                  borderTop: '1px solid var(--border-color)',
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: '36px'
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {formatSize(photo.file_size)}
                  </span>
                  
                  {/* Order controls */}
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <Button
                      type="text"
                      icon={<LeftOutlined style={{ fontSize: '9px' }} />}
                      disabled={index === 0}
                      onClick={() => moveLeft(index)}
                      style={{ width: '18px', height: '18px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    />
                    <Button
                      type="text"
                      icon={<RightOutlined style={{ fontSize: '9px' }} />}
                      disabled={index === photos.length - 1}
                      onClick={() => moveRight(index)}
                      style={{ width: '18px', height: '18px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add More button card */}
          {photos.length < 3 && (
            <div 
              onClick={isProcessing ? undefined : triggerGallery}
              style={{
                width: '120px',
                height: '140px',
                borderRadius: '8px',
                border: '2px dashed var(--border-color)',
                backgroundColor: '#FFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                gap: '8px',
                color: 'var(--text-muted)'
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.borderColor = 'var(--primary-color)';
                  e.currentTarget.style.color = 'var(--primary-color)';
                  e.currentTarget.style.backgroundColor = 'var(--light-blue)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.backgroundColor = '#FFF';
                }
              }}
            >
              {isProcessing ? (
                <Spin indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />} />
              ) : (
                <>
                  <PlusOutlined style={{ fontSize: '20px' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>{t('Add Photo')}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Gallery Meta Info */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontSize: '11px', 
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '8px',
          marginTop: '4px'
        }}>
          <span>{t('Photos')}: <strong>{photos.length} / 3</strong></span>
          <span>{t('Total Size')}: <strong>{formatSize(totalSize)} / 25 MB</strong></span>
        </div>
      </div>

      {/* Bottom upload actions if no photos yet */}
      {photos.length === 0 && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '4px' }}>
          <Button 
            icon={<CameraOutlined />} 
            onClick={triggerCamera}
            disabled={isProcessing}
            style={{ borderRadius: '20px' }}
          >
            {t('Take Photo')}
          </Button>
          <Button 
            icon={<UploadOutlined />} 
            onClick={triggerGallery}
            disabled={isProcessing}
            style={{ borderRadius: '20px' }}
          >
            {t('Upload Gallery')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
