import React, { useState } from 'react';
import { 
  Eye, 
  AlertCircle, 
  Phone, 
  Megaphone, 
  Hash, 
  ExternalLink,
  Users,
  Share2,
  Building,
  Globe
} from 'lucide-react';

export default function PublishingPreview({
  selectedChannels = [],
  customizations = {},
  originalListing = null
}) {
  const [activePreviewChannelId, setActivePreviewChannelId] = useState('');

  if (!selectedChannels || selectedChannels.length === 0) {
    return null;
  }

  const activeChannel = selectedChannels.find(c => c.id === activePreviewChannelId) || selectedChannels[0];
  const custom = (activeChannel && customizations[activeChannel.id]) || {
    title: originalListing?.title || '',
    description: originalListing?.description || '',
    photos: Array.isArray(originalListing?.photos) 
      ? originalListing.photos 
      : (typeof originalListing?.photos === 'string' ? JSON.parse(originalListing?.photos || '[]') : []),
    contact_info: originalListing?.contact_info || '',
    cta: 'Liên hệ ngay!',
    hashtags: ''
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case 'facebook_group':
        return <Users className="w-3.5 h-3.5 text-blue-600" />;
      case 'facebook_page':
        return <Share2 className="w-3.5 h-3.5 text-blue-700" />;
      case 'portal':
        return <Building className="w-3.5 h-3.5 text-emerald-600" />;
      case 'google_business':
        return <Globe className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
      {/* Header with clear disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">4. Xem Trước Nội Dung Trước Khi Xuất Bản</h3>
        </div>

        {/* Preview Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {selectedChannels.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActivePreviewChannelId(c.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors border ${
                (activeChannel && activeChannel.id === c.id)
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Required Disclaimer */}
      <div className="flex items-center gap-2 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-800">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Ghi chú xem trước:</strong> Đây là bản xem trước mô phỏng nội dung của hệ thống (Application Preview), không phải là bản sao chép giao diện trực tiếp từ máy chủ của Facebook hay các nền tảng thứ ba. Giao diện thực tế khi hiển thị sẽ tuân theo định dạng của từng nền tảng đích.
        </span>
      </div>

      {/* Simulated Post Card */}
      {activeChannel && (
        <div className="max-w-2xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          {/* Channel metadata header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center border border-slate-200">
                {getChannelIcon(activeChannel.channel_type)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{activeChannel.name}</h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{activeChannel.channel_type?.toUpperCase()}</span>
                  <span>•</span>
                  <span>Định dạng bài đăng chuẩn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Post Title */}
          {custom.title && (
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {custom.title}
            </h3>
          )}

          {/* Post Description */}
          <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {custom.description || 'Chưa có mô tả'}
          </div>

          {/* Contact & CTA Info */}
          <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-xs">
            {custom.contact_info && (
              <div className="flex items-center gap-2 text-emerald-800 font-semibold bg-emerald-50/80 p-2 rounded-lg">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Liên hệ: {custom.contact_info}</span>
              </div>
            )}
            {custom.cta && (
              <div className="flex items-center gap-2 text-indigo-800 font-medium bg-indigo-50/80 p-2 rounded-lg">
                <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>{custom.cta}</span>
              </div>
            )}
            {custom.hashtags && (
              <div className="flex items-center gap-2 text-slate-500 text-[11px] pt-1">
                <Hash className="w-3.5 h-3.5 text-rose-500" />
                <span>{custom.hashtags}</span>
              </div>
            )}
          </div>

          {/* Photos Grid */}
          {custom.photos && custom.photos.length > 0 && (
            <div className={`grid gap-1.5 pt-2 rounded-xl overflow-hidden ${
              custom.photos.length === 1 ? 'grid-cols-1' :
              custom.photos.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {custom.photos.slice(0, 6).map((photo, pIdx) => (
                <div key={photo.id || pIdx} className="aspect-square bg-slate-200 relative overflow-hidden rounded-lg">
                  <img
                    src={photo.url}
                    alt={photo.filename || `Ảnh ${pIdx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {pIdx === 5 && custom.photos.length > 6 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                      +{custom.photos.length - 6} ảnh
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
