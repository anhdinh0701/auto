import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders, 
  Clock, 
  ShieldCheck, 
  Layers, 
  Share2, 
  Search, 
  Key, 
  RotateCcw,
  Building2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function AIOptimizerView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('headlines'); // 'headlines' | 'rewrite' | 'quality' | 'duplicate' | 'settings'
  const [listings, setListings] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);

  // AI Headlines State
  const [headlines, setHeadlines] = useState([]);
  const [loadingHeadlines, setLoadingHeadlines] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // AI Rewrite State
  const [rewriteChannel, setRewriteChannel] = useState('facebook_page');
  const [rewriteAudience, setRewriteAudience] = useState('dau_tu');
  const [rewrittenContent, setRewrittenContent] = useState('');
  const [rewrittenStats, setRewrittenStats] = useState({ word_count: 0, char_count: 0 });
  const [loadingRewrite, setLoadingRewrite] = useState(false);
  const [copiedRewrite, setCopiedRewrite] = useState(false);

  // Quality Check State
  const [qualityReport, setQualityReport] = useState(null);
  const [loadingQuality, setLoadingQuality] = useState(false);

  // Duplicate & Consistency State
  const [duplicateReport, setDuplicateReport] = useState(null);
  const [consistencyReport, setConsistencyReport] = useState(null);
  const [loadingGuard, setLoadingGuard] = useState(false);

  // Peak Hours State
  const [bestTimeData, setBestTimeData] = useState(null);

  // Settings State
  const [aiSettings, setAiSettings] = useState({ provider: 'openai', model_name: 'gpt-4o-mini', api_key: '', temperature: 0.7, custom_endpoint: '' });
  const [testingAi, setTestingAi] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadListings();
    loadSettings();
    loadBestTime();
  }, []);

  useEffect(() => {
    if (selectedListingId && listings.length > 0) {
      const found = listings.find(l => l.id === selectedListingId);
      setSelectedListing(found || listings[0]);
    }
  }, [selectedListingId, listings]);

  const loadListings = async () => {
    try {
      const data = await api.listings.getAll();
      setListings(data || []);
      if (data && data.length > 0) {
        setSelectedListingId(data[0].id);
        setSelectedListing(data[0]);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách tin BĐS:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await api.ai.getSettings();
      setAiSettings(data || {});
    } catch (err) {
      console.error('Lỗi tải cấu hình AI:', err);
    }
  };

  const loadBestTime = async () => {
    try {
      const data = await api.ai.getBestTime('facebook_page');
      setBestTimeData(data);
    } catch (err) {}
  };

  // 1. Generate Headlines
  const handleGenerateHeadlines = async () => {
    if (!selectedListing) return;
    try {
      setLoadingHeadlines(true);
      const res = await api.ai.generateHeadlines(selectedListing.id, selectedListing);
      setHeadlines(res.headlines || []);
    } catch (err) {
      alert('Lỗi tạo tiêu đề: ' + err.message);
    } finally {
      setLoadingHeadlines(false);
    }
  };

  // 2. Rewrite Description
  const handleRewrite = async () => {
    if (!selectedListing) return;
    try {
      setLoadingRewrite(true);
      const res = await api.ai.rewrite(selectedListing.id, selectedListing, rewriteChannel, rewriteAudience);
      setRewrittenContent(res.content || '');
      setRewrittenStats({ word_count: res.word_count || 0, char_count: res.char_count || 0 });
    } catch (err) {
      alert('Lỗi viết lại mô tả: ' + err.message);
    } finally {
      setLoadingRewrite(false);
    }
  };

  // 3. Quality & Consistency Guard
  const handleRunQualityAudit = async () => {
    if (!selectedListing) return;
    try {
      setLoadingQuality(true);
      const report = await api.ai.checkQuality(selectedListing.title, selectedListing.description, selectedListing);
      setQualityReport(report);
    } catch (err) {
      alert('Lỗi kiểm tra chất lượng: ' + err.message);
    } finally {
      setLoadingQuality(false);
    }
  };

  const handleRunDuplicateAndConsistency = async () => {
    if (!selectedListing) return;
    try {
      setLoadingGuard(true);
      const [dup, cons] = await Promise.all([
        api.ai.checkDuplicate(selectedListing.title, selectedListing.description, selectedListing.id),
        api.ai.checkConsistency(selectedListing.id, selectedListing, selectedListing.title, selectedListing.description)
      ]);
      setDuplicateReport(dup);
      setConsistencyReport(cons);
    } catch (err) {
      alert('Lỗi kiểm tra trùng lặp và thông số: ' + err.message);
    } finally {
      setLoadingGuard(false);
    }
  };

  // Copy helper
  const handleCopyText = async (text, index = null) => {
    try {
      await navigator.clipboard.writeText(text);
      if (index !== null) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        setCopiedRewrite(true);
        setTimeout(() => setCopiedRewrite(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await api.ai.updateSettings(aiSettings);
      alert('Đã lưu cấu hình AI thành công!');
      loadSettings();
    } catch (err) {
      alert('Lỗi lưu cấu hình: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingAi(true);
      setTestResult(null);
      const res = await api.ai.testConnection();
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestingAi(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AI Content Optimization Studio
            </h1>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Tối Ưu Thông Minh
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gợi ý tiêu đề đa góc độ, viết lại mô tả nhắm trúng đối tượng, kiểm tra trùng lặp và tính nhất quán thông số.
          </p>
        </div>

        {/* Selected Listing Picker */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedListingId}
            onChange={(e) => setSelectedListingId(e.target.value)}
            className="text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 max-w-xs truncate focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {listings.map(l => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Property Preview Bar */}
      {selectedListing && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 truncate max-w-md">
              {selectedListing.title}
            </span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {selectedListing.price ? `${selectedListing.price} ${selectedListing.price_unit}` : selectedListing.price_raw_text}
            </span>
            <span className="text-slate-500 font-medium">
              {selectedListing.area ? `${selectedListing.area} m²` : ''} • {[selectedListing.district, selectedListing.province].filter(Boolean).join(', ')}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {selectedListing.bedrooms ? `${selectedListing.bedrooms} PN • ` : ''}{selectedListing.legal_status || 'Pháp lý đầy đủ'}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { id: 'headlines', label: '1. Tiêu đề đa góc độ', icon: FileText },
          { id: 'rewrite', label: '2. Viết lại theo đối tượng', icon: Sparkles },
          { id: 'quality', label: '3. Kiểm tra chất lượng & CTA', icon: CheckCircle2 },
          { id: 'duplicate', label: '4. Kiểm tra trùng lặp & Thông số', icon: ShieldCheck },
          { id: 'settings', label: '5. Khung giờ vàng & Cấu hình AI', icon: Sliders }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: HEADLINES */}
      {activeTab === 'headlines' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Gợi Ý Tiêu Đề Đa Góc Độ (Multi-version Headlines)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tạo 4 phương án tiêu đề khác nhau dựa trên dữ liệu thật, không bịa đặt thông số.
              </p>
            </div>
            <button
              type="button"
              disabled={loadingHeadlines}
              onClick={handleGenerateHeadlines}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${loadingHeadlines ? 'animate-spin' : ''}`} />
              {loadingHeadlines ? 'Đang tạo tiêu đề...' : 'Tạo 4 Phiên Bản Tiêu Đề'}
            </button>
          </div>

          {headlines.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
              Nhấp vào nút <strong className="text-emerald-700">"Tạo 4 Phiên Bản Tiêu Đề"</strong> để AI phân tích thông số và tạo các góc tiếp cận phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {headlines.map((h, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Góc tiếp cận: {h.angle}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(h.title, idx)}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-white px-2 py-1 rounded-lg border border-slate-200"
                    >
                      {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedIndex === idx ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {h.title}
                  </h4>
                  {h.description && (
                    <p className="text-[11px] text-slate-500">{h.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REWRITE DESCRIPTION */}
      {activeTab === 'rewrite' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Viết Lại Mô Tả Theo Kênh & Khách Hàng Mục Tiêu
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động tái cấu trúc nội dung phù hợp phong cách từng nền tảng, không làm sai lệch giá và thông số.
              </p>
            </div>
          </div>

          {/* Configuration controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kênh tiếp thị đích</label>
              <select
                value={rewriteChannel}
                onChange={(e) => setRewriteChannel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-slate-50"
              >
                <option value="facebook_page">Facebook Fanpage (Thu hút, emoji, hashtag)</option>
                <option value="facebook_group">Facebook Group (Cộng đồng, rõ ràng, minh bạch)</option>
                <option value="portal">Cổng BĐS đối tác (Chuẩn mực, gạch đầu dòng, miễn trung gian)</option>
                <option value="google_business">Google Business Profile (Ngắn gọn, định vị)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nhóm khách hàng mục tiêu</label>
              <select
                value={rewriteAudience}
                onChange={(e) => setRewriteAudience(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-slate-50"
              >
                <option value="dau_tu">Nhà đầu tư (Dòng tiền, tiềm năng tăng giá, pháp lý)</option>
                <option value="mua_o">Gia đình mua an cư (Không gian sống, trường học, tiện ích)</option>
                <option value="thue">Khách thuê hoặc kinh doanh (Mặt tiền, lưu lượng)</option>
                <option value="all">Khách hàng đại chúng (Thông tin tổng hợp)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                disabled={loadingRewrite}
                onClick={handleRewrite}
                className="w-full py-2 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className={`w-3.5 h-3.5 ${loadingRewrite ? 'animate-spin' : ''}`} />
                {loadingRewrite ? 'Đang viết lại...' : 'Viết Lại Nội Dung Ngay'}
              </button>
            </div>
          </div>

          {/* Rewritten Content Area */}
          {rewrittenContent ? (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Kết quả viết lại ({rewrittenStats.word_count} từ • {rewrittenStats.char_count} ký tự):
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(rewrittenContent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                >
                  {copiedRewrite ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedRewrite ? 'Đã sao chép!' : 'Sao chép nội dung'}
                </button>
              </div>

              <textarea
                rows={10}
                value={rewrittenContent}
                onChange={(e) => setRewrittenContent(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans leading-relaxed bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
              Chọn kênh đích và nhóm khách hàng mục tiêu, sau đó bấm <strong className="text-indigo-600">"Viết Lại Nội Dung Ngay"</strong>.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUALITY & SPELL CHECK */}
      {activeTab === 'quality' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Kiểm Tra Chất Lượng, Ngữ Pháp & CTA
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Phát hiện từ viết tắt tin nhắn, kiểm tra độ dài tiêu đề, sự hiện diện của SĐT và lời kêu gọi hành động.
              </p>
            </div>
            <button
              type="button"
              disabled={loadingQuality}
              onClick={handleRunQualityAudit}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${loadingQuality ? 'animate-spin' : ''}`} />
              {loadingQuality ? 'Đang thẩm định...' : 'Bắt Đầu Thẩm Định Chất Lượng'}
            </button>
          </div>

          {qualityReport ? (
            <div className="space-y-4 pt-1 text-xs">
              {/* Score Banner */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400">Điểm chất lượng nội dung</span>
                  <div className="text-3xl font-black text-slate-900 mt-0.5">
                    {qualityReport.score} <span className="text-sm font-medium text-slate-400">/ 100</span>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-black ${
                  qualityReport.score >= 80 ? 'bg-emerald-100 text-emerald-800' : (qualityReport.score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                }`}>
                  Xếp loại: {qualityReport.grade}
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Vấn đề cần lưu ý ({qualityReport.issues?.length || 0}):</h4>
                {qualityReport.issues?.length === 0 ? (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-medium">
                    🎉 Tuyệt vời! Không phát hiện lỗi chính tả, viết tắt sai quy cách hay độ dài bất thường.
                  </div>
                ) : (
                  qualityReport.issues.map((iss, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      iss.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' : (iss.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-100 border-slate-200 text-slate-800')
                    }`}>
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{iss.message}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Suggestions */}
              {qualityReport.suggestions?.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <h4 className="font-bold text-slate-800">Gợi ý hoàn thiện thêm:</h4>
                  {qualityReport.suggestions.map((sug, idx) => (
                    <div key={idx} className="p-2.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-200 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
              Bấm <strong className="text-emerald-700">"Bắt Đầu Thẩm Định Chất Lượng"</strong> để kiểm tra tin BĐS đang chọn.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DUPLICATE & CONSISTENCY GUARD */}
      {activeTab === 'duplicate' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Phát Hiện Tin Trùng Lặp & Kiểm Tra Tính Nhất Quán Thông Số
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ngăn chặn spam trùng lặp trên mạng xã hội và đối soát thông số phòng ngủ, diện tích giữa chữ viết và database.
              </p>
            </div>
            <button
              type="button"
              disabled={loadingGuard}
              onClick={handleRunDuplicateAndConsistency}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${loadingGuard ? 'animate-spin' : ''}`} />
              {loadingGuard ? 'Đang rà soát...' : 'Kiểm Tra Trùng Lặp & Tính Nhất Quán'}
            </button>
          </div>

          {duplicateReport && consistencyReport ? (
            <div className="space-y-5 text-xs pt-1">
              {/* Duplicate Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    1. Độ Tương Đồng Với Các Tin Khác Trong Hệ Thống:
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    duplicateReport.is_duplicate ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {duplicateReport.status} ({duplicateReport.highest_similarity}%)
                  </span>
                </div>

                {duplicateReport.matched_listings?.length === 0 ? (
                  <p className="text-slate-500 text-[11px]">Nội dung tin này là độc nhất, không trùng lặp với bất kỳ tin đăng nào trong kho.</p>
                ) : (
                  <div className="space-y-1.5">
                    {duplicateReport.matched_listings.map(m => (
                      <div key={m.listing_id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{m.title}</div>
                          <div className="text-[10px] text-slate-400">{m.location} • {m.property_type}</div>
                        </div>
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {m.similarity_score}% tương đồng
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consistency Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    2. Đối Soát Tính Nhất Quán Giữa Chữ Viết & Thông Số Cấu Trúc:
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    consistencyReport.is_consistent ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {consistencyReport.is_consistent ? '100% Khớp Thông Số' : `Phát hiện ${consistencyReport.inconsistencies_count} điểm lệch`}
                  </span>
                </div>

                {consistencyReport.is_consistent ? (
                  <p className="text-emerald-700 text-[11px] font-medium">
                    ✓ Số phòng ngủ, phòng tắm và diện tích nêu trong mô tả khớp chính xác với thông số lưu trữ.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {consistencyReport.inconsistencies.map((inc, idx) => (
                      <div key={idx} className="p-2.5 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold uppercase tracking-wider text-[10px]">{inc.field}: </span>
                          <span>{inc.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
              Bấm <strong className="text-indigo-600">"Kiểm Tra Trùng Lặp & Tính Nhất Quán"</strong> để rà soát toàn bộ kho dữ liệu.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BEST TIME & AI SETTINGS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Best Time Recommendations */}
          <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Khung Giờ Đăng Hiệu Quả (Thị Trường Việt Nam)
            </h3>
            <p className="text-xs text-slate-500">
              Dựa trên chu kỳ xem tin và tương tác thực tế của người mua và môi giới tại Việt Nam.
            </p>

            <div className="space-y-2 pt-1 text-xs">
              {bestTimeData?.recommended_slots?.map((slot, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {slot.slot}
                    </span>
                    <span className="text-slate-600">{slot.day}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{slot.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Provider Settings */}
          <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                Cấu Hình Nhà Cung Cấp AI (LLM Provider)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hệ thống hỗ trợ OpenAI, Google Gemini hoặc Custom Endpoint. Khóa bí mật luôn được che giấu an toàn trên máy chủ.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nhà cung cấp (Provider)</label>
                <select
                  value={aiSettings.provider || 'openai'}
                  onChange={(e) => setAiSettings({ ...aiSettings, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800"
                >
                  <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                  <option value="gemini">Google Gemini (Gemini 1.5 Pro, Flash)</option>
                  <option value="claude">Anthropic Claude (Claude 3.5 Sonnet)</option>
                  <option value="deepseek">DeepSeek / Custom Endpoint</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên mô hình (Model Name)</label>
                <input
                  type="text"
                  value={aiSettings.model_name || ''}
                  onChange={(e) => setAiSettings({ ...aiSettings, model_name: e.target.value })}
                  placeholder="VD: gpt-4o-mini hoặc gemini-1.5-flash"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Khóa truy cập API (API Key)</label>
                <input
                  type="text"
                  value={aiSettings.api_key || ''}
                  onChange={(e) => setAiSettings({ ...aiSettings, api_key: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Custom Endpoint (Tùy chọn cho proxy hoặc DeepSeek)</label>
                <input
                  type="text"
                  value={aiSettings.custom_endpoint || ''}
                  onChange={(e) => setAiSettings({ ...aiSettings, custom_endpoint: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-mono"
                />
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs ${
                  testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {testResult.message}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  disabled={testingAi}
                  onClick={handleTestConnection}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors"
                >
                  {testingAi ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
                </button>

                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={handleSaveSettings}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  {savingSettings ? 'Đang lưu...' : 'Lưu Cấu Hình AI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
