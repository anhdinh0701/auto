import React, { useState, useEffect } from 'react';
import {
  Compass,
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  Download,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Shield,
  Layers,
  Search,
  Filter,
  BarChart2,
  ExternalLink,
  ChevronRight,
  Info,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  RefreshCw,
  Shuffle,
  Eye,
  Check,
  Building2,
  MapPin
} from 'lucide-react';
import { useToast } from '../components/Toast';

export default function GroupIntelligenceView() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('smart-scheduler'); // 'smart-scheduler' | 'target-groups' | 'health' | 'heatmap'
  
  // Channels & Heatmap states
  const [channelsOverview, setChannelsOverview] = useState([]);
  const [heatmapMatrix, setHeatmapMatrix] = useState([]);
  const [heatmapMetric, setHeatmapMetric] = useState('engagement');
  const [selectedChannelHealth, setSelectedChannelHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Target Groups states (Phase 3)
  const [targetGroups, setTargetGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({
    group_name: '',
    group_url: '',
    target_city: 'Hà Nội',
    target_district: '',
    target_property_type: 'can_ho',
    active_score: 8.5,
    approval_latency_minutes: 15,
    trained_time_slots: '["08:30", "11:45", "19:30", "21:00"]',
    is_active: 1
  });

  // Smart Scheduler states (Phase 3)
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [hardcheckData, setHardcheckData] = useState(null);
  const [smartScheduleResult, setSmartScheduleResult] = useState(null);
  const [postingSchedules, setPostingSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [expandedSpunId, setExpandedSpunId] = useState(null);

  useEffect(() => {
    fetchTargetGroups();
    fetchProperties();
    fetchPostingSchedules();
    fetchChannelsHealth();
    fetchHeatmap();
  }, []);

  // ==================== API FETCHERS ==================== //

  const fetchTargetGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await fetch('http://localhost:3001/api/intelligence/target-groups');
      const data = await res.json();
      if (data.success) {
        setTargetGroups(data.data || []);
      }
    } catch (err) {
      addToast('Lỗi tải danh sách nhóm mục tiêu: ' + err.message, 'error');
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/core/properties');
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setProperties(data.data);
        if (!selectedPropertyId) {
          setSelectedPropertyId(data.data[0].id);
          runHardcheckPreview(data.data[0].id);
        }
      } else {
        // Fallback to listings
        const resList = await fetch('http://localhost:3001/api/listings?limit=20');
        const dataList = await resList.json();
        if (dataList.listings) {
          const listMapped = dataList.listings.map(l => ({ ...l, city: l.province }));
          setProperties(listMapped);
          if (listMapped.length > 0 && !selectedPropertyId) {
            setSelectedPropertyId(listMapped[0].id);
            runHardcheckPreview(listMapped[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch properties list:', err);
    }
  };

  const fetchPostingSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const res = await fetch('http://localhost:3001/api/intelligence/posting-schedules');
      const data = await res.json();
      if (data.success) {
        setPostingSchedules(data.data || []);
      }
    } catch (err) {
      console.warn('Could not fetch posting schedules:', err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const fetchChannelsHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/intelligence/channels-health-overview');
      const data = await res.json();
      if (data.success) {
        setChannelsOverview(data.data || []);
      }
    } catch (err) {
      addToast('Lỗi khi tải dữ liệu kênh: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHeatmap = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/intelligence/time-slot-heatmap');
      const data = await res.json();
      if (data.success) {
        setHeatmapMatrix(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadChannelDetail = async (channelId) => {
    try {
      const res = await fetch(`http://localhost:3001/api/intelligence/channels/${channelId}/health`);
      const data = await res.json();
      if (data.success) {
        setSelectedChannelHealth(data.data);
      }
    } catch (err) {
      addToast('Lỗi tải chi tiết: ' + err.message, 'error');
    }
  };

  // ==================== TARGET GROUPS CRUD ==================== //

  const openAddGroupModal = () => {
    setEditingGroup(null);
    setGroupForm({
      group_name: '',
      group_url: '',
      target_city: 'Hà Nội',
      target_district: '',
      target_property_type: 'can_ho',
      active_score: 8.5,
      approval_latency_minutes: 15,
      trained_time_slots: '["08:30", "11:45", "19:30", "21:00"]',
      is_active: 1
    });
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (grp) => {
    setEditingGroup(grp);
    setGroupForm({
      group_name: grp.group_name || '',
      group_url: grp.group_url || '',
      target_city: grp.target_city || 'Hà Nội',
      target_district: grp.target_district || '',
      target_property_type: grp.target_property_type || 'can_ho',
      active_score: grp.active_score || 8.0,
      approval_latency_minutes: grp.approval_latency_minutes || 15,
      trained_time_slots: Array.isArray(grp.trained_time_slots) ? JSON.stringify(grp.trained_time_slots) : (grp.trained_time_slots || '[]'),
      is_active: grp.is_active !== undefined ? grp.is_active : 1
    });
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    try {
      let parsedSlots;
      try {
        parsedSlots = JSON.parse(groupForm.trained_time_slots);
      } catch (_) {
        parsedSlots = groupForm.trained_time_slots.split(',').map(s => s.trim());
      }

      const payload = {
        ...groupForm,
        trained_time_slots: parsedSlots,
        active_score: parseFloat(groupForm.active_score) || 7.0,
        approval_latency_minutes: parseInt(groupForm.approval_latency_minutes, 10) || 15,
        is_active: groupForm.is_active ? 1 : 0
      };

      const url = editingGroup
        ? `http://localhost:3001/api/intelligence/target-groups/${editingGroup.id}`
        : 'http://localhost:3001/api/intelligence/target-groups';
      const method = editingGroup ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        addToast(editingGroup ? 'Cập nhật nhóm thành công!' : 'Thêm nhóm Facebook mới thành công!', 'success');
        setIsGroupModalOpen(false);
        fetchTargetGroups();
        if (selectedPropertyId) runHardcheckPreview(selectedPropertyId);
      } else {
        addToast(data.error || 'Lỗi lưu nhóm', 'error');
      }
    } catch (err) {
      addToast('Lỗi kết nối: ' + err.message, 'error');
    }
  };

  const handleDeleteGroup = async (grpId, grpName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhóm "${grpName}" khỏi cơ sở dữ liệu?`)) return;
    try {
      const res = await fetch(`http://localhost:3001/api/intelligence/target-groups/${grpId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('Đã xóa nhóm thành công.', 'success');
        fetchTargetGroups();
        if (selectedPropertyId) runHardcheckPreview(selectedPropertyId);
      } else {
        addToast(data.error || 'Lỗi xóa nhóm', 'error');
      }
    } catch (err) {
      addToast('Lỗi: ' + err.message, 'error');
    }
  };

  const handleToggleActiveGroup = async (grp) => {
    try {
      const newStatus = grp.is_active ? 0 : 1;
      const res = await fetch(`http://localhost:3001/api/intelligence/target-groups/${grp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Đã ${newStatus ? 'kích hoạt' : 'tạm dừng'} nhóm ${grp.group_name}`, 'success');
        fetchTargetGroups();
        if (selectedPropertyId) runHardcheckPreview(selectedPropertyId);
      }
    } catch (err) {
      addToast('Lỗi cập nhật: ' + err.message, 'error');
    }
  };

  // ==================== HARD-CHECK & SMART SCHEDULER ==================== //

  const runHardcheckPreview = async (propertyId) => {
    if (!propertyId) return;
    try {
      const res = await fetch(`http://localhost:3001/api/intelligence/hardcheck/${propertyId}`);
      const data = await res.json();
      if (data.success) {
        setHardcheckData(data.data);
      }
    } catch (err) {
      console.warn('Hardcheck error:', err);
    }
  };

  const handlePropertyChange = (e) => {
    const pId = e.target.value;
    setSelectedPropertyId(pId);
    setSmartScheduleResult(null);
    runHardcheckPreview(pId);
  };

  const handleTriggerSmartSchedule = async () => {
    if (!selectedPropertyId) {
      addToast('Vui lòng chọn bất động sản cần lên lịch!', 'warning');
      return;
    }

    setSchedulingLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/intelligence/smart-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedPropertyId })
      });
      const data = await res.json();
      if (data.success) {
        setSmartScheduleResult(data.data);
        fetchPostingSchedules();
        addToast(`Groq AI đã tạo lịch đăng thành công cho ${data.data.schedules_created_count} nhóm Facebook!`, 'success');
      } else {
        addToast(data.error || 'Lỗi lên lịch thông minh', 'error');
      }
    } catch (err) {
      addToast('Lỗi khi gọi Groq AI Scheduler: ' + err.message, 'error');
    } finally {
      setSchedulingLoading(false);
    }
  };

  const handleExportTrainingData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/intelligence/time-slot-training-data');
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `time-slot-training-dataset-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        addToast(`Đã xuất ${data.total_records} mẫu dữ liệu huấn luyện ML có nhãn!`, 'success');
      }
    } catch (err) {
      addToast('Lỗi xuất dữ liệu: ' + err.message, 'error');
    }
  };

  // Filtered views
  const filteredTargetGroups = targetGroups.filter(g =>
    (g.group_name || '').toLowerCase().includes(groupSearch.toLowerCase()) ||
    (g.target_city || '').toLowerCase().includes(groupSearch.toLowerCase()) ||
    (g.target_district || '').toLowerCase().includes(groupSearch.toLowerCase())
  );

  const filteredChannels = channelsOverview.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.province || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedPropObj = properties.find(p => p.id === selectedPropertyId);
  const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  const hoursList = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                Phase 3 • Groq AI & Time Intelligence
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Group & Time-Slot Intelligence</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý Nhóm Facebook BĐS, đối chiếu địa lý cứng (Hard-check), Groq AI xếp lịch khung giờ vàng và chống xung đột (Anti-Spam Jitter).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTrainingData}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất dữ liệu huấn luyện ML</span>
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('smart-scheduler')}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'smart-scheduler'
                ? 'bg-teal-700 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Lên lịch thông minh Groq AI</span>
          </button>

          <button
            onClick={() => setActiveTab('target-groups')}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'target-groups'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Nhóm & Khung giờ đã Train ({targetGroups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'health'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Sức khỏe kênh & Độ tin cậy ({channelsOverview.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'heatmap'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Time-Slot Heatmap 7x24</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SMART SCHEDULER & HARD-CHECK AUDIT (PHASE 3 CORE)                  */}
      {/* ========================================================================= */}
      {activeTab === 'smart-scheduler' && (
        <div className="space-y-6">
          {/* Top Control: Property Selection & Trigger */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Hệ thống lập lịch tự động</span>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  <span>Lên lịch thông minh & Chống xung đột thời gian</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Áp dụng mô hình Groq AI <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800">llama-3.3-70b-versatile</code> để khớp phân khúc, xếp khung giờ vàng và biến tấu Micro-Spinning.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTriggerSmartSchedule}
                  disabled={schedulingLoading || !selectedPropertyId}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                >
                  {schedulingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Groq AI đang xếp lịch...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Lên lịch thông minh (Groq AI)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Property Selector Dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn Bất Động Sản cần lập lịch đăng tin:
                </label>
                <select
                  value={selectedPropertyId}
                  onChange={handlePropertyChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-teal-500"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.city || p.province || 'Chưa rõ'}] {p.title} — {p.price ? `${p.price} tỷ` : 'Thỏa thuận'} ({p.area ? `${p.area} m²` : ''})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPropObj && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Khu vực:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {selectedPropObj.district || selectedPropObj.ward || ''}, {selectedPropObj.city || selectedPropObj.province}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phân khúc:</span>
                    <span className="font-bold text-teal-700">{selectedPropObj.property_type || 'Căn hộ'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Trạng thái:</span>
                    <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                      Sẵn sàng đăng
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hard-Check Audit Panel */}
          {hardcheckData && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Bộ lọc Đối chiếu Địa lý Cứng (Hard-Check Filter)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {hardcheckData.validGroups.length} Nhóm hợp lệ cùng khu vực ({hardcheckData.property?.city})
                  </span>
                  <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    {hardcheckData.rejectedGroups.length} Nhóm bị chặn (Khác tỉnh / Điểm thấp)
                  </span>
                </div>
              </div>

              {/* Two columns: Matched vs Rejected */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Accepted groups */}
                <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Nhóm đủ điều kiện ({hardcheckData.validGroups.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {hardcheckData.validGroups.map(grp => (
                      <div key={grp.id} className="bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span className="truncate pr-2">{grp.group_name}</span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] shrink-0">
                            ★ {grp.active_score}/10
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Khu vực: <b>{grp.target_city}</b> ({grp.target_district || 'Toàn TP'})</span>
                          <span>Độ trễ duyệt: {grp.approval_latency_minutes} phút</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap pt-1">
                          <span className="text-[10px] text-slate-400">Khung giờ train:</span>
                          {(grp.trained_time_slots || []).map((slot, sIdx) => (
                            <span key={sIdx} className="px-1.5 py-0.2 bg-teal-50 border border-teal-200 text-teal-800 rounded text-[10px] font-mono font-semibold">
                              {slot}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rejected groups */}
                <div className="border border-rose-100 bg-rose-50/40 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Nhóm bị loại bỏ tự động ({hardcheckData.rejectedGroups.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {hardcheckData.rejectedGroups.map(grp => (
                      <div key={grp.id} className="bg-white p-3 rounded-lg border border-rose-200 shadow-2xs text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span className="truncate pr-2">{grp.group_name}</span>
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px] shrink-0">
                            ★ {grp.active_score}/10
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-700 font-medium">
                          ⛔ Lý do chặn: {grp.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Scheduled Plan Result */}
          {smartScheduleResult && (
            <div className="bg-gradient-to-br from-teal-50 via-white to-emerald-50 rounded-2xl p-6 border-2 border-teal-300 shadow-md space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-teal-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Kế Hoạch Đăng Tin AI Đã Tạo (Model: {smartScheduleResult.model_used})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tất cả lịch đăng đã được lưu vào <code className="font-semibold text-slate-700">PostingSchedules</code> với trạng thái <b>Pending</b>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-lg text-xs font-bold border border-teal-300">
                    ✓ Chống xung đột (Jitter 6-12 phút): BẬT
                  </span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300">
                    ✓ Micro-Spinning: Đã tạo {smartScheduleResult.schedules_created_count} biến thể
                  </span>
                </div>
              </div>

              {/* Cards of AI Schedules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {smartScheduleResult.schedules.map((item, idx) => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border border-teal-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-teal-700 uppercase">
                          Lệnh #{idx + 1} • Nhóm Facebook BĐS
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                          {item.group_name}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-[11px]">
                        Pending
                      </span>
                    </div>

                    {/* Time breakdown with jitter */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-teal-600" /> Khung giờ vàng mục tiêu:
                        </span>
                        <span className="font-mono font-bold text-slate-800">{item.trained_time_slot}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Độ trễ duyệt bài nhóm:</span>
                        <span className="font-mono text-slate-700">{item.approval_latency_minutes} phút</span>
                      </div>
                      {item.jitter_offset_minutes > 0 && (
                        <div className="flex items-center justify-between text-teal-700 font-semibold bg-teal-50 px-2 py-1 rounded">
                          <span className="flex items-center gap-1">
                            <Shuffle className="w-3 h-3 text-teal-600" /> Độ lệch chống xung đột (Anti-Spam Jitter):
                          </span>
                          <span className="font-mono font-bold">+{item.jitter_offset_minutes} phút</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="font-bold text-slate-800">Thời điểm kích hoạt thực tế:</span>
                        <span className="font-mono font-bold text-emerald-700 text-sm">
                          {item.display_scheduled_time}
                        </span>
                      </div>
                    </div>

                    {/* Micro-spinning hook preview */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" /> Câu mở đầu biến tấu (Opening Hook):
                      </span>
                      <p className="text-xs text-slate-800 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 italic font-medium">
                        "{item.opening_hook}"
                      </p>
                    </div>

                    {/* Expand/Collapse Full Post */}
                    <div>
                      <button
                        onClick={() => setExpandedSpunId(expandedSpunId === item.id ? null : item.id)}
                        className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{expandedSpunId === item.id ? 'Thu gọn bài viết' : 'Xem toàn bộ nội dung bài đăng'}</span>
                      </button>

                      {expandedSpunId === item.id && (
                        <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs whitespace-pre-wrap text-slate-700 max-h-48 overflow-y-auto">
                          {item.spun_content}
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      💡 <i>Lý do chọn nhóm:</i> {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical / Existing PostingSchedules */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Danh Sách Lịch Đăng Đã Lưu (PostingSchedules Table)
                </h3>
              </div>
              <button
                onClick={fetchPostingSchedules}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Làm mới
              </button>
            </div>

            {loadingSchedules ? (
              <p className="text-xs text-slate-400 py-4 text-center">Đang tải danh sách lịch đăng...</p>
            ) : postingSchedules.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Chưa có lịch đăng nào được tạo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Mã Lịch</th>
                      <th className="py-2.5 px-3">BĐS</th>
                      <th className="py-2.5 px-3">Nhóm Mục Tiêu</th>
                      <th className="py-2.5 px-3">Khung Giờ Vàng</th>
                      <th className="py-2.5 px-3">Độ Lệch Jitter</th>
                      <th className="py-2.5 px-3">Thời Điểm Kích Hoạt</th>
                      <th className="py-2.5 px-3">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {postingSchedules.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{s.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate" title={s.property_title}>
                          {s.property_title || s.property_id}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <span className="font-semibold">{s.group_name || s.group_id}</span>
                          <span className="text-[10px] text-slate-400 block">{s.group_city}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-teal-800">
                          {s.target_time_slot || '--:--'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {s.jitter_offset_minutes ? `+${s.jitter_offset_minutes}p` : '0p'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 font-bold">
                          {new Date(s.scheduled_time).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800">
                            {s.status}
                          </span>
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

      {/* ========================================================================= */}
      {/* TAB 2: TARGET GROUPS & TRAINED TIME SLOTS (PHASE 3 CRUD)                   */}
      {/* ========================================================================= */}
      {activeTab === 'target-groups' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhóm theo tên, thành phố, quận..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={openAddGroupModal}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Nhóm Facebook mới</span>
              </button>
            </div>
          </div>

          {/* Group Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTargetGroups.map(grp => (
              <div
                key={grp.id}
                className={`bg-white rounded-xl border p-5 space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  grp.is_active ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {grp.target_city} {grp.target_district ? `• ${grp.target_district}` : ''}
                    </span>
                    <button
                      onClick={() => handleToggleActiveGroup(grp)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                        grp.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {grp.is_active ? '✓ Đang hoạt động' : 'Tạm tắt'}
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-2 line-clamp-2" title={grp.group_name}>
                    {grp.group_name}
                  </h3>

                  <a
                    href={grp.group_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-600 hover:underline flex items-center gap-1 mt-1 truncate"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{grp.group_url}</span>
                  </a>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Điểm hoạt động</span>
                      <span className="font-bold text-emerald-700 text-sm">★ {grp.active_score}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Độ trễ duyệt bài</span>
                      <span className="font-semibold text-slate-700">{grp.approval_latency_minutes} phút</span>
                    </div>
                  </div>

                  {/* Trained Time Slots */}
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Khung giờ vàng đã train:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(grp.trained_time_slots || []).map((slot, sIdx) => (
                        <span key={sIdx} className="px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 rounded font-mono text-[11px] font-semibold">
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditGroupModal(grp)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(grp.id, grp.group_name)}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Form for Add/Edit Target Group */}
          {isGroupModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-base text-slate-900">
                    {editingGroup ? 'Chỉnh sửa Nhóm Facebook BĐS' : 'Thêm Nhóm Facebook BĐS Mới'}
                  </h3>
                  <button
                    onClick={() => setIsGroupModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveGroup} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tên Nhóm Facebook *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Cộng Đồng Cư Dân Khai Sơn City & BĐS Long Biên"
                      value={groupForm.group_name}
                      onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Đường dẫn nhóm (group_url) *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.facebook.com/groups/..."
                      value={groupForm.group_url}
                      onChange={(e) => setGroupForm({ ...groupForm, group_url: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tỉnh/Thành phố *</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Hà Nội hoặc TP. Hồ Chí Minh"
                        value={groupForm.target_city}
                        onChange={(e) => setGroupForm({ ...groupForm, target_city: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Quận/Huyện</label>
                      <input
                        type="text"
                        placeholder="VD: Quận Long Biên"
                        value={groupForm.target_district}
                        onChange={(e) => setGroupForm({ ...groupForm, target_district: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Điểm hoạt động (active_score: 1-10)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="10"
                        value={groupForm.active_score}
                        onChange={(e) => setGroupForm({ ...groupForm, active_score: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Độ trễ duyệt bài (phút)</label>
                      <input
                        type="number"
                        min="0"
                        value={groupForm.approval_latency_minutes}
                        onChange={(e) => setGroupForm({ ...groupForm, approval_latency_minutes: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Danh sách khung giờ vàng đã train (JSON Array hoặc cách nhau bởi dấu phẩy)
                    </label>
                    <input
                      type="text"
                      placeholder='["08:30", "11:45", "19:30", "21:00"]'
                      value={groupForm.trained_time_slots}
                      onChange={(e) => setGroupForm({ ...groupForm, trained_time_slots: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-teal-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="is_active_box"
                      checked={!!groupForm.is_active}
                      onChange={(e) => setGroupForm({ ...groupForm, is_active: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <label htmlFor="is_active_box" className="font-semibold text-slate-700 cursor-pointer">
                      Kích hoạt nhóm này trong thuật toán lập lịch thông minh
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsGroupModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold"
                    >
                      Lưu Nhóm
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GROUP HEALTH & APPROVAL INTELLIGENCE                               */}
      {/* ========================================================================= */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kênh theo tên, khu vực..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-teal-500"
                />
              </div>

              <span className="text-xs text-slate-500 font-medium">
                {filteredChannels.length} kênh tiếp thị
              </span>
            </div>

            <div className="space-y-3">
              {filteredChannels.map(channel => (
                <div
                  key={channel.id}
                  onClick={() => loadChannelDetail(channel.id)}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                    selectedChannelHealth?.channel_id === channel.id
                      ? 'border-teal-500 shadow-md ring-2 ring-teal-100'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{channel.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          {channel.channel_type}
                        </span>

                        {channel.approval_type === 'auto_approved' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            ✓ Duyệt tự động
                          </span>
                        )}
                        {channel.approval_type === 'admin_approval_required' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                            ⏳ Cần Admin duyệt
                          </span>
                        )}
                        {channel.approval_type === 'manual_only' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                            👤 Xuất bản thủ công
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>Khu vực: <b>{channel.province || 'Toàn quốc'}</b></span>
                        <span>Thành viên: <b>{(channel.member_count || 0).toLocaleString()}</b></span>
                        <span>Mẫu dữ liệu: <b>{channel.observation_count || 0} bài đăng</b></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                          Health Score
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl font-black ${
                            channel.health_score >= 80 ? 'text-emerald-600' :
                            channel.health_score >= 60 ? 'text-teal-600' :
                            channel.health_score >= 40 ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {channel.health_score}
                          </span>
                          <span className="text-xs text-slate-400">/100</span>
                        </div>
                      </div>

                      <div className="text-right pl-4 border-l border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                          Độ Tin Cậy
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          channel.confidence === 'HIGH' ? 'bg-emerald-100 text-emerald-800' :
                          channel.confidence === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {channel.confidence}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Breakdown */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                <span>Chi tiết Chỉ số Sức khỏe & Chính sách</span>
              </h3>

              {selectedChannelHealth ? (
                <div className="space-y-4 mt-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Kênh phân tích</span>
                    <h4 className="font-bold text-slate-800 text-sm">{selectedChannelHealth.channel_name}</h4>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">Tỷ lệ duyệt thành công</span>
                        <span className="font-bold text-slate-800">{selectedChannelHealth.breakdown.approval_rate}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${selectedChannelHealth.breakdown.approval_rate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">Độ trễ duyệt bài</span>
                        <span className="font-bold text-slate-800">{selectedChannelHealth.breakdown.avg_approval_latency_mins} phút</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">Tương tác trung bình (24h)</span>
                        <span className="font-bold text-slate-800">{selectedChannelHealth.breakdown.avg_engagement_score}/100</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${selectedChannelHealth.breakdown.avg_engagement_score}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">Độ ổn định kỹ thuật (Connector)</span>
                        <span className="font-bold text-slate-800">{selectedChannelHealth.breakdown.technical_success_rate}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${selectedChannelHealth.breakdown.technical_success_rate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mt-4">
                    <span className="font-bold text-slate-700 block mb-1">Nhận định cơ chế:</span>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedChannelHealth.confidence_reason}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Chọn một kênh bên trái để xem phân tích chi tiết.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TIME-SLOT HEATMAP 7X24                                             */}
      {/* ========================================================================= */}
      {activeTab === 'heatmap' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <span>Heatmap Khung Giờ Đăng Tin Tối Ưu (7 Ngày x 24 Giờ)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Phản ánh xác suất tương tác cao nhất và tỷ lệ được duyệt bài nhanh nhất dựa trên lịch sử dữ liệu thực tế.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Chỉ số hiển thị:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setHeatmapMetric('engagement')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    heatmapMetric === 'engagement' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Tương tác 24h
                </button>
                <button
                  onClick={() => setHeatmapMetric('approval')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    heatmapMetric === 'approval' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Tỷ lệ duyệt (%)
                </button>
                <button
                  onClick={() => setHeatmapMetric('technical')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    heatmapMetric === 'technical' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Kỹ thuật (%)
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-25 gap-1 mb-2 text-center text-[10px] font-bold text-slate-400">
                <div className="col-span-1 text-left pl-2">Thứ</div>
                {hoursList.map(h => (
                  <div key={h}>{h}h</div>
                ))}
              </div>

              {daysOfWeek.map((dayName, dayIdx) => (
                <div key={dayIdx} className="grid grid-cols-25 gap-1 mb-1 items-center">
                  <div className="col-span-1 text-xs font-bold text-slate-700 pl-2 truncate">
                    {dayName}
                  </div>

                  {hoursList.map(h => {
                    const cell = heatmapMatrix.find(c => c.day_index === dayIdx && c.hour === h) || {};
                    let value = cell.avg_engagement_24h || 0;
                    let bgColor = 'bg-slate-100 text-slate-400';

                    if (heatmapMetric === 'engagement') {
                      value = cell.avg_engagement_24h || 0;
                      if (value >= 70) bgColor = 'bg-teal-700 text-white font-bold';
                      else if (value >= 40) bgColor = 'bg-teal-500 text-white font-semibold';
                      else if (value >= 20) bgColor = 'bg-teal-200 text-teal-900';
                      else if (value >= 10) bgColor = 'bg-teal-50 text-teal-700';
                    } else if (heatmapMetric === 'approval') {
                      value = `${cell.approval_rate || 0}%`;
                      const rate = cell.approval_rate || 0;
                      if (rate >= 85) bgColor = 'bg-emerald-600 text-white';
                      else if (rate >= 60) bgColor = 'bg-amber-400 text-slate-900';
                      else bgColor = 'bg-rose-400 text-white';
                    } else {
                      value = `${cell.technical_success_rate || 0}%`;
                      bgColor = 'bg-blue-600 text-white';
                    }

                    return (
                      <div
                        key={h}
                        title={`${dayName} lúc ${h}:00 - Tương tác 24h: ${cell.avg_engagement_24h || 0}, Duyệt: ${cell.approval_rate || 0}%, Mẫu: ${cell.sample_count || 0}`}
                        className={`h-9 rounded-md flex flex-col items-center justify-center text-[10px] cursor-pointer hover:ring-2 hover:ring-slate-900 transition-all ${bgColor}`}
                      >
                        <span>{value}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-3 rounded bg-teal-700 inline-block" /> Khung giờ vàng (Tương tác cao nhất: 8h-10h, 14h-16h, 19h-21h)
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-3 rounded bg-teal-200 inline-block" /> Bình thường
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-3 rounded bg-slate-100 inline-block" /> Khung giờ đêm (Admin nghỉ / duyệt chậm)
              </span>
            </div>

            <span className="text-[11px] text-slate-500">
              Tổng số điểm quan sát ma trận: 168 ô
            </span>
          </div>
        </div>
      )}
    </div>
  );
}