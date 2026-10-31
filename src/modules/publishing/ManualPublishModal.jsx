import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { api } from '../../api';

export default function ManualPublishModal({ 
  task, 
  onClose, 
  onSuccess 
}) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [checklist, setChecklist] = useState({
    ruleCheck: false,
    priceCheck: false,
    contactCheck: false,
    photosUploaded: false
  });

  if (!task) return null;

  const payload = task.custom_payload || {};
  const fullTextToCopy = `${payload.title ? payload.title + '\n\n' : ''}${payload.description || ''}\n\nLiên hệ: ${payload.contact_info || ''}\n${payload.cta || ''}\n\n${payload.hashtags || ''}`.trim();

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(fullTextToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Lỗi sao chép:', err);
    }
  };

  const handleToggleCheck = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const handleConfirmManual = async () => {
    try {
      setConfirming(true);
      await api.publishing.confirmManual(task.id);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert('Không thể cập nhật trạng thái: ' + err.message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-amber-500/10 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Quy Trình Hướng Dẫn Đăng Tin Thủ Công
              </h3>
              <p className="text-xs text-amber-900 font-medium">
                Đích đăng: <span className="underline font-bold">{task.channel_name}</span> ({task.channel_type})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Open Target URL */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-800">
                Bước 1: Mở trang nhóm hoặc diễn đàn đích
              </div>
              <div className="text-[11px] text-slate-500">
                Mở liên kết nhóm Facebook hoặc trang đăng tin trong tab mới để sẵn sàng tạo bài viết.
              </div>
            </div>
            {task.channel_url ? (
              <a
                href={task.channel_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
              >
                Mở kênh ngay
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic">Chưa có URL kênh</span>
            )}
          </div>

          {/* Step 2: Copy Content */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Bước 2: Sao chép nội dung bài đăng
                </div>
                <div className="text-[11px] text-slate-500">
                  Nội dung đã được biên tập và định dạng sẵn cho kênh này.
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyText}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Đã sao chép!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép nội dung
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 max-h-36 overflow-y-auto whitespace-pre-wrap font-sans">
              {fullTextToCopy}
            </div>
          </div>

          {/* Step 3: Photos Download / Preview */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-800">
              Bước 3: Tải hoặc sao chép ảnh đính kèm ({payload.photos?.length || 0} ảnh)
            </div>
            <div className="text-[11px] text-slate-500">
              Bạn có thể nhấp chuột phải vào từng ảnh để lưu về máy hoặc sao chép và dán trực tiếp vào Facebook.
            </div>

            {payload.photos && payload.photos.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                {payload.photos.map((p, idx) => (
                  <a
                    key={p.id || idx}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-lg overflow-hidden border border-slate-200 relative group bg-slate-100 block"
                    title="Bấm để xem ảnh gốc"
                  >
                    <img
                      src={p.url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('flex', 'items-center', 'justify-center', 'text-[10px]', 'text-slate-400');
                        e.target.parentElement.innerText = 'Ảnh lỗi';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Download className="w-4 h-4" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">Không có ảnh nào cho bài đăng này.</div>
            )}
          </div>

          {/* Step 4: Pre-publishing Checklist */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-800">
              Bước 4: Bảng kiểm tra trước khi bấm Đăng (Pre-publishing Checklist)
            </div>
            
            <div className="space-y-1.5 text-xs text-slate-700">
              <label 
                className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white"
                onClick={() => handleToggleCheck('ruleCheck')}
              >
                {checklist.ruleCheck ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span>Đã kiểm tra nội quy nhóm đích (không vi phạm từ cấm, spam, v.v.)</span>
              </label>

              <label 
                className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white"
                onClick={() => handleToggleCheck('priceCheck')}
              >
                {checklist.priceCheck ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span>Thông tin giá và địa chỉ trùng khớp với bất động sản thực tế</span>
              </label>

              <label 
                className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white"
                onClick={() => handleToggleCheck('contactCheck')}
              >
                {checklist.contactCheck ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span>Thông tin số điện thoại / Zalo liên hệ chính xác</span>
              </label>

              <label 
                className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white"
                onClick={() => handleToggleCheck('photosUploaded')}
              >
                {checklist.photosUploaded ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span>Đã tải đủ ảnh thực tế lên trình soạn thảo của nhóm/kênh</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Đóng lại
          </button>

          <button
            type="button"
            disabled={!allChecked || confirming}
            onClick={handleConfirmManual}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
              allChecked && !confirming
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer ring-2 ring-emerald-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {confirming ? 'Đang xác nhận...' : 'Xác nhận: Tôi Đã Đăng Bài Thành Công'}
          </button>
        </div>
      </div>
    </div>
  );
}
