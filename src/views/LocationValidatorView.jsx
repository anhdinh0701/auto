import React, { useState, useEffect } from 'react';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Building2,
  PlusCircle,
  Trash2,
  Search,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { useToast } from '../components/Toast';

export default function LocationValidatorView() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'checker' | 'projects'
  const [listingsAudit, setListingsAudit] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Checker State
  const [testPayload, setTestPayload] = useState({
    project_name: 'Khai Sơn City',
    province: 'TP. Hồ Chí Minh',
    district: 'TP. Thủ Đức',
    ward: 'Phường Long Thạnh Mỹ',
    address_detail: 'Đường Nguyễn Xiển',
    title: 'Bán căn hộ Khai Sơn City giá rẻ'
  });
  const [validationResult, setValidationResult] = useState(null);

  // Add Project State
  const [newProject, setNewProject] = useState({
    project_name: '',
    province: 'Hà Nội',
    district: '',
    ward: '',
    aliases: '',
    notes: ''
  });

  useEffect(() => {
    fetchAuditData();
    fetchProjects();
  }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/listings?limit=100');
      const data = await res.json();
      setListingsAudit(data.items || []);
    } catch (err) {
      addToast('Lỗi khi tải danh sách kiểm tra: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/location/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runTestValidation = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/location/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      const data = await res.json();
      if (data.success) {
        setValidationResult(data.data);
        if (data.data.status === 'NEEDS_REVIEW' || data.data.status === 'INVALID') {
          addToast('Phát hiện mâu thuẫn địa lý nghiêm trọng!', 'warning');
        } else {
          addToast('Địa chỉ hợp lệ!', 'success');
        }
      }
    } catch (err) {
      addToast('Lỗi đối chiếu: ' + err.message, 'error');
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.project_name || !newProject.district) {
      addToast('Vui lòng nhập tên dự án và quận/huyện.', 'error');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/location/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProject,
          aliases: newProject.aliases ? newProject.aliases.split(',').map(s => s.trim()) : []
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Đã thêm dự án chuẩn "${newProject.project_name}"!`, 'success');
        setNewProject({
          project_name: '',
          province: 'Hà Nội',
          district: '',
          ward: '',
          aliases: '',
          notes: ''
        });
        fetchProjects();
      }
    } catch (err) {
      addToast('Lỗi: ' + err.message, 'error');
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/location/projects/${id}`, { method: 'DELETE' });
      addToast('Đã xóa dự án đối chiếu.', 'success');
      fetchProjects();
    } catch (err) {
      addToast('Lỗi xóa: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                Data Quality Guard
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Location Validator & Geographic Integrity</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Phát hiện mâu thuẫn giữa tên dự án, địa chỉ hành chính và khu vực đăng tin. Chặn xuất bản tự động khi dữ liệu sai lệch.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 pb-1">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Rà soát toàn bộ tin ({listingsAudit.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('checker');
              runTestValidation();
            }}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'checker'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Công cụ kiểm tra mâu thuẫn trực tiếp</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'projects'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Danh mục dự án đối chiếu ({projects.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LISTINGS AUDIT */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">
              Trạng thái xác thực địa lý theo từng tin đăng
            </h3>
            <button
              onClick={fetchAuditData}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Làm mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <th className="p-3">Tin đăng</th>
                  <th className="p-3">Dự án khai báo</th>
                  <th className="p-3">Địa chỉ hành chính</th>
                  <th className="p-3">Trạng thái địa lý</th>
                  <th className="p-3">Cảnh báo / Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listingsAudit.map(item => {
                  const status = item.location_verification_status || 'UNVERIFIED';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-semibold text-slate-800 max-w-xs truncate" title={item.title}>
                        {item.title}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {item.project_name || '—'}
                      </td>
                      <td className="p-3 text-slate-600">
                        {item.district}, {item.province}
                      </td>
                      <td className="p-3">
                        {status === 'VERIFIED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ VERIFIED
                          </span>
                        )}
                        {status === 'WARNING' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            ⚠️ WARNING
                          </span>
                        )}
                        {status === 'NEEDS_REVIEW' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                            🚨 NEEDS_REVIEW
                          </span>
                        )}
                        {status === 'UNVERIFIED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            UNVERIFIED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 max-w-md">
                        {item.location_mismatch_details || 'Địa chỉ khớp tiêu chuẩn.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE CONTRADICTION CHECKER */}
      {activeTab === 'checker' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Nhập dữ liệu để thử nghiệm thuật toán đối chiếu
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tên dự án</label>
              <input
                type="text"
                value={testPayload.project_name}
                onChange={(e) => setTestPayload({ ...testPayload, project_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tỉnh / Thành</label>
                <input
                  type="text"
                  value={testPayload.province}
                  onChange={(e) => setTestPayload({ ...testPayload, province: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Quận / Huyện</label>
                <input
                  type="text"
                  value={testPayload.district}
                  onChange={(e) => setTestPayload({ ...testPayload, district: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ đường / Phường</label>
              <input
                type="text"
                value={testPayload.address_detail}
                onChange={(e) => setTestPayload({ ...testPayload, address_detail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <button
              onClick={runTestValidation}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
            >
              Chạy kiểm tra mâu thuẫn
            </button>
          </div>

          {/* Validation Result Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Kết quả phân tích từ Location Validator
            </h3>

            {validationResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-xs text-slate-500 font-medium">Trạng thái phán quyết:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    validationResult.status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : (validationResult.status === 'WARNING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800 animate-pulse')
                  }`}>
                    {validationResult.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Chi tiết lý do & Mâu thuẫn:</span>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs">
                    {validationResult.reasons.map((r, i) => (
                      <p key={i} className="text-slate-700">• {r}</p>
                    ))}
                  </div>
                </div>

                {validationResult.matched_project && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-teal-800">Khớp với dự án chuẩn trong hệ thống:</p>
                    <p>• Tên: <strong>{validationResult.matched_project.project_name}</strong></p>
                    <p>• Vị trí chuẩn: {validationResult.matched_project.ward}, {validationResult.matched_project.district}, {validationResult.matched_project.province}</p>
                  </div>
                )}

                <div className="p-3 bg-slate-100 rounded-xl text-xs flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Được phép xuất bản tự động:</span>
                  <span className={`font-bold ${validationResult.is_publishable ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {validationResult.is_publishable ? 'CÓ (CHO PHÉP)' : 'KHÔNG (BỊ CHẶN)'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Đang chờ lệnh kiểm tra...</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REFERENCE PROJECTS CATALOG */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Cơ sở tri thức dự án chuẩn để đối chiếu chéo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(p => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-slate-800">{p.project_name}</h4>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="text-slate-400 hover:text-rose-600 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{p.district}, {p.province}</span>
                  </p>

                  {p.aliases && p.aliases.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.aliases.map((al, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                          {al}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add project form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 h-fit">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Thêm dự án chuẩn mới
            </h3>

            <form onSubmit={handleAddProject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên dự án *</label>
                <input
                  type="text"
                  placeholder="VD: Aqua City..."
                  value={newProject.project_name}
                  onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tỉnh / Thành *</label>
                <input
                  type="text"
                  placeholder="VD: Đồng Nai..."
                  value={newProject.province}
                  onChange={(e) => setNewProject({ ...newProject, province: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Quận / Huyện *</label>
                <input
                  type="text"
                  placeholder="VD: TP. Biên Hòa..."
                  value={newProject.district}
                  onChange={(e) => setNewProject({ ...newProject, district: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên gọi khác (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="VD: Aqua City Novaland, Đô thị Aqua..."
                  value={newProject.aliases}
                  onChange={(e) => setNewProject({ ...newProject, aliases: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                Lưu vào cơ sở tri thức
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
