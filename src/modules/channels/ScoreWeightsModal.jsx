import React, { useState, useEffect } from 'react';
import { 
  X, 
  SlidersHorizontal, 
  Save, 
  RotateCcw, 
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../components/Toast';

export default function ScoreWeightsModal({ isOpen, onClose, onSaved }) {
  const toast = useToast();
  const [weights, setWeights] = useState({
    weight_location: 25,
    weight_property_type: 20,
    weight_price: 15,
    weight_audience: 15,
    weight_freshness: 15,
    weight_capability: 10
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getScoreSettings().then(setWeights).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSum = Number(weights.weight_location) +
    Number(weights.weight_property_type) +
    Number(weights.weight_price) +
    Number(weights.weight_audience) +
    Number(weights.weight_freshness) +
    Number(weights.weight_capability);

  const handleResetDefault = () => {
    setWeights({
      weight_location: 25,
      weight_property_type: 20,
      weight_price: 15,
      weight_audience: 15,
      weight_freshness: 15,
      weight_capability: 10
    });
    toast.info('Đã khôi phục bộ trọng số tiêu chuẩn mặc định (100%).');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateScoreSettings(weights);
      toast.success('Đã lưu cấu hình trọng số chấm điểm liên quan!');
      if (onSaved) onSaved(weights);
      onClose();
    } catch (err) {
      toast.error('Lỗi lưu cài đặt: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cấu Hình Trọng Số Chấm Điểm (0 - 100)</h3>
              <p className="text-xs text-slate-400">Điều chỉnh mức độ ưu tiên theo chiến lược tiếp thị của bạn.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-700">Tổng tỷ trọng hiện tại:</span>
            <span className={`text-xs font-extrabold font-mono px-2 py-0.5 rounded ${
              totalSum === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {totalSum} % {totalSum === 100 ? '✓ Chuẩn hóa 100%' : '(Hệ thống sẽ tự quy đổi tỷ lệ)'}
            </span>
          </div>

          {/* Slider 1: Location */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">1. Trùng khớp Địa bàn / Khu vực (Location)</span>
              <span className="font-mono font-extrabold text-emerald-600">{weights.weight_location}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={weights.weight_location}
              onChange={(e) => setWeights({ ...weights, weight_location: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Slider 2: Property Type */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">2. Trùng khớp Loại hình BĐS (Property Type)</span>
              <span className="font-mono font-extrabold text-emerald-600">{weights.weight_property_type}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={weights.weight_property_type}
              onChange={(e) => setWeights({ ...weights, weight_property_type: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Slider 3: Price */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">3. Phân khúc giá mục tiêu (Price Segment)</span>
              <span className="font-mono font-extrabold text-emerald-600">{weights.weight_price}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={weights.weight_price}
              onChange={(e) => setWeights({ ...weights, weight_price: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Slider 4: Audience */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">4. Tệp khán giả mục tiêu (Target Audience)</span>
              <span className="font-mono font-extrabold text-emerald-600">{weights.weight_audience}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={weights.weight_audience}
              onChange={(e) => setWeights({ ...weights, weight_audience: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Slider 5: Freshness & Verification */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">5. Độ mới dữ liệu & Đã xác minh (Freshness)</span>
              <span className="font-mono font-extrabold text-emerald-600">{weights.weight_freshness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={weights.weight_freshness}
              onChange={(e) => setWeights({ ...weights, weight_freshness: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Slider 6: Capability */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">6. Khả năng xuất bản (Publishing Capability)</span>
              <span className="font-mono font-extrabold text-emerald-600">{weights.weight_capability}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={weights.weight_capability}
              onChange={(e) => setWeights({ ...weights, weight_capability: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Mặc định
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Lưu cấu hình
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
