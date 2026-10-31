import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Upload, 
  Download, 
  SlidersHorizontal, 
  Filter, 
  ExternalLink, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  Layers, 
  Eye, 
  Edit3, 
  Trash2, 
  Share2, 
  MapPin, 
  Building2, 
  Users, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  RotateCcw,
  Info,
  Check
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';

import ChannelDetailModal from '../modules/channels/ChannelDetailModal';
import ChannelFormModal from '../modules/channels/ChannelFormModal';
import CsvImportModal from '../modules/channels/CsvImportModal';
import CollectionsModal from '../modules/channels/CollectionsModal';
import ScoreWeightsModal from '../modules/channels/ScoreWeightsModal';
import ProviderStatusModal from '../modules/channels/ProviderStatusModal';
import ConfirmModal from '../components/ConfirmModal';

export default function ChannelDiscoveryView({ onNavigate }) {
  const toast = useToast();

  // Channels state
  const [channels, setChannels] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Collections state
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('all');

  // Listings for auto-matching
  const [listings, setListings] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState('');

  // Search & Criteria Form State
  const [criteria, setCriteria] = useState({
    property_type: '',
    listing_action: '',
    province: '',
    district: '',
    price_segment: '',
    target_audience: '',
    channel_type: '',
    min_score: 0
  });

  // Table Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [capabilityFilter, setCapabilityFilter] = useState('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState('score_desc');

  // Multi-select state
  const [selectedChannelIds, setSelectedChannelIds] = useState([]);

  // Modals state
  const [detailChannel, setDetailChannel] = useState(null);
  const [editingChannel, setEditingChannel] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isWeightsOpen, setIsWeightsOpen] = useState(false);
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Load collections & listings for matching
  const loadInitialData = async () => {
    try {
      const [cols, lists] = await Promise.all([
        api.getCollections(),
        api.getListings({ limit: 50 })
      ]);
      setCollections(cols);
      setListings(lists.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch channels list with criteria matching
  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        channel_type: criteria.channel_type,
        verification_status: verificationFilter,
        publishing_capability: capabilityFilter,
        is_favorite: onlyFavorites ? '1' : '',
        collection_id: selectedCollectionId !== 'all' ? selectedCollectionId : '',
        match_province: criteria.province,
        match_district: criteria.district,
        match_property_type: criteria.property_type,
        match_price_segment: criteria.price_segment,
        match_audience: criteria.target_audience,
        min_score: criteria.min_score > 0 ? criteria.min_score : '',
        sort_by: sortBy,
        page,
        limit: 10
      };

      const data = await api.getChannels(params);
      setChannels(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách kênh: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [
    searchTerm,
    criteria,
    verificationFilter,
    capabilityFilter,
    onlyFavorites,
    selectedCollectionId,
    sortBy,
    page,
    toast
  ]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // When user selects a listing to auto-fill criteria
  const handleSelectListing = (listingId) => {
    setSelectedListingId(listingId);
    if (!listingId) return;

    const found = listings.find(l => l.id === listingId);
    if (found) {
      // Determine price segment
      let pSeg = 'trung_cap';
      if (found.price) {
        if (found.price < 2 && found.price_unit === 'tỷ') pSeg = 'gia_re';
        else if (found.price <= 5 && found.price_unit === 'tỷ') pSeg = 'trung_cap';
        else if (found.price <= 15 && found.price_unit === 'tỷ') pSeg = 'cao_cap';
        else if (found.price > 15 && found.price_unit === 'tỷ') pSeg = 'sieu_sang';
      }

      setCriteria({
        property_type: found.property_type || '',
        listing_action: found.listing_action || 'ban',
        province: found.province || '',
        district: found.district || '',
        price_segment: pSeg,
        target_audience: found.listing_action === 'cho_thue' ? 'thue' : 'mua_o',
        channel_type: '',
        min_score: 0
      });
      setPage(1);
      toast.info(`Đã áp dụng thông số từ tin "${found.title}" để tự động chấm điểm kênh!`);
    }
  };

  const handleResetCriteria = () => {
    setSelectedListingId('');
    setCriteria({
      property_type: '',
      listing_action: '',
      province: '',
      district: '',
      price_segment: '',
      target_audience: '',
      channel_type: '',
      min_score: 0
    });
    setSearchTerm('');
    setVerificationFilter('all');
    setCapabilityFilter('all');
    setOnlyFavorites(false);
    setSelectedCollectionId('all');
    setPage(1);
    toast.info('Đã thiết lập lại toàn bộ bộ lọc và tiêu chí.');
  };

  // Channel Actions
  const handleToggleFavorite = async (id) => {
    try {
      const res = await api.toggleFavoriteChannel(id);
      setChannels(prev => prev.map(c => c.id === id ? { ...c, is_favorite: res.is_favorite } : c));
      if (detailChannel && detailChannel.id === id) {
        setDetailChannel(prev => ({ ...prev, is_favorite: res.is_favorite }));
      }
      toast.info(res.is_favorite ? 'Đã thêm vào kênh yêu thích.' : 'Đã bỏ yêu thích.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleVerify = async (id) => {
    try {
      const res = await api.verifyChannel(id);
      setChannels(prev => prev.map(c => c.id === id ? { ...c, verification_status: res.verification_status, last_verified_at: res.last_verified_at } : c));
      if (detailChannel && detailChannel.id === id) {
        setDetailChannel(prev => ({ ...prev, verification_status: res.verification_status, last_verified_at: res.last_verified_at }));
      }
      toast.success(res.verification_status === 'verified' ? 'Đã đánh dấu xác minh uy tín!' : 'Đã chuyển về chưa xác minh.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveChannel = async (channelData) => {
    if (editingChannel) {
      await api.updateChannel(editingChannel.id, channelData);
      toast.success('Đã cập nhật kênh tiếp thị thành công!');
    } else {
      await api.createChannel(channelData);
      toast.success('Đã thêm kênh tiếp thị mới thành công!');
    }
    fetchChannels();
    loadInitialData();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteChannel(deleteTarget.id);
      toast.success('Đã xóa kênh thành công.');
      setDeleteTarget(null);
      fetchChannels();
      loadInitialData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Bulk Actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedChannelIds(channels.map(c => c.id));
    } else {
      setSelectedChannelIds([]);
    }
  };

  const handleToggleSelectChannel = (id) => {
    if (selectedChannelIds.includes(id)) {
      setSelectedChannelIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedChannelIds(prev => [...prev, id]);
    }
  };

  const handleBulkVerify = async () => {
    if (selectedChannelIds.length === 0) return;
    try {
      await api.bulkVerifyChannels(selectedChannelIds);
      toast.success(`Đã xác minh uy tín cho ${selectedChannelIds.length} kênh đã chọn!`);
      setSelectedChannelIds([]);
      fetchChannels();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkAddToCollection = async (collectionId) => {
    if (!collectionId || selectedChannelIds.length === 0) return;
    try {
      await api.bulkCollectionChannels(selectedChannelIds, collectionId, 'add');
      toast.success(`Đã thêm ${selectedChannelIds.length} kênh vào bộ sưu tập!`);
      setSelectedChannelIds([]);
      fetchChannels();
      loadInitialData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedChannelIds.length === 0) return;
    try {
      await api.bulkDeleteChannels(selectedChannelIds);
      toast.success(`Đã xóa ${selectedChannelIds.length} kênh thành công.`);
      setSelectedChannelIds([]);
      setIsBulkDeleting(false);
      fetchChannels();
      loadInitialData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getScoreColor = (sc) => {
    if (sc >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (sc >= 60) return 'text-blue-700 bg-blue-50 border-blue-300';
    if (sc >= 40) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-slate-600 bg-slate-100 border-slate-300';
  };

  const getChannelTypeBadge = (type) => {
    switch (type) {
      case 'facebook_group':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">FB Group</span>;
      case 'facebook_page':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">FB Fanpage</span>;
      case 'zalo_group':
      case 'zalo_oa':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Zalo</span>;
      case 'portal':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">Cổng BĐS</span>;
      case 'forum':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Diễn đàn</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Kênh khác</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Giai Đoạn 2: Channel Discovery
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Tìm Kiếm & Khám Phá Kênh Tiếp Thị BĐS
            </h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Khám phá hội nhóm Facebook, nhóm Zalo, diễn đàn và cổng thông tin theo thuật toán chấm điểm liên quan minh bạch (Relevance Score 0 - 100).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setEditingChannel(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950 transition-all"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Thêm kênh mới</span>
            </button>

            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Nhập CSV</span>
            </button>

            <a
              href={api.getExportCsvUrl()}
              download
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Xuất CSV</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Search & Criteria Matching Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Bộ Tiêu Chí Tìm Kiếm & Chấm Điểm Liên Quan</h3>
          </div>

          {/* Auto fill from Listing dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Khớp theo tin:</span>
            <select
              value={selectedListingId}
              onChange={(e) => handleSelectListing(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 max-w-xs truncate"
            >
              <option value="">-- Chọn tin BĐS để tự động khớp --</option>
              {listings.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Criteria Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Property Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Loại hình BĐS
            </label>
            <select
              value={criteria.property_type}
              onChange={(e) => {
                setCriteria({ ...criteria, property_type: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="">Tất cả loại hình</option>
              <option value="can_ho">Căn hộ chung cư</option>
              <option value="nha_pho">Nhà phố</option>
              <option value="nha_rieng">Nhà riêng</option>
              <option value="dat_nen">Đất nền</option>
              <option value="biet_thu">Biệt thự</option>
              <option value="van_phong">Văn phòng</option>
              <option value="khac">Khác</option>
            </select>
          </div>

          {/* Location: Province */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tỉnh / Thành phố
            </label>
            <input
              type="text"
              placeholder="VD: TP. Hồ Chí Minh"
              value={criteria.province}
              onChange={(e) => {
                setCriteria({ ...criteria, province: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Location: District */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Quận / Huyện
            </label>
            <input
              type="text"
              placeholder="VD: TP. Thủ Đức, Quận 1..."
              value={criteria.district}
              onChange={(e) => {
                setCriteria({ ...criteria, district: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Price Segment */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Phân khúc giá
            </label>
            <select
              value={criteria.price_segment}
              onChange={(e) => {
                setCriteria({ ...criteria, price_segment: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả phân khúc</option>
              <option value="gia_re">Bình dân / Giá rẻ (&lt; 2 tỷ)</option>
              <option value="trung_cap">Trung cấp (2 - 5 tỷ)</option>
              <option value="cao_cap">Cao cấp (5 - 15 tỷ)</option>
              <option value="sieu_sang">Siêu sang (&gt; 15 tỷ)</option>
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tệp khán giả
            </label>
            <select
              value={criteria.target_audience}
              onChange={(e) => {
                setCriteria({ ...criteria, target_audience: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả đối tượng</option>
              <option value="mua_o">Người mua ở thực</option>
              <option value="dau_tu">Nhà đầu tư sinh lời</option>
              <option value="thue">Khách thuê / Cho thuê</option>
              <option value="moi_gioi">Cộng đồng môi giới F1</option>
            </select>
          </div>

          {/* Channel Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Loại kênh tiếp thị
            </label>
            <select
              value={criteria.channel_type}
              onChange={(e) => {
                setCriteria({ ...criteria, channel_type: e.target.value });
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả loại kênh</option>
              <option value="facebook_group">Hội nhóm Facebook (Group)</option>
              <option value="facebook_page">Trang Facebook (Fanpage)</option>
              <option value="zalo_group">Nhóm Zalo</option>
              <option value="portal">Cổng thông tin BĐS</option>
              <option value="forum">Diễn đàn</option>
            </select>
          </div>

          {/* Min Score Filter */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Điểm liên quan tối thiểu:</span>
              <span className="text-emerald-600 font-mono font-extrabold">{criteria.min_score}đ</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={criteria.min_score}
              onChange={(e) => {
                setCriteria({ ...criteria, min_score: parseInt(e.target.value, 10) });
                setPage(1);
              }}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Reset button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetCriteria}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ tiêu chí</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar & Collections Tab Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        {/* Collections Tab Strip */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setSelectedCollectionId('all');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCollectionId === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả kênh ({total})
            </button>

            {collections.map(col => (
              <button
                key={col.id}
                onClick={() => {
                  setSelectedCollectionId(col.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedCollectionId === col.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{col.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                  {col.channel_count || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsCollectionsOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quản lý</span> Bộ sưu tập
            </button>

            <button
              onClick={() => setIsWeightsOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Cấu hình trọng số tính điểm"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsProviderOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Kiểm tra Search Provider API"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input, Filters & Sorting Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên kênh, URL, quận huyện..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Verification Status */}
          <div>
            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả xác minh</option>
              <option value="verified">Đã xác minh (Verified)</option>
              <option value="unverified">Chưa xác minh (Unverified)</option>
              <option value="inactive">Ngưng hoạt động (Inactive)</option>
            </select>
          </div>

          {/* Publishing Capability */}
          <div>
            <select
              value={capabilityFilter}
              onChange={(e) => {
                setCapabilityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả khả năng đăng</option>
              <option value="manual_only">Đăng thủ công (Manual only)</option>
              <option value="api_supported">Hỗ trợ API (API supported)</option>
              <option value="unknown">Chưa rõ (Unknown)</option>
              <option value="unsupported">Không hỗ trợ (Unsupported)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value="score_desc">⭐ Điểm liên quan cao nhất</option>
              <option value="score_asc">Điểm liên quan thấp nhất</option>
              <option value="name_asc">Tên kênh A - Z</option>
              <option value="verified_desc">Xác minh mới nhất</option>
              <option value="members_desc">Quy mô thành viên lớn nhất</option>
            </select>
          </div>
        </div>

        {/* Favorite filter toggle */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyFavorites}
              onChange={(e) => {
                setOnlyFavorites(e.target.checked);
                setPage(1);
              }}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-slate-700 font-medium">Chỉ xem kênh yêu thích</span>
          </label>

          <span className="text-slate-400">
            Hiển thị <span className="font-bold text-slate-800">{channels.length}</span> / {total} kênh
          </span>
        </div>
      </div>

      {/* 4. Bulk Action Floating Bar */}
      {selectedChannelIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Đã chọn <strong className="text-emerald-400">{selectedChannelIds.length}</strong> kênh:</span>
          </div>

          <div className="flex items-center gap-2">
            {collections.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkAddToCollection(e.target.value);
                  e.target.value = '';
                }}
                className="px-3 py-1.5 text-xs bg-slate-800 text-white border border-slate-700 rounded-xl focus:outline-hidden"
              >
                <option value="">+ Thêm vào bộ sưu tập...</option>
                {collections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={handleBulkVerify}
              className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Xác minh hàng loạt
            </button>

            <button
              onClick={() => setIsBulkDeleting(true)}
              className="px-3 py-1.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
            >
              Xóa hàng loạt
            </button>

            <button
              onClick={() => setSelectedChannelIds([])}
              className="px-2 py-1.5 text-slate-400 hover:text-white"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* 5. Channel Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Đang tính toán điểm liên quan và tải danh sách kênh...</p>
          </div>
        ) : channels.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Không tìm thấy kênh phù hợp</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Thử hạ điểm tối thiểu, mở rộng khu vực hoặc sử dụng nút "Thêm kênh mới" để nhập kênh của riêng bạn.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={handleResetCriteria}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Đặt lại tiêu chí
              </button>
              <button
                onClick={() => {
                  setEditingChannel(null);
                  setIsFormOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500"
              >
                + Thêm kênh mới
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={channels.length > 0 && selectedChannelIds.length === channels.length}
                      onChange={handleSelectAll}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="p-3 w-10 text-center">⭐</th>
                  <th className="px-4 py-3.5">Kênh tiếp thị & URL</th>
                  <th className="px-4 py-3.5">Loại kênh</th>
                  <th className="px-4 py-3.5">Khu vực / Quy mô</th>
                  <th className="px-4 py-3.5 text-center">Điểm liên quan</th>
                  <th className="px-4 py-3.5">Trạng thái kiểm minh</th>
                  <th className="px-4 py-3.5">Khả năng đăng bài</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {channels.map((chan) => {
                  const score = chan.relevanceScore !== undefined ? chan.relevanceScore : 50;
                  const isSelected = selectedChannelIds.includes(chan.id);

                  return (
                    <tr 
                      key={chan.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectChannel(chan.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Favorite */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleFavorite(chan.id)}
                          className="p-1 rounded text-slate-300 hover:text-amber-500 transition-colors"
                          title={chan.is_favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                        >
                          <Star className={`w-4 h-4 ${chan.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Name & URL */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div 
                          onClick={() => setDetailChannel(chan)}
                          className="font-bold text-slate-900 hover:text-emerald-600 cursor-pointer line-clamp-1 text-sm"
                        >
                          {chan.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a
                            href={chan.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-400 hover:text-emerald-600 truncate max-w-[200px]"
                          >
                            {chan.url}
                          </a>
                          <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                        </div>
                        {chan.collections && chan.collections.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {chan.collections.map(col => (
                              <span key={col.id} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                                {col.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Channel Type */}
                      <td className="px-4 py-3.5">
                        {getChannelTypeBadge(chan.channel_type)}
                      </td>

                      {/* Location & Members */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-800 font-semibold">
                          {[chan.district, chan.province].filter(Boolean).join(', ') || 'Toàn quốc'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {chan.member_count ? `${chan.member_count.toLocaleString()} thành viên` : 'Chưa có quy mô'}
                        </div>
                      </td>

                      {/* Relevance Score with Breakdown Preview */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setDetailChannel(chan)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold border transition-all hover:scale-105 ${getScoreColor(score)}`}
                          title="Bấm để xem chi tiết cách tính điểm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{score} / 100</span>
                        </button>
                      </td>

                      {/* Verification Status */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleVerify(chan.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                            chan.verification_status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : chan.verification_status === 'inactive'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                          title="Bấm để chuyển trạng thái xác minh"
                        >
                          {chan.verification_status === 'verified' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Đã xác minh</span>
                            </>
                          ) : chan.verification_status === 'inactive' ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                              <span>Ngưng hoạt động</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Chưa xác minh</span>
                            </>
                          )}
                        </button>
                        {chan.last_verified_at && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(chan.last_verified_at).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </td>

                      {/* Publishing Capability */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          chan.publishing_capability === 'api_supported'
                            ? 'bg-emerald-50 text-emerald-700'
                            : chan.publishing_capability === 'manual_only'
                            ? 'bg-blue-50 text-blue-700'
                            : chan.publishing_capability === 'unsupported'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {chan.publishing_capability === 'api_supported' ? '⚡ API chính thức' :
                           chan.publishing_capability === 'manual_only' ? '✍️ Đăng thủ công' :
                           chan.publishing_capability === 'unsupported' ? '⛔ Không hỗ trợ' : '❓ Chưa rõ'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailChannel(chan)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingChannel(chan);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                            title="Sửa kênh"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(chan)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Xóa kênh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-medium">
            Trang <span className="font-bold text-slate-800">{page}</span> / {totalPages} (Tổng số {total} kênh)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ChannelDetailModal
        channel={detailChannel}
        isOpen={!!detailChannel}
        onClose={() => setDetailChannel(null)}
        onEdit={(ch) => {
          setEditingChannel(ch);
          setIsFormOpen(true);
        }}
        onToggleVerify={handleToggleVerify}
        onToggleFavorite={handleToggleFavorite}
      />

      <ChannelFormModal
        channel={editingChannel}
        collections={collections}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingChannel(null);
        }}
        onSave={handleSaveChannel}
      />

      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => {
          fetchChannels();
          loadInitialData();
        }}
      />

      <CollectionsModal
        isOpen={isCollectionsOpen}
        collections={collections}
        onClose={() => setIsCollectionsOpen(false)}
        onRefresh={loadInitialData}
      />

      <ScoreWeightsModal
        isOpen={isWeightsOpen}
        onClose={() => setIsWeightsOpen(false)}
        onSaved={() => fetchChannels()}
      />

      <ProviderStatusModal
        isOpen={isProviderOpen}
        location={criteria.province || 'TP. Hồ Chí Minh'}
        onClose={() => setIsProviderOpen(false)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xác nhận xóa kênh tiếp thị"
        message={`Bạn có chắc muốn xóa kênh "${deleteTarget?.name}" khỏi hệ thống?`}
        confirmText="Xác nhận xóa"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        isOpen={isBulkDeleting}
        title="Xác nhận xóa hàng loạt"
        message={`Bạn có chắc muốn xóa vĩnh viễn ${selectedChannelIds.length} kênh tiếp thị đã chọn?`}
        confirmText="Xóa tất cả đã chọn"
        onConfirm={handleBulkDelete}
        onCancel={() => setIsBulkDeleting(false)}
      />
    </div>
  );
}
