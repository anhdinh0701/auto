import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../components/Toast';

export default function CsvImportModal({ isOpen, onClose, onImportSuccess }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [csvText, setCsvText] = useState('');
  const [duplicateMode, setDuplicateMode] = useState('skip'); // 'skip' | 'update'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const sampleCsvData = `name,url,channel_type,province,district,property_types,price_segments,target_audiences,verification_status,publishing_capability,notes
"Hội BĐS Nhà Phố Bình Thạnh","https://facebook.com/groups/nhadatbinhthanh","facebook_group","TP. Hồ Chí Minh","Bình Thạnh","nha_pho;nha_rieng","trung_cap;cao_cap","mua_o;dau_tu","verified","manual_only","Nhóm hoạt động tích cực"
"Kênh Căn Hộ Thủ Thiêm Quận 2","https://facebook.com/groups/canhothuthiem","facebook_group","TP. Hồ Chí Minh","Quận 2","can_ho;biet_thu","cao_cap;sieu_sang","dau_tu;mua_o","unverified","manual_only","Phân khúc cao cấp"
"Diễn Đàn Chợ Tốt Nhà Đất","https://nha.chotot.com","portal","Toàn quốc","","can_ho;nha_pho;dat_nen","gia_re;trung_cap","mua_o;thue","verified","api_supported","Cổng giao dịch phổ biến"`;

  const handleDownloadSample = () => {
    const blob = new Blob(['\uFEFF' + sampleCsvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau_nhap_kenh_bds.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống tệp mẫu CSV chuẩn UTF-8!');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result);
      toast.info(`Đã đọc nội dung từ tệp "${file.name}".`);
    };
    reader.onerror = () => {
      toast.error('Lỗi khi đọc tệp tin.');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      toast.error('Vui lòng chọn tệp CSV hoặc dán nội dung CSV vào ô bên dưới.');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      const res = await api.importChannelsCsv(csvText, duplicateMode);
      setResult(res);
      toast.success(`Nhập CSV hoàn tất! Thêm mới: ${res.imported}, Cập nhật: ${res.updated}, Bỏ qua: ${res.skipped}`);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      toast.error('Lỗi khi nhập CSV: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nhập Kênh Tiếp Thị Từ Tệp CSV</h3>
              <p className="text-xs text-slate-400">Kiểm tra tính hợp lệ và tự động phát hiện trùng lặp URL/Tên kênh.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Sample Download Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-900 block">Tải về tệp mẫu CSV chuẩn định dạng</span>
              <p className="text-emerald-700">Tệp mẫu đã bao gồm các cột bắt buộc: name, url, channel_type, province, property_types...</p>
            </div>

            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-100/50 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4" /> Tải tệp mẫu
            </button>
          </div>

          {/* Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Chọn tệp CSV từ máy tính
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="w-full border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-emerald-50/20 transition-all text-center"
            >
              <FileText className="w-8 h-8 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Bấm để tải tệp .csv lên</span>
              <span className="text-[11px] text-slate-400">Hỗ trợ tệp bảng tính CSV mã hóa UTF-8</span>
            </label>
          </div>

          {/* Direct CSV Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Hoặc dán trực tiếp nội dung CSV
              </label>
              {csvText && (
                <button
                  type="button"
                  onClick={() => setCsvText('')}
                  className="text-[11px] text-slate-400 hover:text-slate-700"
                >
                  Xóa nội dung
                </button>
              )}
            </div>
            <textarea
              rows={6}
              placeholder={`Dán nội dung tệp CSV vào đây...\nname,url,channel_type,province...`}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-3.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          {/* Duplicate Mode Radio */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Xử lý khi phát hiện kênh bị trùng URL hoặc Tên:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                duplicateMode === 'skip' ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="dupMode"
                  value="skip"
                  checked={duplicateMode === 'skip'}
                  onChange={() => setDuplicateMode('skip')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Bỏ qua kênh trùng lặp</span>
                  <span className="text-slate-500 text-[11px]">Giữ nguyên dữ liệu hiện có trong hệ thống</span>
                </div>
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                duplicateMode === 'update' ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="dupMode"
                  value="update"
                  checked={duplicateMode === 'update'}
                  onChange={() => setDuplicateMode('update')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Cập nhật thông tin mới</span>
                  <span className="text-slate-500 text-[11px]">Ghi đè thông số mới từ tệp CSV</span>
                </div>
              </label>
            </div>
          </div>

          {/* Import Result Feedback */}
          {result && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 animate-fade-in text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Kết quả nhập dữ liệu CSV
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-center">
                <div className="p-2 rounded-lg bg-white/10">
                  <span className="text-slate-400 block text-[10px]">Tổng dòng</span>
                  <span className="text-sm font-bold text-white">{result.totalRows}</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                  <span className="text-emerald-400 block text-[10px]">Thêm mới</span>
                  <span className="text-sm font-bold">{result.imported}</span>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
                  <span className="text-blue-400 block text-[10px]">Cập nhật</span>
                  <span className="text-sm font-bold">{result.updated}</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                  <span className="text-amber-400 block text-[10px]">Bỏ qua</span>
                  <span className="text-sm font-bold">{result.skipped}</span>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="pt-2 text-[11px] text-rose-300 space-y-1">
                  <span className="font-bold block">Các dòng bị bỏ qua do lỗi:</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={loading || !csvText.trim()}
            onClick={handleImport}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{loading ? 'Đang xử lý...' : 'Tiến hành Nhập Kênh'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
