import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Check, 
  FolderPlus,
  RefreshCw
} from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

export default function CollectionsModal({ isOpen, onClose, collections = [], onRefresh }) {
  const toast = useToast();
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('emerald');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingId('new');
    setName('');
    setDescription('');
    setColor('emerald');
  };

  const handleStartEdit = (col) => {
    setEditingId(col.id);
    setName(col.name);
    setDescription(col.description || '');
    setColor(col.color || 'emerald');
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên bộ sưu tập.');
      return;
    }

    try {
      setSaving(true);
      if (editingId === 'new') {
        await api.createCollection({ name: name.trim(), description: description.trim(), color });
        toast.success('Đã tạo bộ sưu tập kênh mới!');
      } else {
        await api.updateCollection(editingId, { name: name.trim(), description: description.trim(), color });
        toast.success('Đã cập nhật bộ sưu tập kênh!');
      }
      handleCancelForm();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Lỗi khi lưu bộ sưu tập: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteCollection(deleteTarget.id);
      toast.success(`Đã xóa bộ sưu tập "${deleteTarget.name}".`);
      setDeleteTarget(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Lỗi khi xóa: ' + err.message);
    }
  };

  const colors = [
    { id: 'emerald', label: 'Xanh ngọc', class: 'bg-emerald-500' },
    { id: 'blue', label: 'Xanh dương', class: 'bg-blue-500' },
    { id: 'indigo', label: 'Tím than', class: 'bg-indigo-500' },
    { id: 'amber', label: 'Cam vàng', class: 'bg-amber-500' },
    { id: 'rose', label: 'Hồng đỏ', class: 'bg-rose-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Quản Lý Bộ Sưu Tập Kênh Tiếp Thị</h3>
              <p className="text-xs text-slate-400">Tổ chức kênh theo nhóm mục tiêu để tái sử dụng ở Giai đoạn 3.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Create / Edit Form */}
          {editingId ? (
            <form onSubmit={handleSave} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800">
                  {editingId === 'new' ? 'Tạo bộ sưu tập mới' : 'Chỉnh sửa bộ sưu tập'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Hủy
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên bộ sưu tập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nhóm BĐS Phân Khúc Cao Cấp Quận 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mô tả mục đích
                </label>
                <input
                  type="text"
                  placeholder="VD: Sử dụng khi có tin nhà phố biệt thự VIP..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Màu sắc nhận diện
                </label>
                <div className="flex items-center gap-2">
                  {colors.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`w-6 h-6 rounded-full ${c.class} flex items-center justify-center transition-transform ${
                        color === c.id ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {color === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                >
                  {saving ? 'Đang lưu...' : 'Lưu bộ sưu tập'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={handleStartCreate}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo bộ sưu tập mới</span>
            </button>
          )}

          {/* List of Collections */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
            {collections.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có bộ sưu tập nào. Bấm nút phía trên để tạo mới.
              </div>
            ) : (
              collections.map((col) => (
                <div key={col.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{col.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {col.channel_count || 0} kênh liên kết • {col.description || 'Không có mô tả'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(col)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Sửa"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(col)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xóa bộ sưu tập kênh"
        message={`Bạn có chắc muốn xóa bộ sưu tập "${deleteTarget?.name}"? Các kênh trong bộ sưu tập vẫn được giữ nguyên trong kho kênh.`}
        confirmText="Xác nhận xóa"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
