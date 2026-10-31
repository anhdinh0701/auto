import React, { useState } from 'react';
import { 
  Share2, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Globe, 
  Send,
  Plus,
  X,
  Sparkles,
  Info,
  Users
} from 'lucide-react';

export default function Phase2Config({ formData, onChange }) {
  const [newGroupInput, setNewGroupInput] = useState('');

  const platforms = [
    { id: 'facebook', name: 'Facebook Fanpage / Profile', icon: 'FB', color: 'bg-blue-600' },
    { id: 'zalo', name: 'Zalo OA / Zalo Cá nhân', icon: 'ZL', color: 'bg-sky-500' },
    { id: 'batdongsan', name: 'Batdongsan.com.vn', icon: 'BĐS', color: 'bg-red-600' },
    { id: 'chotot', name: 'Chợ Tốt Nhà', icon: 'CT', color: 'bg-amber-600' },
  ];

  const handlePlatformToggle = (platId) => {
    const current = formData.target_platforms || [];
    if (current.includes(platId)) {
      onChange('target_platforms', current.filter((p) => p !== platId));
    } else {
      onChange('target_platforms', [...current, platId]);
    }
  };

  const handleAddGroup = () => {
    if (!newGroupInput.trim()) return;
    const current = formData.target_groups || [];
    if (!current.includes(newGroupInput.trim())) {
      onChange('target_groups', [...current, newGroupInput.trim()]);
    }
    setNewGroupInput('');
  };

  const handleRemoveGroup = (group) => {
    const current = formData.target_groups || [];
    onChange('target_groups', current.filter((g) => g !== group));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Informational Banner */}
      <div className="p-4 rounded-2xl bg-emerald-950 text-white flex items-start gap-3 shadow-md">
        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Kiến Trúc Dữ Liệu Sẵn Sàng Cho Giai Đoạn 2</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Phần cấu hình này lưu trữ kênh phân phối, nhóm mục tiêu và kế hoạch xuất bản. Khi bước sang Giai đoạn 2 (Automation Posting), hệ thống sẽ đọc trực tiếp dữ liệu này mà không cần sửa đổi cấu trúc cơ sở dữ liệu.
          </p>
        </div>
      </div>

      {/* Target Platforms Selection */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Share2 className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Nền tảng & Kênh đăng dự kiến</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {platforms.map((plat) => {
            const isSelected = (formData.target_platforms || []).includes(plat.id);
            return (
              <button
                key={plat.id}
                type="button"
                onClick={() => handlePlatformToggle(plat.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${plat.color} text-white flex items-center justify-center font-bold text-xs`}>
                    {plat.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{plat.name}</div>
                    <div className="text-[10px] text-slate-400">Chuẩn bị nội dung định dạng riêng</div>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold border transition-colors ${
                  isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 text-transparent'
                }`}>
                  ✓
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Facebook Groups */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Hội nhóm Facebook mục tiêu</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {(formData.target_groups || []).length} nhóm đã chọn
          </span>
        </div>

        {/* Tag Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập tên hội nhóm (VD: Hội Mua Bán Nhà Đất Thủ Đức, BĐS Sài Gòn...)"
            value={newGroupInput}
            onChange={(e) => setNewGroupInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddGroup();
              }
            }}
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleAddGroup}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Thêm nhóm
          </button>
        </div>

        {/* Group Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {(formData.target_groups || []).length === 0 ? (
            <div className="text-xs text-slate-400 italic">Chưa thêm nhóm Facebook mục tiêu nào.</div>
          ) : (
            (formData.target_groups || []).map((group) => (
              <span
                key={group}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
              >
                <span>{group}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(group)}
                  className="text-blue-400 hover:text-blue-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Schedule & Queue State */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Clock className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Lịch đăng & Trạng thái hàng đợi (Queue)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Thời gian xuất bản dự kiến
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_at ? formData.scheduled_at.slice(0, 16) : ''}
              onChange={(e) => onChange('scheduled_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">Để trống nếu muốn đăng thủ công ngay.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Trạng thái hàng đợi (Giai đoạn 2)
            </label>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {formData.publish_queue_status === 'queued' ? 'Đã xếp hàng (Queued)' : 'Sẵn sàng chờ lệnh (Idle)'}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Sẽ kích hoạt ở GĐ 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
