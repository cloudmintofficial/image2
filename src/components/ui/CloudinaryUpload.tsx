'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface CloudinaryUploadProps {
  uploadType: 'doctor-signature' | 'lab-signature' | 'patient-profile' | 'lab-logo' | 'report-pdf' | 'prescription';
  onUploadSuccess: (fileInfo: { url: string; public_id: string; format: string }) => void;
  onUploadError?: (error: string) => void;
  allowedTypes?: string[]; // e.g. ['image/png', 'image/jpeg', 'application/pdf']
  maxSizeMB?: number;
  label?: string;
  value?: string; // Existing file URL
  onRemove?: () => void;
}

export default function CloudinaryUpload({
  uploadType,
  onUploadSuccess,
  onUploadError,
  allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
  maxSizeMB = 5,
  label = 'Upload File',
  value,
  onRemove,
}: CloudinaryUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  React.useEffect(() => {
    setPreviewUrl(value || null);
    if (!value) {
      setSuccess(false);
    }
  }, [value]);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = async (file: File) => {
    setError(null);
    setSuccess(false);

    // 1. Validation: MIME Type
    if (!allowedTypes.includes(file.type)) {
      const errMsg = `Invalid file type. Allowed formats: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`;
      setError(errMsg);
      if (onUploadError) onUploadError(errMsg);
      return;
    }

    // 2. Validation: Max Size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const errMsg = `File size exceeds the limit of ${maxSizeMB}MB.`;
      setError(errMsg);
      if (onUploadError) onUploadError(errMsg);
      return;
    }

    // 3. Initiate Upload Flow
    setUploading(true);
    setProgress(10); // Start progress

    // Simulate progress bar movement
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);

      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file.');
      }

      const result = await response.json();
      setProgress(100);
      setSuccess(true);
      setPreviewUrl(result.file.url);
      onUploadSuccess(result.file);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'Something went wrong during upload.');
      if (onUploadError) onUploadError(err.message || 'Something went wrong during upload.');
    } finally {
      setTimeout(() => {
        setUploading(false);
      }, 500);
    }
  };

  const handleRemove = async () => {
    if (onRemove) {
      onRemove();
    }
    setPreviewUrl(null);
    setSuccess(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isPdf = previewUrl?.toLowerCase().endsWith('.pdf') || previewUrl?.includes('raw/upload');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {label && <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{label}</label>}

      {/* Upload Box / Preview Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive ? '2px dashed #E8751A' : '2px dashed #cbd5e1',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dragActive ? '#fef7f2' : '#f8fafc',
          cursor: uploading ? 'not-allowed' : 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
          minHeight: '160px',
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />

        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
            <RefreshCw style={{ animation: 'spin 1.5s linear infinite', color: '#E8751A' }} size={32} />
            <span style={{ fontSize: '14px', color: '#64748b' }}>Uploading file ({progress}%)</span>
            <div style={{ width: '80%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#E8751A',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>
        ) : previewUrl ? (
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
            onClick={(e) => e.stopPropagation()} // Prevent click from triggering file select
          >
            {isPdf ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <FileText size={48} color="#E8751A" />
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#E8751A', textDecoration: 'underline', fontSize: '14px', fontWeight: 500 }}
                >
                  View Uploaded PDF Report
                </a>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Upload preview"
                style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            )}

            <button
              onClick={handleRemove}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <X size={14} /> Remove File
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
            <Upload size={36} color="#94a3b8" />
            <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>
              Drag & Drop file here, or <span style={{ color: '#E8751A' }}>browse</span>
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              PNG, JPG or PDF up to {maxSizeMB}MB
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '13px', marginTop: '4px' }}>
          <CheckCircle2 size={16} />
          <span>Upload complete!</span>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
