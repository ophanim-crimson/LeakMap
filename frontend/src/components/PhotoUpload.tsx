import React, { useState, useRef } from 'react';
import { Button, Alert, Spin, Image } from 'antd';
import { CameraOutlined, UploadOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { uploadPhoto } from '../api';

interface PhotoUploadProps {
  onPhotoUploaded: (url: string | null) => void;
  uploadedUrl: string | null;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotoUploaded, uploadedUrl }) => {
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      // Validate type
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

          // Resize long edge to 1200px max
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
                // Return new WebP compressed file
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
            0.8 // WebP compression ratio (80% quality)
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // File limit check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image file size exceeds the 5MB maximum limit.');
      return;
    }

    try {
      const processedFile = await compressImage(file);
      
      setUploading(true);
      const res = await uploadPhoto(processedFile);
      onPhotoUploaded(res.image_url);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoUploaded(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const triggerGallery = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  const isProcessing = compressing || uploading;

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
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
      />

      {uploadedUrl ? (
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          width: '100%',
          maxHeight: '260px',
          border: '1px solid var(--border-color)',
          backgroundColor: '#000',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* Resolve URL relative or absolute */}
          <Image
        src={uploadedUrl.startsWith('http') ? uploadedUrl : `${import.meta.env.VITE_API_URL || ''}${uploadedUrl}`}

            alt="Leak Preview"
            style={{ maxHeight: '260px', objectFit: 'contain', width: '100%' }}
          />
          <Button
            type="primary"
            danger
            icon={<CloseCircleOutlined />}
            onClick={handleRemovePhoto}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              zIndex: 10
            }}
          />
        </div>
      ) : (
        <div 
          className="photo-uploader"
          style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
        >
          {isProcessing ? (
            <div style={{ padding: '20px 0' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                {compressing ? 'Compressing photo...' : 'Uploading photo...'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Button 
                  icon={<CameraOutlined />} 
                  onClick={triggerCamera}
                  style={{ borderRadius: '20px' }}
                >
                  Take Photo
                </Button>
                <Button 
                  icon={<UploadOutlined />} 
                  onClick={triggerGallery}
                  style={{ borderRadius: '20px' }}
                >
                  Upload Gallery
                </Button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                JPEG, PNG or WEBP (Max 5MB) • Compressed to WebP automatically.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
