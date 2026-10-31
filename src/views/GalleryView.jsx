import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Eye, 
  Copy, 
  Check, 
  Download, 
  HardDrive,
  RefreshCw,
  Search
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import PhotoLightbox from '../components/PhotoLightbox';
import ConfirmModal from '../components/ConfirmModal';

export default function GalleryView() {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await api.getPhotos();
      setPhotos(data);
    } catch (err) {
      toast.error('Lỗi tải thư viện ảnh: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const result = await api.uploadImages(files);
      toast.success(`Đã tải lên và lưu trữ thành công ${result.photos.length} ảnh!`);
      loadPhotos();
    } catch (err) {
      toast.error('Lỗi khi tải ảnh: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.deletePhoto(deleteTarget.id);
      toast.success('Đã xóa ảnh khỏi hệ thống lưu trữ.');
      setDeleteTarget(null);
      loadPhotos();
    } catch (err) {
      toast.error('Lỗi khi xóa ảnh: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyUrl = (photo) => {
    const fullUrl = window.location.origin + photo.url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(photo.id);
    toast.success('Đã sao chép đường dẫn ảnh vào Clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPhotos = photos.filter((p) => 
    p.originalname.toLowerCase().includes(search.toLowerCase()) ||
    p.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-600" />
            <span>Thư Viện Ảnh Bất Động Sản</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp toàn bộ hình ảnh tải lên máy chủ. Lưu trữ ảnh gốc nguyên bản, sẵn sàng sử dụng cho bài đăng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleUpload}
            className="hidden"
            id="gallery-file-upload"
          />
          <label
            htmlFor="gallery-file-upload"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer ${
              uploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{uploading ? 'Đang tải...' : 'Tải thêm ảnh mới'}</span>
          </label>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên tệp ảnh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Đang hiển thị <span className="font-bold text-slate-800">{filteredPhotos.length}</span> / {photos.length} ảnh
        </span>
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Đang tải danh sách ảnh...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">Chưa có ảnh nào trong thư viện</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Tải ảnh lên hoặc tạo tin bất động sản mới kèm ảnh để xem tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              <div 
                className="relative aspect-4/3 overflow-hidden cursor-pointer bg-slate-100"
                onClick={() => {
                  setLightboxIndex(idx);
                  setIsLightboxOpen(true);
                }}
              >
                <img
                  src={photo.url}
                  alt={photo.originalname}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye className="w-6 h-6" />
                </div>
              </div>

              <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-xs font-bold text-slate-800 truncate" title={photo.originalname}>
                    {photo.originalname}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {(photo.size / (1024 * 1024)).toFixed(2)} MB • {new Date(photo.created_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <button
                    onClick={() => copyUrl(photo)}
                    className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                    title="Sao chép URL ảnh"
                  >
                    {copiedId === photo.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={photo.url}
                    download={photo.originalname}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                    title="Tải ảnh gốc về máy"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setDeleteTarget(photo)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Xóa ảnh khỏi lưu trữ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <PhotoLightbox
        photos={filteredPhotos}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onSelectIndex={(idx) => setLightboxIndex(idx)}
      />

      {/* Delete modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xóa ảnh khỏi máy chủ"
        message={`Bạn có chắc chắn muốn xóa tệp "${deleteTarget?.originalname}" khỏi hệ thống lưu trữ?`}
        confirmText="Xác nhận xóa"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
