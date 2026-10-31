import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  FileEdit, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  ArrowRight, 
  Image as ImageIcon,
  MapPin, 
  Eye, 
  Edit3, 
  Sparkles,
  TrendingUp,
  AlertCircle,
  Send,
  BarChart3,
  Users,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api';

export default function DashboardView({ onNavigate, onEditListing, onPreviewListing }) {
  const [stats, setStats] = useState({
    total: 0,
    drafts: 0,
    ready: 0,
    reviewed: 0,
    totalPhotos: 0,
    recent: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu Dashboard. Vui lòng kiểm tra máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sẵn sàng đăng
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Đã duyệt nội dung
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <FileEdit className="w-3.5 h-3.5 text-amber-500" /> Bản nháp
          </span>
        );
    }
  };

  const getPropertyTypeLabel = (type) => {
    const labels = {
      can_ho: 'Căn hộ chung cư',
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
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Giai Đoạn 1: Content Studio
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Quản lý & Soạn Thảo Tin Đăng Bất Động Sản
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Tạo bài đăng chuẩn mực, quản lý thư viện ảnh gốc chất lượng cao, tự động sinh nội dung từ thông số và xem trước đa nền tảng tức thì.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('publishing')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-950 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>Trung tâm đăng tin (GĐ 3)</span>
            </button>
            <button
              onClick={() => onNavigate('editor')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs transition-all"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Tạo tin BĐS mới</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={fetchStats} className="ml-auto text-xs font-bold underline">Thử lại</button>
        </div>
      )}

      {/* Mandatory Metric Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Listings */}
        <div 
          onClick={() => onNavigate('listings')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng số tin đã tạo</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500">sản phẩm</span>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-emerald-600 group-hover:translate-x-0.5 transition-transform">
            <span>Xem toàn bộ kho tin</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Ready to Publish */}
        <div 
          onClick={() => onNavigate('listings', { status: 'ready' })}
          className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs hover:shadow-md transition-all cursor-pointer group ring-1 ring-emerald-500/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Sẵn sàng đăng</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{stats.ready}</span>
            <span className="text-xs text-emerald-700/80">đã hoàn thiện</span>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-emerald-700 group-hover:translate-x-0.5 transition-transform">
            <span>Lọc tin sẵn sàng</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Drafts */}
        <div 
          onClick={() => onNavigate('listings', { status: 'draft' })}
          className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Số bản nháp</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center text-amber-600 transition-colors">
              <FileEdit className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{stats.drafts}</span>
            <span className="text-xs text-amber-700/80">cần hoàn thiện</span>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-amber-700 group-hover:translate-x-0.5 transition-transform">
            <span>Tiếp tục chỉnh sửa</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Reviewed / Gallery */}
        <div 
          onClick={() => onNavigate('gallery')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Thư viện ảnh lưu trữ</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 group-hover:bg-sky-100 flex items-center justify-center text-sky-600 transition-colors">
              <ImageIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalPhotos || 0}</span>
            <span className="text-xs text-slate-500">tệp ảnh gốc</span>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-brand-600 group-hover:translate-x-0.5 transition-transform">
            <span>Mở thư viện ảnh</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </div>

      {/* Phase 4 Hub: AI Optimization, Analytics & Automation Control */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('analytics')}
          className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Báo cáo & Analytics</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-sm font-bold text-slate-900">Phân Tích Đa Kênh</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Đo lường lượt xem, tương tác, conversion rate minh bạch.</p>
        </div>

        <div 
          onClick={() => onNavigate('ai')}
          className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">AI Content Studio</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-sm font-bold text-slate-900">Tối Ưu Tin Đăng AI</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Tiêu đề đa góc độ, viết lại theo đối tượng, chống trùng lặp.</p>
        </div>

        <div 
          onClick={() => onNavigate('crm')}
          className="bg-white p-4 rounded-2xl border border-teal-100 shadow-xs hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">Khách Tiềm Năng (CRM)</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-sm font-bold text-slate-900">Quản Lý Phễu Khách</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Ghi nhận lịch sử chăm sóc, nhắc lịch hẹn xem BĐS, nhập CSV.</p>
        </div>

        <div 
          onClick={() => onNavigate('operations')}
          className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Trung Tâm Điều Hành</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-sm font-bold text-slate-900">Giám Sát & Quy Tắc</div>
          <p className="text-[11px] text-slate-500 mt-0.5">6 quy tắc tự động hóa, sức khỏe hệ thống và nhật ký kiểm toán.</p>
        </div>
      </div>

      {/* Mandatory: Recently Modified Listings Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>Các tin được chỉnh sửa gần đây</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Danh sách 5 tin bất động sản có thao tác cập nhật mới nhất trên hệ thống
            </p>
          </div>

          <button
            onClick={() => onNavigate('listings')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <span>Xem tất cả ({stats.total})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Đang tải danh sách tin gần đây...</p>
          </div>
        ) : stats.recent.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">Chưa có tin bất động sản nào</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
              Bắt đầu tạo tin đầu tiên để quản lý thông số, hình ảnh và chuẩn bị nội dung đa kênh.
            </p>
            <button
              onClick={() => onNavigate('editor')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo tin ngay</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.recent.map((item) => {
              const coverPhoto = item.photos && item.photos.length > 0 
                ? (item.photos.find(p => p.is_cover) || item.photos[0]).url 
                : null;

              return (
                <div 
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 sm:w-24 sm:h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {coverPhoto ? (
                        <img 
                          src={coverPhoto} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon className="w-6 h-6" />
                          <span className="text-[10px] mt-1">Chưa có ảnh</span>
                        </div>
                      )}
                    </div>

                    {/* Listing Summary */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(item.status)}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {getPropertyTypeLabel(item.property_type)}
                        </span>
                        <span className="text-xs font-bold uppercase text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-50">
                          {item.listing_action === 'cho_thue' ? 'Cho thuê' : 'Bán'}
                        </span>
                      </div>

                      <h4 
                        onClick={() => onEditListing(item.id)}
                        className="text-sm font-bold text-slate-800 hover:text-emerald-600 cursor-pointer line-clamp-1 transition-colors"
                      >
                        {item.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {(item.price || item.price_raw_text) && (
                          <span className="font-bold text-slate-900">
                            {item.price ? `${item.price} ${item.price_unit}` : item.price_raw_text}
                          </span>
                        )}
                        {item.area && (
                          <span>• {item.area} m²</span>
                        )}
                        {(item.district || item.province) && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {[item.ward, item.district, item.province].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => onPreviewListing(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Xem trước bài đăng"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Xem trước</span>
                    </button>
                    <button
                      onClick={() => onEditListing(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Chỉnh sửa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
