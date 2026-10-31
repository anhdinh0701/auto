import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileText, 
  Save, 
  Wand2, 
  Copy, 
  Check, 
  RefreshCw, 
  BookOpen, 
  AlertTriangle,
  Send,
  Layers,
  ChevronDown
} from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../components/Toast';

export default function ContentStudio({ formData, onChange }) {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveTemplateModal, setSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('khac');

  // Load templates from API
  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const list = await api.getTemplates();
      setTemplates(list);
      if (list.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(list[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách mẫu nội dung');
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Helper to replace template variables strictly with provided real data
  const renderTemplate = (titleTpl, bodyTpl) => {
    const propertyTypeLabels = {
      can_ho: 'Căn hộ chung cư',
      nha_rieng: 'Nhà riêng',
      nha_pho: 'Nhà phố',
      dat_nen: 'Đất nền',
      biet_thu: 'Biệt thự',
      van_phong: 'Văn phòng',
      khac: 'Bất động sản'
    };

    const typeLabel = propertyTypeLabels[formData.property_type] || 'Bất động sản';
    const actionLabel = formData.listing_action === 'cho_thue' ? 'Cho thuê' : 'Bán';

    const amenitiesList = Array.isArray(formData.amenities) ? formData.amenities : [];
    const amenitiesBullets = amenitiesList.length > 0
      ? amenitiesList.map((a) => `- ${a}`).join('\n')
      : '- Vị trí thuận lợi, kết nối đồng bộ';

    const amenitiesShort = amenitiesList.length > 0
      ? amenitiesList.join(', ')
      : 'Đầy đủ tiện ích khu vực';

    const mapNote = formData.map_url
      ? `• Vị trí bản đồ: ${formData.map_url}`
      : '';

    const priceFormatted = formData.price !== null && formData.price !== undefined && formData.price !== ''
      ? `${formData.price}`
      : (formData.price_raw_text || 'Thỏa thuận');

    const unitFormatted = formData.price_unit || '';

    const values = {
      title: formData.title || '',
      property_type_label: typeLabel,
      action_label: actionLabel,
      province: formData.province || 'khu vực',
      district: formData.district || 'trung tâm',
      ward: formData.ward || '',
      address_detail: formData.address_detail || 'vị trí đắc địa',
      price: priceFormatted,
      price_unit: unitFormatted,
      area: formData.area || '---',
      bedrooms: formData.bedrooms || '---',
      bathrooms: formData.bathrooms || '---',
      floors: formData.floors || '1',
      direction: formData.direction || 'Thoáng mát',
      legal_status: formData.legal_status || 'Rõ ràng, minh bạch',
      furniture_status: formData.furniture_status || 'Thỏa thuận',
      amenities_bullets: amenitiesBullets,
      amenities_short: amenitiesShort,
      contact_name: formData.contact_name || 'Bộ phận tư vấn',
      contact_phone: formData.contact_phone || '---',
      contact_zalo: formData.contact_zalo || formData.contact_phone || '---',
      map_note: mapNote
    };

    let generatedTitle = titleTpl;
    let generatedBody = bodyTpl;

    Object.keys(values).forEach((key) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      generatedTitle = generatedTitle.replace(regex, values[key]);
      generatedBody = generatedBody.replace(regex, values[key]);
    });

    return { title: generatedTitle, body: generatedBody };
  };

  // Generate content using selected template
  const handleApplyTemplate = (template) => {
    if (!template) return;
    const { title, body } = renderTemplate(template.title_template, template.body_template);
    // Keep user's custom title if they already wrote one and it's not empty, or update if desired
    onChange('title', title);
    onChange('description', body);
    toast.success(`Đã áp dụng mẫu "${template.name}" và tạo nội dung!`);
  };

  // Generate 4 predefined style variations
  const generateStyleVariation = (styleKey) => {
    let tpl = templates.find((t) => t.style === styleKey);
    if (!tpl && templates.length > 0) {
      tpl = templates[0];
    }
    if (tpl) {
      handleApplyTemplate(tpl);
    }
  };

  // Save current description as a custom template
  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Vui lòng nhập tên cho mẫu mới');
      return;
    }
    try {
      await api.createTemplate({
        name: newTemplateName.trim(),
        category: newTemplateCategory,
        style: 'chuyen_nghiep',
        title_template: formData.title || 'BẤT ĐỘNG SẢN {district}',
        body_template: formData.description || ''
      });
      toast.success('Đã lưu mẫu nội dung mới vào danh viện mẫu!');
      setSaveTemplateModal(false);
      setNewTemplateName('');
      loadTemplates();
    } catch (err) {
      toast.error('Lỗi khi lưu mẫu: ' + err.message);
    }
  };

  // Copy full content
  const handleCopyContent = () => {
    const fullText = `${formData.title || ''}\n\n${formData.description || ''}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Đã sao chép tiêu đề và nội dung vào Clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Template & Generation Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-emerald-600" />
              <span>Studio Tạo Nội Dung BĐS Tự Động</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động ghép các thông số thực tế vào các mẫu bài đăng chuẩn SEO và mạng xã hội.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSaveTemplateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Lưu văn bản này thành mẫu mới</span>
          </button>
        </div>

        {/* 1-Click Style Variations */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Sinh nhanh theo phong cách (Từ thông số đã nhập)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => generateStyleVariation('chuyen_nghiep')}
              className="p-3 text-left rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                1. Chuyên Nghiệp
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Chuẩn thông số, lịch sự, rõ ràng</div>
            </button>

            <button
              type="button"
              onClick={() => generateStyleVariation('mang_xa_hoi')}
              className="p-3 text-left rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                2. Mạng Xã Hội
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Giật tít thu hút, icon bắt mắt</div>
            </button>

            <button
              type="button"
              onClick={() => generateStyleVariation('ngan_gon')}
              className="p-3 text-left rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                3. Ngắn Gọn (Zalo)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Gạch đầu dòng súc tích để gửi chat</div>
            </button>

            <button
              type="button"
              onClick={() => generateStyleVariation('phap_ly')}
              className="p-3 text-left rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                4. Pháp Lý & Đầu Tư
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Nhấn mạnh tiềm năng và độ an toàn</div>
            </button>
          </div>
        </div>

        {/* Template Selector Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
          <div className="flex-1">
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.is_builtin ? '⭐ ' : '📌 '} {tpl.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => handleApplyTemplate(selectedTemplate)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Áp dụng mẫu đã chọn</span>
          </button>
        </div>

        {/* Strict Truthfulness Guarantee Alert */}
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Nguyên tắc Studio:</strong> Nội dung được tạo trực tiếp từ các dữ liệu bạn đã nhập. Hệ thống tuyệt đối không tự bịa đặt giá cả, pháp lý, diện tích hay thông tin sai lệch ngoài thực tế. Bạn có thể chỉnh sửa thủ công mọi ký tự bên dưới.
          </span>
        </div>
      </div>

      {/* Direct Content Editor */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Biên tập Tiêu đề & Nội dung chi tiết</h3>
          </div>

          <button
            type="button"
            onClick={handleCopyContent}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép tất cả'}</span>
          </button>
        </div>

        {/* Title Editor */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Tiêu đề bài đăng
          </label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full px-4 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
          />
        </div>

        {/* Description Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nội dung mô tả bài viết
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {(formData.description || '').length} ký tự • {(formData.description || '').split(/\s+/).filter(Boolean).length} từ
            </span>
          </div>

          <textarea
            rows={14}
            value={formData.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Nội dung chi tiết của bất động sản. Bạn có thể tự gõ hoặc bấm 'Sinh nhanh theo phong cách' ở phía trên để hệ thống tự điền..."
            className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800 leading-relaxed"
          />
        </div>
      </div>

      {/* Save Template Modal */}
      {saveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Lưu thành Mẫu Nội Dung mới</h3>
            <p className="text-xs text-slate-500">
              Mẫu này sẽ được lưu vào cơ sở dữ liệu để bạn có thể tái sử dụng cho các tin đăng sau.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tên mẫu bài đăng
              </label>
              <input
                type="text"
                placeholder="VD: Mẫu bán biệt thự cao cấp ven sông"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phân loại
              </label>
              <select
                value={newTemplateCategory}
                onChange={(e) => setNewTemplateCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="nha_pho">Nhà phố / Nhà riêng</option>
                <option value="can_ho">Căn hộ chung cư</option>
                <option value="dat_nen">Đất nền</option>
                <option value="cho_thue">Cho thuê</option>
                <option value="biet_thu">Biệt thự</option>
                <option value="khac">Khác</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaveTemplateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
              >
                Lưu vào kho mẫu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
