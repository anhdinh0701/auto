import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Share2, 
  User, 
  HardDrive, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../components/Toast';

export default function SettingsView() {
  const toast = useToast();
  const [profile, setProfile] = useState({
    name: 'Nguyễn Thành Đạt',
    phone: '0908 123 456',
    zalo: '0908 123 456',
    agency: 'Công Ty Bất Động Sản Thịnh Vượng',
    note: 'Hỗ trợ khách hàng 24/7'
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('broker_profile', JSON.stringify(profile));
    toast.success('Đã lưu cấu hình thông tin môi giới mặc định!');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          <span>Cài Đặt & Kiến Trúc Hệ Thống</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý thông tin môi giới mặc định, cấu hình lưu trữ SQLite và chuẩn bị kiến trúc cho Giai đoạn 2.
        </p>
      </div>

      {/* Default Broker Profile */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <User className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Thông tin Môi Giới Mặc Định (Tự động điền)</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Công ty / Đơn vị phân phối
              </label>
              <input
                type="text"
                value={profile.agency}
                onChange={(e) => setProfile({ ...profile, agency: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Số điện thoại Hotline
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Số Zalo tư vấn
              </label>
              <input
                type="text"
                value={profile.zalo}
                onChange={(e) => setProfile({ ...profile, zalo: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm"
            >
              Lưu thông tin mặc định
            </button>
          </div>
        </form>
      </div>

      {/* Persistence & Storage Specs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Trạng Thái Lưu Trữ Bền Vững (Persistence)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Cơ sở dữ liệu SQLite</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                WAL Mode Hoạt động
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Đường dẫn tệp: <code className="font-mono text-slate-800">data/realestate.db</code>. Dữ liệu tin, mẫu bài đăng và thông số kỹ thuật được lưu bền vững trên ổ đĩa.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Thư mục Upload Ảnh</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                Chất Lượng Gốc 100%
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Đường dẫn thư mục: <code className="font-mono text-slate-800">uploads/</code>. Tệp ảnh được lưu trữ an toàn với tên định danh độc nhất, không qua nén làm suy giảm chất lượng.
            </p>
          </div>
        </div>
      </div>

      {/* Phase 2 Architecture Readiness Roadmap */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Lộ Trình & Thiết Kế Cho Giai Đoạn 2</h3>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/80">
            Sẵn sàng mở rộng
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Giai đoạn 1 đã hoàn thiện toàn bộ studio biên tập, quản lý ảnh và cấu trúc bảng dữ liệu chứa sẵn các trường mở rộng cho Giai đoạn 2:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> 1. Đa kênh & Facebook Groups
            </div>
            <p className="text-slate-400 text-[11px]">
              Trường <code className="text-white">target_platforms</code> và <code className="text-white">target_groups</code> đã tích hợp trực tiếp trong mỗi tin đăng.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> 2. Lịch đăng & Hàng đợi Queue
            </div>
            <p className="text-slate-400 text-[11px]">
              Trường <code className="text-white">scheduled_at</code> và <code className="text-white">publish_queue_status</code> sẵn sàng cho scheduler tự động.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> 3. Nhật ký xuất bản (Publish Logs)
            </div>
            <p className="text-slate-400 text-[11px]">
              Trường <code className="text-white">publish_logs</code> lưu vết thời gian, nền tảng, mã phản hồi thành công hoặc lỗi chi tiết.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 4. Đa tài khoản & Phân quyền
            </div>
            <p className="text-slate-400 text-[11px]">
              Cấu trúc bảng SQLite cho phép gán người dùng hoặc nhóm môi giới mà không làm vỡ logic hiện tại.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
