import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  Star, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Image as ImageIcon,
  HardDrive,
  FileImage,
  RefreshCw
} from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../components/Toast';
import PhotoLightbox from '../../components/PhotoLightbox';

export default function MediaManager({ photos = [], onChange, listingId = null }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Validate files before upload
  const validateFiles = (fileList) => {
    const maxFiles = 30;
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];

    if (photos.length + fileList.length > maxFiles) {
      toast.error(`Tổng số ảnh không được vượt quá ${maxFiles} ảnh (hiện có ${photos.length}).`);
      return false;
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast.error(`Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận JPEG, PNG, WEBP, GIF.`);
        return false;
      }
      if (file.size > maxSizeBytes) {
        toast.error(`Tệp "${file.name}" vượt quá kích thước tối đa 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        return false;
      }
    }
    return true;
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    if (!validateFiles(files)) return;

    try {
      setIsUploading(true);
      setUploadProgress('Đang tải lên và lưu vào hệ thống máy chủ...');

      const result = await api.uploadImages(files, listingId);
      
      const newPhotos = result.photos.map((p, index) => ({
        id: p.id,
        url: p.url,
        filename: p.filename,
        originalname: p.originalname,
        size: p.size,
        is_cover: photos.length === 0 && index === 0, // Set first photo as cover if none exists
        order: photos.length + index
      }));

      const updatedList = [...photos, ...newPhotos];
      onChange('photos', updatedList);
      toast.success(`Đã tải lên và lưu trữ thành công ${newPhotos.length} ảnh gốc!`);
    } catch (err) {
      toast.error('Lỗi khi tải ảnh: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  // Reordering
  const movePhoto = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= photos.length) return;
    const updated = [...photos];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    
    // update order property
    const normalized = updated.map((p, idx) => ({ ...p, order: idx }));
    onChange('photos', normalized);
  };

  // Set Cover Photo
  const setCover = (index) => {
    const updated = photos.map((p, idx) => ({
      ...p,
      is_cover: idx === index
    }));
    onChange('photos', updated);
    toast.info('Đã đặt làm ảnh đại diện cho tin đăng.');
  };

  // Delete Photo
  const removePhoto = (index) => {
    const photoToRemove = photos[index];
    let updated = photos.filter((_, idx) => idx !== index);
    
    // If we removed the cover, make the first remaining photo cover
    if (photoToRemove.is_cover && updated.length > 0) {
      updated[0] = { ...updated[0], is_cover: true };
    }
    updated = updated.map((p, idx) => ({ ...p, order: idx }));
    onChange('photos', updated);
    toast.info('Đã xóa ảnh khỏi danh sách.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragActive
            ? 'border-emerald-500 bg-emerald-50/50'
            : 'border-slate-200 hover:border-emerald-400 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
          id="photo-upload-input"
          disabled={isUploading}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            {isUploading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-800">
              {isUploading ? 'Đang lưu trữ ảnh vào máy chủ...' : 'Kéo thả ảnh vào đây hoặc bấm để chọn'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Hỗ trợ định dạng JPEG, PNG, WEBP • Tối đa 10MB/ảnh • Tối đa 30 ảnh
            </p>
          </div>

          <div className="pt-2">
            <label
              htmlFor="photo-upload-input"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer ${
                isUploading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Đang tải lên...' : 'Chọn nhiều ảnh từ máy'}</span>
            </label>
          </div>

          {/* Quality Preservation Notice */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lưu trữ ảnh gốc nguyên bản, không giảm chất lượng file</span>
          </div>
        </div>
      </div>

      {/* Uploaded Photos Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <span>Thư viện ảnh của tin đăng</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đang có <span className="font-bold text-slate-800">{photos.length}</span> ảnh. Bạn có thể đổi ảnh đại diện và thứ tự hiển thị.
            </p>
          </div>

          {photos.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setLightboxIndex(0);
                setIsLightboxOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Xem phóng to toàn bộ</span>
            </button>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileImage className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">Chưa có ảnh nào được tải lên cho bất động sản này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id || index}
                className={`relative group bg-slate-100 rounded-xl overflow-hidden border-2 transition-all flex flex-col ${
                  photo.is_cover ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Photo Thumbnail */}
                <div 
                  className="relative aspect-4/3 overflow-hidden cursor-pointer"
                  onClick={() => {
                    setLightboxIndex(index);
                    setIsLightboxOpen(true);
                  }}
                >
                  <img
                    src={photo.url}
                    alt={photo.originalname || 'Photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />

                  {/* Cover Badge */}
                  {photo.is_cover && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shadow-md">
                      <Star className="w-3 h-3 fill-white" />
                      <span>ẢNH ĐẠI DIỆN</span>
                    </div>
                  )}

                  {/* Order Tag */}
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                    #{index + 1}
                  </div>

                  {/* Hover Quick Zoom */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Eye className="w-6 h-6" />
                  </div>
                </div>

                {/* Card Controls */}
                <div className="p-2 bg-white flex items-center justify-between gap-1 border-t border-slate-100">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => movePhoto(index, -1)}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
                      title="Di chuyển sang trái"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === photos.length - 1}
                      onClick={() => movePhoto(index, 1)}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
                      title="Di chuyển sang phải"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Star Cover Button */}
                  <button
                    type="button"
                    onClick={() => setCover(index)}
                    className={`p-1 rounded transition-colors ${
                      photo.is_cover
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                    }`}
                    title={photo.is_cover ? 'Ảnh đại diện hiện tại' : 'Đặt làm ảnh đại diện'}
                  >
                    <Star className={`w-3.5 h-3.5 ${photo.is_cover ? 'fill-emerald-600' : ''}`} />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa ảnh này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox modal for high-res preview */}
      <PhotoLightbox
        photos={photos}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onSelectIndex={(newIdx) => setLightboxIndex(newIdx)}
      />
    </div>
  );
}
