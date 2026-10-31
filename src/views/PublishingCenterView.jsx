import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  Settings, 
  Search, 
  Filter, 
  PlusCircle, 
  FileText, 
  Eye, 
  XCircle, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Radio,
  Zap,
  Play,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { api } from '../api';
import PropertySelector from '../modules/publishing/PropertySelector';
import ChannelSelector from '../modules/publishing/ChannelSelector';
import ChannelContentEditor from '../modules/publishing/ChannelContentEditor';
import PublishingPreview from '../modules/publishing/PublishingPreview';
import ManualPublishModal from '../modules/publishing/ManualPublishModal';
import TaskDetailModal from '../modules/publishing/TaskDetailModal';
import ConnectorsConfigModal from '../modules/publishing/ConnectorsConfigModal';

export default function PublishingCenterView() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('agent'); // 'agent' | 'workspace' | 'history' | 'worker_logs'
  
  // Phase 4 Dedicated Agent states
  const [postingSchedules, setPostingSchedules] = useState([]);
  const [agentStatus, setAgentStatus] = useState(null);
  const [postingScheduleId, setPostingScheduleId] = useState(null);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState('all');

  // Data States
  const [listings, setListings] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [selectedChannelIds, setSelectedChannelIds] = useState([]);
  const [channelsData, setChannelsData] = useState([]);
  const [activeEditorChannelId, setActiveEditorChannelId] = useState('');
  const [customizations, setCustomizations] = useState({});
  const [scheduleTime, setScheduleTime] = useState('');
  
  // History & Tasks States
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, scheduled: 0, queued: 0, needs_manual: 0, failed: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [workerStatus, setWorkerStatus] = useState(null);
  
  // Connectors
  const [connectors, setConnectors] = useState([]);

  // Modals
  const [activeModalTask, setActiveModalTask] = useState(null);
  const [activeManualTask, setActiveManualTask] = useState(null);
  const [showConnectorsModal, setShowConnectorsModal] = useState(false);

  const loadWorkerAndLogs = async () => {
    try {
      const [workerRes, logsRes] = await Promise.all([
        fetch('http://localhost:3001/api/publishing/worker-status').then(r => r.json()),
        fetch('http://localhost:3001/api/publishing/execution-logs?limit=40').then(r => r.json())
      ]);
      if (workerRes.success) setWorkerStatus(workerRes.worker);
      if (logsRes.success) setExecutionLogs(logsRes.logs || []);
    } catch (e) {
      console.error('Lỗi tải nhật ký worker:', e);
    }
  };

  const loadAgentAndSchedules = async () => {
    try {
      setLoadingAgent(true);
      const [schedRes, agentRes] = await Promise.all([
        fetch('http://localhost:3001/api/posting-schedules').then(r => r.json()),
        fetch('http://localhost:3001/api/publishing/agent-status').then(r => r.json())
      ]);
      if (schedRes.success) setPostingSchedules(schedRes.data || []);
      if (agentRes.success) setAgentStatus(agentRes);
    } catch (e) {
      console.warn('Lỗi tải agent & schedules:', e);
    } finally {
      setLoadingAgent(false);
    }
  };

  const handlePostNow = async (scheduleId) => {
    setPostingScheduleId(scheduleId);
    try {
      addToast('Dedicated Posting Agent đang mở kết nối CDP qua cổng 9222...', 'info');
      const res = await fetch(`http://localhost:3001/api/publishing/post-now/${scheduleId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Đăng tin thành công vào nhóm Facebook!', 'success');
        await loadAgentAndSchedules();
        loadTasks();
      } else {
        addToast(data.error || 'Đăng bài thất bại.', 'error');
        await loadAgentAndSchedules();
      }
    } catch (err) {
      addToast('Lỗi: ' + err.message, 'error');
    } finally {
      setPostingScheduleId(null);
    }
  };

  useEffect(() => {
    loadInitialData();
    loadTasks();
    loadWorkerAndLogs();
    loadAgentAndSchedules();
  }, []);

  const loadInitialData = async () => {
    try {
      const [listRes, chanRes, connRes] = await Promise.all([
        api.listings.getAll(),
        api.channels.getAll(),
        api.connectors.getAll()
      ]);
      setListings(listRes || []);
      setChannelsData(chanRes || []);
      setConnectors(connRes || []);

      if (listRes && listRes.length > 0) {
        setSelectedListingId(listRes[0].id);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu ban đầu:', err);
    }
  };

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);
      const [tasksRes, statsRes] = await Promise.all([
        api.publishing.getTasks({
          status: statusFilter,
          search: historySearch
        }),
        api.publishing.getStats()
      ]);
      setTasks(tasksRes.tasks || []);
      setStats(statsRes || {});
    } catch (err) {
      console.error('Lỗi tải lịch sử tác vụ:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // When listing changes, sync customization defaults
  useEffect(() => {
    if (!selectedListingId) return;
    const listing = listings.find(l => l.id === selectedListingId);
    if (!listing) return;

    const photos = Array.isArray(listing.photos)
      ? listing.photos
      : (typeof listing.photos === 'string' ? JSON.parse(listing.photos || '[]') : []);

    // Initialize customization for any currently selected channels that don't have custom data
    setCustomizations(prev => {
      const next = { ...prev };
      selectedChannelIds.forEach(cId => {
        if (!next[cId] || !next[cId].is_customized) {
          next[cId] = {
            title: listing.title || '',
            description: listing.description || '',
            photos: photos,
            contact_info: listing.contact_info || '',
            cta: 'Liên hệ ngay để xem nhà thực tế!',
            hashtags: `#bds #${listing.property_type || 'nhadat'} #${listing.city ? listing.city.replace(/\s+/g, '') : 'vietnam'}`,
            is_customized: false
          };
        }
      });
      return next;
    });
  }, [selectedListingId, listings, selectedChannelIds]);

  const selectedListing = listings.find(l => l.id === selectedListingId) || listings[0] || null;
  const selectedChannels = channelsData.filter(c => selectedChannelIds.includes(c.id));

  // Channel toggling
  const handleToggleChannel = (channelId) => {
    setSelectedChannelIds(prev => {
      const exists = prev.includes(channelId);
      const updated = exists ? prev.filter(id => id !== channelId) : [...prev, channelId];
      if (!exists && (!activeEditorChannelId || !updated.includes(activeEditorChannelId))) {
        setActiveEditorChannelId(channelId);
      }
      return updated;
    });
  };

  const handleSelectMultipleChannels = (ids) => {
    setSelectedChannelIds(ids);
    if (ids.length > 0 && (!activeEditorChannelId || !ids.includes(activeEditorChannelId))) {
      setActiveEditorChannelId(ids[0]);
    }
  };

  const handleCustomizationChange = (channelId, data) => {
    setCustomizations(prev => ({
      ...prev,
      [channelId]: data
    }));
  };

  // Execution actions
  const handleExecutePublishing = async (actionType) => {
    if (!selectedListingId) {
      alert('Vui lòng chọn bất động sản cần đăng tin!');
      return;
    }
    if (selectedChannelIds.length === 0) {
      alert('Vui lòng chọn ít nhất một kênh tiếp thị đích!');
      return;
    }

    // Schedule validation
    if (actionType === 'schedule') {
      if (!scheduleTime) {
        alert('Vui lòng chọn thời gian hẹn giờ xuất bản!');
        return;
      }
      const targetTime = new Date(scheduleTime).getTime();
      if (isNaN(targetTime) || targetTime <= Date.now()) {
        alert('Thời gian hẹn giờ phải ở tương lai!');
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await api.publishing.createTasks({
        listing_id: selectedListingId,
        channel_ids: selectedChannelIds,
        action: actionType,
        scheduled_for: actionType === 'schedule' ? new Date(scheduleTime).toISOString() : null,
        customizations: customizations
      });

      alert(res.message || 'Tác vụ đã được thiết lập thành công!');

      // Check if any task needs manual action immediately
      const manualTasks = (res.tasks || []).filter(t => t.status === 'needs_manual_action');
      if (manualTasks.length > 0) {
        setActiveManualTask(manualTasks[0]);
      }

      // Switch to history tab and refresh
      setActiveTab('history');
      await loadTasks();
    } catch (err) {
      alert('Không thể tạo tác vụ đăng tin: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Send className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Trung Tâm Đăng Tin & Tự Động Hóa
            </h1>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Giai Đoạn 3
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Điều phối đăng bài đa kênh, hàng đợi tự động, hướng dẫn đăng tin thủ công và bảo mật xác thực nền tảng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowConnectorsModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Cấu hình Kết nối & API
          </button>

          <button
            type="button"
            onClick={() => {
              loadInitialData();
              loadTasks();
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Tổng tác vụ</div>
          <div className="text-xl font-black text-slate-900 mt-1">{stats.total || 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã xuất bản
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{stats.published || 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-700 uppercase flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Đã lên lịch
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">{stats.scheduled || 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-800 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Chờ đăng tay
          </div>
          <div className="text-xl font-black text-amber-800 mt-1">{stats.needs_manual || 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-700 uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Hàng đợi
          </div>
          <div className="text-xl font-black text-indigo-700 mt-1">{stats.queued || 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 uppercase flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Thất bại
          </div>
          <div className="text-xl font-black text-rose-700 mt-1">{stats.failed || 0}</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('agent');
            loadAgentAndSchedules();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'agent'
              ? 'bg-gradient-to-r from-indigo-700 to-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-4 h-4 text-cyan-300" />
          Dedicated Posting Agent (Chrome 24/24)
          {postingSchedules.filter(s => s.status === 'Pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[10px]">
              {postingSchedules.filter(s => s.status === 'Pending').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'workspace'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          Không Gian Xuất Bản (Workspace)
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('history');
            loadTasks();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Hàng Đợi & Tác Vụ ({stats.total || 0})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('worker_logs');
            loadWorkerAndLogs();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'worker_logs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Nhật Ký Thực Thi Worker ({executionLogs.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 0: DEDICATED POSTING AGENT (CHROME STATION 24/24)     */}
      {/* ========================================================= */}
      {activeTab === 'agent' && (
        <div className="space-y-6">
          {/* Top Station Status Banner */}
          <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-700 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                  <Radio className="w-6 h-6 text-cyan-300 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>Dedicated Posting Agent (Chrome 24/24)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-black bg-indigo-100 text-indigo-800 uppercase">
                      Chu trình 60s
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tác vụ quét ngầm mỗi 60 giây, tự động kết nối qua Playwright CDP tới Trạm Chrome trên Windows và đăng bài như người thật theo đúng 6 bước.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadAgentAndSchedules}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${loadingAgent ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                agentStatus?.station?.isOnline
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Trạng Thái Trạm Chrome</span>
                <div className="flex items-center gap-1.5 font-extrabold text-sm mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${agentStatus?.station?.isOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                  <span>{agentStatus?.station?.isOnline ? 'ONLINE & SẴN SÀNG' : 'OFFLINE'}</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Port: 9222 (127.0.0.1)
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lịch Chờ Đăng (Pending)</span>
                <div className="font-extrabold text-amber-700 text-xl mt-1">
                  {postingSchedules.filter(s => s.status === 'Pending').length}
                </div>
                <span className="text-[10px] text-slate-400">Sẵn sàng xuất bản</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Đã Xuất Bản Thành Công</span>
                <div className="font-extrabold text-emerald-700 text-xl mt-1">
                  {postingSchedules.filter(s => s.status === 'Published').length}
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">Đã xác nhận trên Facebook</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Thất Bại (Cần Review)</span>
                <div className="font-extrabold text-rose-700 text-xl mt-1">
                  {postingSchedules.filter(s => s.status === 'Failed').length}
                </div>
                <span className="text-[10px] text-slate-400">Có ảnh screenshot lỗi</span>
              </div>
            </div>
          </div>

          {/* Schedules Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Danh Sách Lịch Đăng Của Dedicated Agent</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tất cả các bản ghi có trạng thái <b>Pending</b> sẽ được Agent tự động xuất bản đúng thời điểm. Bạn có thể bấm <b>"Đăng thử ngay lập tức"</b> để kiểm tra trực tiếp.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={scheduleStatusFilter}
                  onChange={(e) => setScheduleStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-indigo-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Pending">Chờ đăng (Pending)</option>
                  <option value="Published">Đã đăng (Published)</option>
                  <option value="Failed">Thất bại (Failed)</option>
                </select>
              </div>
            </div>

            {postingSchedules.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Chưa có lịch đăng nào trong bảng PostingSchedules. Hãy vào tab "Group & Time-Slot Intelligence" để tạo lịch đăng thông minh bằng Groq AI.
              </div>
            ) : (
              <div className="space-y-3">
                {postingSchedules
                  .filter(s => scheduleStatusFilter === 'all' || s.status === scheduleStatusFilter)
                  .map(schedule => {
                    const isPosting = postingScheduleId === schedule.id;

                    return (
                      <div
                        key={schedule.id}
                        className={`p-4 rounded-xl border transition-all ${
                          schedule.status === 'Published'
                            ? 'bg-emerald-50/20 border-emerald-200'
                            : schedule.status === 'Failed'
                            ? 'bg-rose-50/20 border-rose-200'
                            : 'bg-white border-slate-200 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                {schedule.id}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">
                                {schedule.property_title || schedule.property_id}
                              </span>
                              {schedule.group_city && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {schedule.group_city}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                              <span className="flex items-center gap-1 font-semibold text-indigo-700">
                                <span>Nhóm:</span>
                                <a
                                  href={schedule.group_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:underline flex items-center gap-1 text-indigo-600 truncate max-w-xs"
                                >
                                  {schedule.group_name || schedule.group_url}
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Khung giờ vàng: <b>{schedule.target_time_slot || '19:30'}</b></span>
                                {schedule.jitter_offset_minutes > 0 && (
                                  <span className="text-teal-700 font-bold font-mono">
                                    (+{schedule.jitter_offset_minutes}p jitter)
                                  </span>
                                )}
                              </span>
                              <span>•</span>
                              <span>Kích hoạt: <b>{new Date(schedule.scheduled_time).toLocaleString('vi-VN')}</b></span>
                            </div>

                            {/* Spun content / Opening hook preview */}
                            {schedule.opening_hook && (
                              <p className="text-xs text-slate-700 italic bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                                "{schedule.opening_hook}"
                              </p>
                            )}

                            {schedule.error_log && (
                              <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 font-medium">
                                ⛔ Lỗi: {schedule.error_log}
                              </p>
                            )}
                          </div>

                          {/* Action Button & Status Badge */}
                          <div className="flex items-center gap-3 shrink-0">
                            {schedule.status === 'Published' && (
                              <span className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-100 text-emerald-800 flex items-center gap-1.5 border border-emerald-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã Đăng Thành Công
                              </span>
                            )}

                            {schedule.status === 'In_Progress' && (
                              <span className="px-3 py-1.5 rounded-xl font-bold text-xs bg-blue-100 text-blue-800 flex items-center gap-1.5 border border-blue-200 animate-pulse">
                                <RotateCcw className="w-4 h-4 animate-spin text-blue-600" /> Đang Tiến Hành Đăng...
                              </span>
                            )}

                            {schedule.status === 'Failed' && (
                              <span className="px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-100 text-rose-800 flex items-center gap-1.5 border border-rose-200">
                                <XCircle className="w-4 h-4 text-rose-600" /> Thất Bại
                              </span>
                            )}

                            {schedule.status === 'Pending' && (
                              <span className="px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-100 text-amber-800 flex items-center gap-1.5 border border-amber-200">
                                <Clock className="w-4 h-4 text-amber-600" /> Đang Chờ Đến Giờ
                              </span>
                            )}

                            {/* "Đăng thử ngay lập tức" Button */}
                            <button
                              onClick={() => handlePostNow(schedule.id)}
                              disabled={isPosting}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-98"
                              title="Kích hoạt Agent chạy 6 bước Playwright qua CDP trên Trạm Chrome ngay lập tức"
                            >
                              {isPosting ? (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Agent đang đăng...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Đăng thử ngay lập tức</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: WORKSPACE */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          {/* Step 1: Select Listing */}
          <PropertySelector
            listings={listings}
            selectedListingId={selectedListingId}
            onSelectListing={(id) => setSelectedListingId(id)}
          />

          {/* Step 2: Select Channels */}
          <ChannelSelector
            selectedChannelIds={selectedChannelIds}
            onToggleChannel={handleToggleChannel}
            onSelectMultiple={handleSelectMultipleChannels}
          />

          {/* Step 3: Customize per Channel */}
          {selectedChannels.length > 0 && (
            <ChannelContentEditor
              selectedChannels={selectedChannels}
              activeChannelId={activeEditorChannelId || selectedChannels[0]?.id}
              onSelectActiveChannel={(cId) => setActiveEditorChannelId(cId)}
              customizations={customizations}
              onChangeCustomization={handleCustomizationChange}
              originalListing={selectedListing}
            />
          )}

          {/* Step 4: Preview */}
          {selectedChannels.length > 0 && (
            <PublishingPreview
              selectedChannels={selectedChannels}
              customizations={customizations}
              originalListing={selectedListing}
            />
          )}

          {/* Action Execution Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sticky bottom-4 z-20 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Bước 5: Chọn Phương Thức Xuất Bản
                </h4>
                <p className="text-[11px] text-slate-500">
                  Hệ thống tự động điều hướng: Kênh API sẽ xuất bản trực tiếp, kênh Facebook Group sẽ chuyển sang bảng hướng dẫn đăng thủ công.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Draft Button */}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleExecutePublishing('draft')}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
                >
                  Lưu bản nháp
                </button>

                {/* Submit for Approval */}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleExecutePublishing('submit_for_approval')}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200"
                >
                  Gửi phê duyệt nội dung
                </button>

                {/* Schedule For Later */}
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleExecutePublishing('schedule')}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Lên lịch hẹn giờ
                  </button>
                </div>

                {/* Publish Now */}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleExecutePublishing('publish_now')}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Đang xử lý...' : 'Xuất Bản Ngay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORKER ENGINE STATUS & DETAILED EXECUTION LOGS */}
      {activeTab === 'worker_logs' && (
        <div className="space-y-6">
          {/* Worker Status Overview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">Background Worker Engine</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                      ● RUNNING
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Node ID: {workerStatus?.worker_id || 'Worker-Node-01'} • Chu kỳ quét: 5s • Múi giờ: Asia/Ho_Chi_Minh
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadWorkerAndLogs}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm mới nhật ký</span>
              </button>
            </div>

            {/* Queue breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Đang chạy / Kết nối</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{workerStatus?.queue_stats?.active_count || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Hàng đợi chờ</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{workerStatus?.queue_stats?.pending_count || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Đã hẹn giờ</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{workerStatus?.queue_stats?.scheduled_count || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Chờ đăng tay</span>
                <p className="text-lg font-bold text-amber-700 mt-0.5">{workerStatus?.queue_stats?.manual_action_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Execution Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">
                Nhật ký thực thi tác vụ chi tiết (Audit & Traceability)
              </h4>
              <span className="text-xs text-slate-400">Hiển thị {executionLogs.length} sự kiện gần nhất</span>
            </div>

            {executionLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Chưa có bản ghi thực thi nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Mã Job</th>
                      <th className="py-2.5 px-3">Hành động</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3">Thời lượng</th>
                      <th className="py-2.5 px-3">Chi tiết / Lý do</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {executionLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-600">
                          {log.job_id?.slice(0, 8)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'PUBLISHED' || log.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : (log.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700')
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {log.duration_ms || 0}ms
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-md truncate" title={log.details}>
                          {log.details || log.error_code || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUEUE & HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Lọc trạng thái:
              </span>
              {[
                { id: '', label: 'Tất cả' },
                { id: 'published', label: 'Đã xuất bản' },
                { id: 'needs_manual_action', label: 'Chờ đăng tay' },
                { id: 'scheduled', label: 'Đã lên lịch' },
                { id: 'queued', label: 'Hàng đợi' },
                { id: 'failed', label: 'Thất bại' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(f.id);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    statusFilter === f.id
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadTasks()}
                placeholder="Tìm tin BĐS hoặc kênh..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Tasks Table */}
          {loadingTasks ? (
            <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách tác vụ...</div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
              Không có tác vụ nào phù hợp với bộ lọc. Hãy tạo tác vụ mới ở tab <span className="font-bold text-emerald-600">Không Gian Xuất Bản</span>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Mã tác vụ</th>
                    <th className="py-3 px-3">Bất động sản</th>
                    <th className="py-3 px-3">Kênh đích</th>
                    <th className="py-3 px-3">Ảnh AI duyệt</th>
                    <th className="py-3 px-3">Địa lý</th>
                    <th className="py-3 px-3">Worker State</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    <th className="py-3 px-3">Thời gian</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map(task => {
                    const approvedCount = (task.approved_photo_ids || []).length;
                    const locStatus = task.location_verification_status || 'UNVERIFIED';

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-slate-500">
                          #{task.id.slice(0, 8)}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 max-w-[180px] truncate">
                          {task.listing_title || task.listing_id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{task.channel_name}</div>
                          <div className="text-[11px] text-slate-400">{task.channel_type}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                            {approvedCount} ảnh
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {locStatus === 'VERIFIED' && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              ✓ VERIFIED
                            </span>
                          )}
                          {locStatus === 'WARNING' && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              ⚠️ WARNING
                            </span>
                          )}
                          {locStatus === 'NEEDS_REVIEW' && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                              🚨 NEEDS_REVIEW
                            </span>
                          )}
                          {locStatus === 'UNVERIFIED' && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              UNVERIFIED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                            {task.worker_state || 'PENDING'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {task.status === 'published' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Đã xuất bản
                            </span>
                          )}
                          {task.status === 'needs_manual_action' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3" /> Chờ đăng tay
                            </span>
                          )}
                          {task.status === 'scheduled' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Calendar className="w-3 h-3" /> Đã lên lịch
                            </span>
                          )}
                          {['queued', 'publishing'].includes(task.status) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Clock className="w-3 h-3 animate-spin" /> Đang xử lý
                            </span>
                          )}
                          {task.status === 'failed' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" /> Thất bại
                            </span>
                          )}
                          {task.status === 'cancelled' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                              Đã hủy
                            </span>
                          )}
                          {task.status === 'draft' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                              Bản nháp
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-500">
                          {task.published_at 
                            ? new Date(task.published_at).toLocaleString('vi-VN')
                            : (task.scheduled_for ? new Date(task.scheduled_for).toLocaleString('vi-VN') : new Date(task.created_at).toLocaleString('vi-VN'))}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {task.status === 'needs_manual_action' && (
                              <button
                                type="button"
                                onClick={() => setActiveManualTask(task)}
                                className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors shadow-xs"
                                title="Mở hướng dẫn đăng bài cho Facebook Groups hoặc diễn đàn"
                              >
                                Đăng ngay
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setActiveModalTask(task)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              Chi tiết
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
      )}

      {/* TAB 3: WORKER ENGINE STATUS & DETAILED EXECUTION LOGS */}
      {activeTab === 'worker_logs' && (
        <div className="space-y-6">
          {/* Worker Status Overview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">Background Worker Engine</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                      ● RUNNING
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Node ID: {workerStatus?.worker_id || 'Worker-Node-01'} • Chu kỳ quét: 5s • Múi giờ: Asia/Ho_Chi_Minh
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadWorkerAndLogs}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm mới nhật ký</span>
              </button>
            </div>

            {/* Queue breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Đang chạy / Kết nối</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{workerStatus?.queue_stats?.active_count || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Hàng đợi chờ</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{workerStatus?.queue_stats?.pending_count || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Đã hẹn giờ</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{workerStatus?.queue_stats?.scheduled_count || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Chờ đăng tay</span>
                <p className="text-lg font-bold text-amber-700 mt-0.5">{workerStatus?.queue_stats?.manual_action_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Execution Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">
                Nhật ký thực thi tác vụ chi tiết (Audit & Traceability)
              </h4>
              <span className="text-xs text-slate-400">Hiển thị {executionLogs.length} sự kiện gần nhất</span>
            </div>

            {executionLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Chưa có bản ghi thực thi nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Mã Job</th>
                      <th className="py-2.5 px-3">Hành động</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3">Thời lượng</th>
                      <th className="py-2.5 px-3">Chi tiết / Lý do</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {executionLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-600">
                          {log.job_id?.slice(0, 8)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'PUBLISHED' || log.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : (log.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700')
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {log.duration_ms || 0}ms
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-md truncate" title={log.details}>
                          {log.details || log.error_code || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModalTask && (
        <TaskDetailModal
          task={activeModalTask}
          onClose={() => setActiveModalTask(null)}
          onRefresh={loadTasks}
          onOpenManualModal={(t) => setActiveManualTask(t)}
        />
      )}

      {activeManualTask && (
        <ManualPublishModal
          task={activeManualTask}
          onClose={() => setActiveManualTask(null)}
          onSuccess={loadTasks}
        />
      )}

      {showConnectorsModal && (
        <ConnectorsConfigModal
          onClose={() => {
            setShowConnectorsModal(false);
            loadInitialData();
          }}
        />
      )}
    </div>
  );
}
