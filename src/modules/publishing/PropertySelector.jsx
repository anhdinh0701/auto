import React from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Maximize2, 
  BedDouble, 
  Bath, 
  CheckCircle2, 
  ChevronDown,
  Image as ImageIcon
} from 'lucide-react';

export default function PropertySelector({ 
  listings = [], 
  selectedListingId, 
  onSelectListing 
}) {
  const selectedListing = listings.find(l => l.id === selectedListingId) || listings[0] || null;

  const getCoverPhoto = (listing) => {
    if (!listing || !listing.photos) return null;
    const photos = Array.isArray(listing.photos) 
      ? listing.photos 
      : (typeof listing.photos === 'string' ? JSON.parse(listing.photos || '[]') : []);
    const cover = photos.find(p => p.is_cover) || photos[0];
    return cover ? cover.url : null;
  };

  const getPhotoCount = (listing) => {
    if (!listing || !listing.photos) return 0;
    const photos = Array.isArray(listing.photos) 
      ? listing.photos 
      : (typeof listing.photos === 'string' ? JSON.parse(listing.photos || '[]') : []);
    return photos.length;
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">1. Chọn Bất Động Sản Cần Đăng Bài</h3>
        </div>

        {/* Dropdown Selector */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedListingId || (selectedListing ? selectedListing.id : '')}
            onChange={(e) => onSelectListing(e.target.value)}
            className="w-full sm:w-80 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
          >
            {listings.map(l => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedListing ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <div className="w-20 h-20 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200 relative">
              {getCoverPhoto(selectedListing) ? (
                <img 
                  src={getCoverPhoto(selectedListing)} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-black/60 text-white">
                {getPhotoCount(selectedListing)} ảnh
              </span>
            </div>

            {/* Info */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {selectedListing.listing_action === 'cho_thue' ? 'Cho thuê' : 'Cần bán'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {selectedListing.property_type}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                {selectedListing.title}
              </h4>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="font-extrabold text-emerald-600">
                  {selectedListing.price ? `${selectedListing.price} ${selectedListing.price_unit || 'tỷ'}` : selectedListing.price_raw_text || 'Thỏa thuận'}
                </span>
                {selectedListing.area && <span>• {selectedListing.area} m²</span>}
                {selectedListing.bedrooms && <span>• {selectedListing.bedrooms} PN</span>}
                {selectedListing.bathrooms && <span>• {selectedListing.bathrooms} WC</span>}
                <span className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {[selectedListing.district, selectedListing.province].filter(Boolean).join(', ') || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              Đã sẵn sàng nội dung gốc
            </span>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-slate-400">
          Chưa có tin bất động sản nào trong hệ thống. Hãy tạo tin ở Giai đoạn 1 trước.
        </div>
      )}
    </div>
  );
}
