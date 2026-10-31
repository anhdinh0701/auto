import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Building2, 
  Image as ImageIcon, 
  FileText, 
  Share2, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Clock,
  Layers,
  Check
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';

import BasicInfoStep from '../modules/editor/BasicInfoStep';
import MediaManager from '../modules/editor/MediaManager';
import ContentStudio from '../modules/editor/ContentStudio';
import PlatformPreview from '../modules/editor/PlatformPreview';
import Phase2Config from '../modules/editor/Phase2Config';

export default function EditorView({ listingId = null, onBack, onSaved }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'media' | 'content' | 'preview' | 'phase2'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'can_ho',
    listing_action: 'ban',
    province: 'TP. Hồ Chí Minh',
    district: '',
    ward: '',
    address_detail: '',
    price: '',
    price_unit: 'tỷ',
    price_raw_text: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    floors: '',
    direction: '',
    legal_status: 'Sổ hồng riêng',
    furniture_status: 'Đầy đủ nội thất',
    amenities: ['Chỗ để xe ô tô', 'Bảo vệ 24/7'],
    contact_name: 'Nguyễn Thành Đạt',
    contact_phone: '0908 123 456',
    contact_zalo: '0908 123 456',
    contact_note: '',
    map_url: '',
    detail_url: '',
    status: 'draft',
    photos: [],
    target_platforms: ['facebook', 'batdongsan'],
    target_groups: [],
    scheduled_at: null,
    publish_queue_status: 'idle',
    publish_logs: []
  });

  // Fetch listing data if editing
  useEffect(() => {
    if (!listingId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await api.getListing(listingId);
        setFormData(data);
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi tải thông tin bất động sản: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [listingId, toast]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (overrideStatus = null) => {
    if (!formData.title || !formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề cho tin bất động sản!');
      setActiveTab('info');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        status: overrideStatus || formData.status
      };

      let result;
      if (listingId) {
        result = await api.updateListing(listingId, payload);
        toast.success('Đã cập nhật tin bất động sản thành công!');
      } else {
        result = await api.createListing(payload);
        toast.success('Đã tạo mới tin bất động sản thành công!');
      }

      if (onSaved) onSaved(result);
    } catch (err) {
      toast.error('Lỗi lưu tin: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'info', label: '1. Thông số BĐS', icon: Building2 },
    { id: 'media', label: `2. Quản lý Ảnh (${formData.photos?.length || 0})`, icon: ImageIcon },
    { id: 'content', label: '3. Studio Nội dung & Mẫu', icon: FileText },
    { id: 'preview', label: '4. Xem trước Đa nền tảng', icon: Eye },
    { id: 'phase2', label: '5. Sẵn sàng Giai đoạn 2', icon: Share2 },
  ];

  if (loading) {
    return (
      <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu tin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Sticky Header */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 line-clamp-1">
              {listingId ? (formData.title || 'Chỉnh sửa tin') : 'Tạo tin bất động sản mới'}
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Trạng thái lưu:</span>
              <span className="font-bold text-slate-700">
                {formData.status === 'ready' ? 'Sẵn sàng đăng' : formData.status === 'reviewed' ? 'Đã duyệt' : 'Bản nháp'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {/* Status selector */}
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="draft">📝 Bản nháp</option>
            <option value="reviewed">🔍 Đã duyệt nội dung</option>
            <option value="ready">✅ Sẵn sàng đăng</option>
          </select>

          {/* Quick Preview Button */}
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Xem trước</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave()}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : 'Lưu tin'}</span>
          </button>
        </div>
      </div>

      {/* Stepper Tabs Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-xs flex overflow-x-auto gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'info' && (
          <BasicInfoStep formData={formData} onChange={handleChange} />
        )}
        {activeTab === 'media' && (
          <MediaManager photos={formData.photos || []} onChange={handleChange} listingId={listingId} />
        )}
        {activeTab === 'content' && (
          <ContentStudio formData={formData} onChange={handleChange} />
        )}
        {activeTab === 'preview' && (
          <PlatformPreview formData={formData} />
        )}
        {activeTab === 'phase2' && (
          <Phase2Config formData={formData} onChange={handleChange} />
        )}
      </div>
    </div>
  );
}
