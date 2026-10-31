import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Database, 
  HardDrive, 
  Cpu, 
  Sliders, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Layers, 
  Play, 
  RefreshCw,
  Lock,
  ExternalLink,
  ChevronRight,
  Server
} from 'lucide-react';
import { api } from '../api';

export default function OperationsCenterView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('lifecycle'); // 'lifecycle' | 'rules' | 'audit'
  const [overview, setOverview] = useState(null);
  const [rules, setRules] = useState([]);
  const [ruleLogs, setRuleLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingAll, setRetryingAll] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [over, rls, rlogs, alogs] = await Promise.all([
        api.operations.getOverview(),
        api.automation.getRules(),
        api.automation.getLogs(30),
        api.operations.getAuditLogs()
      ]);
      setOverview(over);
      setRules(rls || []);
      setRuleLogs(rlogs || []);
      setAuditLogs(alogs || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Operations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId, currentEnabled) => {
    try {
      await api.automation.toggleRule(ruleId, !currentEnabled);
      const updatedRules = await api.automation.getRules();
      setRules(updatedRules || []);
    } catch (err) {
      alert('Không thể chuyển trạng thái quy tắc: ' + err.message);
    }
  };

  const handleTestRule = async (ruleId) => {
    try {
      const res = await api.automation.testRule(ruleId);
      alert(`[Thực thi kiểm thử] ${res.message}`);
      const rlogs = await api.automation.getLogs(30);
      setRuleLogs(rlogs || []);
    } catch (err) {
      alert('Lỗi kiểm thử quy tắc: ' + err.message);
    }
  };

  const handleRetryAllFailed = async () => {
    if (!confirm('Bạn có muốn đưa tất cả tác vụ lỗi vào hàng đợi thử lại?')) return;
    try {
      setRetryingAll(true);
      const res = await api.operations.retryAllFailed();
      alert(res.message);
      loadAllData();
    } catch (err) {
      alert('Lỗi thử lại tác vụ: ' + err.message);
    } finally {
      setRetryingAll(false);
    }
  };

  const health = overview?.health || {};
  const lifecycle = overview?.lifecycle || {};
  const actionable = overview?.actionable_items || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Trung Tâm Điều Hành & Giám Sát Tự Động Hóa
            </h1>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Giai Đoạn 4
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Giám sát toàn diện sức khỏe hệ thống, quy tắc tự động hóa, tác vụ nền và nhật ký kiểm toán bảo mật.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAllData}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Làm mới hệ thống
          </button>
        </div>
      </div>

      {/* System Health Diagnostics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Database Health */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Cơ sở dữ liệu</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-black text-slate-900">SQLite Hoạt Động</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Kích thước: {health.database?.size_mb || 0} MB • data/realestate.db
          </div>
        </div>

        {/* Task Scheduler Heartbeat */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Bộ Lập Lịch Ngầm</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-black text-slate-900">Chu Kỳ 8s Đang Chạy</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Tự động xử lý hàng đợi & lịch hẹn
          </div>
        </div>

        {/* Image Storage Health */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Lưu Trữ Ảnh Gốc</span>
            <HardDrive className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="text-sm font-black text-slate-900">Ổ Đĩa An Toàn</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {health.storage?.files_count || 0} ảnh • {health.storage?.size_mb || 0} MB
          </div>
        </div>

        {/* AI Engine Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Dịch Vụ AI</span>
            <Cpu className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${health.ai_service?.status === 'configured' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-sm font-black text-slate-900">
              {health.ai_service?.status === 'configured' ? 'Sẵn Sàng' : 'Chưa cấu hình API Key'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate">
            {health.ai_service?.provider?.toUpperCase() || 'OPENAI'} • {health.ai_service?.model || 'gpt-4o-mini'}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        {[
          { id: 'lifecycle', label: '1. Vòng đời tin đăng & Giám sát', icon: Layers },
          { id: 'rules', label: '2. Quy tắc tự động hóa (Rules Engine)', icon: Sliders },
          { id: 'audit', label: '3. Nhật ký kiểm toán & Bảo mật (Audit Log)', icon: ShieldCheck }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIFECYCLE & MONITORING */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-6">
          {/* Lifecycle Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Listing Lifecycle */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Vòng Đời Tin Đăng Bất Động Sản (Giai đoạn 1)
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Bản nháp</span>
                  <span className="text-xl font-bold text-slate-800">{lifecycle.listings?.draft || 0}</span>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                  <span className="text-blue-700 block text-[11px]">Đã duyệt nội dung</span>
                  <span className="text-xl font-bold text-blue-700">{lifecycle.listings?.reviewed || 0}</span>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 block text-[11px]">Sẵn sàng đăng</span>
                  <span className="text-xl font-bold text-emerald-700">{lifecycle.listings?.ready || 0}</span>
                </div>
              </div>
            </div>

            {/* Publishing Task Lifecycle */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Trạng Thái Tác Vụ Xuất Bản (Giai đoạn 3)
              </h3>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-blue-700 block text-[10px]">Lên lịch</span>
                  <span className="text-lg font-bold text-blue-700">{lifecycle.scheduled || 0}</span>
                </div>
                <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-200">
                  <span className="text-indigo-700 block text-[10px]">Hàng đợi</span>
                  <span className="text-lg font-bold text-indigo-700">{lifecycle.queued || 0}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 block text-[10px]">Đã đăng</span>
                  <span className="text-lg font-bold text-emerald-700">{lifecycle.published || 0}</span>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-amber-800 block text-[10px]">Đăng tay</span>
                  <span className="text-lg font-bold text-amber-800">{lifecycle.needs_manual || 0}</span>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-rose-700 block text-[10px]">Thất bại</span>
                  <span className="text-lg font-bold text-rose-700">{lifecycle.failed || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Issues Requiring Attention */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Sự Cố Cần Người Dùng Xử Lý & Thử Lại
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các bài viết cần đăng tay lên nhóm hoặc các tác vụ bị gián đoạn do sự cố mạng.
                </p>
              </div>

              {actionable.failed_tasks?.length > 0 && (
                <button
                  type="button"
                  disabled={retryingAll}
                  onClick={handleRetryAllFailed}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retryingAll ? 'animate-spin' : ''}`} />
                  {retryingAll ? 'Đang xử lý...' : 'Thử Lại Tất Cả Tác Vụ Lỗi'}
                </button>
              )}
            </div>

            {/* Tasks requiring manual action */}
            {actionable.manual_tasks?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Chờ đăng thủ công ({actionable.manual_tasks.length}):
                </span>
                <div className="space-y-1.5">
                  {actionable.manual_tasks.map(t => (
                    <div key={t.id} className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{t.title}</div>
                        <div className="text-[11px] text-amber-800">Đích đến: <strong>{t.channel_name}</strong> ({t.channel_type})</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('publishing')}
                        className="px-3 py-1 text-xs font-bold text-amber-900 bg-amber-300 hover:bg-amber-400 rounded-lg transition-colors shadow-xs"
                      >
                        Mở hướng dẫn đăng
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failed tasks */}
            {actionable.failed_tasks?.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Tác vụ thất bại ({actionable.failed_tasks.length}):
                </span>
                <div className="space-y-1.5">
                  {actionable.failed_tasks.map(t => (
                    <div key={t.id} className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{t.title}</div>
                        <div className="text-[11px] text-rose-700 font-mono">[{t.error_code}] {t.error_message}</div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        Thử lần: {t.attempt_count}/{t.max_attempts}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!actionable.manual_tasks?.length && !actionable.failed_tasks?.length && (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                ✓ Hệ thống vận hành hoàn hảo: Không có lỗi hoặc tác vụ cần xử lý gấp.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATION RULES ENGINE */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Rules List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Danh Sách Quy Tắc Tự Động Hóa (Automation Rules)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các quy tắc tự động hóa phản ứng theo sự kiện của hệ thống, hỗ trợ bật/tắt và kiểm thử an toàn.
              </p>
            </div>

            <div className="space-y-3">
              {rules.map(rule => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rule.is_enabled 
                      ? 'bg-slate-50/80 border-slate-200' 
                      : 'bg-slate-100/40 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{rule.name}</span>
                        <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {rule.trigger_event}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{rule.description}</p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-0.5">
                        <span>Đã chạy: <strong>{rule.execution_count}</strong> lần</span>
                        <span>•</span>
                        <span>Lần gần nhất: {rule.last_triggered_at ? new Date(rule.last_triggered_at).toLocaleString('vi-VN') : 'Chưa kích hoạt'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTestRule(rule.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-xs"
                        title="Chạy thử nghiệm quy tắc này ngay lập tức"
                      >
                        <Play className="w-3 h-3 text-emerald-600" />
                        Chạy thử
                      </button>

                      {/* Toggle switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.is_enabled}
                          onChange={() => handleToggleRule(rule.id, rule.is_enabled)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rule Execution History Log */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Lịch Sử Thực Thi Quy Tắc ({ruleLogs.length} lần gần nhất)
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
              {ruleLogs.map(log => (
                <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{log.rule_name || log.rule_id}</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">{log.message}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {log.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ghi nhận mọi thao tác cấu hình, tạo mới, và thực thi quy tắc tự động hóa.
              </p>
            </div>

            {/* Redaction Guarantee Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-slate-700 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              Khóa API & Mật khẩu được che giấu tuyệt đối
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map(a => (
              <div key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{a.action}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {a.entity_type}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{a.details}</p>
                </div>
                <div className="text-slate-400 text-[11px] shrink-0 font-mono">
                  {new Date(a.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
