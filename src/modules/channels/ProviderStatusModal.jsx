import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  AlertTriangle, 
  ExternalLink, 
  ShieldCheck, 
  Key,
  Info
} from 'lucide-react';
import { api } from '../../api';

export default function ProviderStatusModal({ isOpen, onClose, location = 'TP. Hồ Chí Minh' }) {
  const [providerStatus, setProviderStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getSearchProviderStatus()
        .then(setProviderStatus)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const locParam = encodeURIComponent(location || 'TP. Hồ Chí Minh');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Trạng Thái Search Provider (Tìm Kiếm API)</h3>
              <p className="text-xs text-slate-400">Kiểm tra kết nối các nguồn tìm kiếm bên thứ ba chính thức.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Provider Warning / Status Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Search provider not configured (Chưa cấu hình API)</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              {providerStatus?.message || 'Khóa API tìm kiếm trực tuyến (Google Custom Search hoặc Facebook Graph API) chưa được thiết lập trong biến môi trường.'}
            </p>
          </div>

          {/* Compliance & Security Guarantee */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Nguyên tắc bảo mật & tuân thủ chính sách:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
              <li><strong>Không cào dữ liệu trái phép (No Scraping):</strong> Hệ thống không bypass login, không vượt CAPTCHA hay quét ngầm nội dung nhạy cảm của người dùng Facebook/Zalo.</li>
              <li><strong>Không bịa đặt kênh ảo:</strong> Tuyệt đối không tạo kết quả tìm kiếm giả mạo hoặc tự phát sinh số liệu thành viên không kiểm chứng.</li>
              <li><strong>Hỗ trợ chính ngạch:</strong> Khi có nhu cầu tự động hóa tìm kiếm kênh, vui lòng liên kết API chính thức qua biến môi trường <code className="text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">GOOGLE_SEARCH_API_KEY</code> hoặc <code className="text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">FACEBOOK_GRAPH_API_TOKEN</code>.</li>
            </ul>
          </div>

          {/* Manual Discovery Links */}
          <div className="space-y-2.5">
            <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
              Đề xuất tìm kiếm kênh thủ công uy tín ({location || 'Khu vực mục tiêu'}):
            </span>

            <div className="space-y-2">
              <a
                href={`https://www.google.com/search?q=site%3Afacebook.com%2Fgroups+bất+động+sản+${locParam}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 group-hover:text-emerald-700">
                    1. Tìm Hội nhóm Facebook BĐS ({location})
                  </div>
                  <div className="text-[11px] text-slate-400">Truy vấn Google mở các nhóm công khai liên quan khu vực</div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </a>

              <a
                href={`https://www.google.com/search?q=zalo.me%2Fg%2F+bất+động+sản+${locParam}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 group-hover:text-emerald-700">
                    2. Tìm Nhóm Zalo BĐS ({location})
                  </div>
                  <div className="text-[11px] text-slate-400">Tìm kiếm các liên kết tham gia nhóm Zalo mở</div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </a>

              <a
                href={`https://www.google.com/search?q=diễn+đàn+bất+động+sản+${locParam}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 group-hover:text-emerald-700">
                    3. Tìm Diễn đàn BĐS & Trang chuyên ngành
                  </div>
                  <div className="text-[11px] text-slate-400">Các chuyên trang tin tức và diễn đàn giao lưu đầu tư</div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </a>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
