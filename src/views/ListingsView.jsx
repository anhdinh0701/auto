import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Eye, 
  MapPin, 
  CheckCircle2, 
  FileEdit, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  LayoutGrid,
  List,
  AlertCircle,
  Home,
  Send
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function ListingsView({ 
  onNavigate, 
  onEditListing, 
  onPreviewListing, 
  initialFilter = {} 
}) {
  const toast = useToast();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState(initialFilter.status || 'all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [sortBy, setSortBy] = useState('updated_desc');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getListings({
        search: searchTerm,
        property_type: selectedType,
        status: selectedStatus,
        listing_action: selectedAction,
        sort_by: sortBy,
        page,
        limit: 9
      });
      setListings(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách bất động sản: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, selectedStatus, selectedAction, sortBy, page, toast]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle clone
  const handleClone = async (id) => {
    try {
      const cloned = await api.cloneListing(id);
      toast.success(`Đã nhân bản tin "${cloned.title}" thành bản nháp mới!`);
      fetchListings();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.deleteListing(deleteTarget.id);
      toast.success('Đã xóa tin bất động sản thành công.');
      setDeleteTarget(null);
      fetchListings();
    } catch (err) {
      toast.error('Lỗi khi xóa tin: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Sẵn sàng đăng
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3 h-3 text-blue-500" /> Đã duyệt
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <FileEdit className="w-3 h-3 text-amber-500" /> Bản nháp
          </span>
        );
    }
  };

  const getPropertyTypeLabel = (type) => {
    const labels = {
      can_ho: 'Căn hộ',
      nha_rieng: 'Nhà riêng',
      nha_pho: 'Nhà phố',
      dat_nen: 'Đất nền',
      biet_thu: 'Biệt thự',
      van_phong: 'Văn phòng',
      khac: 'Khác'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Search / Filters Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Kho Tin Bất Động Sản</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tổng cộng có <span className="font-bold text-slate-800">{total}</span> bất động sản được lưu trong hệ thống
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dạng lưới thẻ"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dạng danh sách bảng"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => onNavigate('editor')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo tin mới</span>
            </button>
          </div>
        </div>

        {/* Filter Bar Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          {/* Keyword Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, quận huyện, địa chỉ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Property Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả loại hình</option>
              <option value="can_ho">Căn hộ</option>
              <option value="nha_rieng">Nhà riêng</option>
              <option value="nha_pho">Nhà phố</option>
              <option value="dat_nen">Đất nền</option>
              <option value="biet_thu">Biệt thự</option>
              <option value="van_phong">Văn phòng</option>
              <option value="khac">Khác</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="reviewed">Đã duyệt</option>
              <option value="ready">Sẵn sàng đăng</option>
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
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="updated_desc">Mới cập nhật</option>
              <option value="created_desc">Mới tạo nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="area_desc">Diện tích lớn nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu bất động sản...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy tin bất động sản phù hợp</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc.'
                : 'Chưa có tin nào. Hãy tạo tin đăng bất động sản đầu tiên của bạn.'}
            </p>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedType('all');
              setSelectedStatus('all');
              onNavigate('editor');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo tin mới ngay</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const coverPhoto = item.photos && item.photos.length > 0 
              ? (item.photos.find(p => p.is_cover) || item.photos[0]).url 
              : null;
            const photoCount = item.photos ? item.photos.length : 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all flex flex-col overflow-hidden group"
              >
                {/* Image Cover */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {coverPhoto ? (
                    <img
                      src={coverPhoto}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <Home className="w-10 h-10 mb-1" />
                      <span className="text-xs">Chưa có ảnh</span>
                    </div>
                  )}

                  {/* Badges on Image */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {getStatusBadge(item.status)}
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-900/80 text-white backdrop-blur-xs">
                      {item.listing_action === 'cho_thue' ? 'Cho thuê' : 'Bán'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                    {photoCount} ảnh
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {getPropertyTypeLabel(item.property_type)}
                      </span>
                      {item.area && <span className="font-bold text-slate-700">{item.area} m²</span>}
                    </div>

                    <h3 
                      onClick={() => onEditListing(item.id)}
                      className="text-sm font-bold text-slate-900 hover:text-emerald-600 line-clamp-2 cursor-pointer transition-colors leading-snug"
                    >
                      {item.title}
                    </h3>

                    {/* Price Tag */}
                    <div className="text-emerald-600 font-extrabold text-base">
                      {item.price ? `${item.price} ${item.price_unit}` : item.price_raw_text || 'Thỏa thuận'}
                      {item.price && item.area && (
                        <span className="text-xs font-normal text-slate-400 ml-1.5">
                          (~{(item.price * (item.price_unit === 'tỷ' ? 1000 : 1) / item.area).toFixed(1)} tr/m²)
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-slate-500 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{[item.ward, item.district, item.province].filter(Boolean).join(', ') || 'Chưa nhập vị trí'}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onPreviewListing(item)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Xem trước bài đăng"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleClone(item.id)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Nhân bản tin này"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Xóa tin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onNavigate('publishing')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                        title="Đăng bài bất động sản này lên các kênh"
                      >
                        <Send className="w-3 h-3" />
                        <span>Đăng tin</span>
                      </button>
                      <button
                        onClick={() => onEditListing(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Bất động sản</th>
                  <th className="px-4 py-3.5">Loại hình</th>
                  <th className="px-4 py-3.5">Giá / Diện tích</th>
                  <th className="px-4 py-3.5">Địa chỉ</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {listings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-1 hover:text-emerald-600 cursor-pointer" onClick={() => onEditListing(item.id)}>
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.photos?.length || 0} ảnh • Cập nhật: {new Date(item.updated_at).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 rounded font-semibold text-slate-700">
                        {getPropertyTypeLabel(item.property_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-emerald-600">
                        {item.price ? `${item.price} ${item.price_unit}` : item.price_raw_text || 'Thỏa thuận'}
                      </div>
                      <div className="text-slate-400 text-[11px]">{item.area ? `${item.area} m²` : '-'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {[item.district, item.province].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onPreviewListing(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 rounded"
                          title="Xem trước"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleClone(item.id)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 rounded"
                          title="Nhân bản"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditListing(item.id)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded"
                          title="Sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-medium">
            Trang <span className="font-bold text-slate-800">{page}</span> / {totalPages}
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

      {/* Mandatory Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xác nhận xóa tin bất động sản"
        message={`Bạn có chắc chắn muốn xóa tin "${deleteTarget?.title}"? Tin này và dữ liệu liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống.`}
        confirmText="Xác nhận xóa"
        cancelText="Giữ lại tin"
        isDanger={true}
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
