import React from 'react';
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Users, 
  MapPin, 
  Building2, 
  DollarSign, 
  Share2, 
  Star, 
  Sparkles,
  Info,
  Layers,
  FileText
} from 'lucide-react';

export default function ChannelDetailModal({ 
  channel, 
  isOpen, 
  onClose, 
  onEdit, 
  onToggleVerify, 
  onToggleFavorite 
}) {
  if (!isOpen || !channel) return null;

  const score = channel.relevanceScore !== undefined ? channel.relevanceScore : 50;
  const breakdown = channel.scoreBreakdown || {};

  const getScoreColor = (sc) => {
    if (sc >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-300 ring-emerald-500/20';
    if (sc >= 60) return 'text-blue-700 bg-blue-50 border-blue-300 ring-blue-500/20';
    if (sc >= 40) return 'text-amber-700 bg-amber-50 border-amber-300 ring-amber-500/20';
    return 'text-slate-600 bg-slate-50 border-slate-300 ring-slate-500/20';
  };

  const getChannelTypeLabel = (type) => {
    const labels = {
      facebook_group: 'Hội nhóm Facebook (Group)',
      facebook_page: 'Trang Facebook (Fanpage)',
      zalo_group: 'Nhóm Zalo',
      zalo_oa: 'Zalo Official Account (OA)',
      portal: 'Cổng thông tin / Web BĐS',
      forum: 'Diễn đàn Bất Động Sản',
      telegram: 'Nhóm / Kênh Telegram',
      other: 'Kênh khác'
    };
    return labels[type] || type;
  };

  const getCapabilityBadge = (cap) => {
    switch (cap) {
      case 'api_supported':
        return (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              API publishing supported and verified (Hỗ trợ đăng tự động qua API)
            </span>
            <p className="text-[11px] text-emerald-700">Kênh đã được kết nối và kiểm chứng qua API chính thức.</p>
          </div>
        );
      case 'manual_only':
        return (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800">
              <Share2 className="w-4 h-4 text-blue-600" />
              Manual publishing only (Chỉ hỗ trợ xuất bản thủ công)
            </span>
            <p className="text-[11px] text-blue-700">
              Phù hợp cho Hội nhóm Facebook hoặc nhóm Zalo (tuân thủ chính sách, không sử dụng bot trái phép).
            </p>
          </div>
        );
      case 'unsupported':
        return (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Unsupported (Không hỗ trợ xuất bản)
            </span>
            <p className="text-[11px] text-rose-700">Kênh chỉ phục vụ tham khảo thông tin thị trường.</p>
          </div>
        );
      case 'unknown':
      default:
        return (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <Info className="w-4 h-4 text-amber-600" />
              Unknown or not verified (Chưa xác minh khả năng đăng)
            </span>
            <p className="text-[11px] text-amber-700">Cần kiểm tra quyền đăng và cơ chế kiểm duyệt của ban quản trị.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {getChannelTypeLabel(channel.channel_type)}
              </span>
              {channel.is_favorite && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Star className="w-3 h-3 fill-amber-300" /> Kênh yêu thích
                </span>
              )}
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white leading-snug">
              {channel.name}
            </h3>
            <a
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:underline break-all"
            >
              <span>{channel.url}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. Relevance Score Breakdown Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">Điểm Đánh Giá Mức Độ Liên Quan (Relevance Score)</h4>
              </div>
              <div className={`px-3 py-1 rounded-xl text-base font-extrabold border ring-2 ${getScoreColor(score)}`}>
                {score} / 100
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Điểm số được tính toán minh bạch dựa trên 6 tiêu chí phối hợp theo trọng số có thể cấu hình. Dữ liệu chưa xác minh hoặc bị thiếu sẽ bị trừ điểm theo nguyên tắc nghiêm ngặt:
            </p>

            {/* Score Factor Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Location */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Khu vực & Địa bàn
                  </span>
                  <span className="text-emerald-600 font-mono font-extrabold">
                    {breakdown.location?.score || 0}đ ({breakdown.location?.weight || 25}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{breakdown.location?.reason || '-'}</div>
              </div>

              {/* Property Type */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Loại hình BĐS
                  </span>
                  <span className="text-emerald-600 font-mono font-extrabold">
                    {breakdown.propertyType?.score || 0}đ ({breakdown.propertyType?.weight || 20}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{breakdown.propertyType?.reason || '-'}</div>
              </div>

              {/* Price Segment */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Phân khúc giá
                  </span>
                  <span className="text-emerald-600 font-mono font-extrabold">
                    {breakdown.price?.score || 0}đ ({breakdown.price?.weight || 15}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{breakdown.price?.reason || '-'}</div>
              </div>

              {/* Audience */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" /> Tệp khán giả mục tiêu
                  </span>
                  <span className="text-emerald-600 font-mono font-extrabold">
                    {breakdown.audience?.score || 0}đ ({breakdown.audience?.weight || 15}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{breakdown.audience?.reason || '-'}</div>
              </div>

              {/* Freshness & Verification */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Độ mới & Kiểm minh
                  </span>
                  <span className="text-emerald-600 font-mono font-extrabold">
                    {breakdown.freshness?.score || 0}đ ({breakdown.freshness?.weight || 15}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{breakdown.freshness?.reason || '-'}</div>
              </div>

              {/* Capability */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Khả năng xuất bản
                  </span>
                  <span className="text-emerald-600 font-mono font-extrabold">
                    {breakdown.capability?.score || 0}đ ({breakdown.capability?.weight || 10}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{breakdown.capability?.reason || '-'}</div>
              </div>
            </div>
          </div>

          {/* 2. Publishing Capability & Verification Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Khả năng xuất bản bài viết</h4>
            {getCapabilityBadge(channel.publishing_capability)}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Trạng thái xác minh</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    channel.verification_status === 'verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : channel.verification_status === 'inactive'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {channel.verification_status === 'verified' ? 'Đã xác minh' : channel.verification_status === 'inactive' ? 'Không hoạt động' : 'Chưa xác minh'}
                  </span>
                  <button
                    onClick={() => onToggleVerify(channel.id)}
                    className="text-[11px] text-emerald-600 hover:underline font-semibold"
                  >
                    Đổi trạng thái
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Ngày xác minh gần nhất</span>
                <span className="text-xs font-bold text-slate-800">
                  {channel.last_verified_at ? new Date(channel.last_verified_at).toLocaleDateString('vi-VN') : 'Chưa có thông tin'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Detailed Matching Attributes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Thông số phân loại chi tiết</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase block">Địa bàn phủ sóng</span>
                <span className="font-bold text-slate-800">
                  {[channel.district, channel.province].filter(Boolean).join(', ') || 'Chưa cập nhật'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase block">Quy mô thành viên</span>
                <span className="font-bold text-slate-800">
                  {channel.member_count ? `${channel.member_count.toLocaleString()} thành viên` : 'Chưa khai báo'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase block">Loại BĐS phù hợp</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {channel.property_types && channel.property_types.length > 0 ? (
                    channel.property_types.map(pt => (
                      <span key={pt} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium text-[11px]">
                        {pt}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">Tất cả loại hình</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase block">Phân khúc & Khán giả</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {channel.price_segments && channel.price_segments.map(ps => (
                    <span key={ps} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium text-[11px]">
                      {ps}
                    </span>
                  ))}
                  {channel.target_audiences && channel.target_audiences.map(ta => (
                    <span key={ta} className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium text-[11px]">
                      {ta}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Notes & Collections */}
          {channel.notes && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Ghi chú vận hành</h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed">
                {channel.notes}
              </p>
            </div>
          )}

          {channel.collections && channel.collections.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Thuộc bộ sưu tập</h4>
              <div className="flex flex-wrap gap-1.5">
                {channel.collections.map(col => (
                  <span key={col.id} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{col.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => onToggleFavorite(channel.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
              channel.is_favorite 
                ? 'bg-amber-50 text-amber-800 border-amber-300' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-4 h-4 ${channel.is_favorite ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
            <span>{channel.is_favorite ? 'Đã yêu thích' : 'Lưu yêu thích'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(channel);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              Chỉnh sửa kênh
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
