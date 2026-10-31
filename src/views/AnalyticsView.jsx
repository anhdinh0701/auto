import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Eye, 
  Users, 
  ArrowUpRight, 
  RotateCcw, 
  PlusCircle, 
  Layers, 
  Building2, 
  Share2, 
  MapPin, 
  FileText,
  Calendar,
  Info,
  Check
} from 'lucide-react';
import { api } from '../api';

export default function AnalyticsView({ onNavigate }) {
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedListingId, setSelectedListingId] = useState('all');
  const [selectedChannelId, setSelectedChannelId] = useState('all');
  const [listings, setListings] = useState([]);
  const [channels, setChannels] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Manual Entry Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    listing_id: '',
    channel_id: '',
    views: '',
    interactions: '',
    leads_count: '',
    notes: ''
  });
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    loadPrerequisites();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [timeRange, selectedListingId, selectedChannelId]);

  const loadPrerequisites = async () => {
    try {
      const [listRes, chanRes] = await Promise.all([
        api.listings.getAll(),
        api.channels.getAll()
      ]);
      setListings(listRes || []);
      setChannels(chanRes || []);
    } catch (err) {
      console.error('Lỗi tải danh sách BĐS và kênh:', err);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.analytics.getDashboard({
        time_range: timeRange,
        listing_id: selectedListingId,
        channel_id: selectedChannelId
      });
      setDashboardData(data);
    } catch (err) {
      console.error('Lỗi tải Analytics Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualEntry = async (e) => {
    e.preventDefault();
    if (!manualForm.listing_id) {
      alert('Vui lòng chọn bất động sản liên quan!');
      return;
    }
    try {
      setSavingManual(true);
      await api.analytics.addManualEntry({
        listing_id: manualForm.listing_id,
        channel_id: manualForm.channel_id || null,
        views: parseInt(manualForm.views, 10) || 0,
        interactions: parseInt(manualForm.interactions, 10) || 0,
        leads_count: parseInt(manualForm.leads_count, 10) || 0,
        notes: manualForm.notes
      });
      alert('Đã lưu số liệu hiệu quả thành công!');
      setShowManualModal(false);
      setManualForm({ listing_id: '', channel_id: '', views: '', interactions: '', leads_count: '', notes: '' });
      fetchDashboard();
    } catch (err) {
      alert('Lỗi lưu số liệu: ' + err.message);
    } finally {
      setSavingManual(false);
    }
  };

  const summary = dashboardData?.summary || {};
  const performance = dashboardData?.performance || {};
  const dataSources = dashboardData?.data_sources || {};
  const channelComparison = dashboardData?.channel_comparison || [];
  const propertyComparison = dashboardData?.property_type_comparison || [];
  const locationComparison = dashboardData?.location_comparison || [];
  const trends = dashboardData?.trends || [];
  const errorBreakdown = dashboardData?.error_breakdown || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Báo Cáo & Phân Tích Hiệu Quả Đăng Tin
            </h1>
            <span className="text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Giai Đoạn 4
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Đo lường hiệu suất xuất bản, lượt tương tác, tỷ lệ chuyển đổi khách hàng tiềm năng và so sánh đa chiều.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Nhập số liệu thủ công
          </button>

          <button
            type="button"
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        {/* Time Range Filter */}
        <div className="sm:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="font-bold text-slate-600 shrink-0 flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Kỳ:
          </span>
          {[
            { id: 'today', label: 'Hôm nay' },
            { id: '7days', label: '7 ngày' },
            { id: '30days', label: '30 ngày' },
            { id: '90days', label: '90 ngày' }
          ].map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => setTimeRange(r.id)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                timeRange === r.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Property Selector */}
        <div className="sm:col-span-4">
          <select
            value={selectedListingId}
            onChange={(e) => setSelectedListingId(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="all">-- Tất cả bất động sản --</option>
            {listings.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>

        {/* Channel Selector */}
        <div className="sm:col-span-4">
          <select
            value={selectedChannelId}
            onChange={(e) => setSelectedChannelId(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="all">-- Tất cả kênh tiếp thị --</option>
            {channels.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.channel_type})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transparency & Data Source Callout Banner */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-slate-700">
            <strong>Tính minh bạch dữ liệu:</strong> Số liệu tương tác được phân loại minh bạch theo nguồn gốc:
          </span>
        </div>
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
            <Check className="w-3 h-3 text-emerald-600" />
            Nền tảng tự động: {dataSources.platform || 0}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-bold">
            ✍️ Nhập thủ công: {dataSources.manual || 0}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[11px]">
            Chưa có API: {dataSources.unavailable || 0}
          </span>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Lượt xem tin</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
            {(performance.total_views || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Từ các bài đăng được ghi nhận</div>
        </div>

        {/* Total Interactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tương tác</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-teal-600">
            {(performance.total_interactions || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Likes, bình luận & chia sẻ</div>
        </div>

        {/* Total Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Khách tiềm năng</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600">
            {performance.total_leads || 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Liên hệ phát sinh từ tin đăng</div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tỷ lệ chuyển đổi</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-600">
            {performance.conversion_rate || 0}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Số lead / Số lượt xem</div>
        </div>
      </div>

      {/* Publishing Status Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-400 font-bold uppercase">Tổng tin xuất bản</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{summary.total_posts || 0}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <div className="text-[11px] text-emerald-700 font-bold uppercase">Thành công</div>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">{summary.published || 0}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-rose-200 bg-rose-50/30 shadow-xs">
          <div className="text-[11px] text-rose-700 font-bold uppercase">Thất bại</div>
          <div className="text-lg font-bold text-rose-700 mt-0.5">{summary.failed || 0}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <div className="text-[11px] text-amber-800 font-bold uppercase">Chờ đăng tay</div>
          <div className="text-lg font-bold text-amber-800 mt-0.5">{summary.needs_manual || 0}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-200 bg-blue-50/30 shadow-xs">
          <div className="text-[11px] text-blue-700 font-bold uppercase">Đã lên lịch</div>
          <div className="text-lg font-bold text-blue-700 mt-0.5">{summary.scheduled || 0}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-indigo-200 bg-indigo-50/30 shadow-xs">
          <div className="text-[11px] text-indigo-700 font-bold uppercase">Tỷ lệ thành công</div>
          <div className="text-lg font-bold text-indigo-700 mt-0.5">{summary.success_rate || 0}%</div>
        </div>
      </div>

      {/* Visual Timeline Trend Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Biểu Đồ Xu Hướng Xuất Bản & Tương Tác Theo Ngày
          </h3>
          <span className="text-[11px] text-slate-400">14 ngày gần nhất</span>
        </div>

        <div className="h-44 flex items-end gap-2 pt-4 pb-2 px-2 overflow-x-auto">
          {trends.map((t, idx) => {
            const maxViews = Math.max(...trends.map(x => x.views), 50);
            const heightPercent = Math.max(12, Math.min(100, (t.views / maxViews) * 100));

            return (
              <div key={idx} className="flex-1 min-w-[32px] flex flex-col items-center gap-1 group">
                <div className="text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.views}
                </div>
                <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden flex flex-col justify-end" style={{ height: `${heightPercent}%` }}>
                  <div className="w-full bg-indigo-500 rounded-t-lg transition-all" style={{ height: '100%' }} />
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-1">
                  {t.display_date}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Dimensional Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-600" />
            So Sánh Hiệu Quả Theo Kênh Tiếp Thị
          </h3>

          {channelComparison.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">Chưa có dữ liệu bài đăng</div>
          ) : (
            <div className="space-y-2.5">
              {channelComparison.map(c => (
                <div key={c.channel_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{c.channel_name}</div>
                    <div className="text-[11px] text-slate-400">{c.channel_type} • {c.posts} tin đăng</div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="font-bold text-slate-800">{(c.views || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">lượt xem</div>
                    </div>
                    <div>
                      <div className="font-bold text-emerald-600">{c.leads || 0}</div>
                      <div className="text-[10px] text-slate-400">leads</div>
                    </div>
                    <div>
                      <div className="font-bold text-indigo-600">{c.conversion_rate || 0}%</div>
                      <div className="text-[10px] text-slate-400">chuyển đổi</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Property Type Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            So Sánh Theo Loại Hình Bất Động Sản
          </h3>

          {propertyComparison.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">Chưa có dữ liệu loại hình</div>
          ) : (
            <div className="space-y-2.5">
              {propertyComparison.map(p => (
                <div key={p.property_type} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{p.label}</div>
                    <div className="text-[11px] text-slate-400">{p.posts} tin đăng trong kho</div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="font-bold text-slate-800">{(p.views || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">lượt xem</div>
                    </div>
                    <div>
                      <div className="font-bold text-emerald-600">{p.leads || 0}</div>
                      <div className="text-[10px] text-slate-400">leads</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Breakdown Table */}
      {errorBreakdown.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Lịch Sử & Phân Loại Lỗi Xuất Bản ({summary.failed || 0} lỗi)
          </h3>
          <div className="divide-y divide-rose-100 text-xs">
            {errorBreakdown.map(e => (
              <div key={e.code} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-rose-900">{e.code}</span>
                  <p className="text-rose-700 text-[11px] mt-0.5">{e.sample_message}</p>
                </div>
                <span className="font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full text-xs">
                  {e.count} lần
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Ghi Nhận Số Liệu Hiệu Quả Thủ Công</h3>
              <button onClick={() => setShowManualModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveManualEntry} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bất động sản (*)</label>
                <select
                  required
                  value={manualForm.listing_id}
                  onChange={(e) => setManualForm({ ...manualForm, listing_id: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="">-- Chọn tin BĐS --</option>
                  {listings.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kênh tiếp thị</label>
                <select
                  value={manualForm.channel_id}
                  onChange={(e) => setManualForm({ ...manualForm, channel_id: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="">-- Chọn kênh đăng tin --</option>
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lượt xem</label>
                  <input
                    type="number"
                    value={manualForm.views}
                    onChange={(e) => setManualForm({ ...manualForm, views: e.target.value })}
                    placeholder="VD: 500"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tương tác</label>
                  <input
                    type="number"
                    value={manualForm.interactions}
                    onChange={(e) => setManualForm({ ...manualForm, interactions: e.target.value })}
                    placeholder="VD: 25"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khách (Leads)</label>
                  <input
                    type="number"
                    value={manualForm.leads_count}
                    onChange={(e) => setManualForm({ ...manualForm, leads_count: e.target.value })}
                    placeholder="VD: 2"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú nguồn dữ liệu</label>
                <textarea
                  rows={2}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Ghi nhận từ bài viết nhóm Facebook hoặc cuộc gọi môi giới..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  {savingManual ? 'Đang lưu...' : 'Lưu Số Liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
