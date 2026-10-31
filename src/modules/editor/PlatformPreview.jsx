import React, { useState } from 'react';
import { 
  Share2, 
  ThumbsUp, 
  MessageCircle, 
  Copy, 
  Check, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize2, 
  Phone, 
  ExternalLink, 
  ShieldAlert, 
  Send, 
  Star,
  CheckCircle2,
  Building,
  Calendar,
  Layers
} from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function PlatformPreview({ formData }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('social'); // 'social' | 'portal' | 'quick_msg'
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const photos = formData.photos || [];
  const coverPhoto = photos.find((p) => p.is_cover) || photos[0];
  const otherPhotos = photos.filter((p) => p !== coverPhoto);

  const formatPrice = () => {
    if (formData.price) return `${formData.price} ${formData.price_unit || 'tỷ'}`;
    return formData.price_raw_text || 'Thỏa thuận';
  };

  const getFullCopyText = () => {
    let text = `${formData.title || 'BẤT ĐỘNG SẢN'}\n\n`;
    text += `${formData.description || ''}\n\n`;
    text += `─────────────\n`;
    text += `📍 Địa chỉ: ${[formData.address_detail, formData.ward, formData.district, formData.province].filter(Boolean).join(', ')}\n`;
    text += `💰 Giá: ${formatPrice()}\n`;
    if (formData.area) text += `📐 Diện tích: ${formData.area} m²\n`;
    if (formData.bedrooms) text += `🛏 Phòng ngủ: ${formData.bedrooms}\n`;
    if (formData.bathrooms) text += `🚿 Vệ sinh: ${formData.bathrooms}\n`;
    if (formData.legal_status) text += `📜 Pháp lý: ${formData.legal_status}\n`;
    text += `☎️ Liên hệ: ${formData.contact_name || ''} - ${formData.contact_phone || ''} (Zalo: ${formData.contact_zalo || ''})\n`;
    if (formData.map_url) text += `🗺 Bản đồ: ${formData.map_url}\n`;
    return text;
  };

  const handleCopyQuickText = () => {
    const text = getFullCopyText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép nội dung bài đăng vào Clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2.5 text-xs">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300">
            <strong className="text-white">Lưu ý mô phỏng:</strong> Đây là chế độ xem trước bố cục của Content Studio để rà soát tiêu đề, ảnh và thông tin liên hệ trước khi đăng, không tuyên bố tái hiện chính xác 100% giao diện thực tế của từng nền tảng.
          </span>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'social'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bố cục Mạng Xã Hội (Facebook)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('portal')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'portal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cổng Thông Tin BĐS (Portal)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quick_msg')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'quick_msg'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tin Nhắn Nhanh (Zalo/SMS)
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopyQuickText}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Đã sao chép' : 'Sao chép văn bản'}</span>
        </button>
      </div>

      {/* TAB 1: SOCIAL MEDIA PREVIEW (FACEBOOK STYLE) */}
      {activeTab === 'social' && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden animate-fade-in">
          {/* Post Header */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                {(formData.contact_name || 'BĐS').substr(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                  <span>{formData.contact_name || 'Bất Động Sản Chuyên Nghiệp'}</span>
                  <CheckCircle2 className="w-4 h-4 text-brand-600 fill-brand-100" />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Vừa xong</span> • <span>Công khai 🌐</span>
                </div>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
              {formData.listing_action === 'cho_thue' ? 'Cho thuê' : 'Đang mở bán'}
            </span>
          </div>

          {/* Caption Body with Expand/Collapse */}
          <div className="px-4 pb-3 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm md:text-base leading-snug">
              {formData.title || 'Tiêu đề bài viết bất động sản'}
            </h4>

            <div className={`text-xs md:text-sm text-slate-700 whitespace-pre-line leading-relaxed ${
              !isExpanded ? 'line-clamp-4' : ''
            }`}>
              {formData.description || 'Chưa có nội dung mô tả chi tiết...'}
            </div>

            {(formData.description || '').length > 200 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                {isExpanded ? 'Thu gọn' : '... Xem thêm'}
              </button>
            )}
          </div>

          {/* Mosaic Image Grid */}
          {photos.length > 0 && (
            <div className="border-t border-b border-slate-100">
              {photos.length === 1 ? (
                <div className="aspect-4/3 overflow-hidden bg-slate-100">
                  <img src={photos[0].url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : photos.length === 2 ? (
                <div className="grid grid-cols-2 gap-1 bg-slate-200">
                  <div className="aspect-square overflow-hidden bg-slate-100">
                    <img src={photos[0].url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-square overflow-hidden bg-slate-100">
                    <img src={photos[1].url} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              ) : photos.length === 3 ? (
                <div className="grid grid-cols-2 gap-1 bg-slate-200">
                  <div className="row-span-2 aspect-square overflow-hidden bg-slate-100">
                    <img src={photos[0].url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-4/3 overflow-hidden bg-slate-100">
                    <img src={photos[1].url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-4/3 overflow-hidden bg-slate-100">
                    <img src={photos[2].url} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              ) : (
                /* 4 or more photos layout */
                <div className="grid grid-cols-2 gap-1 bg-slate-200">
                  <div className="aspect-4/3 overflow-hidden bg-slate-100">
                    <img src={photos[0].url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-4/3 overflow-hidden bg-slate-100">
                    <img src={photos[1].url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-4/3 overflow-hidden bg-slate-100">
                    <img src={photos[2].url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                    <img src={photos[3].url} alt="" className="w-full h-full object-cover" />
                    {photos.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-extrabold text-xl">
                        +{photos.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Social Feedback Bar */}
          <div className="p-3 bg-slate-50 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">
                👍
              </span>
              <span className="font-medium">Bạn và 42 người khác</span>
            </div>
            <div>
              <span>18 bình luận • 6 lượt chia sẻ</span>
            </div>
          </div>

          <div className="px-4 py-2 border-t border-slate-200 flex items-center justify-around text-xs font-semibold text-slate-600">
            <button className="flex items-center gap-1.5 py-1.5 hover:text-brand-600">
              <ThumbsUp className="w-4 h-4" /> Thích
            </button>
            <button className="flex items-center gap-1.5 py-1.5 hover:text-brand-600">
              <MessageCircle className="w-4 h-4" /> Bình luận
            </button>
            <button className="flex items-center gap-1.5 py-1.5 hover:text-brand-600">
              <Share2 className="w-4 h-4" /> Chia sẻ
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PORTAL PREVIEW (BATDONGSAN / CHOTOT STYLE) */}
      {activeTab === 'portal' && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden animate-fade-in space-y-6 p-6">
          {/* Main Photo Gallery */}
          <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            {coverPhoto ? (
              <img src={coverPhoto.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                Chưa có ảnh bìa
              </div>
            )}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-slate-900/80 text-white backdrop-blur-xs">
                {photos.length} hình ảnh thực tế
              </span>
            </div>
          </div>

          {/* Header Info */}
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900">
              {formData.title || 'Tiêu đề tin đăng'}
            </h3>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{[formData.address_detail, formData.ward, formData.district, formData.province].filter(Boolean).join(', ') || 'Chưa nhập địa chỉ'}</span>
            </div>

            {/* Price & Area Highlight Strip */}
            <div className="flex flex-wrap items-baseline gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Mức giá</span>
                <span className="text-2xl font-extrabold text-rose-600">{formatPrice()}</span>
              </div>
              {formData.area && (
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Diện tích</span>
                  <span className="text-2xl font-extrabold text-slate-900">{formData.area} m²</span>
                </div>
              )}
              {formData.bedrooms && (
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Phòng ngủ</span>
                  <span className="text-lg font-bold text-slate-800">{formData.bedrooms} PN</span>
                </div>
              )}
              {formData.bathrooms && (
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Phòng tắm</span>
                  <span className="text-lg font-bold text-slate-800">{formData.bathrooms} WC</span>
                </div>
              )}
            </div>
          </div>

          {/* Key Specs Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400">Pháp lý</div>
              <div className="text-xs font-bold text-slate-800 mt-1">{formData.legal_status || 'Đang cập nhật'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400">Hướng nhà</div>
              <div className="text-xs font-bold text-slate-800 mt-1">{formData.direction || 'Không xác định'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400">Nội thất</div>
              <div className="text-xs font-bold text-slate-800 mt-1">{formData.furniture_status || 'Cơ bản'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400">Số tầng</div>
              <div className="text-xs font-bold text-slate-800 mt-1">{formData.floors ? `${formData.floors} tầng` : '-'}</div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Thông tin mô tả</h4>
            <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed p-4 rounded-xl bg-slate-50 border border-slate-100 font-sans">
              {formData.description || 'Chưa có thông tin mô tả.'}
            </div>
          </div>

          {/* Amenities Badges */}
          {formData.amenities && formData.amenities.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Đặc điểm & Tiện ích</h4>
              <div className="flex flex-wrap gap-2">
                {formData.amenities.map((a) => (
                  <span key={a} className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Broker Contact Card */}
          <div className="p-4 rounded-xl bg-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-emerald-400 font-bold uppercase">Môi giới phụ trách</div>
              <div className="text-base font-bold text-white">{formData.contact_name || 'Chuyên viên tư vấn'}</div>
              <div className="text-xs text-slate-300 font-mono">Hotline: {formData.contact_phone || '---'}</div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={formData.contact_phone ? `tel:${formData.contact_phone}` : '#'}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> Gọi điện
              </a>
              {formData.contact_zalo && (
                <a
                  href={`https://zalo.me/${formData.contact_zalo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Nhắn Zalo
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUICK MESSAGE (ZALO / SMS / TELEGRAM READY) */}
      {activeTab === 'quick_msg' && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bản sao văn bản gửi nhanh (Zalo / SMS)</h3>
              <p className="text-xs text-slate-400">Được tối ưu để copy-paste gửi khách hàng qua tin nhắn nhanh.</p>
            </div>
            <button
              type="button"
              onClick={handleCopyQuickText}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép toàn bộ'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-96">
            {getFullCopyText()}
          </pre>

          {/* Quick Photo URLs list */}
          {photos.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Liên kết ảnh ({photos.length} ảnh):
              </span>
              <div className="space-y-1">
                {photos.map((p, idx) => (
                  <div key={p.id || idx} className="flex items-center justify-between text-[11px] p-2 bg-slate-50 rounded-lg border border-slate-100 font-mono">
                    <span className="truncate max-w-md text-slate-600">{p.originalname || p.filename}</span>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline font-bold shrink-0 ml-2"
                    >
                      Mở ảnh ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
