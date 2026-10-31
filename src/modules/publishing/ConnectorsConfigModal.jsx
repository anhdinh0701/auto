import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Send, 
  Lock, 
  RefreshCw,
  Share2,
  Building,
  Globe
} from 'lucide-react';
import { api } from '../../api';

export default function ConnectorsConfigModal({ onClose }) {
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConnectorId, setActiveConnectorId] = useState('facebook_page');
  const [formData, setFormData] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      setLoading(true);
      const data = await api.connectors.getAll();
      setConnectors(data);
      if (data.length > 0) {
        const current = data.find(c => c.id === activeConnectorId) || data[0];
        setActiveConnectorId(current.id);
        setFormData(current.config || {});
      }
    } catch (err) {
      console.error('Lỗi tải cấu hình kết nối:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConnector = (conn) => {
    setActiveConnectorId(conn.id);
    setFormData(conn.config || {});
    setTestResult(null);
  };

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.connectors.update(activeConnectorId, {
        config: formData,
        is_active: 1
      });
      alert('Đã lưu cấu hình kết nối an toàn trên máy chủ!');
      await loadConnectors();
    } catch (err) {
      alert('Không thể lưu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.connectors.test(activeConnectorId);
      setTestResult(res);
      await loadConnectors();
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message
      });
    } finally {
      setTesting(false);
    }
  };

  const activeConnector = connectors.find(c => c.id === activeConnectorId);

  const getConnectorIcon = (id) => {
    switch (id) {
      case 'facebook_page':
        return <Share2 className="w-5 h-5 text-blue-600" />;
      case 'batdongsan_portal':
        return <Building className="w-5 h-5 text-emerald-600" />;
      case 'google_business':
        return <Globe className="w-5 h-5 text-sky-600" />;
      default:
        return <Key className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">Quản Lý Khóa & Cấu Hình Kết Nối API</h3>
              <p className="text-xs text-slate-400">
                Lưu trữ bảo mật trên máy chủ — Mã khóa nhạy cảm luôn được che giấu (Redacted).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
          {/* Connector Sidebar */}
          <div className="md:col-span-4 bg-slate-50 p-4 border-r border-slate-200 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Các kết nối hỗ trợ
            </div>
            {loading ? (
              <div className="text-xs text-slate-400 py-4 text-center">Đang tải...</div>
            ) : (
              connectors.map(c => {
                const isSelected = c.id === activeConnectorId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectConnector(c)}
                    className={`w-full text-left p-3 rounded-xl transition-all border flex items-center gap-3 ${
                      isSelected 
                        ? 'bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-500' 
                        : 'bg-transparent border-transparent hover:bg-slate-200/60'
                    }`}
                  >
                    <div className="p-2 bg-slate-100 rounded-lg">
                      {getConnectorIcon(c.id)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{c.name}</div>
                      <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                        {c.is_configured ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đã cấu hình
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            Chưa cấu hình
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Form Content */}
          <div className="md:col-span-8 p-5 space-y-4">
            {activeConnector ? (
              <>
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900">{activeConnector.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeConnector.id === 'facebook_page' && 'Đăng bài tự động lên Fanpage Facebook qua Meta Graph API v19+ chính thức.'}
                    {activeConnector.id === 'batdongsan_portal' && 'Tích hợp đăng tin đồng bộ qua API cổng đối tác hoặc Webhook.'}
                    {activeConnector.id === 'google_business' && 'Cập nhật tin bài địa phương lên hồ sơ doanh nghiệp Google My Business.'}
                  </p>
                </div>

                {/* Secret Warning Alert */}
                <div className="flex items-center gap-2 p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Mọi khóa API và Token được lưu trong bảng SQLite mã hóa máy chủ và không bao giờ gửi nguyên văn về trình duyệt.
                  </span>
                </div>

                {/* Dynamic Inputs according to connector */}
                <div className="space-y-3">
                  {activeConnector.id === 'facebook_page' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Page ID (Facebook Page ID)
                        </label>
                        <input
                          type="text"
                          value={formData.page_id || ''}
                          onChange={(e) => handleFieldChange('page_id', e.target.value)}
                          placeholder="VD: 10482910481928"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Page Access Token (Mã truy cập trang)
                        </label>
                        <input
                          type="text"
                          value={formData.access_token || ''}
                          onChange={(e) => handleFieldChange('access_token', e.target.value)}
                          placeholder="EAABw..."
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Meta App ID (Tùy chọn)
                        </label>
                        <input
                          type="text"
                          value={formData.app_id || ''}
                          onChange={(e) => handleFieldChange('app_id', e.target.value)}
                          placeholder="VD: 98127391823"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </>
                  )}

                  {activeConnector.id === 'batdongsan_portal' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Endpoint API / Webhook Cổng BĐS
                        </label>
                        <input
                          type="text"
                          value={formData.api_endpoint || ''}
                          onChange={(e) => handleFieldChange('api_endpoint', e.target.value)}
                          placeholder="https://api.batdongsan.vn/v1/listings"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          API Key / Bearer Token
                        </label>
                        <input
                          type="text"
                          value={formData.api_key || ''}
                          onChange={(e) => handleFieldChange('api_key', e.target.value)}
                          placeholder="bds_sec_..."
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mã Nhà Môi Giới (Broker ID)
                        </label>
                        <input
                          type="text"
                          value={formData.broker_id || ''}
                          onChange={(e) => handleFieldChange('broker_id', e.target.value)}
                          placeholder="MG-88992"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </>
                  )}

                  {activeConnector.id === 'google_business' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Location ID (Mã chi nhánh Google)
                        </label>
                        <input
                          type="text"
                          value={formData.location_id || ''}
                          onChange={(e) => handleFieldChange('location_id', e.target.value)}
                          placeholder="accounts/123/locations/456"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          OAuth2 Access Token
                        </label>
                        <input
                          type="text"
                          value={formData.access_token || ''}
                          onChange={(e) => handleFieldChange('access_token', e.target.value)}
                          placeholder="ya29.a0..."
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Test Result Display */}
                {testResult && (
                  <div className={`p-3 rounded-xl border text-xs ${
                    testResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                      {testResult.message || (testResult.success ? 'Kiểm tra kết nối thành công!' : 'Kiểm tra thất bại!')}
                    </div>
                    {testResult.error && (
                      <p className="mt-1 text-[11px] text-rose-700">{testResult.error}</p>
                    )}
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={testing}
                    onClick={handleTest}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-300"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    {testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối (Test)'}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
