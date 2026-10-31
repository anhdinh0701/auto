import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Search, 
  Filter, 
  FolderCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle,
  ExternalLink,
  Users,
  Globe,
  Building
} from 'lucide-react';
import { api } from '../../api';

export default function ChannelSelector({ 
  selectedChannelIds = [], 
  onToggleChannel, 
  onSelectMultiple 
}) {
  const [channels, setChannels] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chans, cols] = await Promise.all([
        api.channels.getAll(),
        api.channels.getCollections()
      ]);
      setChannels(chans || []);
      setCollections(cols || []);
    } catch (err) {
      console.error('Lỗi tải danh sách kênh:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCapabilityBadge = (cap) => {
    switch (cap) {
      case 'api_publishing_available':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Đăng bài tự động qua API đã kết nối">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            API tự động
          </span>
        );
      case 'manual_publishing_only':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200" title="Nhóm Facebook / Kênh web yêu cầu quy trình hướng dẫn đăng thủ công">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Đăng thủ công
          </span>
        );
      case 'unsupported':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200" title="Kênh này không hỗ trợ đăng tin">
            <XCircle className="w-3 h-3 text-rose-600" />
            Không hỗ trợ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200" title="Chưa xác minh quyền đăng bài">
            <Info className="w-3 h-3 text-slate-500" />
            Chưa xác minh
          </span>
        );
    }
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case 'facebook_group':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'facebook_page':
        return <Share2 className="w-4 h-4 text-blue-700" />;
      case 'portal':
        return <Building className="w-4 h-4 text-emerald-600" />;
      case 'google_business':
        return <Globe className="w-4 h-4 text-sky-600" />;
      default:
        return <Globe className="w-4 h-4 text-slate-500" />;
    }
  };

  // Filter channels based on search, type, and collection
  const filteredChannels = channels.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchLoc = c.location?.toLowerCase().includes(q);
      if (!matchName && !matchLoc) return false;
    }
    if (filterType && c.channel_type !== filterType) {
      return false;
    }
    if (selectedCollectionId) {
      const col = collections.find(x => x.id === selectedCollectionId);
      if (col && col.channel_ids && !col.channel_ids.includes(c.id)) {
        return false;
      }
    }
    return true;
  });

  const handleSelectCollection = (colId) => {
    setSelectedCollectionId(colId);
    if (!colId) return;
    const col = collections.find(x => x.id === colId);
    if (col && col.channel_ids && col.channel_ids.length > 0) {
      // Add all channels in this collection to selection
      const merged = Array.from(new Set([...selectedChannelIds, ...col.channel_ids]));
      onSelectMultiple(merged);
    }
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredChannels.map(c => c.id);
    const merged = Array.from(new Set([...selectedChannelIds, ...visibleIds]));
    onSelectMultiple(merged);
  };

  const handleClearVisible = () => {
    const visibleIds = new Set(filteredChannels.map(c => c.id));
    const remaining = selectedChannelIds.filter(id => !visibleIds.has(id));
    onSelectMultiple(remaining);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">2. Chọn Kênh Tiếp Thị Đích</h3>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
            Đã chọn: {selectedChannelIds.length} kênh
          </span>
        </div>

        {/* Collection Selector */}
        <div className="flex items-center gap-2">
          <FolderCheck className="w-4 h-4 text-slate-500" />
          <select
            value={selectedCollectionId}
            onChange={(e) => handleSelectCollection(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- Chọn theo Bộ sưu tập kênh --</option>
            {collections.map(col => (
              <option key={col.id} value={col.id}>
                📁 {col.name} ({col.channel_ids?.length || 0} kênh)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
        <div className="sm:col-span-6 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên kênh hoặc khu vực..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tất cả loại kênh</option>
            <option value="facebook_page">Facebook Fanpage</option>
            <option value="facebook_group">Facebook Group</option>
            <option value="portal">Cổng BĐS đối tác</option>
            <option value="google_business">Google Doanh Nghiệp</option>
            <option value="classifieds">Rao vặt</option>
          </select>
        </div>

        <div className="sm:col-span-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleSelectAllVisible}
            className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
          >
            Chọn tất cả
          </button>
          <button
            type="button"
            onClick={handleClearVisible}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Bỏ chọn
          </button>
        </div>
      </div>

      {/* Channel list */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Đang tải danh sách kênh...</div>
      ) : filteredChannels.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
          Không tìm thấy kênh phù hợp. Bạn có thể thêm kênh mới ở mục <span className="font-semibold text-emerald-600">Tìm kiếm kênh (Giai đoạn 2)</span>.
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
          {filteredChannels.map(channel => {
            const isSelected = selectedChannelIds.includes(channel.id);
            return (
              <div
                key={channel.id}
                onClick={() => onToggleChannel(channel.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                  isSelected 
                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/30' 
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Controlled by outer div
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="p-1.5 rounded-lg bg-slate-100">
                    {getChannelIcon(channel.channel_type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{channel.name}</p>
                      {channel.url && (
                        <a
                          href={channel.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-emerald-600"
                          title="Mở liên kết gốc"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{channel.location || 'Toàn quốc'}</span>
                      {channel.members_count > 0 && (
                        <>
                          <span>•</span>
                          <span>{channel.members_count.toLocaleString()} thành viên</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2 shrink-0">
                  {getCapabilityBadge(channel.publishing_capability)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guidance note */}
      <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Lưu ý:</strong> Kênh có nhãn <span className="text-emerald-700 font-semibold">API tự động</span> sẽ được gửi trực tiếp đến nền tảng khi bấm xuất bản. Kênh <span className="text-amber-700 font-semibold">Đăng thủ công</span> (như Facebook Groups) sẽ hướng dẫn bạn sao chép nội dung và tải ảnh để đăng trực tiếp mà không cần ủy quyền mật khẩu.
        </span>
      </div>
    </div>
  );
}
