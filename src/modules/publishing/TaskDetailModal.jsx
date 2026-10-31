import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  RotateCcw, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Layers, 
  Trash2,
  Share2,
  Users,
  Building,
  Globe
} from 'lucide-react';
import { api } from '../../api';

export default function TaskDetailModal({ 
  task, 
  onClose, 
  onRefresh,
  onOpenManualModal 
}) {
  const [loadingAction, setLoadingAction] = useState(false);

  if (!task) return null;

  const handleCancel = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch đăng tin này không?')) return;
    try {
      setLoadingAction(true);
      await api.publishing.cancelTask(task.id);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      alert('Không thể hủy: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRetry = async () => {
    try {
      setLoadingAction(true);
      await api.publishing.retryTask(task.id);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      alert('Không thể thử lại: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa tác vụ này?')) return;
    try {
      setLoadingAction(true);
      await api.publishing.deleteTask(task.id);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      alert('Không thể xóa: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã xuất bản
          </span>
        );
      case 'needs_manual_action':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            Chờ đăng thủ công
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Calendar className="w-3.5 h-3.5" />
            Đã lên lịch
          </span>
        );
      case 'queued':
      case 'publishing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            Đang xử lý
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            Thất bại
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const payload = task.custom_payload || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Chi Tiết Tác Vụ #{task.id.slice(0, 8)}
                </h3>
                {getStatusBadge(task.status)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kênh đích: <strong className="text-slate-800">{task.channel_name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">Bất động sản</span>
              <span className="font-bold text-slate-800 line-clamp-1">{task.listing_title || task.listing_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Loại kênh</span>
              <span className="font-bold text-slate-800">{task.channel_type}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Lịch dự kiến</span>
              <span className="font-bold text-slate-800">
                {task.scheduled_for ? new Date(task.scheduled_for).toLocaleString('vi-VN') : 'Ngay lập tức'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Số lần thử</span>
              <span className="font-bold text-slate-800">
                {task.retry_count || 0} / {task.max_retries || 3}
              </span>
            </div>
          </div>

          {/* Outcome & Platform Post ID */}
          {task.status === 'published' && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Kết quả: {task.outcome === 'user_confirmed_manual' ? 'Người dùng đã đăng thủ công thành công' : 'Nền tảng xác nhận thành công (platform_confirmed)'}
              </div>
              {task.published_at && (
                <div className="text-[11px] text-emerald-700">
                  Thời gian hoàn tất: {new Date(task.published_at).toLocaleString('vi-VN')}
                </div>
              )}
              {task.platform_post_id && (
                <div className="text-[11px] text-emerald-900 font-mono flex items-center gap-2 pt-1">
                  <span>Mã bài viết nền tảng (Post ID): {task.platform_post_id}</span>
                  {task.platform_url && (
                    <a
                      href={task.platform_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-700 hover:underline font-sans font-bold"
                    >
                      Xem bài đăng thật <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Details if Failed */}
          {task.status === 'failed' && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <div className="font-bold text-rose-800 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                Lỗi xuất bản: {task.error_code || 'PUBLISH_ERROR'}
              </div>
              <p className="text-rose-700 text-xs">{task.error_message}</p>
              {task.error_details && (
                <pre className="p-2 bg-white rounded border border-rose-200 text-[10px] text-rose-900 overflow-x-auto mt-2 font-mono">
                  {task.error_details}
                </pre>
              )}
            </div>
          )}

          {/* Content Payload Snapshot */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800">Nội dung đã gửi:</h4>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <p className="font-bold text-slate-900">{payload.title}</p>
              <p className="text-slate-700 whitespace-pre-wrap">{payload.description}</p>
              {payload.contact_info && (
                <p className="text-emerald-700 font-semibold">Liên hệ: {payload.contact_info}</p>
              )}
              {payload.cta && (
                <p className="text-indigo-700">{payload.cta}</p>
              )}
              {payload.hashtags && (
                <p className="text-slate-500 font-mono text-[11px]">{payload.hashtags}</p>
              )}
            </div>
          </div>

          {/* Photos Snapshot */}
          {payload.photos && payload.photos.length > 0 && (
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800">Ảnh kèm theo ({payload.photos.length}):</h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                {payload.photos.map((p, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {['draft', 'failed', 'cancelled'].includes(task.status) && (
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa tác vụ
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {task.status === 'needs_manual_action' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenManualModal(task);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-400 hover:bg-amber-500 rounded-xl transition-colors shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Mở hướng dẫn đăng thủ công
              </button>
            )}

            {['scheduled', 'queued'].includes(task.status) && (
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200"
              >
                <XCircle className="w-3.5 h-3.5" />
                Hủy lịch đăng
              </button>
            )}

            {['failed', 'unknown'].includes(task.status) && (
              <button
                type="button"
                disabled={loadingAction || (task.retry_count >= (task.max_retries || 3))}
                onClick={handleRetry}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                  task.retry_count >= (task.max_retries || 3)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Thử lại ngay ({task.retry_count || 0}/{task.max_retries || 3})
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
