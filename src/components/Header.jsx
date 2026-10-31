import React from 'react';
import { Menu, Search, Bell, Plus, UserCheck, ShieldCheck } from 'lucide-react';

export default function Header({ onOpenMobile, onNavigate, title = 'Tổng quan hệ thống' }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Search Shortcut */}
        <button
          onClick={() => onNavigate('listings')}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Tìm kiếm tin...</span>
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs">
            ĐA
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">Môi Giới Chuyên Nghiệp</div>
            <div className="text-[10px] text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Giai đoạn 1 Studio
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
