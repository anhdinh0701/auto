import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Star } from 'lucide-react';

export default function PhotoLightbox({ photos = [], currentIndex = 0, isOpen, onClose, onSelectIndex }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onSelectIndex(currentIndex + 1);
      if (e.key === 'ArrowLeft' && currentIndex > 0) onSelectIndex(currentIndex - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onClose, onSelectIndex]);

  if (!isOpen || !photos.length) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 animate-fade-in select-none"
      onClick={onClose}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between text-white/90 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="text-sm text-slate-300 truncate max-w-xs md:max-w-md">
            {currentPhoto.originalname || currentPhoto.filename || 'Ảnh chi tiết'}
          </span>
          {currentPhoto.is_cover && (
            <span className="flex items-center gap-1 text-xs font-bold bg-emerald-500/80 text-white px-2.5 py-0.5 rounded-full">
              <Star className="w-3 h-3 fill-white" /> Ảnh đại diện
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={currentPhoto.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Tải ảnh gốc"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {currentIndex > 0 && (
          <button
            onClick={() => onSelectIndex(currentIndex - 1)}
            className="absolute left-2 md:left-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all transform hover:scale-105 z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <img
          src={currentPhoto.url}
          alt={currentPhoto.originalname || 'Preview'}
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all duration-200"
        />

        {currentIndex < photos.length - 1 && (
          <button
            onClick={() => onSelectIndex(currentIndex + 1)}
            className="absolute right-2 md:right-6 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all transform hover:scale-105 z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto py-2 z-10" onClick={(e) => e.stopPropagation()}>
          {photos.map((p, idx) => (
            <button
              key={p.id || idx}
              onClick={() => onSelectIndex(idx)}
              className={`relative rounded-md overflow-hidden h-14 w-20 shrink-0 border-2 transition-all ${
                idx === currentIndex ? 'border-emerald-400 scale-105 opacity-100 shadow-md' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
