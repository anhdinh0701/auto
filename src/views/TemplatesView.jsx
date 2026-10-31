import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Copy, 
  Sparkles, 
  Star,
  Info,
  Wand2,
  Code
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function TemplatesView({ onNavigate }) {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'nha_pho',
    style: 'chuyen_nghiep',
    title_template: '',
    body_template: ''
  });

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const list = await api.getTemplates();
      setTemplates(list);
    } catch (err) {
      toast.error('Lỗi khi tải mẫu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'nha_pho',
      style: 'chuyen_nghiep',
      title_template: 'BÁN {property_type_label} TẠI {district} - GIÁ {price} {price_unit}',
      body_template: `CHÍNH CHỦ CẦN BÁN {property_type_label} TẠI {district}, {province}

Thông tin chi tiết:
- Vị trí: {address_detail}, {ward}, {district}
- Diện tích: {area} m²
- Thiết kế: {bedrooms} PN, {bathrooms} WC
- Giá: {price} {price_unit}
- Pháp lý: {legal_status}

Tiện ích:
{amenities_bullets}

Liên hệ xem nhà: {contact_phone} ({contact_name})`
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tpl) => {
    setEditingTemplate(tpl);
    setFormData({
      name: tpl.name,
      category: tpl.category,
      style: tpl.style,
      title_template: tpl.title_template,
      body_template: tpl.body_template
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.title_template.trim() || !formData.body_template.trim()) {
      toast.error('Vui lòng điền đầy đủ tên mẫu, mẫu tiêu đề và nội dung.');
      return;
    }

    try {
      if (editingTemplate) {
        await api.updateTemplate(editingTemplate.id, formData);
        toast.success('Đã cập nhật mẫu nội dung thành công!');
      } else {
        await api.createTemplate(formData);
        toast.success('Đã tạo mẫu nội dung mới thành công!');
      }
      setIsModalOpen(false);
      loadTemplates();
    } catch (err) {
      toast.error('Lỗi lưu mẫu: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.deleteTemplate(deleteTarget.id);
      toast.success('Đã xóa mẫu thành công.');
      setDeleteTarget(null);
      loadTemplates();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyBody = (tpl) => {
    navigator.clipboard.writeText(tpl.body_template);
    setCopiedId(tpl.id);
    toast.success('Đã sao chép cấu trúc mẫu vào Clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const variables = [
    '{property_type_label}', '{price}', '{price_unit}', '{area}',
    '{district}', '{province}', '{ward}', '{address_detail}',
    '{bedrooms}', '{bathrooms}', '{floors}', '{direction}',
    '{legal_status}', '{furniture_status}', '{amenities_bullets}',
    '{contact_name}', '{contact_phone}', '{contact_zalo}'
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>Kho Mẫu Bài Đăng Bất Động Sản</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Các mẫu bài đăng chuẩn SEO, Mạng xã hội và Tin nhắn nhanh giúp tiết kiệm 80% thời gian soạn bài.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mẫu bài đăng mới</span>
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Đang tải danh sách mẫu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tpl.is_builtin === 1 ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Hệ thống
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Tùy chỉnh
                      </span>
                    )}
                    <span className="text-xs uppercase font-bold text-slate-400">
                      {tpl.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyBody(tpl)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Sao chép mẫu"
                    >
                      {copiedId === tpl.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {tpl.is_builtin !== 1 && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(tpl)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Sửa mẫu"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tpl)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa mẫu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {tpl.name}
                </h3>

                <div className="text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                  <span className="text-slate-400 font-mono block text-[10px] uppercase">Mẫu tiêu đề:</span>
                  {tpl.title_template}
                </div>

                <pre className="text-xs font-mono text-slate-600 bg-slate-900 text-slate-200 p-3.5 rounded-xl whitespace-pre-wrap line-clamp-6 leading-relaxed max-h-48 overflow-hidden">
                  {tpl.body_template}
                </pre>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Style: {tpl.style}
                </span>
                <button
                  onClick={() => onNavigate('editor')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Dùng mẫu để tạo tin</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <h3 className="text-base font-bold text-slate-900">
              {editingTemplate ? 'Chỉnh sửa mẫu bài đăng' : 'Tạo mẫu bài đăng mới'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên mẫu bài đăng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Mẫu bán biệt thự nghỉ dưỡng"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Danh mục
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="nha_pho">Nhà phố / Nhà riêng</option>
                    <option value="can_ho">Căn hộ chung cư</option>
                    <option value="dat_nen">Đất nền</option>
                    <option value="cho_thue">Cho thuê</option>
                    <option value="biet_thu">Biệt thự</option>
                    <option value="khac">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phong cách
                  </label>
                  <select
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="chuyen_nghiep">Chuyên nghiệp</option>
                    <option value="mang_xa_hoi">Mạng xã hội</option>
                    <option value="ngan_gon">Ngắn gọn (Zalo/SMS)</option>
                    <option value="phap_ly">Pháp lý & Đầu tư</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mẫu tiêu đề
                </label>
                <input
                  type="text"
                  required
                  value={formData.title_template}
                  onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nội dung mẫu
                </label>
                <textarea
                  rows={8}
                  required
                  value={formData.body_template}
                  onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
                  className="w-full p-3.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              {/* Variable Helper Pills */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Bấm để chèn biến thông số:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFormData({ ...formData, body_template: formData.body_template + ' ' + v })}
                      className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded text-[11px] font-mono border border-slate-200 transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm"
                >
                  {editingTemplate ? 'Cập nhật mẫu' : 'Lưu mẫu mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xóa mẫu nội dung"
        message={`Bạn có chắc chắn muốn xóa mẫu "${deleteTarget?.name}"?`}
        confirmText="Xác nhận xóa"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
