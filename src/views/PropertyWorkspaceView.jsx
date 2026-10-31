import React, { useState, useEffect } from 'react';
import {
  Building2,
  PlusCircle,
  Sparkles,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Check,
  RefreshCw,
  Sliders,
  Layers,
  MapPin,
  Camera,
  UploadCloud,
  ChevronDown,
  Info,
  Calendar,
  Clock
} from 'lucide-react';
import { useToast } from '../components/Toast';

function PropertyImage({ src, alt, className = '', fallbackText = 'Ảnh không khả dụng' }) {
  const [loadError, setLoadError] = useState(false);

  const cleanSrc = React.useMemo(() => {
    if (!src) return null;
    let s = typeof src === 'object' ? (src.url || src.file_path || src.filename || '') : String(src);
    if (!s) return null;
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    const cleanPath = s.startsWith('/') ? s : `/${s}`;
    // If running on Vite dev server (port != 3001), prepend backend URL
    if (typeof window !== 'undefined' && window.location.port && window.location.port !== '3001') {
      return `http://localhost:3001${cleanPath}`;
    }
    return cleanPath;
  }, [src]);

  useEffect(() => {
    setLoadError(false);
  }, [cleanSrc]);

  if (!cleanSrc || loadError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 border border-slate-200/80 text-slate-400 p-2 text-center select-none ${className}`}>
        <ImageIcon className="w-6 h-6 text-slate-300 mb-1 shrink-0" />
        <span className="text-[10px] font-medium text-slate-500 leading-tight">
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <img
      src={cleanSrc}
      alt={alt || 'Hình ảnh bất động sản'}
      className={className}
      onError={() => setLoadError(true)}
      loading="lazy"
    />
  );
}

export default function PropertyWorkspaceView({
  initialTab = 'catalog',
  editingListingId = null,
  onNavigateToPublishing
}) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState(editingListingId ? 'editor' : initialTab); // 'catalog' | 'editor' | 'ai_images' | 'templates'
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');

  // Form State for Single Standard Creation / Edit
  const [formData, setFormData] = useState({
    title: '',
    project_name: '',
    property_type: 'can_ho',
    listing_action: 'ban',
    province: 'Hà Nội',
    district: 'Quận Long Biên',
    ward: 'Phường Thượng Thanh',
    address_detail: '',
    price: '',
    price_unit: 'tỷ',
    area: '',
    bedrooms: '',
    bathrooms: '',
    floors: '',
    direction: 'Đông Nam',
    legal_status: 'Sổ hồng riêng',
    furniture_status: 'Full nội thất',
    contact_name: 'Nguyễn Văn A',
    contact_phone: '0912345678',
    contact_zalo: '0912345678',
    description: '',
    photos: [],
    approved_photo_ids: []
  });

  // AI Image Selection States
  const [analyzingPhotos, setAnalyzingPhotos] = useState(false);
  const [aiImageAnalysis, setAiImageAnalysis] = useState(null);
  const [targetChannelPreset, setTargetChannelPreset] = useState('facebook_feed'); // 'facebook_feed' | 'portal' | 'banner'
  const [approvedPhotoIds, setApprovedPhotoIds] = useState([]);
  const [isExtractingFeatures, setIsExtractingFeatures] = useState(false);
  const [nlpExtractedData, setNlpExtractedData] = useState(null);

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Reference projects for quick autocomplete
  const [referenceProjects, setReferenceProjects] = useState([]);
  const [locationValidationReport, setLocationValidationReport] = useState(null);

  // Fetch listings and reference projects on mount
  useEffect(() => {
    fetchListings();
    fetchReferenceProjects();
    fetchTemplates();
  }, []);

  // When editingListingId changes or selectedListing changes, populate form
  useEffect(() => {
    if (editingListingId) {
      loadListingForEdit(editingListingId);
    }
  }, [editingListingId]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/listings?limit=50');
      const data = await res.json();
      setListings(data.items || []);
    } catch (err) {
      addToast('Lỗi khi tải kho tin: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceProjects = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/location/projects');
      const data = await res.json();
      if (data.success) {
        setReferenceProjects(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/templates');
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : (data.templates || []));
    } catch (err) {
      console.error(err);
    }
  };

  const loadListingForEdit = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/listings/${id}`);
      const data = await res.json();
      if (data) {
        setSelectedListing(data);
        setFormData({
          id: data.id,
          title: data.title || '',
          project_name: data.project_name || '',
          property_type: data.property_type || 'can_ho',
          listing_action: data.listing_action || 'ban',
          province: data.province || '',
          district: data.district || '',
          ward: data.ward || '',
          address_detail: data.address_detail || '',
          price: data.price !== null ? data.price : '',
          price_unit: data.price_unit || 'tỷ',
          area: data.area !== null ? data.area : '',
          bedrooms: data.bedrooms !== null ? data.bedrooms : '',
          bathrooms: data.bathrooms !== null ? data.bathrooms : '',
          floors: data.floors !== null ? data.floors : '',
          direction: data.direction || '',
          legal_status: data.legal_status || '',
          furniture_status: data.furniture_status || '',
          contact_name: data.contact_name || '',
          contact_phone: data.contact_phone || '',
          contact_zalo: data.contact_zalo || '',
          description: data.description || '',
          photos: data.photos || [],
          approved_photo_ids: data.approved_photo_ids || []
        });
        setApprovedPhotoIds(data.approved_photo_ids || []);
        runLocationCheck({
          project_name: data.project_name,
          province: data.province,
          district: data.district,
          ward: data.ward,
          address_detail: data.address_detail,
          title: data.title
        });
        setActiveTab('editor');
      }
    } catch (err) {
      addToast('Không thể tải tin: ' + err.message, 'error');
    }
  };

  // Run location check against API
  const runLocationCheck = async (locPayload) => {
    try {
      const res = await fetch('http://localhost:3001/api/location/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locPayload)
      });
      const resData = await res.json();
      if (resData.success) {
        setLocationValidationReport(resData.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    if (['project_name', 'province', 'district', 'ward', 'address_detail'].includes(field)) {
      runLocationCheck({
        project_name: field === 'project_name' ? value : updated.project_name,
        province: field === 'province' ? value : updated.province,
        district: field === 'district' ? value : updated.district,
        ward: field === 'ward' ? value : updated.ward,
        address_detail: field === 'address_detail' ? value : updated.address_detail,
        title: updated.title
      });
    }
  };

  // Select project from reference list
  const handleSelectReferenceProject = (proj) => {
    const updated = {
      ...formData,
      project_name: proj.project_name,
      province: proj.province,
      district: proj.district,
      ward: proj.ward || formData.ward
    };
    setFormData(updated);
    runLocationCheck(updated);
    addToast(`Đã đồng bộ vị trí chuẩn cho dự án "${proj.project_name}"`, 'success');
  };

  // Handle Save (Create or Update)
  const handleSaveListing = async () => {
    if (!formData.title.trim()) {
      addToast('Vui lòng nhập tiêu đề tin bất động sản.', 'error');
      return;
    }

    try {
      const isEdit = Boolean(formData.id);
      const url = isEdit ? `http://localhost:3001/api/listings/${formData.id}` : 'http://localhost:3001/api/listings';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          approved_photo_ids: approvedPhotoIds
        })
      });

      const saved = await res.json();
      if (res.ok) {
        addToast(isEdit ? 'Đã cập nhật tin đăng thành công!' : 'Đã tạo tin bất động sản mới!', 'success');
        setSelectedListing(saved);
        setFormData(prev => ({ ...prev, id: saved.id }));
        fetchListings();
      } else {
        addToast(saved.error || 'Lỗi khi lưu tin', 'error');
      }
    } catch (err) {
      addToast('Lỗi kết nối: ' + err.message, 'error');
    }
  };

  // Module 1: NLP Feature Extractor (llama-3.3-70b-versatile with JSON mode)
  const handleExtractFeaturesNLP = async () => {
    const textToAnalyze = formData.description?.trim() || formData.title?.trim();
    if (!textToAnalyze) {
      addToast('Vui lòng nhập nội dung mô tả hoặc tiêu đề trước khi trích xuất.', 'warning');
      return;
    }

    setIsExtractingFeatures(true);
    try {
      const res = await fetch('http://localhost:3001/api/ai/extract-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_content: textToAnalyze,
          listing_id: formData.id || null
        })
      });

      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        setNlpExtractedData(d);
        setFormData(prev => ({
          ...prev,
          province: d.city || prev.province,
          district: d.district || prev.district,
          ward: d.ward || prev.ward,
          property_type: d.property_type || prev.property_type,
          price: d.price !== null && d.price !== undefined ? d.price : prev.price,
          price_unit: d.price_unit || prev.price_unit,
          area: d.area !== null && d.area !== undefined ? d.area : prev.area
        }));

        addToast(`Groq AI trích xuất thành công: ${d.property_type} tại ${d.district}, ${d.city}!`, 'success');
      } else {
        addToast(result.error || 'Lỗi trích xuất đặc trưng bài viết.', 'error');
      }
    } catch (err) {
      addToast('Lỗi Groq NLP: ' + err.message, 'error');
    } finally {
      setIsExtractingFeatures(false);
    }
  };

  // Module 2: AI Image Selection & Scoring Runner (Groq Vision Matching)
  const handleRunAiImageSelection = async () => {
    const photosToAnalyze = formData.photos && formData.photos.length > 0 ? formData.photos : (selectedListing?.photos || []);
    if (!photosToAnalyze || photosToAnalyze.length === 0) {
      addToast('Tin đăng chưa có ảnh. Vui lòng tải ảnh lên trước.', 'warning');
      return;
    }

    setAnalyzingPhotos(true);
    try {
      const res = await fetch('http://localhost:3001/api/ai/select-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: formData.id,
          property_id: formData.id,
          photos: photosToAnalyze,
          channel_type: targetChannelPreset,
          target_limit: 4,
          key_selling_points: nlpExtractedData?.key_selling_points,
          required_image_types: nlpExtractedData?.required_image_types
        })
      });

      const data = await res.json();
      if (data.success) {
        setAiImageAnalysis(data);
        const recommendedIds = (data.recommended_photos || []).map(p => p.id);
        setApprovedPhotoIds(recommendedIds);
        await fetchListings();
        addToast(`Groq Vision đã chọn 4 ảnh tối ưu! Ảnh bìa: ${data.cover_photo_category || 'Hero'}.`, 'success');
      } else {
        addToast(data.error || 'Lỗi phân tích ảnh AI', 'error');
      }
    } catch (err) {
      addToast('Lỗi Groq Vision: ' + err.message, 'error');
    } finally {
      setAnalyzingPhotos(false);
    }
  };

  // Persist User-Approved Photo Bundle
  const handleApproveAndSaveBundle = async () => {
    if (!formData.id) {
      addToast('Vui lòng lưu thông tin tin đăng trước khi phê duyệt ảnh.', 'warning');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/ai/approve-photo-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: formData.id,
          approved_photo_ids: approvedPhotoIds,
          notes: `Người dùng phê duyệt gói ${approvedPhotoIds.length} ảnh cho định dạng ${targetChannelPreset}.`
        })
      });

      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        setFormData(prev => ({ ...prev, approved_photo_ids: approvedPhotoIds }));
        fetchListings();
      } else {
        addToast(data.error || 'Lỗi lưu bộ ảnh', 'error');
      }
    } catch (err) {
      addToast('Lỗi kết nối: ' + err.message, 'error');
    }
  };

  // Toggle Photo in Approved Bundle
  const togglePhotoApproval = (photoId) => {
    if (approvedPhotoIds.includes(photoId)) {
      setApprovedPhotoIds(approvedPhotoIds.filter(id => id !== photoId));
    } else {
      setApprovedPhotoIds([...approvedPhotoIds, photoId]);
    }
  };

  // Phase 3: Quick Smart Schedule via Groq
  const handleTriggerQuickSchedule = async (listingId) => {
    try {
      addToast('Đang gọi Groq AI đối chiếu nhóm BĐS & xếp lịch đăng...', 'info');
      const res = await fetch('http://localhost:3001/api/intelligence/smart-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: listingId })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Groq AI đã xếp lịch thành công cho ${data.data.schedules_created_count} nhóm Facebook! (Đã áp dụng Jitter 6-12p & Micro-Spinning)`, 'success');
      } else {
        addToast(data.error || 'Lỗi lên lịch', 'error');
      }
    } catch (err) {
      addToast('Lỗi: ' + err.message, 'error');
    }
  };

  // Filter listings
  const filteredListings = listings.filter(l => {
    const matchSearch = (l.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.district || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.project_name || '').toLowerCase().includes(search.toLowerCase());
    const matchType = propertyTypeFilter === 'all' || l.property_type === propertyTypeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                Hub Cốt Lõi
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Property Content Workspace</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Không gian quản trị tập trung: Soạn tin tiêu chuẩn, Chọn ảnh AI, Đối chiếu địa lý và Quản lý mẫu bài.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFormData({
                  title: '',
                  project_name: '',
                  property_type: 'can_ho',
                  listing_action: 'ban',
                  province: 'Hà Nội',
                  district: 'Quận Long Biên',
                  ward: 'Phường Thượng Thanh',
                  address_detail: '',
                  price: '',
                  price_unit: 'tỷ',
                  area: '',
                  bedrooms: '',
                  bathrooms: '',
                  floors: '',
                  direction: 'Đông Nam',
                  legal_status: 'Sổ hồng riêng',
                  furniture_status: 'Full nội thất',
                  contact_name: 'Nguyễn Văn A',
                  contact_phone: '0912345678',
                  contact_zalo: '0912345678',
                  description: '',
                  photos: [],
                  approved_photo_ids: []
                });
                setSelectedListing(null);
                setApprovedPhotoIds([]);
                setAiImageAnalysis(null);
                setLocationValidationReport(null);
                setActiveTab('editor');
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-xs flex items-center gap-2 transition-all active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo tin BĐS mới</span>
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 pb-1">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Kho tin BĐS ({listings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'editor'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>{formData.id ? 'Sửa tin: ' + (formData.title.slice(0, 20) + '...') : 'Soạn tin tiêu chuẩn'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_images')}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'ai_images'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Chọn ảnh thông minh AI</span>
            {approvedPhotoIds.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-white text-emerald-800 rounded-full font-bold">
                {approvedPhotoIds.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'templates'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Mẫu nội dung ({templates.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CATALOG VIEW */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, dự án, quận huyện..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={propertyTypeFilter}
                onChange={(e) => setPropertyTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-emerald-500"
              >
                <option value="all">Tất cả loại hình</option>
                <option value="can_ho">Căn hộ chung cư</option>
                <option value="nha_pho">Nhà phố</option>
                <option value="nha_rieng">Nhà riêng</option>
                <option value="dat_nen">Đất nền</option>
                <option value="biet_thu">Biệt thự</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredListings.map(listing => {
              let photoList = listing.photos || [];
              if (typeof photoList === 'string') {
                try { photoList = JSON.parse(photoList); } catch (_) { photoList = []; }
              }
              const p0 = photoList[0];
              const coverPhoto = (typeof p0 === 'object' ? (p0.url || p0.file_path || p0.filename) : p0) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';
              const approvedCount = (listing.approved_photo_ids || []).length;
              const locStatus = listing.location_verification_status || 'UNVERIFIED';

              return (
                <div key={listing.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col">
                  {/* Photo Header */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <PropertyImage src={coverPhoto} alt={listing.title} className="w-full h-full object-cover" fallbackText="Ảnh không tìm thấy" />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                        {listing.property_type}
                      </span>
                      {locStatus === 'VERIFIED' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3" /> Địa lý chuẩn
                        </span>
                      )}
                      {locStatus === 'NEEDS_REVIEW' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Cần đối chiếu
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-slate-900/80 backdrop-blur-xs text-white rounded text-xs font-bold">
                      {listing.price ? `${listing.price} ${listing.price_unit}` : 'Thỏa thuận'}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {listing.project_name && (
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                          Dự án: {listing.project_name}
                        </p>
                      )}
                      <h3 className="font-bold text-slate-800 text-sm mt-0.5 line-clamp-2" title={listing.title}>
                        {listing.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{listing.district || 'Chưa rõ'}, {listing.province || 'Chưa rõ'}</span>
                      </p>

                      <div className="flex items-center gap-2 mt-3 text-xs text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">DT: {listing.area || '--'} m²</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded">Ảnh: {photoList.length}</span>
                        {approvedCount > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {approvedCount} ảnh AI duyệt
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                      <button
                        onClick={() => loadListingForEdit(listing.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> Sửa
                      </button>

                      <button
                        onClick={() => {
                          loadListingForEdit(listing.id);
                          setActiveTab('ai_images');
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Bộ ảnh AI
                      </button>

                      <button
                        onClick={() => handleTriggerQuickSchedule(listing.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1 shadow-2xs"
                        title="Đối chiếu nhóm cùng thành phố, áp dụng Jitter 6-12p và Micro-Spinning"
                      >
                        <Calendar className="w-3.5 h-3.5 text-teal-600" /> Lên lịch AI
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SINGLE STANDARD EDITOR VIEW */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Edit Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {formData.id ? 'Chỉnh sửa tin đăng BĐS' : 'Soạn tin bất động sản tiêu chuẩn'}
                </h2>
                <p className="text-xs text-slate-500">
                  Điền các trường thông số chính xác để phục vụ đăng tự động và chấm điểm kênh.
                </p>
              </div>

              <button
                onClick={handleSaveListing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs flex items-center gap-2 active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>Lưu thông tin</span>
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Tiêu đề tin đăng *
              </label>
              <input
                type="text"
                placeholder="VD: Bán căn hộ 2PN Vinhomes Grand Park view công viên 36ha..."
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-emerald-500"
              />
            </div>

            {/* Project Autocomplete & Contradiction Checker */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <label className="block text-xs font-bold uppercase text-emerald-800 mb-1">
                Dự án / Khu đô thị (Kiểm tra đối chiếu địa lý tự động)
              </label>
              <input
                type="text"
                placeholder="Nhập hoặc chọn dự án (VD: Khai Sơn City, Vinhomes Grand Park, Ecopark...)"
                value={formData.project_name}
                onChange={(e) => handleInputChange('project_name', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-emerald-200 rounded-lg text-sm text-slate-800 focus:outline-emerald-500"
              />

              {/* Reference quick chips */}
              <div className="flex flex-wrap gap-1.5 mt-2.5 items-center">
                <span className="text-[11px] text-emerald-700 font-medium">Gợi ý dự án đối chiếu:</span>
                {referenceProjects.slice(0, 5).map(proj => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => handleSelectReferenceProject(proj)}
                    className="text-[11px] px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md font-medium transition-all"
                  >
                    {proj.project_name}
                  </button>
                ))}
              </div>
            </div>

            {/* Geographical Hierarchy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Tỉnh / Thành phố *</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Quận / Huyện *</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Phường / Xã</label>
                <input
                  type="text"
                  value={formData.ward}
                  onChange={(e) => handleInputChange('ward', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Địa chỉ chi tiết / Đường</label>
              <input
                type="text"
                placeholder="VD: Số 28 Nguyễn Xiển, phân khu The Rainbow..."
                value={formData.address_detail}
                onChange={(e) => handleInputChange('address_detail', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500"
              />
            </div>

            {/* Property Specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Loại BĐS</label>
                <select
                  value={formData.property_type}
                  onChange={(e) => handleInputChange('property_type', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500"
                >
                  <option value="can_ho">Căn hộ chung cư</option>
                  <option value="nha_pho">Nhà phố</option>
                  <option value="nha_rieng">Nhà riêng</option>
                  <option value="dat_nen">Đất nền</option>
                  <option value="biet_thu">Biệt thự</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Mức giá</label>
                <div className="flex">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="VD: 3.2"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg text-sm focus:outline-emerald-500"
                  />
                  <select
                    value={formData.price_unit}
                    onChange={(e) => handleInputChange('price_unit', e.target.value)}
                    className="px-2 py-2 bg-slate-100 border border-slate-200 rounded-r-lg text-xs font-bold text-slate-700"
                  >
                    <option value="tỷ">Tỷ</option>
                    <option value="triệu/tháng">Tr/tháng</option>
                    <option value="triệu/m2">Tr/m²</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Diện tích (m²)</label>
                <input
                  type="number"
                  placeholder="VD: 69"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Phòng ngủ / WC</label>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    placeholder="PN"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center"
                  />
                  <input
                    type="number"
                    placeholder="WC"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase text-slate-600">
                  Nội dung mô tả chi tiết
                </label>
                <button
                  type="button"
                  onClick={handleExtractFeaturesNLP}
                  disabled={isExtractingFeatures || (!formData.description?.trim() && !formData.title?.trim())}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isExtractingFeatures ? 'animate-spin' : ''}`} />
                  <span>{isExtractingFeatures ? 'Đang trích xuất Groq NLP...' : 'Trích xuất đặc trưng AI (Groq NLP)'}</span>
                </button>
              </div>
              <textarea
                rows={6}
                placeholder="Nhập nội dung chi tiết hoặc chọn từ Thư viện mẫu bài đăng..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-emerald-500 font-sans leading-relaxed"
              />

              {/* Display Extracted Tags if available */}
              {nlpExtractedData && (
                <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đặc trưng đã trích xuất bằng Groq AI (Llama 70B):</span>
                  </div>
                  {nlpExtractedData.key_selling_points?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="font-semibold text-emerald-800 text-[11px]">Điểm nhấn (Selling Points):</span>
                      {nlpExtractedData.key_selling_points.map((pt, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-emerald-200 rounded-md text-emerald-700 text-[11px] font-medium shadow-2xs">
                          ✓ {pt}
                        </span>
                      ))}
                    </div>
                  )}
                  {nlpExtractedData.required_image_types?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="font-semibold text-emerald-800 text-[11px]">Góc ảnh yêu cầu:</span>
                      {nlpExtractedData.required_image_types.map((ang, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-teal-200 rounded-md text-teal-700 text-[11px] font-mono shadow-2xs">
                          📷 {ang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Location Sanity & Photo Quick Overview */}
          <div className="space-y-6">
            {/* Location Validation Box */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Kiểm tra thực địa địa lý</span>
              </h3>

              {locationValidationReport ? (
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Trạng thái:</span>
                    {locationValidationReport.status === 'VERIFIED' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                      </span>
                    )}
                    {locationValidationReport.status === 'WARNING' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo
                      </span>
                    )}
                    {locationValidationReport.status === 'NEEDS_REVIEW' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" /> Mâu thuẫn địa lý
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    {locationValidationReport.reasons.map((r, i) => (
                      <p key={i} className={`flex items-start gap-1.5 ${locationValidationReport.status === 'NEEDS_REVIEW' ? 'text-rose-700 font-semibold' : 'text-slate-600'}`}>
                        <span>•</span> <span>{r}</span>
                      </p>
                    ))}
                  </div>

                  {locationValidationReport.status === 'NEEDS_REVIEW' && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                      ⚠️ Lưu ý: Tự động chặn xuất bản khi có mâu thuẫn địa lý nghiêm trọng để tránh spam hoặc sai lệch khu vực.
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-2">
                  Đang đồng bộ dữ liệu địa lý...
                </p>
              )}
            </div>

            {/* Quick Photo Selector Summary */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Bộ ảnh tin đăng</span>
                </h3>
                <span className="text-xs text-slate-500">
                  {formData.photos?.length || 0} ảnh
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {(formData.photos || []).slice(0, 6).map((p, idx) => (
                  <div key={idx} className="relative h-18 rounded-lg overflow-hidden border border-slate-200">
                    <PropertyImage src={p.url || p.file_path || p} alt="pic" className="w-full h-full object-cover" fallbackText="Ảnh lỗi" />
                    {approvedPhotoIds.includes(p.id) && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center text-white text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setActiveTab('ai_images')}
                className="w-full mt-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mở AI Chọn ảnh & Phê duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI IMAGE SELECTION & RANKING WORKFLOW */}
      {activeTab === 'ai_images' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800">
                  AI Photo Studio
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Đánh giá, Chấm điểm & Lựa chọn bộ ảnh xuất bản
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AI phân tích góc chụp (mặt tiền, nội thất, sơ đồ), độ nét, độ phân giải và đề xuất số lượng ảnh theo định dạng kênh.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={targetChannelPreset}
                onChange={(e) => setTargetChannelPreset(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="facebook_feed">Chuẩn Facebook Feed (Carousel 4-6 ảnh)</option>
                <option value="portal">Chuẩn Cổng BĐS Batdongsan / Chotot (8-12 ảnh)</option>
                <option value="banner">Chuẩn Single Banner (1-2 ảnh nét nhất)</option>
              </select>

              <button
                onClick={handleRunAiImageSelection}
                disabled={analyzingPhotos}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyzingPhotos ? 'animate-spin' : ''}`} />
                <span>{analyzingPhotos ? 'Đang phân tích...' : 'AI Phân tích & Chọn ảnh'}</span>
              </button>
            </div>
          </div>

          {/* AI Explanation Banner */}
          {aiImageAnalysis && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
                <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                  {aiImageAnalysis.bundle_reason}
                </p>
              </div>

              <button
                onClick={handleApproveAndSaveBundle}
                className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu bộ {approvedPhotoIds.length} ảnh đã duyệt</span>
              </button>
            </div>
          )}

          {/* Grid of Recommended Photos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <span>Ảnh trong kho tin ({formData.photos?.length || 0})</span>
                <span className="text-xs text-slate-400">— Nhấp để chọn/bỏ chọn xuất bản</span>
              </h3>
              <span className="text-xs font-semibold text-emerald-700">
                Đã duyệt {approvedPhotoIds.length} ảnh cho lệnh đăng
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(formData.photos || []).map((photo, index) => {
                const isApproved = approvedPhotoIds.includes(photo.id);
                const recData = aiImageAnalysis?.recommended_photos?.find(r => r.id === photo.id);

                return (
                  <div
                    key={photo.id || index}
                    onClick={() => togglePhotoApproval(photo.id)}
                    className={`cursor-pointer group relative rounded-xl overflow-hidden border-2 transition-all ${
                      isApproved ? 'border-emerald-500 shadow-md ring-2 ring-emerald-200' : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="h-36 bg-slate-100">
                      <PropertyImage src={photo.url || photo.file_path || photo} alt="photo-item" className="w-full h-full object-cover" fallbackText="Ảnh không tồn tại" />
                    </div>

                    {/* Badge selection */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {isApproved ? (
                        <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-md shadow-xs flex items-center gap-1">
                          ✓ Đã duyệt
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-800/80 text-white text-[10px] rounded-md backdrop-blur-xs">
                          Chưa chọn
                        </span>
                      )}
                      {recData && recData.sort_order === 0 && (
                        <span className="px-2 py-0.5 bg-amber-500 text-white font-bold text-[10px] rounded-md shadow-xs flex items-center gap-1 animate-pulse">
                          ★ Ảnh bìa AI
                        </span>
                      )}
                    </div>

                    {/* Metadata summary */}
                    <div className="p-2.5 bg-white text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate text-[11px] capitalize">
                          {recData ? (recData.detected_category || recData.category_label) : 'Ảnh không gian'}
                        </span>
                        {recData && (
                          <span className="font-bold text-emerald-700 text-[11px]">
                            {recData.total_score || recData.aesthetic_score}/10
                          </span>
                        )}
                      </div>
                      {recData && (
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Đẹp: {recData.aesthetic_score}/10</span>
                          <span>Khớp: {recData.relevance_score}/10</span>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 truncate" title={photo.originalname || photo.filename}>
                        {photo.originalname || photo.filename}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TEMPLATES MANAGEMENT */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Danh mục mẫu tin
            </h3>
            <div className="space-y-2">
              {templates.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplate(tpl);
                    // Apply to current description if empty or user wants
                    if (!formData.description || window.confirm('Áp dụng mẫu này vào nội dung mô tả của tin đang soạn?')) {
                      setFormData(prev => ({
                        ...prev,
                        description: tpl.body_template
                          .replace('{address_detail}', formData.address_detail || '')
                          .replace('{district}', formData.district || '')
                          .replace('{province}', formData.province || '')
                          .replace('{price}', formData.price || '')
                          .replace('{price_unit}', formData.price_unit || '')
                          .replace('{area}', formData.area || '')
                          .replace('{bedrooms}', formData.bedrooms || '')
                          .replace('{bathrooms}', formData.bathrooms || '')
                          .replace('{contact_name}', formData.contact_name || '')
                          .replace('{contact_phone}', formData.contact_phone || '')
                      }));
                      addToast(`Đã áp dụng mẫu "${tpl.name}" vào nội dung tin!`, 'success');
                    }
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedTemplate?.id === tpl.id ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-xs text-slate-800">{tpl.name}</p>
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase">{tpl.category}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Xem trước cấu trúc mẫu bài đăng
            </h3>
            {selectedTemplate ? (
              <div className="mt-4 space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500">Mẫu tiêu đề:</span>
                  <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                    {selectedTemplate.title_template}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase text-slate-500">Mẫu nội dung:</span>
                  <pre className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans whitespace-pre-wrap leading-relaxed mt-1">
                    {selectedTemplate.body_template}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-4">
                Chọn một mẫu bên trái để xem nội dung và áp dụng vào tin đăng.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
