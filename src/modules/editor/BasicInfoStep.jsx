import React from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Maximize2, 
  BedDouble, 
  Bath, 
  Compass, 
  FileCheck, 
  Sofa, 
  Phone, 
  User, 
  MessageSquare, 
  Globe, 
  Map, 
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export default function BasicInfoStep({ formData, onChange }) {
  const propertyTypes = [
    { value: 'can_ho', label: 'Căn hộ chung cư' },
    { value: 'nha_rieng', label: 'Nhà riêng' },
    { value: 'nha_pho', label: 'Nhà phố' },
    { value: 'dat_nen', label: 'Đất nền' },
    { value: 'biet_thu', label: 'Biệt thự' },
    { value: 'van_phong', label: 'Văn phòng' },
    { value: 'khac', label: 'Khác' },
  ];

  const directions = [
    'Đông', 'Tây', 'Nam', 'Bắc', 
    'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'
  ];

  const commonAmenities = [
    'Thang máy', 'Hồ bơi', 'Chỗ để xe ô tô', 'Ban công thoáng',
    'Gần chợ / Siêu thị', 'Gần trường học', 'Gần bệnh viện',
    'Bảo vệ 24/7', 'Khuôn viên công viên', 'Phòng Gym / Yoga',
    'Sân thượng', 'Giếng trời', 'Mặt tiền kinh doanh'
  ];

  const isLand = formData.property_type === 'dat_nen';

  const handleAmenityToggle = (amenity) => {
    const current = formData.amenities || [];
    if (current.includes(amenity)) {
      onChange('amenities', current.filter((a) => a !== amenity));
    } else {
      onChange('amenities', [...current, amenity]);
    }
  };

  // Calculate price per m2
  const calculatePricePerM2 = () => {
    if (!formData.price || !formData.area || formData.area <= 0) return null;
    let totalInMillion = formData.price;
    if (formData.price_unit === 'tỷ') totalInMillion = formData.price * 1000;
    const perM2 = (totalInMillion / formData.area).toFixed(1);
    return perM2;
  };

  const pricePerM2 = calculatePricePerM2();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Category & Type */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Phân loại & Mục đích giao dịch</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Action: Ban / Cho thue */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Nhu cầu giao dịch <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange('listing_action', 'ban')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  formData.listing_action === 'ban'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Cần Bán
              </button>
              <button
                type="button"
                onClick={() => onChange('listing_action', 'cho_thue')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  formData.listing_action === 'cho_thue'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Cho Thuê
              </button>
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Loại hình bất động sản <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.property_type || 'can_ho'}
              onChange={(e) => onChange('property_type', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {propertyTypes.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Tiêu đề tin đăng <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Bán Căn Hộ Vinhomes Grand Park 2PN2WC 69m2 View Thoáng..."
            value={formData.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Tiêu đề nên súc tích, bao gồm loại hình, vị trí, diện tích hoặc điểm nổi bật nhất.
          </p>
        </div>
      </div>

      {/* 2. Location */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Vị trí & Địa chỉ</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tỉnh / Thành phố
            </label>
            <input
              type="text"
              placeholder="VD: TP. Hồ Chí Minh, Hà Nội..."
              value={formData.province || ''}
              onChange={(e) => onChange('province', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Quận / Huyện / TP
            </label>
            <input
              type="text"
              placeholder="VD: Quận 1, Cầu Giấy, TP. Thủ Đức..."
              value={formData.district || ''}
              onChange={(e) => onChange('district', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Phường / Xã / Khu vực
            </label>
            <input
              type="text"
              placeholder="VD: Phường Bến Nghé, Xã An Khánh..."
              value={formData.ward || ''}
              onChange={(e) => onChange('ward', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Địa chỉ chi tiết / Dự án
          </label>
          <input
            type="text"
            placeholder="VD: Số 45 Lê Duẩn / Tòa S2.01 Vinhomes Central Park"
            value={formData.address_detail || ''}
            onChange={(e) => onChange('address_detail', e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 3. Pricing & Dimensions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Mức giá & Diện tích</h3>
          </div>
          {pricePerM2 && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              Đơn giá ước tính: ~{pricePerM2} triệu/m²
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Price Value */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Mức giá số
            </label>
            <input
              type="number"
              step="any"
              placeholder="VD: 3.5"
              value={formData.price !== null && formData.price !== undefined ? formData.price : ''}
              onChange={(e) => onChange('price', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
            />
          </div>

          {/* Price Unit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Đơn vị tính
            </label>
            <select
              value={formData.price_unit || 'tỷ'}
              onChange={(e) => onChange('price_unit', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value="tỷ">Tỷ VNĐ</option>
              <option value="triệu">Triệu VNĐ</option>
              <option value="triệu/tháng">Triệu / Tháng (Thuê)</option>
              <option value="nghìn/m2">Nghìn / m²</option>
              <option value="thỏa_thuận">Thỏa thuận</option>
            </select>
          </div>

          {/* Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Diện tích (m²)
            </label>
            <input
              type="number"
              step="any"
              placeholder="VD: 85"
              value={formData.area !== null && formData.area !== undefined ? formData.area : ''}
              onChange={(e) => onChange('area', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
            />
          </div>
        </div>
      </div>

      {/* 4. Specifications & Architecture (Conditional fields) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Thông số kỹ thuật & Pháp lý</h3>
          </div>
          {isLand && (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Đất nền: số phòng ngủ/WC có thể để trống
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Phòng ngủ
            </label>
            <input
              type="number"
              placeholder={isLand ? 'Không áp dụng' : 'VD: 3'}
              disabled={isLand}
              value={formData.bedrooms !== null && formData.bedrooms !== undefined ? formData.bedrooms : ''}
              onChange={(e) => onChange('bedrooms', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:opacity-40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Phòng tắm / WC
            </label>
            <input
              type="number"
              placeholder={isLand ? 'Không áp dụng' : 'VD: 2'}
              disabled={isLand}
              value={formData.bathrooms !== null && formData.bathrooms !== undefined ? formData.bathrooms : ''}
              onChange={(e) => onChange('bathrooms', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:opacity-40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Số tầng
            </label>
            <input
              type="number"
              placeholder="VD: 4"
              value={formData.floors !== null && formData.floors !== undefined ? formData.floors : ''}
              onChange={(e) => onChange('floors', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Hướng nhà / Đất
            </label>
            <select
              value={formData.direction || ''}
              onChange={(e) => onChange('direction', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Chọn hướng</option>
              {directions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tình trạng pháp lý
            </label>
            <input
              type="text"
              placeholder="VD: Sổ hồng riêng, Sổ đỏ chính chủ, HĐMB..."
              value={formData.legal_status || ''}
              onChange={(e) => onChange('legal_status', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tình trạng nội thất
            </label>
            <input
              type="text"
              placeholder="VD: Đầy đủ nội thất cao cấp, Bàn giao thô, Cơ bản..."
              value={formData.furniture_status || ''}
              onChange={(e) => onChange('furniture_status', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Amenities Checkboxes */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Tiện ích & Điểm cộng nổi bật
          </label>
          <div className="flex flex-wrap gap-2">
            {commonAmenities.map((amenity) => {
              const isChecked = (formData.amenities || []).includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    isChecked
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isChecked ? '✓ ' : '+ '}
                  {amenity}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Contact Information & Links */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Phone className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Thông tin liên hệ & Liên kết</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Họ tên người phụ trách
            </label>
            <input
              type="text"
              placeholder="VD: Nguyễn Thành Đạt"
              value={formData.contact_name || ''}
              onChange={(e) => onChange('contact_name', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Số điện thoại Hotline
            </label>
            <input
              type="text"
              placeholder="VD: 0908 123 456"
              value={formData.contact_phone || ''}
              onChange={(e) => onChange('contact_phone', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Số Zalo tư vấn
            </label>
            <input
              type="text"
              placeholder="VD: 0908 123 456"
              value={formData.contact_zalo || ''}
              onChange={(e) => onChange('contact_zalo', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              URL Bản đồ Google Maps (nếu có)
            </label>
            <input
              type="url"
              placeholder="https://maps.google.com/?q=..."
              value={formData.map_url || ''}
              onChange={(e) => onChange('map_url', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Ghi chú liên hệ
            </label>
            <input
              type="text"
              placeholder="VD: Xem nhà báo trước 30p, hỗ trợ 24/7..."
              value={formData.contact_note || ''}
              onChange={(e) => onChange('contact_note', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
