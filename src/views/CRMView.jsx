import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload, 
  Calendar, 
  Phone, 
  Mail, 
  MessageSquare, 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Edit3, 
  Trash2, 
  FileText, 
  Share2,
  AlertCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';

export default function CRMView({ onNavigate }) {
  const [leads, setLeads] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('all');

  // Modals
  const [selectedLead, setSelectedLead] = useState(null); // Detail modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    email: '',
    zalo: '',
    source_platform: 'Facebook',
    property_type_interest: 'can_ho',
    location_interest: '',
    budget_text: '',
    status: 'new',
    notes: '',
    next_followup_at: ''
  });
  const [savingCreate, setSavingCreate] = useState(false);

  // New activity form inside detail modal
  const [activityForm, setActivityForm] = useState({
    activity_type: 'call',
    summary: '',
    details: ''
  });
  const [savingActivity, setSavingActivity] = useState(false);

  // CSV Import State
  const [csvContent, setCsvContent] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);

  // Listings & Channels for dropdowns
  const [listings, setListings] = useState([]);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    loadPrerequisites();
    loadReminders();
    loadLeads();
  }, [activeStatus, searchQuery, selectedPropertyType]);

  const loadPrerequisites = async () => {
    try {
      const [listRes, chanRes] = await Promise.all([
        api.listings.getAll(),
        api.channels.getAll()
      ]);
      setListings(listRes || []);
      setChannels(chanRes || []);
    } catch (err) {}
  };

  const loadReminders = async () => {
    try {
      const data = await api.leads.getUpcomingReminders();
      setReminders(data || []);
    } catch (err) {}
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res = await api.leads.getAll({
        status: activeStatus,
        search: searchQuery,
        property_type: selectedPropertyType
      });
      setLeads(res.items || []);
      setStatusCounts(res.statusCounts || {});
    } catch (err) {
      console.error('Lỗi tải danh sách khách hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLeadDetail = async (leadId) => {
    try {
      const detail = await api.leads.get(leadId);
      setSelectedLead(detail);
    } catch (err) {
      alert('Không thể tải chi tiết khách hàng: ' + err.message);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      setSavingCreate(true);
      await api.leads.create(createForm);
      alert('Đã thêm khách hàng thành công!');
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        phone: '',
        email: '',
        zalo: '',
        source_platform: 'Facebook',
        property_type_interest: 'can_ho',
        location_interest: '',
        budget_text: '',
        status: 'new',
        notes: '',
        next_followup_at: ''
      });
      loadLeads();
      loadReminders();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingCreate(false);
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!activityForm.summary || !selectedLead) return;
    try {
      setSavingActivity(true);
      await api.leads.addActivity(selectedLead.id, activityForm);
      setActivityForm({ activity_type: 'call', summary: '', details: '' });
      // Reload detail
      handleOpenLeadDetail(selectedLead.id);
      loadLeads();
    } catch (err) {
      alert('Lỗi thêm nhật ký chăm sóc: ' + err.message);
    } finally {
      setSavingActivity(false);
    }
  };

  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      await api.leads.update(leadId, { status: newStatus });
      if (selectedLead && selectedLead.id === leadId) {
        handleOpenLeadDetail(leadId);
      }
      loadLeads();
    } catch (err) {
      alert('Không thể cập nhật trạng thái: ' + err.message);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      await api.leads.delete(leadId);
      setSelectedLead(null);
      loadLeads();
      loadReminders();
    } catch (err) {
      alert('Không thể xóa: ' + err.message);
    }
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim()) {
      alert('Vui lòng dán hoặc chọn tệp CSV!');
      return;
    }
    try {
      setImportingCsv(true);
      const res = await api.leads.importCsv(csvContent);
      alert(res.message);
      setShowImportModal(false);
      setCsvContent('');
      loadLeads();
    } catch (err) {
      alert('Lỗi nhập CSV: ' + err.message);
    } finally {
      setImportingCsv(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Mới</span>;
      case 'contacting':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Đang liên hệ</span>;
      case 'consulting':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">Đang tư vấn</span>;
      case 'scheduled_viewing':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">Đã hẹn xem</span>;
      case 'deal_won':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Thành công 🎉</span>;
      case 'deal_lost':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Không còn nhu cầu</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Quản Lý Khách Hàng Tiềm Năng (CRM)
            </h1>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Giai Đoạn 4
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi khách hàng từ các tin đăng và kênh phân phối, ghi nhận lịch sử tương tác và nhắc lịch hẹn xem BĐS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={api.leads.getExportCsvUrl()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất CSV
          </a>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Nhập CSV
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm Khách Hàng
          </button>
        </div>
      </div>

      {/* Upcoming Reminders Alert Banner */}
      {reminders.length > 0 && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Clock className="w-4 h-4 text-amber-600" />
              Lịch Hẹn & Chăm Sóc Khách Hàng Sắp Tới ({reminders.length} nhắc hẹn trong 48h):
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 text-xs">
            {reminders.map(r => (
              <div
                key={r.id}
                onClick={() => handleOpenLeadLead(r.id)}
                className="p-2.5 bg-white rounded-xl border border-amber-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-900">{r.name} ({r.code})</div>
                  <div className="text-[11px] text-amber-800 font-medium mt-0.5">
                    ⏰ {new Date(r.next_followup_at).toLocaleString('vi-VN')}
                  </div>
                </div>
                {r.phone && (
                  <a
                    href={`tel:${r.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100"
                    title="Gọi ngay"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Metrics Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Tất cả', count: statusCounts.all || 0 },
          { id: 'new', label: 'Mới', count: statusCounts.new || 0 },
          { id: 'contacting', label: 'Đang liên hệ', count: statusCounts.contacting || 0 },
          { id: 'consulting', label: 'Đang tư vấn', count: statusCounts.consulting || 0 },
          { id: 'scheduled_viewing', label: 'Đã hẹn xem', count: statusCounts.scheduled_viewing || 0 },
          { id: 'deal_won', label: 'Thành công', count: statusCounts.deal_won || 0 },
          { id: 'deal_lost', label: 'Không còn nhu cầu', count: statusCounts.deal_lost || 0 }
        ].map(tab => {
          const isActive = activeStatus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveStatus(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        <div className="sm:col-span-8 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên khách hàng, số điện thoại, email, mã KH hoặc ghi chú..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedPropertyType}
            onChange={(e) => setSelectedPropertyType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Tất cả loại hình BĐS quan tâm</option>
            <option value="can_ho">Căn hộ chung cư</option>
            <option value="nha_pho">Nhà phố</option>
            <option value="dat_nen">Đất nền</option>
            <option value="biet_thu">Biệt thự</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách khách hàng...</div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50">
            Không tìm thấy khách hàng nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-3">Liên hệ</th>
                  <th className="py-3 px-3">Nhu cầu BĐS</th>
                  <th className="py-3 px-3">Ngân sách</th>
                  <th className="py-3 px-3">Nguồn</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3">Lịch hẹn tiếp</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => handleOpenLeadDetail(lead.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{lead.code}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800">{lead.phone || '-'}</div>
                      <div className="text-[11px] text-slate-400">{lead.email || ''}</div>
                    </td>
                    <td className="py-3.5 px-3 max-w-[180px] truncate">
                      <div className="font-medium text-slate-800">{lead.listing_title || lead.property_type_interest || 'Chung'}</div>
                      <div className="text-[11px] text-slate-400">{lead.location_interest || ''}</div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-emerald-700">
                      {lead.budget_text || (lead.budget_min ? `${lead.budget_min} - ${lead.budget_max} tỷ` : 'Thương lượng')}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {lead.source_platform || lead.channel_name || 'Trực tiếp'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="py-3.5 px-3 text-[11px] text-slate-500">
                      {lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLeadDetail(lead.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LEAD DETAIL MODAL & TIMELINE */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in duration-150">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">{selectedLead.name}</h3>
                  <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {selectedLead.code}
                  </span>
                  {getStatusBadge(selectedLead.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                  <span>SĐT: {selectedLead.phone || 'Chưa có'}</span>
                  <span>•</span>
                  <span>Email: {selectedLead.email || 'Chưa có'}</span>
                  <span>•</span>
                  <span>Nguồn: {selectedLead.source_platform || 'Trực tiếp'}</span>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Quick status bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">Chuyển trạng thái chăm sóc:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'new', label: 'Mới' },
                    { id: 'contacting', label: 'Đang liên hệ' },
                    { id: 'consulting', label: 'Đang tư vấn' },
                    { id: 'scheduled_viewing', label: 'Đã hẹn xem' },
                    { id: 'deal_won', label: 'Thành công 🎉' },
                    { id: 'deal_lost', label: 'Hủy' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedLead.id, st.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        selectedLead.status === st.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Requirements & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900">Thông tin nhu cầu BĐS:</div>
                  <div className="text-slate-600">Loại hình: <strong>{selectedLead.property_type_interest || 'Chưa xác định'}</strong></div>
                  <div className="text-slate-600">Khu vực tìm kiếm: <strong>{selectedLead.location_interest || 'Toàn thành phố'}</strong></div>
                  <div className="text-slate-600">Khoảng tài chính: <strong className="text-emerald-700">{selectedLead.budget_text || 'Thỏa thuận'}</strong></div>
                  {selectedLead.listing_title && (
                    <div className="text-slate-600">Tin liên quan: <strong>{selectedLead.listing_title}</strong></div>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900">Ghi chú & Lịch hẹn:</div>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedLead.notes || 'Không có ghi chú thêm.'}</p>
                  <div className="text-indigo-700 font-bold mt-2">
                    Lịch hẹn tiếp: {selectedLead.next_followup_at ? new Date(selectedLead.next_followup_at).toLocaleString('vi-VN') : 'Chưa đặt lịch'}
                  </div>
                </div>
              </div>

              {/* Add Activity Form */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  Ghi Lại Hoạt Động Chăm Sóc Mới (Cuộc gọi, gặp mặt, Zalo):
                </h4>
                <form onSubmit={handleAddActivity} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={activityForm.activity_type}
                      onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value })}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="call">📞 Cuộc gọi tư vấn</option>
                      <option value="message">💬 Nhắn tin Zalo / SMS</option>
                      <option value="meeting">🤝 Hẹn gặp / Dẫn xem nhà</option>
                      <option value="note">📝 Ghi chú chung</option>
                    </select>

                    <input
                      type="text"
                      required
                      placeholder="Tiêu đề (VD: Đã gọi điện hỏi tiến độ)..."
                      value={activityForm.summary}
                      onChange={(e) => setActivityForm({ ...activityForm, summary: e.target.value })}
                      className="sm:col-span-2 px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Chi tiết trao đổi (VD: Khách yêu cầu bớt 50 triệu thì đặt cọc)..."
                      value={activityForm.details}
                      onChange={(e) => setActivityForm({ ...activityForm, details: e.target.value })}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                    <button
                      type="submit"
                      disabled={savingActivity}
                      className="px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shrink-0"
                    >
                      {savingActivity ? 'Đang lưu...' : 'Thêm Nhật Ký'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Lịch sử chăm sóc ({selectedLead.activities?.length || 0}):</h4>
                {selectedLead.activities?.length === 0 ? (
                  <p className="text-slate-400 italic">Chưa có lịch sử chăm sóc.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedLead.activities.map(act => (
                      <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{act.summary}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(act.performed_at || act.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        {act.details && (
                          <p className="text-slate-600 text-[11px]">{act.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteLead(selectedLead.id)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200"
              >
                Xóa khách hàng
              </button>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE LEAD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Thêm Khách Hàng Tiềm Năng Mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateLead} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và tên (*)</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại (*)</label>
                  <input
                    type="tel"
                    required
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="khachhang@gmail.com"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nguồn khách hàng</label>
                  <select
                    value={createForm.source_platform}
                    onChange={(e) => setCreateForm({ ...createForm, source_platform: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="Facebook Fanpage">Facebook Fanpage</option>
                    <option value="Facebook Group">Facebook Group</option>
                    <option value="Batdongsan.com.vn">Batdongsan.com.vn</option>
                    <option value="Zalo">Zalo</option>
                    <option value="Giới thiệu">Người quen giới thiệu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loại hình BĐS quan tâm</label>
                  <select
                    value={createForm.property_type_interest}
                    onChange={(e) => setCreateForm({ ...createForm, property_type_interest: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="can_ho">Căn hộ chung cư</option>
                    <option value="nha_pho">Nhà phố</option>
                    <option value="dat_nen">Đất nền</option>
                    <option value="biet_thu">Biệt thự</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khoảng ngân sách</label>
                  <input
                    type="text"
                    value={createForm.budget_text}
                    onChange={(e) => setCreateForm({ ...createForm, budget_text: e.target.value })}
                    placeholder="VD: 3 - 4 tỷ"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Khu vực tìm kiếm</label>
                <input
                  type="text"
                  value={createForm.location_interest}
                  onChange={(e) => setCreateForm({ ...createForm, location_interest: e.target.value })}
                  placeholder="VD: Quận 9, TP. Thủ Đức, TP.HCM"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái khởi tạo</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="new">Mới</option>
                    <option value="contacting">Đang liên hệ</option>
                    <option value="consulting">Đang tư vấn</option>
                    <option value="scheduled_viewing">Đã hẹn xem</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hẹn liên hệ tiếp theo</label>
                  <input
                    type="datetime-local"
                    value={createForm.next_followup_at}
                    onChange={(e) => setCreateForm({ ...createForm, next_followup_at: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú nhu cầu chi tiết</label>
                <textarea
                  rows={2}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="Nhu cầu tài chính, hướng phong thủy, số phòng ngủ mong muốn..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingCreate}
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {savingCreate ? 'Đang tạo...' : 'Tạo Khách Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT CSV MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Nhập Khách Hàng Từ Tệp CSV</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Định dạng các cột chuẩn: <code>Họ Tên, Số Điện Thoại, Email, Nguồn, Loại Hình, Khu Vực, Ngân Sách</code>. Hệ thống tự động bỏ qua số điện thoại đã tồn tại.
              </p>

              <textarea
                rows={8}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Họ Tên,Số Điện Thoại,Email,Nguồn&#10;Nguyễn Văn B,0919888999,vanb@gmail.com,Facebook&#10;Trần Thị C,0907111222,thic@gmail.com,Batdongsan"
                className="w-full p-3 border border-slate-200 rounded-xl font-mono text-slate-800 bg-slate-50"
              />

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={importingCsv}
                  onClick={handleImportCsv}
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  {importingCsv ? 'Đang nhập...' : 'Bắt Đầu Nhập CSV'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
