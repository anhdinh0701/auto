import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Send,
  Calendar,
  Clock,
  Sparkles,
  Bot,
  Radio,
  Zap,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  FileEdit,
  Laptop,
  Check,
  ChevronRight,
  Maximize2,
  ShieldCheck,
  MessageSquare,
  History,
  Layers,
  ArrowUpRight,
  Plus,
  Copy,
  Sun,
  Moon,
  CalendarDays,
  Timer,
  Sliders,
  StopCircle,
  ListOrdered
} from 'lucide-react';
import { useToast } from '../components/Toast';

export default function CleanWorkspaceView() {
  const { addToast } = useToast();

  // ------------------ ĐIỀU HƯỚNG 3 MỤC CHÍNH ------------------
  // 'photos' | 'composer' | 'chrome-logs'
  const [activeTab, setActiveTab] = useState('photos');

  // ------------------ MỤC 1: KHO ẢNH THẬT ------------------
  const [uploadedPhotos, setUploadedPhotos] = useState([
    {
      filename: 'khaison_city_2pn.png',
      originalname: 'Căn hộ Khai Sơn City 2PN 89m2.png',
      url: '/uploads/khaison_city_2pn.png',
      path: 'D:\\New folder\\uploads\\khaison_city_2pn.png',
      size: 1004908
    }
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const fileInputRef = useRef(null);

  // ------------------ MỤC 2: SOẠN BÀI & LINK NHÓM (MULTI-GROUP QUEUE) ------------------
  const [groupUrlsText, setGroupUrlsText] = useState('https://www.facebook.com/groups/1857977624574831?locale=vi_VN');
  const [delayMin, setDelayMin] = useState(90);
  const [delayMax, setDelayMax] = useState(180);
  const [autoSpin, setAutoSpin] = useState(true);
  const [activeQueue, setActiveQueue] = useState(null);
  const [isStoppingQueue, setIsStoppingQueue] = useState(false);

  // Mẫu danh sách nhóm BĐS tiện ích
  const SAMPLE_KHAISON_GROUPS = [
    'https://www.facebook.com/groups/1857977624574831?locale=vi_VN',
    'https://www.facebook.com/groups/cuasoloithoat',
    'https://www.facebook.com/groups/khaisoncityofficial',
    'https://www.facebook.com/groups/bds.longbien.hanoi',
    'https://www.facebook.com/groups/chungcukhaisoncity'
  ];

  const SAMPLE_HANOI_GROUPS = [
    'https://www.facebook.com/groups/batdongsanhanoi24h',
    'https://www.facebook.com/groups/chothuenhadathanoi',
    'https://www.facebook.com/groups/bds.thudo.hanoi',
    'https://www.facebook.com/groups/muabanbatdongsanhanoi',
    'https://www.facebook.com/groups/hoi.cu.dan.long.bien'
  ];

  // Trích xuất danh sách link hợp lệ (mỗi dòng 1 link)
  const parsedGroupUrls = groupUrlsText
    .split(/[\r\n,;]+/)
    .map(u => u.trim())
    .filter(u => u && u.includes('facebook.com'));

  const handleAddSampleGroups = (sampleList) => {
    const existing = groupUrlsText.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
    const combined = Array.from(new Set([...existing, ...sampleList]));
    setGroupUrlsText(combined.join('\n'));
    addToast(`Đã thêm ${sampleList.length} nhóm vào danh sách!`, 'success');
  };

  const [postContent, setPostContent] = useState(`Em cần Cho thuê căn 2PN 89m2 Khai Sơn City giá 11triệu full đồ ạ.
Tầng đẹp nhà đang trống nhận nhà luôn
Liên hệ: 033.8866.058 ( zalo)`);
  const [postTimingMode, setPostTimingMode] = useState('now'); // 'now' | 'schedule' | 'multi_schedule'
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // Helper tính ngày mặc định
  const getInitialScheduleDate = () => {
    const now = new Date();
    if (now.getHours() >= 18) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
  };

  const defaultScheduleDate = getInitialScheduleDate();
  const [targetScheduleDate, setTargetScheduleDate] = useState(defaultScheduleDate);

  // Danh sách nhiều khung giờ & nội dung riêng từng khung giờ
  const [timeSlots, setTimeSlots] = useState([
    {
      id: 'slot-1',
      slotKey: 'morning',
      label: '🌅 Buổi Sáng (08:30)',
      time: `${defaultScheduleDate}T08:30`,
      defaultTime: '08:30',
      hookTitle: 'Chào buổi sáng & Khách tìm nhà sớm',
      content: `[CHÀO BUỔI SÁNG CẢ NHÀ 🌅]
Em cần Cho thuê căn 2PN 89m2 Khai Sơn City giá 11triệu full đồ ạ.
Tầng đẹp nhà đang trống nhận nhà luôn. Anh/chị xem nhà sáng nay alo em mở cửa nhé!
Liên hệ: 033.8866.058 ( zalo)`
    },
    {
      id: 'slot-2',
      slotKey: 'noon',
      label: '🍽️ Buổi Trưa (11:45)',
      time: `${defaultScheduleDate}T11:45`,
      defaultTime: '11:45',
      hookTitle: 'Nghỉ trưa chốt nhanh - Giá tốt',
      content: `[NGHỈ TRƯA XEM NHÀ NHANH 🍽️]
Căn hộ Khai Sơn City 2PN 89m2 full đồ đẹp - Giá chỉ 11tr/tháng.
Vị trí trung tâm Long Biên, vào ở ngay. Hỗ trợ anh chị xem nhà giờ nghỉ trưa thuận tiện!
Hotline/Zalo: 033.8866.058`
    },
    {
      id: 'slot-3',
      slotKey: 'afternoon',
      label: '☕ Buổi Chiều (14:30)',
      time: `${defaultScheduleDate}T14:30`,
      defaultTime: '14:30',
      hookTitle: 'Cà phê chiều tìm nhà ưng ý',
      content: `[CĂN ĐẸP GIÁ HỢP LÝ CHO THUÊ ☕]
Cho thuê căn 2PN 89m2 Khai Sơn City giá 11triệu full đồ xinh xắn.
Tầng cao thoáng mát, view đẹp ngắm trọn công viên.
Anh chị quan tâm nhắn Zalo em gửi clip chi tiết: 033.8866.058`
    },
    {
      id: 'slot-4',
      slotKey: 'evening',
      label: '🌙 Buổi Tối (20:00)',
      time: `${defaultScheduleDate}T20:00`,
      defaultTime: '20:00',
      hookTitle: 'Tối thảnh thơi chọn căn đẹp',
      content: `[TỐI THẢNH THƠI CHỌN CĂN ĐẸP 🌙]
Cần cho thuê gấp căn hộ 2PN 89m2 Khai Sơn City giá 11triệu full nội thất.
Phù hợp gia đình trẻ, chuyên gia làm việc Long Biên - Hoàn Kiếm.
Liên hệ: 033.8866.058 (zalo kết bạn tư vấn 24/7 ạ)`
    }
  ]);

  const [pendingSchedules, setPendingSchedules] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [postingProgress, setPostingProgress] = useState('');
  const [lastPostResult, setLastPostResult] = useState(null);

  // Đổi ngày áp dụng cho tất cả các khung giờ
  const handleDateChangeForSlots = (newDate) => {
    setTargetScheduleDate(newDate);
    setTimeSlots(prev => prev.map(slot => {
      const timePart = slot.time ? slot.time.split('T')[1] || slot.defaultTime || '09:00' : (slot.defaultTime || '09:00');
      return {
        ...slot,
        time: `${newDate}T${timePart}`
      };
    }));
  };

  // Nạp 4 khung giờ vàng BĐS trong ngày
  const handleApplyGoldenHours = (dateOverride = null) => {
    const baseDate = dateOverride || targetScheduleDate || getInitialScheduleDate();
    setTimeSlots([
      {
        id: 'slot-' + Date.now() + '-1',
        slotKey: 'morning',
        label: '🌅 Buổi Sáng (08:30)',
        time: `${baseDate}T08:30`,
        defaultTime: '08:30',
        hookTitle: 'Chào buổi sáng & Khách tìm nhà sớm',
        content: `[CHÀO BUỔI SÁNG CẢ NHÀ 🌅]
Em cần Cho thuê căn 2PN 89m2 Khai Sơn City giá 11triệu full đồ ạ.
Tầng đẹp nhà đang trống nhận nhà luôn. Anh/chị xem nhà sáng nay alo em mở cửa nhé!
Liên hệ: 033.8866.058 ( zalo)`
      },
      {
        id: 'slot-' + Date.now() + '-2',
        slotKey: 'noon',
        label: '🍽️ Buổi Trưa (11:45)',
        time: `${baseDate}T11:45`,
        defaultTime: '11:45',
        hookTitle: 'Nghỉ trưa chốt nhanh - Giá tốt',
        content: `[NGHỈ TRƯA XEM NHÀ NHANH 🍽️]
Căn hộ Khai Sơn City 2PN 89m2 full đồ đẹp - Giá chỉ 11tr/tháng.
Vị trí trung tâm Long Biên, vào ở ngay. Hỗ trợ anh chị xem nhà giờ nghỉ trưa thuận tiện!
Hotline/Zalo: 033.8866.058`
      },
      {
        id: 'slot-' + Date.now() + '-3',
        slotKey: 'afternoon',
        label: '☕ Buổi Chiều (14:30)',
        time: `${baseDate}T14:30`,
        defaultTime: '14:30',
        hookTitle: 'Cà phê chiều tìm nhà ưng ý',
        content: `[CĂN ĐẸP GIÁ HỢP LÝ CHO THUÊ ☕]
Cho thuê căn 2PN 89m2 Khai Sơn City giá 11triệu full đồ xinh xắn.
Tầng cao thoáng mát, view đẹp ngắm trọn công viên.
Anh chị quan tâm nhắn Zalo em gửi clip chi tiết: 033.8866.058`
      },
      {
        id: 'slot-' + Date.now() + '-4',
        slotKey: 'evening',
        label: '🌙 Buổi Tối (20:00)',
        time: `${baseDate}T20:00`,
        defaultTime: '20:00',
        hookTitle: 'Tối thảnh thơi chọn căn đẹp',
        content: `[TỐI THẢNH THƠI CHỌN CĂN ĐẸP 🌙]
Cần cho thuê gấp căn hộ 2PN 89m2 Khai Sơn City giá 11triệu full nội thất.
Phù hợp gia đình trẻ, chuyên gia làm việc Long Biên - Hoàn Kiếm.
Liên hệ: 033.8866.058 (zalo kết bạn tư vấn 24/7 ạ)`
      }
    ]);
    addToast('Đã nạp 4 khung giờ vàng BĐS (08:30, 11:45, 14:30, 20:00) kèm nội dung chuyên biệt!', 'success');
  };

  // Thêm khung giờ mới
  const handleAddTimeSlot = () => {
    const newId = 'slot-' + Date.now();
    const nextSlotNum = timeSlots.length + 1;
    setTimeSlots(prev => [
      ...prev,
      {
        id: newId,
        slotKey: 'custom',
        label: `⏰ Khung giờ #${nextSlotNum}`,
        time: `${targetScheduleDate}T${String(Math.min(22, 8 + nextSlotNum * 2)).padStart(2, '0')}:00`,
        defaultTime: '09:00',
        hookTitle: 'Khung giờ tùy chỉnh',
        content: postContent || `Em cần Cho thuê căn 2PN 89m2 Khai Sơn City giá 11triệu full đồ ạ.
Tầng đẹp nhà đang trống nhận nhà luôn
Liên hệ: 033.8866.058 ( zalo)`
      }
    ]);
  };

  // Xóa khung giờ
  const handleRemoveTimeSlot = (id) => {
    if (timeSlots.length <= 1) {
      addToast('Cần giữ lại ít nhất 1 khung giờ đăng!', 'error');
      return;
    }
    setTimeSlots(prev => prev.filter(s => s.id !== id));
  };

  // Cập nhật thông tin slot
  const handleUpdateTimeSlot = (id, field, value) => {
    setTimeSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Sao chép nội dung chính vào slot
  const handleCopyMainContentToSlot = (id) => {
    handleUpdateTimeSlot(id, 'content', postContent);
    addToast('Đã sao chép nội dung từ khung soạn thảo chính!', 'success');
  };

  // Áp dụng Hook mở đầu cho slot
  const handleApplyHookToSlot = (id, hookHeader) => {
    const targetSlot = timeSlots.find(s => s.id === id);
    if (!targetSlot) return;
    let base = targetSlot.content.replace(/^\[.*?\]\s*/s, '');
    const updated = `${hookHeader}\n${base}`;
    handleUpdateTimeSlot(id, 'content', updated);
  };

  // Tải danh sách lịch đăng đang chờ
  const fetchPendingSchedules = async () => {
    try {
      const res = await fetch('/api/posting-schedules/active');
      const data = await res.json();
      if (data.success) {
        setPendingSchedules(data.data || []);
      }
    } catch (_) {}
  };

  // Hủy lịch đăng
  const handleCancelPendingSchedule = async (id) => {
    try {
      const res = await fetch(`/api/posting-schedules/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('Đã hủy lịch đăng thành công!', 'success');
        fetchPendingSchedules();
      }
    } catch (err) {
      addToast('Lỗi hủy lịch: ' + err.message, 'error');
    }
  };

  // ------------------ MỤC 3: KẾT NỐI LAPTOP & NHẬT KÝ ------------------
  const [chromeStatus, setChromeStatus] = useState({ connected: false, isOnline: false });
  const isChromeConnected = Boolean(chromeStatus?.connected || chromeStatus?.isOnline);
  const [isCheckingChrome, setIsCheckingChrome] = useState(false);
  const [isLaunchingChrome, setIsLaunchingChrome] = useState(false);
  // Danh sách lịch sử bài đăng thực tế (khởi tạo rỗng con số 0)
  const [postHistory, setPostHistory] = useState([]);

  // ------------------ CHATBOT NỔI (FLOATING BUBBLE) ------------------
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Chào bạn! Tôi là Trợ lý AI BĐS chạy bằng Groq Llama-3.3-70B. Bạn cần tôi viết bài bán nhà, đất nền, căn hộ hay giật tít hấp dẫn?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatMessagesEndRef = useRef(null);

  // Lấy dữ liệu tiến độ hàng đợi nhiều nhóm chạy ngầm
  const fetchActiveQueue = async () => {
    try {
      const res = await fetch('/api/publish/queue/active');
      if (!res.ok) return;
      const data = await res.json();
      setActiveQueue(data);
    } catch (_) {}
  };

  // Dừng khẩn cấp hàng đợi
  const handleStopQueue = async (batchId) => {
    if (!batchId) return;
    setIsStoppingQueue(true);
    try {
      const res = await fetch(`/api/publish/queue/${batchId}/stop`, { method: 'POST' });
      const data = await res.json();
      addToast(data.message || 'Đã gửi lệnh dừng hàng đợi!', 'info');
      await fetchActiveQueue();
    } catch (err) {
      addToast('Lỗi dừng hàng đợi: ' + err.message, 'error');
    } finally {
      setIsStoppingQueue(false);
    }
  };

  useEffect(() => {
    checkChromeStation(true);
    fetchPendingSchedules();
    fetchActiveQueue();
    // Tự động kiểm tra trạng thái mỗi 3 giây
    const interval = setInterval(() => {
      checkChromeStation(true);
      fetchPendingSchedules();
      fetchActiveQueue();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  // ==================== XỬ LÝ ẢNH THỰC TẾ ====================
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const res = await fetch('/api/upload-photos', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.files) {
        setUploadedPhotos(prev => [...prev, ...data.files]);
        addToast(`Đã tải lên thành công ${data.count} ảnh thật vào kho!`, 'success');
      } else {
        addToast(data.error || 'Lỗi tải ảnh lên', 'error');
      }
    } catch (err) {
      addToast('Lỗi kết nối upload: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (idx) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== idx));
    if (selectedPhotoIndex === idx) setSelectedPhotoIndex(null);
  };

  const handleClearAllPhotos = () => {
    if (window.confirm('Bạn có chắc chắn muốn dọn sạch tất cả ảnh trong kho tạm?')) {
      setUploadedPhotos([]);
      setSelectedPhotoIndex(null);
    }
  };

  // ==================== TRẠM CHROME LAPTOP (PORT 9222) ====================
  const checkChromeStation = async (silent = false) => {
    setIsCheckingChrome(true);
    try {
      const res = await fetch('/api/chrome/status');
      const data = await res.json();
      setChromeStatus(data);
      const isConnected = Boolean(data.connected || data.isOnline);
      if (!silent) {
        if (isConnected) {
          addToast(`Trình duyệt Chrome trên Laptop ĐÃ KẾT NỐI (Port 9222 ${data.browser || ''})!`, 'success');
        } else {
          addToast('Chưa kết nối Chrome Laptop. Hãy bấm nút "Mở Chrome Laptop".', 'warning');
        }
      }
    } catch (err) {
      if (!silent) addToast('Lỗi kiểm tra trạm: ' + err.message, 'error');
    } finally {
      setIsCheckingChrome(false);
    }
  };

  const launchChromeStation = async () => {
    setIsLaunchingChrome(true);
    try {
      const res = await fetch('/api/chrome/launch', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Đã gửi lệnh mở Chrome Laptop thành công!', 'success');
        // Chờ 2.5s rồi tự động check lại
        setTimeout(() => checkChromeStation(true), 2500);
      } else {
        addToast(data.error || 'Không thể mở Chrome trên laptop.', 'error');
      }
    } catch (err) {
      addToast('Lỗi mở Chrome: ' + err.message, 'error');
    } finally {
      setIsLaunchingChrome(false);
    }
  };

  const [isOpeningFb, setIsOpeningFb] = useState(false);
  const handleOpenFacebookTab = async () => {
    setIsOpeningFb(true);
    try {
      const res = await fetch('/api/chrome/open-facebook', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Đã hiện cửa sổ Facebook trên Chrome! Vui lòng đăng nhập tài khoản tại đó.', 'success');
        // Tự động kiểm tra lại sau 4s
        setTimeout(() => checkChromeStation(true), 4000);
      } else {
        addToast(data.error || 'Lỗi mở Facebook', 'error');
      }
    } catch (err) {
      addToast('Lỗi: ' + err.message, 'error');
    } finally {
      setIsOpeningFb(false);
    }
  };

  // ==================== ĐĂNG BÀI THẬT (DIRECT POST & MULTI-GROUP QUEUE) ====================
  const handleDirectPost = async () => {
    if (parsedGroupUrls.length === 0) {
      addToast('Vui lòng nhập ít nhất 1 Link Nhóm Facebook hợp lệ!', 'error');
      return;
    }

    const imageFilenames = uploadedPhotos.map(p => p.filename || p.path || p.url);
    const postRecordId = 'post-' + Date.now();
    const submissionTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. CHẾ ĐỘ LÊN LỊCH NHIỀU KHUNG GIỜ VỚI NỘI DUNG RIÊNG TỪNG GIỜ
    if (postTimingMode === 'multi_schedule') {
      const validSlots = timeSlots.filter(s => s.time && s.content && s.content.trim());
      if (validSlots.length === 0) {
        addToast('Vui lòng thiết lập ít nhất 1 khung giờ và nội dung hợp lệ!', 'error');
        return;
      }

      setIsPosting(true);
      setPostingProgress(`Đang tạo lịch đăng tự động cho ${validSlots.length} khung giờ trên ${parsedGroupUrls.length} nhóm...`);
      setLastPostResult(null);

      try {
        const schedulesPayload = validSlots.map(s => ({
          scheduledTime: s.time,
          content: s.content.trim(),
          images: imageFilenames
        }));

        const res = await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupUrls: parsedGroupUrls,
            images: imageFilenames,
            schedules: schedulesPayload
          })
        });

        const data = await res.json();
        setLastPostResult(data);

        if (data.success) {
          addToast(`Đã lên lịch thành công cho ${data.count || validSlots.length} tác vụ trên ${parsedGroupUrls.length} nhóm!`, 'success');
          
          const newEntries = validSlots.map((slot, idx) => ({
            id: `${postRecordId}-${idx}`,
            time: submissionTime,
            groupUrl: `${parsedGroupUrls.length} nhóm BĐS`,
            contentSnippet: slot.content.trim().substring(0, 100) + (slot.content.length > 100 ? '...' : ''),
            imageCount: imageFilenames.length,
            mode: `Hẹn giờ (${slot.time.replace('T', ' ')})`,
            scheduledTime: slot.time,
            success: true,
            statusText: 'Đã lên lịch',
            error: null,
            screenshotUrl: null,
            postUrl: null
          }));

          setPostHistory(prev => [...newEntries, ...prev]);
          fetchPendingSchedules();
        } else {
          addToast(data.error || 'Lên lịch nhiều khung giờ thất bại.', 'error');
        }
      } catch (err) {
        addToast('Lỗi lên lịch: ' + err.message, 'error');
      } finally {
        setIsPosting(false);
        setPostingProgress('');
      }
      return;
    }

    // 2. CHẾ ĐỘ ĐĂNG NGAY HOẶC HẸN 1 KHUNG GIỜ (HỖ TRỢ QUEUE ĐA NHÓM)
    if (!postContent.trim()) {
      addToast('Vui lòng nhập nội dung bài viết trước khi đăng!', 'error');
      return;
    }
    if (postTimingMode === 'schedule' && !scheduledDateTime) {
      addToast('Vui lòng chọn thời gian hẹn giờ cụ thể!', 'error');
      return;
    }

    setIsPosting(true);
    setPostingProgress(parsedGroupUrls.length > 1 
      ? `Đang đẩy ${parsedGroupUrls.length} nhóm vào Hàng đợi và khởi động Chrome...` 
      : 'Đang gửi lệnh đăng bài tới Chrome Laptop...');
    setLastPostResult(null);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupUrls: parsedGroupUrls,
          content: postContent.trim(),
          images: imageFilenames,
          delayMin: Number(delayMin) || 90,
          delayMax: Number(delayMax) || 180,
          autoSpin: Boolean(autoSpin),
          scheduledTime: postTimingMode === 'schedule' ? scheduledDateTime : null
        })
      });

      const data = await res.json();
      setLastPostResult(data);

      if (data.isQueue) {
        addToast(`🚀 Đã kích hoạt Hàng đợi đăng ${data.totalGroups} nhóm tự động! Tự động giãn cách an toàn chống spam.`, 'success');
        await fetchActiveQueue();

        const newHistoryItem = {
          id: postRecordId,
          time: submissionTime,
          groupUrl: `${data.totalGroups} nhóm Facebook (Hàng đợi)`,
          contentSnippet: postContent.trim().substring(0, 100) + (postContent.length > 100 ? '...' : ''),
          imageCount: imageFilenames.length,
          mode: `Hàng đợi (${data.totalGroups} nhóm | Nghỉ ${data.delayMin}-${data.delayMax}s)`,
          scheduledTime: null,
          success: true,
          statusText: 'Đang chạy hàng đợi',
          error: null,
          screenshotUrl: null,
          postUrl: null
        };
        setPostHistory(prev => [newHistoryItem, ...prev]);
      } else {
        const errSsMatch = data.error?.match(/error-publish-[0-9]+\.png/);
        const ssUrl = data.screenshotUrl || (errSsMatch ? `/logs/errors/${errSsMatch[0]}` : null);

        const newHistoryItem = {
          id: postRecordId,
          time: submissionTime,
          groupUrl: parsedGroupUrls[0],
          contentSnippet: postContent.trim().substring(0, 100) + (postContent.length > 100 ? '...' : ''),
          imageCount: imageFilenames.length,
          mode: postTimingMode === 'schedule' ? 'Hẹn 1 giờ' : 'Đăng ngay',
          scheduledTime: postTimingMode === 'schedule' ? scheduledDateTime : null,
          success: data.success,
          statusText: data.success ? (data.isScheduled ? 'Đã lên lịch' : 'Thành công') : 'Thất bại',
          error: data.error || null,
          screenshotUrl: ssUrl,
          postUrl: data.post_url || null
        };

        setPostHistory(prev => [newHistoryItem, ...prev]);

        if (data.success) {
          if (data.isScheduled) {
            addToast(data.message || 'Đã lên lịch đăng bài thành công!', 'success');
            fetchPendingSchedules();
          } else {
            addToast('Đã đăng bài thành công lên Facebook trên laptop của bạn!', 'success');
          }
        } else {
          addToast(data.error || 'Đăng bài thất bại.', 'error');
        }
      }
    } catch (err) {
      addToast('Lỗi thực thi: ' + err.message, 'error');
      setLastPostResult({ success: false, error: err.message });
      setPostHistory(prev => [
        {
          id: postRecordId,
          time: submissionTime,
          groupUrl: `${parsedGroupUrls.length} nhóm`,
          contentSnippet: postContent.trim().substring(0, 100),
          imageCount: imageFilenames.length,
          mode: postTimingMode === 'schedule' ? 'Hẹn 1 giờ' : 'Đăng ngay',
          success: false,
          statusText: 'Lỗi mạng/hệ thống',
          error: err.message
        },
        ...prev
      ]);
    } finally {
      setIsPosting(false);
      setPostingProgress('');
    }
  };

  // ==================== CHATBOT GROQ API ====================
  const handleSendChatMessage = async (presetText = null) => {
    const text = presetText || chatInput;
    if (!text.trim() || chatLoading) return;

    const newMsgs = [...chatMessages, { role: 'user', content: text.trim() }];
    setChatMessages(newMsgs);
    if (!presetText) setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setChatMessages([...newMsgs, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages([...newMsgs, { role: 'assistant', content: 'Lỗi phản hồi từ Groq API: ' + (data.error || 'Vui lòng thử lại.') }]);
      }
    } catch (err) {
      setChatMessages([...newMsgs, { role: 'assistant', content: 'Lỗi kết nối Groq: ' + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleInsertContentFromAI = (text) => {
    setPostContent(prev => {
      if (!prev.trim()) return text;
      return `${prev}\n\n${text}`;
    });
    setActiveTab('composer'); // Tự động chuyển ngay sang Mục 2 để người dùng nhìn thấy
    addToast('Đã chèn nội dung vào Mục 2 (Soạn bài)!', 'success');
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* ======================================================== */}
      {/* THANH CÔNG CỤ ĐIỀU HƯỚNG BÊN TRÁI (LEFT SIDEBAR)         */}
      {/* ======================================================== */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-xl">
              B
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-wide leading-tight">BĐS Studio</h1>
              <p className="text-xs text-slate-400">Tự Động Đăng Bài Facebook</p>
            </div>
          </div>
        </div>

        {/* 3 Mục điều hướng chính */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab('photos')}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-medium text-sm transition-all text-left ${
              activeTab === 'photos'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-semibold'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className={`p-2 rounded-lg ${activeTab === 'photos' ? 'bg-emerald-700/60' : 'bg-slate-800'}`}>
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div>Kho Ảnh & Tải Ảnh Lên</div>
              <div className="text-[11px] opacity-75 font-normal">
                {uploadedPhotos.length > 0 ? `${uploadedPhotos.length} ảnh đã sẵn sàng` : 'Chưa có ảnh nào'}
              </div>
            </div>
            {uploadedPhotos.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-400 text-slate-950 font-bold">
                {uploadedPhotos.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('composer')}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-medium text-sm transition-all text-left ${
              activeTab === 'composer'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-semibold'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className={`p-2 rounded-lg ${activeTab === 'composer' ? 'bg-emerald-700/60' : 'bg-slate-800'}`}>
              <FileEdit className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div>Soạn Bài & Lên Lịch</div>
              <div className="text-[11px] opacity-75 font-normal">Link nhóm, nội dung & hẹn giờ</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('chrome-logs')}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-medium text-sm transition-all text-left ${
              activeTab === 'chrome-logs'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-semibold'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className={`p-2 rounded-lg ${activeTab === 'chrome-logs' ? 'bg-emerald-700/60' : 'bg-slate-800'}`}>
              <Laptop className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div>Kết Nối Chrome & Nhật Ký</div>
              <div className="text-[11px] opacity-75 font-normal">Trạm Port 9222 & lịch sử đăng</div>
            </div>
            {postHistory.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-200 font-bold">
                {postHistory.length}
              </span>
            )}
          </button>
        </nav>

        {/* Trạng thái Chrome tóm tắt ở đáy Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 font-medium">Trạm Chrome Laptop:</span>
              <span className={`w-2 h-2 rounded-full ${isChromeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            </div>
            <div className="text-xs font-semibold text-slate-200">
              {isChromeConnected ? `Port 9222: ĐÃ KẾT NỐI` : 'CHƯA KẾT NỐI'}
            </div>
            <button
              onClick={() => checkChromeStation(false)}
              disabled={isCheckingChrome}
              className="mt-2 w-full py-1.5 px-2 bg-slate-700 hover:bg-slate-600 rounded text-[11px] text-slate-200 font-medium flex items-center justify-center gap-1 transition"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingChrome ? 'animate-spin' : ''}`} />
              Kiểm tra nhanh
            </button>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* VÙNG NỘI DUNG CHÍNH (MAIN WORKSPACE AREA)                */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
        
        {/* Header trên cùng: Tiêu đề + Đèn báo Chrome Station */}
        <header className="h-16 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-wide">
              {activeTab === 'photos' && '🖼️ Kho Ảnh & Tải Ảnh Lên'}
              {activeTab === 'composer' && '✍️ Soạn Nội Dung & Lên Lịch Đăng'}
              {activeTab === 'chrome-logs' && '💻 Kết Nối Chrome Laptop (Port 9222) & Nhật Ký Đăng'}
            </h2>
          </div>

          {/* Đèn báo trạng thái Chrome 9222 luôn hiển thị ở Header */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActiveTab('chrome-logs')}
              className={`cursor-pointer px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition ${
                isChromeConnected
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title="Bấm để mở trang Quản lý Trạm Chrome Laptop"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isChromeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{isChromeConnected ? '🟢 Chrome 9222: Đã kết nối' : '🟡 Chrome 9222: Chưa kết nối'}</span>
            </div>

            {/* Nút hỗ trợ mở Chatbot nổi */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition border border-slate-700"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>AI BĐS</span>
            </button>
          </div>
        </header>

        {/* Nội dung tab tương ứng */}
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* ======================================================== */}
          {/* MỤC 1: KHO ẢNH & TẢI ẢNH LÊN                             */}
          {/* ======================================================== */}
          {activeTab === 'photos' && (
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Thẻ Upload Kéo thả */}
              <div className="bg-slate-900 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center transition-all bg-gradient-to-b from-slate-900 to-slate-900/60">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="real-photo-upload-input"
                />

                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Tải ảnh thực tế từ máy tính</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Ảnh sẽ được lưu trực tiếp vào thư mục máy chủ <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">./uploads/</code> để đăng bài
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <label
                      htmlFor="real-photo-upload-input"
                      className={`cursor-pointer px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition ${
                        isUploading ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang lưu ảnh vào máy tính...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Chọn nhiều ảnh (JPG, PNG, WebP)</span>
                        </>
                      )}
                    </label>

                    {uploadedPhotos.length > 0 && (
                      <button
                        onClick={handleClearAllPhotos}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800 text-sm font-medium transition"
                      >
                        Xóa tất cả ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Lưới hiển thị danh sách ảnh */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">Danh sách ảnh trong kho ({uploadedPhotos.length})</span>
                    <span className="text-xs text-slate-400">• Click vào ảnh để xem kích thước lớn</span>
                  </div>

                  {uploadedPhotos.length > 0 && (
                    <button
                      onClick={() => setActiveTab('composer')}
                      className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <span>Dùng bộ ảnh này để Soạn bài</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {uploadedPhotos.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                    <ImageIcon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                    <p className="font-medium text-slate-300">Kho ảnh hiện tại hoàn toàn trống</p>
                    <p className="text-xs text-slate-500 mt-1">Bấm nút "Chọn nhiều ảnh" ở trên để tải ảnh căn hộ, nhà phố thật của bạn lên.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {uploadedPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-xl overflow-hidden shadow-sm transition-all"
                      >
                        <div
                          className="aspect-square bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer"
                          onClick={() => setSelectedPhotoIndex(idx)}
                        >
                          <img
                            src={photo.url}
                            alt={photo.originalname || `Photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>

                        {/* Thứ tự ảnh */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-[11px] font-bold text-emerald-400 border border-slate-800">
                          #{idx + 1}
                        </div>

                        {/* Nút xóa ảnh */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(idx);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow-md"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="p-2 text-[11px] text-slate-400 truncate bg-slate-900 border-t border-slate-800">
                          {photo.originalname || photo.filename}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal xem trước ảnh lớn */}
              {selectedPhotoIndex !== null && uploadedPhotos[selectedPhotoIndex] && (
                <div
                  className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
                  onClick={() => setSelectedPhotoIndex(null)}
                >
                  <div className="relative max-w-4xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                      <span className="text-sm font-semibold text-white">
                        Ảnh #{selectedPhotoIndex + 1}: {uploadedPhotos[selectedPhotoIndex].originalname}
                      </span>
                      <button
                        onClick={() => setSelectedPhotoIndex(null)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-4 flex items-center justify-center bg-black">
                      <img
                        src={uploadedPhotos[selectedPhotoIndex].url}
                        alt="Zoomed"
                        className="max-h-[65vh] max-w-full object-contain rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MỤC 2: SOẠN BÀI & LÊN LỊCH ĐĂNG                          */}
          {/* ======================================================== */}
          {activeTab === 'composer' && (
            <div className="max-w-5xl mx-auto space-y-6">
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 space-y-6">
                
                {/* 1. Danh sách Nhóm Facebook mục tiêu (Multi-Group Queue) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-emerald-400" />
                      <span>1. Danh sách Nhóm Facebook mục tiêu (Multi-Group Queue):</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-600/50">
                        {parsedGroupUrls.length} nhóm hợp lệ
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:inline">Không giới hạn số lượng</span>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={groupUrlsText}
                    onChange={(e) => setGroupUrlsText(e.target.value)}
                    placeholder="Dán danh sách các link nhóm Facebook vào đây (mỗi dòng 1 link nhóm). Ví dụ:&#10;https://www.facebook.com/groups/1857977624574831&#10;https://www.facebook.com/groups/batdongsanhanoi...&#10;Hệ thống hỗ trợ KHÔNG GIỚI HẠN số lượng nhóm, tự động đăng tuần tự và chống spam!"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs font-mono focus:outline-hidden focus:border-emerald-500 transition leading-relaxed"
                  />

                  {/* Nút nạp nhóm nhanh */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400 text-[11px]">Nạp nhanh nhóm mẫu:</span>
                      <button
                        type="button"
                        onClick={() => handleAddSampleGroups(SAMPLE_KHAISON_GROUPS)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                      >
                        + 5 nhóm Khai Sơn City
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSampleGroups(SAMPLE_HANOI_GROUPS)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                      >
                        + 5 nhóm BĐS Hà Nội
                      </button>
                    </div>
                    {groupUrlsText.trim() && (
                      <button
                        type="button"
                        onClick={() => setGroupUrlsText('')}
                        className="text-slate-400 hover:text-rose-400 text-xs transition"
                      >
                        Xóa danh sách link
                      </button>
                    )}
                  </div>

                  {/* BẢNG CẤU HÌNH CHỐNG KHÓA NICK (ANTI-SPAM BATCHING & GROQ SPIN) */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Cơ chế bảo vệ tài khoản & Chống khóa nick khi đăng &gt;10 nhóm</span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-mono">Anti-Spam Engine Active</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Giãn cách thông minh */}
                      <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                        <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Timer className="w-3.5 h-3.5 text-amber-400" />
                            Giãn cách thông minh (Smart Delay):
                          </span>
                          <span className="text-[11px] text-amber-400 font-mono">{delayMin}s - {delayMax}s</span>
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Nghỉ ngẫu nhiên giữa 2 nhóm liên tiếp để mô phỏng người thật thao tác.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <div className="flex-1 flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-700 text-xs text-white">
                            <span className="text-slate-400 text-[10px]">Từ:</span>
                            <input
                              type="number"
                              min={10}
                              max={600}
                              value={delayMin}
                              onChange={(e) => setDelayMin(Math.max(10, parseInt(e.target.value) || 10))}
                              className="w-12 bg-transparent text-white font-mono text-xs focus:outline-hidden text-center"
                            />
                            <span className="text-slate-400 text-[10px]">giây</span>
                          </div>
                          <span className="text-slate-500 text-xs">→</span>
                          <div className="flex-1 flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-700 text-xs text-white">
                            <span className="text-slate-400 text-[10px]">Đến:</span>
                            <input
                              type="number"
                              min={20}
                              max={900}
                              value={delayMax}
                              onChange={(e) => setDelayMax(Math.max(delayMin, parseInt(e.target.value) || 180))}
                              className="w-12 bg-transparent text-white font-mono text-xs focus:outline-hidden text-center"
                            />
                            <span className="text-slate-400 text-[10px]">giây</span>
                          </div>
                        </div>
                      </div>

                      {/* Groq AI Micro-Spin */}
                      <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                        <div>
                          <label className="cursor-pointer flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={autoSpin}
                              onChange={(e) => setAutoSpin(e.target.checked)}
                              className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500"
                            />
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                Tự động biến tấu Groq AI (Micro-Spin)
                              </span>
                              <p className="text-[11px] text-slate-400 leading-tight">
                                Tự động đảo nhẹ câu chào & icon cho từng nhóm để mỗi nhóm là 1 mã băm khác nhau, giữ nguyên 100% giá, diện tích & SĐT.
                              </p>
                            </div>
                          </label>
                        </div>
                        <div className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Mô hình: Groq Llama-3.3-70b-versatile
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Khung soạn thảo bài viết */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-white">
                      2. Nội dung bài viết BĐS:
                    </label>
                    <button
                      onClick={() => setIsChatOpen(true)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Nhờ Trợ lý AI viết hộ</span>
                    </button>
                  </div>
                  <textarea
                    rows={10}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Nhập tiêu đề, mô tả căn hộ/nhà đất, diện tích, giá bán, tiện ích và số điện thoại liên hệ..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-500 transition leading-relaxed font-sans"
                  />
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Số ký tự: {postContent.length}</span>
                    <button
                      onClick={() => setPostContent('')}
                      className="hover:text-rose-400 transition"
                    >
                      Làm rỗng ô soạn thảo
                    </button>
                  </div>
                </div>

                {/* 3. Dải ảnh đính kèm từ Mục 1 */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Ảnh đính kèm sẽ đăng cùng bài ({uploadedPhotos.length} ảnh):
                    </label>
                    <button
                      onClick={() => setActiveTab('photos')}
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Thêm hoặc quản lý ảnh ở Mục 1</span>
                    </button>
                  </div>

                  {uploadedPhotos.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                      <span>Chưa có ảnh nào được tải lên. Bài viết sẽ được đăng dưới dạng chỉ có văn bản (Text only).</span>
                      <button
                        onClick={() => setActiveTab('photos')}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium"
                      >
                        Tải ảnh ngay
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1">
                      {uploadedPhotos.map((p, idx) => (
                        <div key={idx} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                          <img src={p.url} alt={`img-${idx}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 hover:bg-rose-600 rounded text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Tùy chọn thời gian đăng */}
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-white">3. Thời gian đăng bài & Khung giờ:</label>
                    <span className="text-xs text-emerald-400 font-medium">Hỗ trợ hẹn nhiều giờ với nội dung chuyên biệt</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label
                      onClick={() => setPostTimingMode('now')}
                      className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition ${
                        postTimingMode === 'now'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="timing"
                        checked={postTimingMode === 'now'}
                        onChange={() => setPostTimingMode('now')}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="font-semibold text-xs text-white">🚀 Đăng ngay</div>
                        <div className="text-[11px] text-slate-400">Đăng tức thì qua Chrome</div>
                      </div>
                    </label>

                    <label
                      onClick={() => setPostTimingMode('schedule')}
                      className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition ${
                        postTimingMode === 'schedule'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="timing"
                        checked={postTimingMode === 'schedule'}
                        onChange={() => setPostTimingMode('schedule')}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="font-semibold text-xs text-white">⏰ Hẹn 1 khung giờ</div>
                        <div className="text-[11px] text-slate-400">Đăng 1 bài vào 1 giờ cụ thể</div>
                      </div>
                    </label>

                    <label
                      onClick={() => setPostTimingMode('multi_schedule')}
                      className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition relative overflow-hidden ${
                        postTimingMode === 'multi_schedule'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="absolute top-1 right-2 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">
                        ĐỀ XUẤT
                      </div>
                      <input
                        type="radio"
                        name="timing"
                        checked={postTimingMode === 'multi_schedule'}
                        onChange={() => setPostTimingMode('multi_schedule')}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="font-semibold text-xs text-white">📅 Nhiều khung giờ</div>
                        <div className="text-[11px] text-slate-400">Từng giờ có nội dung riêng</div>
                      </div>
                    </label>
                  </div>

                  {/* Khi chọn Hẹn 1 khung giờ */}
                  {postTimingMode === 'schedule' && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <label className="block text-xs font-semibold text-slate-300">Chọn ngày & giờ hẹn đăng:</label>
                      <input
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                      />
                    </div>
                  )}

                  {/* KHI CHỌN NHIỀU KHUNG GIỜ VỚI NỘI DUNG RIÊNG TỪNG GIỜ */}
                  {postTimingMode === 'multi_schedule' && (
                    <div className="p-5 bg-slate-950 rounded-2xl border border-emerald-500/30 space-y-5">
                      {/* Thanh công cụ quản lý khung giờ */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">Ngày áp dụng:</span>
                          <input
                            type="date"
                            value={targetScheduleDate}
                            onChange={(e) => handleDateChangeForSlots(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-semibold focus:outline-hidden focus:border-emerald-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApplyGoldenHours()}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>⚡ Nạp 4 Khung giờ vàng BĐS</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAddTimeSlot}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm khung giờ</span>
                          </button>
                        </div>
                      </div>

                      {/* Hướng dẫn ngắn */}
                      <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                        <Timer className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Mỗi khung giờ dưới đây sẽ tự động đăng bài theo đúng giờ đã hẹn với nội dung tùy chỉnh riêng biệt, giúp bạn tiếp cận nhiều tệp khách khác nhau trong ngày mà không bị Facebook quét trùng lặp bài.</span>
                      </div>

                      {/* Danh sách từng khung giờ & nội dung */}
                      <div className="space-y-4">
                        {timeSlots.map((slot, index) => (
                          <div key={slot.id} className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-slate-700 space-y-3 transition">
                            
                            {/* Tiêu đề & Giờ hẹn của slot */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/50 flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </span>
                                <input
                                  type="text"
                                  value={slot.label}
                                  onChange={(e) => handleUpdateTimeSlot(slot.id, 'label', e.target.value)}
                                  className="bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-hidden px-1 py-0.5 rounded"
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    type="datetime-local"
                                    value={slot.time}
                                    onChange={(e) => handleUpdateTimeSlot(slot.id, 'time', e.target.value)}
                                    className="bg-transparent text-xs text-white focus:outline-hidden"
                                  />
                                </div>

                                {timeSlots.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTimeSlot(slot.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                                    title="Xóa khung giờ này"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Thanh thao tác nhanh cho nội dung */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="text-slate-400 font-medium text-[11px]">Nội dung riêng cho khung giờ này:</span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleCopyMainContentToSlot(slot.id)}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 border border-slate-700"
                                  title="Sao chép nội dung từ ô soạn thảo chính ở trên"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Lấy từ bài chính</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleApplyHookToSlot(slot.id, '[CHÀO BUỔI SÁNG CẢ NHÀ 🌅]')}
                                  className="px-2 py-0.5 rounded bg-amber-950/50 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 text-[11px]"
                                >
                                  Hook Sáng
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleApplyHookToSlot(slot.id, '[NGHỈ TRƯA XEM NHÀ NHANH 🍽️]')}
                                  className="px-2 py-0.5 rounded bg-orange-950/50 hover:bg-orange-900/50 text-orange-300 border border-orange-800/40 text-[11px]"
                                >
                                  Hook Trưa
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleApplyHookToSlot(slot.id, '[CÀ PHÊ CHIỀU XEM CĂN ĐẸP ☕]')}
                                  className="px-2 py-0.5 rounded bg-amber-950/50 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 text-[11px]"
                                >
                                  Hook Chiều
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleApplyHookToSlot(slot.id, '[TỐI THẢNH THƠI CHỌN CĂN ĐẸP 🌙]')}
                                  className="px-2 py-0.5 rounded bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800/40 text-[11px]"
                                >
                                  Hook Tối
                                </button>
                              </div>
                            </div>

                            {/* Ô nhập nội dung riêng cho slot */}
                            <textarea
                              rows={4}
                              value={slot.content}
                              onChange={(e) => handleUpdateTimeSlot(slot.id, 'content', e.target.value)}
                              placeholder="Nhập nội dung phù hợp cho khung giờ này..."
                              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 transition leading-relaxed font-sans"
                            />

                            <div className="flex justify-between items-center text-[11px] text-slate-500">
                              <span>Số ký tự: {slot.content.length}</span>
                              <span className="text-emerald-400/80">Ảnh đính kèm: Đăng cùng {uploadedPhotos.length} ảnh đã chọn ở Mục 1</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Nút bấm Đăng Bài Ngay */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-400">
                    {isChromeConnected ? (
                      <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Trạm Chrome 24/24 đã sẵn sàng nhận lệnh ({chromeStatus?.browser || 'Chrome'})
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-4 h-4" />
                        Trạm Chrome chưa bật (hệ thống sẽ tự động bật khi bạn bấm đăng)
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleDirectPost}
                    disabled={isPosting}
                    className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base shadow-xl transition-all flex items-center justify-center gap-3 ${
                      isPosting
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-[1.02]'
                    }`}
                  >
                    {isPosting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>{postingProgress || 'Đang thực hiện đăng bài...'}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-current" />
                        <span>
                          {postTimingMode === 'multi_schedule'
                            ? `📅 LÊN LỊCH ĐĂNG CHO ${timeSlots.length} KHUNG GIỜ (${parsedGroupUrls.length} NHÓM)`
                            : postTimingMode === 'schedule'
                            ? `⏰ HẸN GIỜ ĐĂNG CHO ${parsedGroupUrls.length} NHÓM`
                            : parsedGroupUrls.length > 1
                            ? `🚀 BẮT ĐẦU ĐĂNG ${parsedGroupUrls.length} NHÓM (HÀNG ĐỢI TỰ ĐỘNG)`
                            : '🚀 ĐĂNG BÀI NGAY BẰNG CHROME LAPTOP'}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* TIẾN ĐỘ HÀNG ĐỢI CHẠY NGẦM (MULTI-GROUP QUEUE PROGRESS) */}
                {activeQueue?.batch && (
                  <div className={`p-5 rounded-2xl border transition-all ${
                    activeQueue.batch.status === 'running'
                      ? 'bg-emerald-950/30 border-emerald-500/70 shadow-xl shadow-emerald-950/40'
                      : activeQueue.batch.status === 'stopped'
                      ? 'bg-amber-950/30 border-amber-600/60'
                      : activeQueue.batch.status === 'completed'
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-rose-950/30 border-rose-600/60'
                  }`}>
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full ${
                          activeQueue.batch.status === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                        }`} />
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <span>Tiến độ Hàng đợi đăng đa nhóm:</span>
                          <span className="font-mono text-emerald-300">
                            {activeQueue.batch.completed_groups + activeQueue.batch.failed_groups}/{activeQueue.batch.total_groups} nhóm
                          </span>
                        </h4>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase font-mono tracking-wider border ${
                          activeQueue.batch.status === 'running'
                            ? 'bg-emerald-900/60 text-emerald-300 border-emerald-600/60'
                            : activeQueue.batch.status === 'stopped'
                            ? 'bg-amber-900/60 text-amber-300 border-amber-600/60'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {activeQueue.batch.status === 'running' ? 'Đang chạy ngầm' : activeQueue.batch.status === 'stopped' ? 'Đã dừng' : 'Hoàn tất'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold font-mono text-emerald-400">
                          {Math.round(((activeQueue.batch.completed_groups + activeQueue.batch.failed_groups) / Math.max(1, activeQueue.batch.total_groups)) * 100)}%
                        </span>

                        {activeQueue.batch.status === 'running' && (
                          <button
                            type="button"
                            onClick={() => handleStopQueue(activeQueue.batch.id)}
                            disabled={isStoppingQueue}
                            className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
                          >
                            <StopCircle className="w-3.5 h-3.5" />
                            <span>{isStoppingQueue ? 'Đang dừng...' : 'Dừng khẩn cấp'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden mb-3 border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${Math.round(((activeQueue.batch.completed_groups + activeQueue.batch.failed_groups) / Math.max(1, activeQueue.batch.total_groups)) * 100)}%`
                        }}
                      />
                    </div>

                    {/* Current Step Description & Countdown */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 mb-3">
                      <div className="flex items-center gap-2">
                        {activeQueue.batch.status === 'running' ? (
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="font-medium text-slate-200">{activeQueue.batch.current_step || 'Đang chờ tác vụ...'}</span>
                      </div>
                      {activeQueue.batch.remainingDelaySeconds > 0 && (
                        <span className="font-mono text-amber-400 font-bold bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/60 flex items-center gap-1.5">
                          <Timer className="w-3 h-3 text-amber-400" />
                          <span>Nghỉ chống spam: còn {activeQueue.batch.remainingDelaySeconds}s</span>
                        </span>
                      )}
                    </div>

                    {/* Items Scroll List */}
                    {activeQueue.items && activeQueue.items.length > 0 && (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {activeQueue.items.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs hover:border-slate-700 transition"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-mono shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-white truncate font-mono text-[11px]" title={item.group_url}>
                                  {item.group_url}
                                </div>
                                {item.spun_content && (
                                  <div className="text-[10px] text-slate-400 truncate italic">
                                    {item.spun_content.substring(0, 70)}...
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.status === 'success' && (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[10px] font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Thành công
                                </span>
                              )}
                              {item.status === 'posting' && (
                                <span className="px-2.5 py-1 rounded-lg bg-sky-950 text-sky-300 border border-sky-800/60 text-[10px] font-semibold flex items-center gap-1 animate-pulse">
                                  <RefreshCw className="w-3 h-3 animate-spin" /> Đang đăng...
                                </span>
                              )}
                              {item.status === 'pending' && (
                                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-400 text-[10px]">
                                  Chờ lượt
                                </span>
                              )}
                              {item.status === 'failed' && (
                                <span className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800/60 text-[10px] font-semibold flex items-center gap-1" title={item.error_message}>
                                  <AlertTriangle className="w-3 h-3" /> Lỗi
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Báo cáo kết quả bài đăng */}
                {lastPostResult && (
                  <div className={`p-5 rounded-2xl border text-sm transition-all ${
                    lastPostResult.success
                      ? 'bg-emerald-950/40 border-emerald-600 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-600 text-rose-200'
                  }`}>
                    <div className="font-bold flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {lastPostResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
                        <span className="text-base">{lastPostResult.success ? 'Đăng bài thành công!' : 'Đăng bài thất bại'}</span>
                      </div>
                      
                      {!lastPostResult.success && (
                        <button
                          onClick={handleOpenFacebookTab}
                          disabled={isOpeningFb}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isOpeningFb ? 'Đang mở...' : 'Mở Facebook Đăng Nhập Ngay'}</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs opacity-90 leading-relaxed">{lastPostResult.message || lastPostResult.error}</p>

                    {/* HIỂN THỊ TRỰC TIẾP ẢNH LỖI NẾU CÓ */}
                    {(() => {
                      const ssMatch = lastPostResult.error?.match(/error-publish-[0-9]+\.png/);
                      const ssUrl = lastPostResult.screenshotUrl || (ssMatch ? `/logs/errors/${ssMatch[0]}` : null);
                      if (!ssUrl) return null;
                      return (
                        <div className="mt-4 pt-4 border-t border-rose-800/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                              📸 Ảnh chụp màn hình Chrome lúc gặp sự cố:
                            </span>
                            <a
                              href={ssUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-rose-300 hover:underline flex items-center gap-1"
                            >
                              <span>Xem ảnh gốc</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="rounded-xl overflow-hidden border border-rose-800 bg-black/80 max-h-96 overflow-y-auto">
                            <img
                              src={ssUrl}
                              alt="Ảnh chụp lỗi từ Chrome"
                              className="w-full object-contain"
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {lastPostResult.post_url && (
                      <a
                        href={lastPostResult.post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-emerald-300 underline"
                      >
                        <span>Mở bài viết trên Facebook</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MỤC 3: KẾT NỐI CHROME LAPTOP & NHẬT KÝ ĐĂNG              */}
          {/* ======================================================== */}
          {activeTab === 'chrome-logs' && (
            <div className="max-w-5xl mx-auto space-y-8">
              
              {/* Thẻ Quản Lý Trạm Chrome */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                      isChromeConnected
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      <Radio className={`w-6 h-6 ${isChromeConnected ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Trạm Google Chrome Laptop (Port 9222)</h3>
                      <p className="text-xs text-slate-400">Trình duyệt Chrome thật chạy nền với hồ sơ độc lập</p>
                    </div>
                  </div>

                  {/* Nút bấm điều khiển */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={launchChromeStation}
                      disabled={isLaunchingChrome}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>{isLaunchingChrome ? 'Đang mở Chrome...' : 'Khởi động Chrome Trạm 24/24'}</span>
                    </button>

                    <button
                      onClick={() => checkChromeStation(false)}
                      disabled={isCheckingChrome}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCheckingChrome ? 'animate-spin' : ''}`} />
                      <span>Kiểm tra</span>
                    </button>
                  </div>
                </div>

                {/* Thông số kỹ thuật & Trạng thái */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400">Trạng thái Chrome CDP:</span>
                    <div className="font-bold text-sm">
                      {isChromeConnected ? (
                        <span className="text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> ĐÃ KẾT NỐI (Port 9222)
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> CHƯA KẾT NỐI
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400">Cổng gỡ lỗi Debug Port:</span>
                    <div className="font-bold text-sm text-slate-200">
                      127.0.0.1:9222 (CDP)
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400">Trạng thái phiên:</span>
                    <div className="font-bold text-sm text-emerald-400">
                      Chrome Live Session sẵn sàng
                    </div>
                  </div>
                </div>

                {/* Hướng dẫn ngắn gọn */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Quy tắc vận hành an toàn 24/24:</span>
                  </div>
                  <p>1. Bấm nút "Khởi động Chrome Trạm 24/24" ở trên để mở một cửa sổ Chrome thật trên máy tính.</p>
                  <p>2. Đăng nhập tài khoản Facebook của bạn trên cửa sổ Chrome này 1 lần duy nhất, sau đó đóng tab Facebook đi để lại trang trắng <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded">about:blank</code>.</p>
                  <p>3. Trạm Chrome sẽ tiêu tốn dưới 50MB RAM và luôn sẵn sàng nhận lệnh đăng bài bất cứ lúc nào.</p>
                </div>
              </div>

              {/* HÀNG ĐỢI LỊCH ĐĂNG TỰ ĐỘNG (PENDING SCHEDULES) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-base">Hàng Đợi Lịch Đăng Tự Động (Đang chờ đến giờ)</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-950/80 text-amber-300 border border-amber-800/60 font-semibold">
                      {pendingSchedules.length} lịch chờ
                    </span>
                  </div>

                  <button
                    onClick={fetchPendingSchedules}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Làm mới</span>
                  </button>
                </div>

                {pendingSchedules.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
                    Hiện không có bài nào đang chờ đăng. Bạn có thể chọn "Nhiều khung giờ" ở Mục 2 để lên lịch tự động cho cả ngày.
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="p-3.5">Thời gian hẹn</th>
                            <th className="p-3.5">Nhóm đăng</th>
                            <th className="p-3.5">Nội dung riêng của khung giờ</th>
                            <th className="p-3.5 text-center">Trạng thái</th>
                            <th className="p-3.5 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {pendingSchedules.map((sched) => (
                            <tr key={sched.id} className="hover:bg-slate-800/40 transition">
                              <td className="p-3.5 font-mono text-emerald-300 font-semibold whitespace-nowrap">
                                {new Date(sched.scheduled_time).toLocaleString('vi-VN', {
                                  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                                })}
                              </td>
                              <td className="p-3.5 font-medium text-white max-w-[200px] truncate" title={sched.group_id}>
                                {sched.group_name || sched.group_id}
                              </td>
                              <td className="p-3.5 text-slate-300 max-w-[300px] truncate" title={sched.spun_content}>
                                {sched.spun_content}
                              </td>
                              <td className="p-3.5 text-center whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                                  Chờ đến giờ
                                </span>
                              </td>
                              <td className="p-3.5 text-right whitespace-nowrap">
                                <button
                                  onClick={() => handleCancelPendingSchedule(sched.id)}
                                  className="px-2.5 py-1 rounded bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-[11px] font-medium transition"
                                >
                                  Hủy lịch
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* BẢNG NHẬT KÝ ĐĂNG BÀI THỰC TẾ (Mặc định 0 bài) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-white text-base">Nhật Ký Đăng Bài Thực Tế</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 font-semibold">
                      {postHistory.length} bài đã thực hiện
                    </span>
                  </div>

                  {postHistory.length > 0 && (
                    <button
                      onClick={() => setPostHistory([])}
                      className="text-xs text-slate-400 hover:text-rose-400 transition"
                    >
                      Xóa nhật ký phiên
                    </button>
                  )}
                </div>

                {postHistory.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                    <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-medium text-slate-300">Chưa có bài đăng nào được thực hiện</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Khi bạn bấm "ĐĂNG BÀI NGAY" hoặc "LÊN LỊCH ĐĂNG" ở Mục 2, thông tin chi tiết về bài viết, nhóm đăng và kết quả thực tế từ trình duyệt Chrome sẽ được ghi nhận tại đây.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="p-3.5">Thời gian</th>
                            <th className="p-3.5">Nhóm Facebook</th>
                            <th className="p-3.5">Trích đoạn nội dung</th>
                            <th className="p-3.5 text-center">Ảnh</th>
                            <th className="p-3.5">Chế độ</th>
                            <th className="p-3.5">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {postHistory.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-800/40 transition">
                              <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">{item.time}</td>
                              <td className="p-3.5 font-medium text-white max-w-[200px] truncate" title={item.groupUrl}>
                                {item.groupUrl}
                              </td>
                              <td className="p-3.5 text-slate-400 max-w-[260px] truncate" title={item.contentSnippet}>
                                {item.contentSnippet}
                              </td>
                              <td className="p-3.5 text-center font-bold text-emerald-400">{item.imageCount}</td>
                              <td className="p-3.5 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  item.mode === 'Hẹn giờ' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60' : 'bg-slate-800 text-slate-300'
                                }`}>
                                  {item.mode}
                                </span>
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                {item.success ? (
                                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {item.statusText}
                                  </span>
                                ) : (
                                  <div className="flex flex-col">
                                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                      {item.statusText}
                                    </span>
                                    {item.error && (
                                      <span className="text-[10px] text-rose-300/80 max-w-[220px] truncate" title={item.error}>
                                        {item.error}
                                      </span>
                                    )}
                                    {item.screenshotUrl && (
                                      <a
                                        href={item.screenshotUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 mt-0.5"
                                      >
                                        <span>Xem ảnh lỗi</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* 2. CHATBOT GROQ NỔI: FLOATING ACTION BUTTON & POPOVER    */}
      {/* ======================================================== */}
      
      {/* Bong bóng thoại Popover khi mở */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] w-[400px] h-[550px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-120px)] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header Chatbot Popover */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <span>Trợ Lý AI BĐS</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h4>
                <p className="text-[10px] text-slate-400">Groq API • Llama-3.3-70B Siêu Tốc</p>
              </div>
            </div>

            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Đóng bong bóng thoại"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Khung gợi ý nhanh */}
          <div className="p-2.5 bg-slate-950/50 border-b border-slate-800/80 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSendChatMessage('Hãy viết bài bán căn hộ 2 phòng ngủ cao cấp, đầy đủ nội thất, view thoáng đẹp')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-700 border border-slate-700 rounded-lg text-slate-300 shrink-0 transition"
            >
              🏠 Bán căn hộ 2PN
            </button>
            <button
              onClick={() => handleSendChatMessage('Hãy viết bài bán nhà phố mặt tiền kinh doanh, sổ đỏ chính chủ, đường lớn')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-700 border border-slate-700 rounded-lg text-slate-300 shrink-0 transition"
            >
              🏘️ Bán nhà phố
            </button>
            <button
              onClick={() => handleSendChatMessage('Hãy viết bài bán đất nền phân lô, sổ đỏ trao tay, giá đầu tư sinh lời cao')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-700 border border-slate-700 rounded-lg text-slate-300 shrink-0 transition"
            >
              🌱 Bán đất nền
            </button>
            <button
              onClick={() => handleSendChatMessage('Tối ưu giật tít mở đầu hấp dẫn và câu kêu gọi hành động (CTA) cho bài đăng BĐS')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-700 border border-slate-700 rounded-lg text-slate-300 shrink-0 transition"
            >
              🔥 Giật tít & CTA
            </button>
          </div>

          {/* Vùng tin nhắn chat */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-900">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Nút chèn nội dung vào Mục 2 */}
                {msg.role === 'assistant' && idx > 0 && (
                  <button
                    onClick={() => handleInsertContentFromAI(msg.content)}
                    className="mt-1.5 px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-lg text-[11px] font-semibold border border-slate-700 flex items-center gap-1 transition"
                  >
                    <span>📋 Chèn vào khung nội dung</span>
                  </button>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-2 text-slate-400 p-2 text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>AI đang soạn bài...</span>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Khung nhập tin nhắn */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="Hỏi AI hoặc yêu cầu viết bài..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500"
            />
            <button
              onClick={() => handleSendChatMessage()}
              disabled={chatLoading || !chatInput.trim()}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Nút tròn nổi (Floating Action Button) hình ĐẦU ROBOT */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-slate-950 shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-2 border-white/20 group"
        title={isChatOpen ? 'Thu gọn Trợ lý AI' : 'Mở Trợ lý AI BĐS (Groq Llama 70B)'}
        style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
      >
        <div className="relative flex items-center justify-center">
          <Bot className="w-7 h-7 text-slate-950 group-hover:rotate-12 transition-transform" />
          {/* Vòng hào quang pulsing nếu chatbot đang đóng */}
          {!isChatOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-75"></span>
          )}
        </div>
      </button>

    </div>
  );
}
