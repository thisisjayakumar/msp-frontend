"use client";

import { useState, useEffect, useRef } from 'react';
import patrolAPI from '@/components/API_Service/patrol-api';

export default function PatrolUploadCard({ upload, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [remarks, setRemarks] = useState(upload.patrol_remarks || '');
  const [showReuploadConfirm, setShowReuploadConfirm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const fileInputRef = useRef(null);

  // Calculate time remaining for reupload
  useEffect(() => {
    if (upload.can_reupload && upload.reupload_deadline) {
      const interval = setInterval(() => {
        const now = new Date();
        const deadline = new Date(upload.reupload_deadline);
        const diff = deadline - now;

        if (diff <= 0) {
          setTimeRemaining('Expired');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [upload.can_reupload, upload.reupload_deadline]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file size must not exceed 10MB');
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Only JPEG, PNG, and WebP images are allowed');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      alert('Please select an image');
      return;
    }

    // If it's a reupload, show confirmation
    if (upload.qc_image && !showReuploadConfirm) {
      setShowReuploadConfirm(true);
      return;
    }

    setUploading(true);
    try {
      const result = await patrolAPI.uploads.submitUpload(upload.id, selectedImage, remarks);
      
      if (result.error) {
        alert(result.message || 'Failed to upload image');
      } else {
        alert('QC image uploaded successfully!');
        setSelectedImage(null);
        setImagePreview(null);
        setShowReuploadConfirm(false);
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUpload = async () => {
    if (!confirm('Are you sure you want to delete this upload? You can reupload within the time window.')) {
      return;
    }

    try {
      const result = await patrolAPI.uploads.deleteUpload(upload.id);
      
      if (result.error) {
        alert(result.message || 'Failed to delete upload');
      } else {
        alert('Upload deleted. You can now upload a new image.');
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete upload');
    }
  };

  const getStatusBadge = () => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-700',
      submitted: 'bg-green-100 text-green-700',
      missed: 'bg-red-100 text-red-700',
      reuploaded: 'bg-blue-100 text-blue-700'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[upload.status] || 'bg-gray-100 text-gray-700'}`}>
        {upload.status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const isWindowOpen = upload.is_upload_window_open;
  const canUpload = isWindowOpen && !upload.is_locked;
  const hasExistingUpload = !!upload.qc_image;

  return (
    <div className={`bg-gradient-to-br ${
      upload.status === 'missed' ? 'from-red-50 to-red-100 border-red-300' :
      upload.status === 'submitted' || upload.status === 'reuploaded' ? 'from-green-50 to-green-100 border-green-300' :
      isWindowOpen ? 'from-blue-50 to-blue-100 border-blue-300' :
      'from-gray-50 to-gray-100 border-gray-300'
    } border-2 rounded-lg p-4 shadow-sm transition-all hover:shadow-md`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-bold text-gray-800">
          {upload.scheduled_time}
        </div>
        {getStatusBadge()}
      </div>

      {/* Window Status */}
      <div className="text-sm text-gray-600 mb-3">
        {isWindowOpen ? (
          <span className="text-green-600 font-medium">
            ✓ Upload window is open
          </span>
        ) : upload.status === 'missed' ? (
          <span className="text-red-600 font-medium">
            ✗ Upload window closed
          </span>
        ) : (
          <span className="text-gray-500">
            Upload window: ±15-30 mins from scheduled time
          </span>
        )}
      </div>

      {/* Existing Upload Preview */}
      {hasExistingUpload && (
        <div className="mb-3">
          <div className="relative">
            <img 
              src={upload.qc_image_url} 
              alt="QC Sheet" 
              className="w-full h-40 object-cover rounded-lg"
            />
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium">
              Uploaded: {new Date(upload.upload_timestamp).toLocaleTimeString()}
            </div>
          </div>
          {upload.patrol_remarks && (
            <div className="mt-2 text-sm text-gray-700 bg-white/60 rounded p-2">
              <strong>Remarks:</strong> {upload.patrol_remarks}
            </div>
          )}
        </div>
      )}

      {/* Reupload Timer */}
      {upload.can_reupload && (
        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm">
          <div className="font-medium text-blue-700">Reupload window active</div>
          <div className="text-blue-600">Time remaining: {timeRemaining}</div>
        </div>
      )}

      {/* Upload Form */}
      {canUpload && (
        <div className="space-y-3">
          {/* Image Selection */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {selectedImage ? '📷 Change Image' : '📷 Select QC Image'}
            </button>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-40 object-cover rounded-lg border-2 border-emerald-300"
              />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Remarks */}
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional remarks (e.g., All readings normal, Coil tension slightly high)"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          />

          {/* Upload Button */}
          {selectedImage && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : hasExistingUpload ? '🔄 Reupload QC Image' : '✓ Submit QC Image'}
            </button>
          )}

          {/* Delete Button (if can reupload) */}
          {upload.can_reupload && !selectedImage && (
            <button
              onClick={handleDeleteUpload}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              🗑️ Delete & Reupload
            </button>
          )}
        </div>
      )}

      {/* Locked Message */}
      {upload.is_locked && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-center">
          <svg className="w-6 h-6 text-gray-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div className="text-sm text-gray-600 font-medium">
            Upload locked
          </div>
        </div>
      )}

      {/* Reupload Confirmation Modal */}
      {showReuploadConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Reupload</h3>
            <p className="text-gray-600 mb-4">
              This will replace your existing upload. Are you sure you want to continue?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowReuploadConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:bg-gray-400"
              >
                {uploading ? 'Uploading...' : 'Yes, Reupload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

