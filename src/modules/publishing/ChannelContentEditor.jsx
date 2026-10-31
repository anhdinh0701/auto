import React, { useState } from 'react';
import { 
  FileEdit, 
  RotateCcw, 
  Copy, 
  Image as ImageIcon, 
  Phone, 
  Megaphone, 
  Hash, 
  Check, 
  Share2, 
  Users, 
  Building, 
  Globe 
} from 'lucide-react';

export default function ChannelContentEditor({
  selectedChannels = [],
  activeChannelId,
  onSelectActiveChannel,
  customizations = {}, // { [channelId]: { title, description, photos, contact_info, cta, hashtags, is_customized } }
  onChangeCustomization,
  originalListing = null
}) {
  const activeChannel = selectedChannels.find(c => c.id === activeChannelId) || selectedChannels[0];
  const activeCustomization = (activeChannel && customizations[activeChannel.id]) || {
    title: originalListing?.title || '',
    description: originalListing?.description || '',
    photos: Array.isArray(originalListing?.photos) 
      ? originalListing.photos 
      : (typeof originalListing?.photos === 'string' ? JSON.parse(originalListing?.photos || '[]') : []),
    contact_info: originalListing?.contact_info || '',
    cta: 'Liên hệ ngay để xem nhà thực tế!',
    hashtags: '#batdongsan #muabannhadat',
    is_customized: false
  };

  const originalPhotos = Array.isArray(originalListing?.photos)
    ? originalListing.photos
    : (typeof originalListing?.photos === 'string' ? JSON.parse(originalListing?.photos || '[]') : []);

  const handleFieldChange = (field, value) => {
    if (!activeChannel) return;
    onChangeCustomization(activeChannel.id, {
      ...activeCustomization,
      [field]: value,
      is_customized: true
    });
  };

  const handleTogglePhoto = (photo) => {
    if (!activeChannel) return;
    const currentPhotos = activeCustomization.photos || [];
    const exists = currentPhotos.some(p => p.url === photo.url);
    const newPhotos = exists 
      ? currentPhotos.filter(p => p.url !== photo.url)
      : [...currentPhotos, photo];

    handleFieldChange('photos', newPhotos);
  };

  const handleResetToOriginal = () => {
    if (!activeChannel || !originalListing) return;
    onChangeCustomization(activeChannel.id, {
      title: originalListing.title || '',
      description: originalListing.description || '',
      photos: originalPhotos,
      contact_info: originalListing.contact_info || '',
      cta: 'Liên hệ ngay để xem nhà thực tế!',
      hashtags: `#bds #${originalListing.property_type || 'nhadat'} #${originalListing.city ? originalListing.city.replace(/\s+/g, '') : 'vietnam'}`,
      is_customized: false
    });
  };

  const handleApplyToAllChannels = () => {
    if (!activeChannel) return;
    selectedChannels.forEach(c => {
      onChangeCustomization(c.id, {
        ...activeCustomization,
        is_customized: true
      });
    });
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

  if (!selectedChannels || selectedChannels.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs text-center py-10">
        <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">Chưa chọn kênh tiếp thị nào</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Vui lòng chọn ít nhất một kênh ở Bước 2 để tinh chỉnh nội dung và hình ảnh phù hợp với từng nền tảng.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FileEdit className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">3. Tinh Chỉnh Nội Dung Riêng Cho Từng Kênh</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApplyToAllChannels}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
            title="Sao chép nội dung kênh hiện tại cho tất cả các kênh khác đã chọn"
          >
            <Copy className="w-3.5 h-3.5" />
            Áp dụng cho mọi kênh
          </button>
          <button
            type="button"
            onClick={handleResetToOriginal}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Khôi phục lại nội dung gốc từ tin BĐS đã chọn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi phục gốc
          </button>
        </div>
      </div>

      {/* Channel Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {selectedChannels.map(channel => {
          const isSelected = channel.id === activeChannel?.id;
          const isCustom = customizations[channel.id]?.is_customized;

          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => onSelectActiveChannel(channel.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border shrink-0 ${
                isSelected 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {getChannelIcon(channel.channel_type)}
              <span className="truncate max-w-[140px]">{channel.name}</span>
              {isCustom && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Editor Form for Active Channel */}
      {activeChannel && (
        <div className="space-y-4 pt-1">
          {/* Channel Info Banner */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200">
            <span className="text-slate-600 font-medium">
              Đang chỉnh sửa cho: <strong className="text-slate-900">{activeChannel.name}</strong> ({activeChannel.channel_type})
            </span>
            <span className="text-[11px] text-slate-500">
              {activeCustomization.is_customized ? '✨ Đã chỉnh sửa riêng' : '📋 Theo nội dung gốc'}
            </span>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề bài đăng
            </label>
            <input
              type="text"
              value={activeCustomization.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Tiêu đề thu hút người đọc..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Nội dung chi tiết
              </label>
              <span className="text-[11px] text-slate-400">
                {activeCustomization.description?.length || 0} ký tự
              </span>
            </div>
            <textarea
              rows={6}
              value={activeCustomization.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Mô tả thông tin chi tiết bất động sản..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans"
            />
          </div>

          {/* Contact & CTA & Hashtags Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Thông tin liên hệ
              </label>
              <input
                type="text"
                value={activeCustomization.contact_info || ''}
                onChange={(e) => handleFieldChange('contact_info', e.target.value)}
                placeholder="SĐT / Zalo liên hệ..."
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
                Lời kêu gọi hành động (CTA)
              </label>
              <input
                type="text"
                value={activeCustomization.cta || ''}
                onChange={(e) => handleFieldChange('cta', e.target.value)}
                placeholder="VD: Inbox ngay để nhận sổ đỏ..."
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                <Hash className="w-3.5 h-3.5 text-rose-600" />
                Hashtags
              </label>
              <input
                type="text"
                value={activeCustomization.hashtags || ''}
                onChange={(e) => handleFieldChange('hashtags', e.target.value)}
                placeholder="#batdongsan #nhadat..."
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Photos Selection for this channel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                Hình ảnh cho kênh này ({activeCustomization.photos?.length || 0} ảnh được chọn)
              </label>
              <span className="text-[11px] text-slate-400">
                Nhấp vào ảnh để chọn hoặc bỏ chọn cho kênh {activeChannel.name}
              </span>
            </div>

            {originalPhotos.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 text-center">
                Bất động sản này chưa có hình ảnh nào. Bạn có thể thêm ảnh trong phần Soạn tin BĐS (Giai đoạn 1).
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {originalPhotos.map((photo, idx) => {
                  const isSelected = (activeCustomization.photos || []).some(p => p.url === photo.url);
                  return (
                    <div
                      key={photo.id || idx}
                      onClick={() => handleTogglePhoto(photo)}
                      className={`relative group aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        isSelected 
                          ? 'border-emerald-600 ring-2 ring-emerald-400/40' 
                          : 'border-transparent opacity-40 hover:opacity-75'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.filename || `Ảnh ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate text-center">
                        {photo.is_cover ? 'Ảnh bìa' : `#${idx + 1}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
