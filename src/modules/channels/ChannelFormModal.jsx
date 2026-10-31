import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  AlertCircle, 
  Share2, 
  Building2, 
  MapPin, 
  DollarSign, 
  Users, 
  FileText,
  Info
} from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function ChannelFormModal({ 
  isOpen, 
  onClose, 
  channel = null, 
  collections = [], 
  onSave 
}) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    channel_type: 'facebook_group',
    category: 'bat_dong_san',
    province: 'TP. Hồ Chí Minh',
    district: '',
    ward: '',
    property_types: ['can_ho', 'nha_pho'],
    price_segments: ['trung_cap', 'cao_cap'],
    target_audiences: ['mua_o', 'dau_tu'],
    verification_status: 'unverified',
    publishing_capability: 'manual_only',
    member_count: '',
    notes: '',
    collection_id: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (channel) {
      setFormData({
        name: channel.name || '',
        url: channel.url || '',
        channel_type: channel.channel_type || 'facebook_group',
        category: channel.category || 'bat_dong_san',
        province: channel.province || '',
        district: channel.district || '',
        ward: channel.ward || '',
        property_types: Array.isArray(channel.property_types) ? channel.property_types : [],
        price_segments: Array.isArray(channel.price_segments) ? channel.price_segments : [],
        target_audiences: Array.isArray(channel.target_audiences) ? channel.target_audiences : [],
        verification_status: channel.verification_status || 'unverified',
        publishing_capability: channel.publishing_capability || 'unknown',
        member_count: channel.member_count ? String(channel.member_count) : '',
        notes: channel.notes || '',
        collection_id: channel.collections && channel.collections.length > 0 ? channel.collections[0].id : ''
      });
    } else {
      setFormData({
        name: '',
        url: '',
        channel_type: 'facebook_group',
        category: 'bat_dong_san',
        province: 'TP. Hồ Chí Minh',
        district: '',
        ward: '',
        property_types: ['can_ho', 'nha_pho'],
        price_segments: ['trung_cap'],
        target_audiences: ['mua_o'],
        verification_status: 'unverified',
        publishing_capability: 'manual_only',
        member_count: '',
        notes: '',
        collection_id: collections.length > 0 ? collections[0].id : ''
      });
    }
  }, [channel, collections, isOpen]);

  if (!isOpen) return null;

  const propertyTypeOptions = [
    { value: 'can_ho', label: 'Căn hộ chung cư' },
    { value: 'nha_pho', label: 'Nhà phố' },
    { value: 'nha_rieng', label: 'Nhà riêng' },
    { value: 'dat_nen', label: 'Đất nền' },
    { value: 'biet_thu', label: 'Biệt thự' },
    { value: 'van_phong', label: 'Văn phòng' },
    { value: 'khac', label: 'Khác' },
  ];

  const priceSegmentOptions = [
    { value: 'gia_re', label: 'Bình dân / Giá rẻ (< 2 tỷ)' },
    { value: 'trung_cap', label: 'Trung cấp (2 - 5 tỷ)' },
    { value: 'cao_cap', label: 'Cao cấp (5 - 15 tỷ)' },
    { value: 'sieu_sang', label: 'Siêu sang (> 15 tỷ)' },
  ];

  const audienceOptions = [
    { value: 'mua_o', label: 'Người mua ở thực' },
    { value: 'dau_tu', label: 'Nhà đầu tư sinh lời' },
    { value: 'thue', label: 'Khách thuê / Cho thuê' },
    { value: 'moi_gioi', label: 'Cộng đồng môi giới F1' },
  ];

  const toggleArrayItem = (field, val) => {
    const list = formData[field] || [];
    if (list.includes(val)) {
      setFormData({ ...formData, [field]: list.filter(item => item !== val) });
    } else {
      setFormData({ ...formData, [field]: [...list, val] });
    }
  };

  const handleChannelTypeChange = (e) => {
    const newType = e.target.value;
    let newCap = formData.publishing_capability;
    if (newType === 'facebook_group' && newCap === 'api_supported') {
      newCap = 'manual_only';
    }
    setFormData({
      ...formData,
      channel_type: newType,
      publishing_capability: newCap
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên kênh.');
      return;
    }
    if (!formData.url.trim()) {
      toast.error('Vui lòng nhập đường dẫn URL của kênh.');
      return;
    }
    if (!/^https?:\/\//i.test(formData.url.trim())) {
      toast.error('URL kênh phải bắt đầu bằng http:// hoặc https://.');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        ...formData,
        name: formData.name.trim(),
        url: formData.url.trim(),
        member_count: formData.member_count ? parseInt(formData.member_count, 10) : 0
      });
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {channel ? 'Chỉnh sửa thông tin kênh' : 'Thêm kênh tiếp thị mới'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nhập chính xác URL và thông số để hệ thống tính điểm liên quan chuẩn xác.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Name & URL */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên kênh / Hội nhóm / Diễn đàn <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Cộng Đồng Cư Dân Vinhomes Grand Park Q9"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Đường dẫn URL kênh <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://facebook.com/groups/..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono text-slate-700"
              />
            </div>
          </div>

          {/* Channel Type & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Loại hình kênh
              </label>
              <select
                value={formData.channel_type}
                onChange={handleChannelTypeChange}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="facebook_group">Hội nhóm Facebook (Group)</option>
                <option value="facebook_page">Trang Facebook (Fanpage)</option>
                <option value="zalo_group">Nhóm Zalo</option>
                <option value="zalo_oa">Zalo Official Account (OA)</option>
                <option value="portal">Cổng thông tin / Web BĐS</option>
                <option value="forum">Diễn đàn Bất Động Sản</option>
                <option value="telegram">Nhóm Telegram</option>
                <option value="other">Kênh khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quy mô thành viên ước tính
              </label>
              <input
                type="number"
                placeholder="VD: 45000"
                value={formData.member_count}
                onChange={(e) => setFormData({ ...formData, member_count: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tỉnh / Thành phố
              </label>
              <input
                type="text"
                placeholder="VD: TP. Hồ Chí Minh / Toàn quốc"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quận / Huyện / TP khu vực
              </label>
              <input
                type="text"
                placeholder="VD: TP. Thủ Đức, Quận 1..."
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Publishing Capability & Verification */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Khả năng xuất bản (Publishing Capability)
                </label>
                <select
                  value={formData.publishing_capability}
                  onChange={(e) => setFormData({ ...formData, publishing_capability: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="manual_only">Manual publishing only (Đăng thủ công)</option>
                  <option value="api_supported" disabled={formData.channel_type === 'facebook_group'}>
                    API publishing supported (Đăng qua API)
                  </option>
                  <option value="unknown">Unknown or not verified (Chưa xác minh)</option>
                  <option value="unsupported">Unsupported (Không hỗ trợ)</option>
                </select>
                {formData.channel_type === 'facebook_group' && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    * Theo quy định Meta Graph API, Hội nhóm Facebook chỉ hỗ trợ xuất bản thủ công.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Trạng thái kiểm minh (Verification)
                </label>
                <select
                  value={formData.verification_status}
                  onChange={(e) => setFormData({ ...formData, verification_status: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="unverified">Chưa xác minh (Unverified)</option>
                  <option value="verified">Đã xác minh uy tín (Verified)</option>
                  <option value="inactive">Ngưng hoạt động / Bị chặn (Inactive)</option>
                </select>
              </div>
            </div>

            {/* Collection Assignment */}
            {collections.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gán vào Bộ sưu tập
                </label>
                <select
                  value={formData.collection_id}
                  onChange={(e) => setFormData({ ...formData, collection_id: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Không gán bộ sưu tập --</option>
                  {collections.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Multi-select Pills: Property Types */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Loại hình BĐS phù hợp (Chọn để chấm điểm)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {propertyTypeOptions.map((opt) => {
                const active = (formData.property_types || []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleArrayItem('property_types', opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-select Pills: Price Segments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phân khúc giá
            </label>
            <div className="flex flex-wrap gap-1.5">
              {priceSegmentOptions.map((opt) => {
                const active = (formData.price_segments || []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleArrayItem('price_segments', opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-select Pills: Target Audiences */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tệp khán giả mục tiêu
            </label>
            <div className="flex flex-wrap gap-1.5">
              {audienceOptions.map((opt) => {
                const active = (formData.target_audiences || []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleArrayItem('target_audiences', opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ghi chú hoạt động & Quy tắc đăng bài
            </label>
            <textarea
              rows={3}
              placeholder="VD: Kiểm duyệt bài viết trong 30 phút, không đăng kèm link spam, yêu cầu kèm số điện thoại..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Đang lưu...' : channel ? 'Cập nhật kênh' : 'Lưu kênh mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
