import React from 'react';
import { 
  Building2, 
  PlusCircle, 
  Settings, 
  Compass,
  Send,
  ShieldCheck,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  Database
} from 'lucide-react';

export default function Sidebar({ currentView, onNavigate, isMobileOpen, onCloseMobile }) {
  const menuItems = [
    { id: 'workspace', label: 'Property Workspace', icon: Building2, badge: 'Hub' },
    { id: 'intelligence', label: 'Group & Time Intelligence', icon: Compass, badge: null },
    { id: 'accounts', label: 'Account & Session Pool', icon: ShieldCheck, badge: null },
    { id: 'publishing', label: 'Publishing Center', icon: Send, badge: null },
    { id: 'data-quality', label: 'Data Quality & Location', icon: MapPin, badge: null },
    { id: 'settings', label: 'Settings & Automation', icon: Settings, badge: null },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-900 text-white z-40 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-18 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">BĐS Studio</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                GĐ 1-4 Full Hub
              </span>
            </div>
            <p className="text-xs text-slate-400">Marketing & Content Hub</p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="px-4 pt-5 pb-3">
          <button
            onClick={() => {
              onNavigate('workspace', { mode: 'create' });
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-md shadow-emerald-950 transition-all transform active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo tin BĐS mới</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
            Không gian làm việc
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-inner border border-slate-700/50'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Storage & Phase Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> SQLite Persistent
            </span>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              Online
            </span>
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            Dữ liệu & ảnh lưu trữ máy chủ an toàn, không mất sau reload.
          </div>
        </div>
      </aside>
    </>
  );
}
