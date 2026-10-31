import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Lock,
  ExternalLink,
  Clock,
  Layers,
  HelpCircle,
  Check,
  ShieldAlert,
  Smartphone,
  Eye,
  CheckCheck,
  Share2,
  AlertOctagon,
  XCircle,
  Info,
  Radio,
  Zap,
  ChevronDown,
  ChevronUp,
  Link2,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { useToast } from '../components/Toast';

function FacebookIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

export default function AccountPoolView() {
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  // Playwright Real Browser Authentication state (No OAuth / App ID required)
  const [isLaunchingBrowser, setIsLaunchingBrowser] = useState(false);
  const [browserStatus, setBrowserStatus] = useState(null);
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const [quickCookieInput, setQuickCookieInput] = useState('');
  const [isCheckingCookies, setIsCheckingCookies] = useState(false);
  const [isImportingCookie, setIsImportingCookie] = useState(false);

  // Dedicated "Tài khoản Facebook của tôi" Section state
  const [directFbToken, setDirectFbToken] = useState('');
  const [directFbName, setDirectFbName] = useState('');
  const [isDirectConnecting, setIsDirectConnecting] = useState(false);
  const [isPingingFb, setIsPingingFb] = useState(false);
  const [lastPingResult, setLastPingResult] = useState(null);
  const [showConnectForm, setShowConnectForm] = useState(false);

  // Phase 4: Local Chrome Station 24/24 states
  const [chromeStationStatus, setChromeStationStatus] = useState(null);
  const [isLaunchingStation, setIsLaunchingStation] = useState(false);
  const [isCheckingStation, setIsCheckingStation] = useState(false);

  // General add modal for other platforms (Batdongsan, Google Business)
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [newConn, setNewConn] = useState({
    platform: 'portal_batdongsan',
    connection_name: '',
    account_id: '',
    auth_method: 'api_token',
    raw_token: '',
    granted_permissions: ['listing.create', 'listing.update']
  });

  useEffect(() => {
    fetchAccounts();
    checkChromeStationStatus();
  }, []);

  const checkChromeStationStatus = async (silent = true) => {
    setIsCheckingStation(true);
    try {
      const res = await fetch('http://localhost:3001/api/accounts/chrome-station/status');
      const data = await res.json();
      setChromeStationStatus(data);
      if (!silent) {
        if (data.isOnline) {
          addToast(data.statusText || 'Trạm Chrome 24/24: ONLINE & SẴN SÀNG', 'success');
        } else {
          addToast(data.message || 'Trạm Chrome đang OFFLINE', 'warning');
        }
      }
    } catch (err) {
      if (!silent) addToast('Không thể kết nối máy chủ kiểm tra: ' + err.message, 'error');
    } finally {
      setIsCheckingStation(false);
    }
  };

  const handleLaunchChromeStation = async () => {
    setIsLaunchingStation(true);
    try {
      addToast('Đang khởi chạy Google Chrome thật (port 9222, dir C:\\bds_chrome_station)...', 'info');
      const res = await fetch('http://localhost:3001/api/accounts/chrome-station/launch', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Khởi động Trạm Chrome 24/24 thành công!', 'success');
        setChromeStationStatus(data);
      } else {
        addToast(data.error || 'Lỗi khởi động Chrome', 'error');
      }
    } catch (err) {
      addToast('Lỗi: ' + err.message, 'error');
    } finally {
      setIsLaunchingStation(false);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/accounts');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data || []);
      }
    } catch (err) {
      addToast('Lỗi khi tải danh sách tài khoản: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Launch Playwright Real Chromium Browser (headless: false, no OAuth/App ID)
  const handleLaunchBrowser = async () => {
    setIsLaunchingBrowser(true);
    setShowBrowserModal(true);
    setBrowserStatus({
      status: 'opening',
      isBrowserOpen: true,
      message: 'Đang mở cửa sổ trình duyệt Chromium tại https://www.facebook.com/ ...'
    });

    try {
      const res = await fetch('http://localhost:3001/api/accounts/launch-browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Trình duyệt Facebook đã mở!', 'info');
        setBrowserStatus({
          status: 'waiting_for_login',
          isBrowserOpen: true,
          message: data.message
        });
        startPollingBrowserStatus();
      } else {
        addToast('Lỗi mở trình duyệt: ' + data.error, 'error');
        setBrowserStatus({ status: 'error', message: data.error, isBrowserOpen: false });
      }
    } catch (err) {
      addToast('Lỗi kết nối máy chủ: ' + err.message, 'error');
      setBrowserStatus({ status: 'error', message: err.message, isBrowserOpen: false });
    } finally {
      setIsLaunchingBrowser(false);
    }
  };

  // Poll for c_user cookie detection
  const startPollingBrowserStatus = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:3001/api/accounts/browser-status');
        const data = await res.json();
        if (data.success) {
          setBrowserStatus(data);
          if (data.status === 'connected' && data.uid) {
            clearInterval(interval);
            addToast(`Đăng nhập thành công! Đã phát hiện cookie c_user (UID: ${data.uid}).`, 'success');
            await fetchAccounts();
            setTimeout(() => setShowBrowserModal(false), 2500);
          } else if (!data.isBrowserOpen && data.status !== 'waiting_for_login') {
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 1500);
  };

  // Close Playwright browser manually
  const handleCloseBrowser = async () => {
    try {
      await fetch('http://localhost:3001/api/accounts/close-browser', { method: 'POST' });
      setBrowserStatus(prev => ({ ...prev, isBrowserOpen: false, status: 'idle', message: 'Trình duyệt đã đóng.' }));
      setShowBrowserModal(false);
    } catch (_) {}
  };

  // Immediate check cookies triggered by "Đã đăng nhập xong - Kiểm tra ngay"
  const handleCheckCookiesNow = async () => {
    setIsCheckingCookies(true);
    try {
      const res = await fetch('http://localhost:3001/api/accounts/check-browser-cookies', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.isConnected) {
        addToast(data.message || `Đã kết nối thành công tài khoản UID: ${data.uid}`, 'success');
        setBrowserStatus({ status: 'connected', uid: data.uid, isBrowserOpen: false, message: data.message });
        await fetchAccounts();
        setTimeout(() => setShowBrowserModal(false), 2000);
      } else {
        addToast(data.message || 'Chưa phát hiện cookie đăng nhập. Vui lòng hoàn tất đăng nhập trên trình duyệt rồi thử lại.', 'warning');
      }
    } catch (err) {
      addToast('Lỗi kiểm tra cookie: ' + err.message, 'error');
    } finally {
      setIsCheckingCookies(false);
    }
  };

  // Import raw cookie string or JSON
  const handleImportRawCookie = async () => {
    if (!quickCookieInput || !quickCookieInput.trim()) {
      addToast('Vui lòng dán chuỗi cookie vào ô nhập liệu.', 'warning');
      return;
    }
    setIsImportingCookie(true);
    try {
      const res = await fetch('http://localhost:3001/api/accounts/import-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie_string: quickCookieInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || `Nạp cookie thành công! UID: ${data.uid}`, 'success');
        setBrowserStatus({ status: 'connected', uid: data.uid, isBrowserOpen: false, message: data.message });
        setQuickCookieInput('');
        await fetchAccounts();
        setTimeout(() => setShowBrowserModal(false), 2000);
      } else {
        addToast(data.error || 'Nạp cookie thất bại.', 'error');
      }
    } catch (err) {
      addToast('Lỗi nạp cookie: ' + err.message, 'error');
    } finally {
      setIsImportingCookie(false);
    }
  };

  // Test Connection
  const handleTestConnection = async (id) => {
    setTestingId(id);
    try {
      const res = await fetch(`http://localhost:3001/api/accounts/${id}/test-connection`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.data.message || 'Kiểm tra phiên kết nối thành công!', 'success');
      } else {
        addToast(data.data?.message || data.error || 'Kiểm tra kết nối thất bại', 'warning');
      }
      fetchAccounts();
    } catch (err) {
      addToast('Lỗi kết nối: ' + err.message, 'error');
    } finally {
      setTestingId(null);
    }
  };

  // Re-authenticate
  const handleReauth = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/accounts/${id}/re-authenticate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        addToast('Vui lòng mở trang Facebook để cấp lại quyền.', 'info');
        handleOpenFacebookConnect();
      }
    } catch (err) {
      addToast('Lỗi: ' + err.message, 'error');
    }
  };

  // Sync Discovered Pages to Channels
  const handleSyncPagesToChannels = async (id) => {
    setSyncingId(id);
    try {
      const res = await fetch(`http://localhost:3001/api/accounts/${id}/sync-pages-to-channels`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Đã đồng bộ Fanpage vào danh mục kênh đăng tin!', 'success');
      } else {
        addToast(data.error || 'Lỗi đồng bộ', 'error');
      }
    } catch (err) {
      addToast('Lỗi: ' + err.message, 'error');
    } finally {
      setSyncingId(null);
    }
  };

  // Revoke / Disconnect
  const handleRevoke = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi quyền và ngắt kết nối tài khoản "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/accounts/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        addToast('Đã thu hồi kết nối tài khoản.', 'success');
        fetchAccounts();
      }
    } catch (err) {
      addToast('Lỗi xóa: ' + err.message, 'error');
    }
  };

  // Direct Facebook Connection Handlers (User's Own Account)
  const handleDirectConnect = async (tokenToUse) => {
    const token = tokenToUse || directFbToken;
    if (!token || !token.trim()) {
      addToast('Vui lòng dán Access Token từ Facebook / Meta.', 'error');
      return;
    }

    setIsDirectConnecting(true);
    setLastPingResult(null);

    const startTime = Date.now();
    try {
      const res = await fetch('http://localhost:3001/api/accounts/facebook/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: token.trim(),
          auth_method: 'user_token',
          custom_name: directFbName.trim() || undefined
        })
      });

      const data = await res.json();
      const latency = Date.now() - startTime;

      if (res.ok && data.success) {
        addToast(data.message || 'Liên kết tài khoản Facebook thành công!', 'success');
        setDirectFbToken('');
        setDirectFbName('');
        setShowConnectForm(false);
        setLastPingResult({
          success: true,
          status: data.data?.connection_status || 'CONNECTED',
          message: data.message,
          latency,
          timestamp: new Date().toLocaleTimeString('vi-VN')
        });
        await fetchAccounts();
      } else {
        addToast(data.error || 'Liên kết tài khoản thất bại.', 'error');
        setLastPingResult({
          success: false,
          status: data.status || 'ERROR',
          message: data.error || 'Meta Graph API từ chối xác thực token này.',
          latency,
          timestamp: new Date().toLocaleTimeString('vi-VN')
        });
      }
    } catch (err) {
      addToast('Lỗi khi liên kết: ' + err.message, 'error');
      setLastPingResult({
        success: false,
        status: 'ERROR',
        message: 'Lỗi mạng hoặc không thể gọi đến máy chủ: ' + err.message,
        latency: Date.now() - startTime,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      });
    } finally {
      setIsDirectConnecting(false);
    }
  };

  const handleQuickPingFb = async (account) => {
    if (!account) return;
    setIsPingingFb(true);
    const startTime = Date.now();
    try {
      const res = await fetch(`http://localhost:3001/api/accounts/${account.id}/test-connection`, {
        method: 'POST'
      });
      const data = await res.json();
      const latency = Date.now() - startTime;
      if (data.success) {
        addToast(`Kiểm tra thành công! Phản hồi từ Meta: ${latency}ms`, 'success');
        setLastPingResult({
          success: true,
          status: data.data?.connection_status || 'CONNECTED',
          message: data.data?.message || 'Tài khoản đang hoạt động tốt trên Meta Graph API',
          latency,
          timestamp: new Date().toLocaleTimeString('vi-VN')
        });
      } else {
        addToast(`Cảnh báo: ${data.data?.message || data.error}`, 'warning');
        setLastPingResult({
          success: false,
          status: data.data?.connection_status || 'ERROR',
          message: data.data?.message || data.error || 'Không thể xác thực với Meta',
          latency,
          timestamp: new Date().toLocaleTimeString('vi-VN')
        });
      }
      await fetchAccounts();
    } catch (err) {
      addToast('Lỗi khi kiểm tra kết nối: ' + err.message, 'error');
    } finally {
      setIsPingingFb(false);
    }
  };

  // Helper for Status Badges
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> CONNECTED
          </span>
        );
      case 'AUTHENTICATION_REQUIRED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-200 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> AUTHENTICATION_REQUIRED
          </span>
        );
      case 'REAUTH_REQUIRED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1 border border-rose-200">
            <AlertOctagon className="w-3.5 h-3.5" /> REAUTH_REQUIRED
          </span>
        );
      case 'PERMISSION_MISSING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 flex items-center gap-1 border border-orange-200">
            <ShieldAlert className="w-3.5 h-3.5" /> PERMISSION_MISSING
          </span>
        );
      case 'NOT_SUPPORTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 flex items-center gap-1 border border-purple-200">
            <XCircle className="w-3.5 h-3.5" /> NOT_SUPPORTED
          </span>
        );
      case 'DISCONNECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 flex items-center gap-1 border border-slate-200">
            DISCONNECTED
          </span>
        );
      case 'ERROR':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" /> ERROR
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                Security & Session Pool
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Session Pool</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Đăng nhập Facebook bằng trình duyệt thật (Playwright Chromium), tự động nhận diện cookie c_user và quản lý phiên an toàn.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLaunchBrowser}
              disabled={isLaunchingBrowser}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-xs flex items-center gap-2 transition-all active:scale-98"
            >
              <FacebookIcon className="w-4 h-4 fill-white" />
              <span>{isLaunchingBrowser ? 'Đang mở trình duyệt...' : 'Đăng nhập / Xác thực Facebook'}</span>
            </button>
          </div>
        </div>

        {/* Security Principles Banner */}
        <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wide">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>Quy chuẩn an toàn và bảo mật thông tin</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-slate-600">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <strong>1. Đăng nhập chính danh:</strong> Người dùng tự nhập tài khoản & mật khẩu trên trang Facebook chính thức. Ứng dụng tuyệt đối không hỏi, không thu thập và không lưu mật khẩu.
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <strong>2. Xác minh 2 lớp / SMS:</strong> Nhận mã OTP trên điện thoại và nhập trực tiếp trên Facebook. Không tự động đọc SMS, không bypass CAPTCHA hay checkpoint.
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <strong>3. Bảo vệ bí mật Token:</strong> Access Token lưu trữ ở máy chủ an toàn, chỉ hiển thị dạng redacted (ví dụ: EAAQ...9b4F). Không bao giờ trả token đầy đủ về trình duyệt.
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PHASE 4: LOCAL CHROME STATION 24/24 (CDP PORT 9222)     */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-700 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Radio className="w-6 h-6 animate-pulse text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 uppercase tracking-wide">
                  Giai đoạn 4 • Core Station
                </span>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Trạm Google Chrome 24/24 (Local Chrome Station)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mở Google Chrome thật trên Windows với cổng gỡ lỗi từ xa 9222, duy trì phiên đăng nhập Facebook 24/24 với mức tiêu thụ RAM dưới 50MB.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => checkChromeStationStatus(false)}
              disabled={isCheckingStation}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isCheckingStation ? 'animate-spin' : ''}`} />
              <span>{isCheckingStation ? 'Đang kiểm tra...' : 'Kiểm tra Trạm Chrome'}</span>
            </button>

            <button
              onClick={handleLaunchChromeStation}
              disabled={isLaunchingStation}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all active:scale-98"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{isLaunchingStation ? 'Đang khởi chạy...' : 'Khởi động Chrome Trạm 24/24'}</span>
            </button>
          </div>
        </div>

        {/* Live Station Status Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${
            chromeStationStatus?.isOnline
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
              : 'bg-amber-50/70 border-amber-300 text-amber-900'
          }`}>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Trạng Thái Trạm</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-3 h-3 rounded-full shrink-0 ${chromeStationStatus?.isOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              <span className="font-extrabold text-sm">
                {chromeStationStatus?.isOnline ? 'ONLINE & SẴN SÀNG' : 'OFFLINE'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {chromeStationStatus?.isOnline ? 'CDP endpoint 127.0.0.1:9222 sẵn sàng' : 'Chưa phát hiện tiến trình Chrome trên port 9222'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cổng Kết Nối & IP</span>
            <div className="font-mono font-bold text-slate-800 text-sm mt-1">
              http://127.0.0.1:9222
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Giao thức Remote Debugging Protocol</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thư Mục Phiên (Profile)</span>
            <div className="font-mono font-bold text-slate-800 truncate mt-1" title="C:\bds_chrome_station">
              C:\bds_chrome_station
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1">Lưu cookie & phiên độc lập</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tiêu Thụ Tài Nguyên</span>
            <div className="font-bold text-slate-800 text-sm mt-1 flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-xs">&lt; 50MB RAM</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Treo trang trắng about:blank</span>
          </div>
        </div>

        {/* Operating Guide */}
        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-indigo-900">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Hướng dẫn vận hành Chế độ 24/24 không bao giờ tràn RAM:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed text-[11px]">
            <li>Nhấn <b>"Khởi động Chrome Trạm 24/24"</b>. Hệ thống sẽ mở một cửa sổ Google Chrome thật trên Windows.</li>
            <li>Trên cửa sổ Chrome đó, mở tab truy cập Facebook và đăng nhập tài khoản của bạn (kèm SMS/2FA nếu có) <b>1 lần duy nhất</b>.</li>
            <li>Sau khi đăng nhập xong, hãy <b>đóng tab Facebook lại</b> và chỉ để cửa sổ Chrome treo ở tab trắng <code>about:blank</code>.</li>
            <li>Cửa sổ Chrome này sẽ chạy bền vững 24/24 (chiếm dưới 50MB RAM, không bị Facebook quét bot, không bị ngủ đông). Dedicated Posting Agent tại Publishing Center sẽ tự động kết nối và đăng bài theo đúng lịch.</li>
          </ol>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DEDICATED SECTION: TÀI KHOẢN FACEBOOK CỦA BẠN & KIỂM TRA */}
      {/* ======================================================== */}
      {(() => {
        const primaryFb = accounts.find(a => a.platform === 'facebook_page' && a.connection_status === 'CONNECTED')
          || accounts.find(a => a.platform === 'facebook_page');
        const isLinked = primaryFb && primaryFb.connection_status === 'CONNECTED';
        const pagesList = primaryFb?.pages_discovered || [];

        return (
          <div className="bg-gradient-to-b from-white via-white to-blue-50/30 rounded-2xl p-6 border-2 border-blue-200 shadow-sm space-y-6 relative overflow-hidden">
            <FacebookIcon className="absolute -right-10 -bottom-10 w-44 h-44 text-blue-500/5 pointer-events-none" />

            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <FacebookIcon className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Kết nối Facebook bằng tài khoản của bạn
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tự cung cấp tài khoản Facebook, xác thực quyền quản trị Fanpage và giám sát trạng thái liên kết trực tiếp theo thời gian thực.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {primaryFb && (
                  <button
                    onClick={() => handleQuickPingFb(primaryFb)}
                    disabled={isPingingFb}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPingingFb ? 'animate-spin' : ''}`} />
                    <span>{isPingingFb ? 'Đang kiểm tra...' : 'Kiểm tra liên kết ngay'}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowConnectForm(!showConnectForm)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200"
                >
                  <Link2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{showConnectForm ? 'Thu gọn form' : (primaryFb ? 'Đổi tài khoản khác' : 'Liên kết tài khoản')}</span>
                  {showConnectForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Linked Status Card */}
            {primaryFb && !showConnectForm && (
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Account Identity */}
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      {primaryFb.avatar_url ? (
                        <img
                          src={primaryFb.avatar_url}
                          alt={primaryFb.connection_name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-base border border-blue-200">
                          {primaryFb.connection_name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isLinked ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{primaryFb.connection_name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          ID: {primaryFb.account_id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Phương thức: <strong className="text-slate-700">{primaryFb.auth_method}</strong></span>
                        <span>•</span>
                        <span>Token máy chủ: <strong className="font-mono text-slate-700">{primaryFb.token_masked}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Big Connection Status Badge */}
                  <div className="flex items-center gap-3">
                    {isLinked ? (
                      <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-bold text-xs shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div>ĐÃ LIÊN KẾT THÀNH CÔNG</div>
                          <div className="text-[10px] font-normal text-emerald-700">Sẵn sàng xuất bản bài đăng</div>
                        </div>
                      </div>
                    ) : primaryFb.connection_status === 'PERMISSION_MISSING' ? (
                      <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2 font-bold text-xs shadow-xs">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <div>
                          <div>THIẾU QUYỀN ĐĂNG BÀI</div>
                          <div className="text-[10px] font-normal text-amber-700">Cần cấp thêm pages_manage_posts</div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-bold text-xs shadow-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <div>
                          <div>PHIÊN HẾT HẠN / CẦN KẾT NỐI LẠI</div>
                          <div className="text-[10px] font-normal text-rose-700">{primaryFb.connection_status}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Ping Result Banner */}
                {lastPingResult && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                    lastPingResult.success
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/80 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-2.5 font-medium">
                      {lastPingResult.success ? (
                        <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{lastPingResult.message}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                      <span>Phản hồi: <strong>{lastPingResult.latency}ms</strong></span>
                      <span>• Lúc {lastPingResult.timestamp}</span>
                    </div>
                  </div>
                )}

                {/* Discovered Fanpages & Sync Toolbar */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Danh sách Fanpage của bạn ({pagesList.length} trang đã nhận diện)</span>
                    </div>

                    {pagesList.length > 0 && (
                      <button
                        onClick={() => handleSyncPages(primaryFb.id)}
                        disabled={syncingId === primaryFb.id}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                      >
                        <Share2 className={`w-3.5 h-3.5 ${syncingId === primaryFb.id ? 'animate-spin' : ''}`} />
                        <span>{syncingId === primaryFb.id ? 'Đang đồng bộ...' : 'Đồng bộ Fanpage vào Kênh đăng'}</span>
                      </button>
                    )}
                  </div>

                  {pagesList.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      Chưa phát hiện Fanpage nào do tài khoản này quản trị. Hãy đảm bảo tài khoản đã được cấp quyền Admin/Editor trên Fanpage của Meta.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {pagesList.map((pg, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between shadow-2xs">
                          <div>
                            <div className="font-bold text-slate-900">{pg.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">ID: {pg.id} • {pg.category}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pg.has_post_permission ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {pg.has_post_permission ? 'Được phép đăng' : 'Chỉ xem'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Input Form for Connecting User's Own Account */}
            {(!primaryFb || showConnectForm) && (
              <div className="p-5 bg-white rounded-xl border border-blue-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      {primaryFb ? 'Cập nhật hoặc liên kết tài khoản Facebook mới' : 'Cung cấp thông tin tài khoản Facebook của bạn'}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Bảo mật máy chủ</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên gợi nhớ / Tên chủ tài khoản:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Facebook Cá Nhân (Nguyễn Văn A - Real Estate)"
                      value={directFbName}
                      onChange={(e) => setDirectFbName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Mã Access Token của tài khoản Facebook: <span className="text-rose-500">*</span>
                      </label>
                      <a
                        href="https://developers.facebook.com/tools/explorer/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <span>Mở Meta Graph API Explorer để lấy Token</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Dán mã User Access Token hoặc Page Token từ Meta (thường bắt đầu bằng EAA...)"
                      value={directFbToken}
                      onChange={(e) => setDirectFbToken(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                  </div>

                  {/* Fast Helper Pills */}
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs space-y-2">
                    <div className="text-[11px] text-blue-900 font-medium flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Cách lấy token nhanh trong 3 bước:</span>
                    </div>
                    <ol className="list-decimal list-inside text-[11px] text-blue-800 space-y-0.5 ml-1">
                      <li>Đăng nhập tài khoản Facebook trên trình duyệt và mở <strong>Meta Graph API Explorer</strong>.</li>
                      <li>Tại ô <strong>Permissions</strong>, tích chọn: <code className="bg-white px-1 py-0.5 rounded text-blue-900 font-mono">pages_show_list</code> và <code className="bg-white px-1 py-0.5 rounded text-blue-900 font-mono">pages_manage_posts</code>.</li>
                      <li>Nhấn <strong>Generate Access Token</strong>, cấp quyền cho Fanpage của bạn, sau đó copy dán vào ô trên.</li>
                    </ol>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLaunchBrowser}
                      disabled={isLaunchingBrowser}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all active:scale-98"
                    >
                      <FacebookIcon className="w-4 h-4 fill-white" />
                      <span>{isLaunchingBrowser ? 'Đang mở Chromium...' : 'Đăng nhập bằng Trình duyệt (Playwright)'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {showConnectForm && primaryFb && (
                        <button
                          type="button"
                          onClick={() => setShowConnectForm(false)}
                          className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium"
                        >
                          Hủy
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDirectConnect()}
                        disabled={isDirectConnecting}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-2 transition-all"
                      >
                        <span>{isDirectConnecting ? 'Đang xác thực...' : 'Lưu Access Token'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {accounts.map(acc => {
          const pagesDiscovered = acc.pages_discovered || [];

          return (
            <div key={acc.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                      {acc.platform === 'facebook_page' ? <FacebookIcon className="w-5 h-5 fill-blue-600" /> : <ShieldCheck className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{acc.connection_name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ID: <span className="font-mono text-slate-700">{acc.account_id}</span> • Nền tảng: <span className="font-semibold text-slate-700">{acc.platform}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {renderStatusBadge(acc.connection_status)}
                  </div>
                </div>

                {/* Token & Expiry Details */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-400" /> Masked Token:
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {acc.token_masked || '••••••••'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Hạn hiệu lực:
                    </span>
                    <span className="font-medium text-slate-700">
                      {acc.token_expires_at ? new Date(acc.token_expires_at).toLocaleDateString('vi-VN') : 'Vĩnh viễn / Thủ công'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Xác minh gần nhất:
                    </span>
                    <span className="text-slate-600">
                      {acc.last_verified_at ? new Date(acc.last_verified_at).toLocaleTimeString('vi-VN') + ' ' + new Date(acc.last_verified_at).toLocaleDateString('vi-VN') : 'Chưa'}
                    </span>
                  </div>
                </div>

                {/* Granted & Missing Scopes */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quyền hạn Graph API:</p>
                  <div className="flex flex-wrap gap-1">
                    {(acc.granted_permissions || []).map((perm, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        ✓ {perm}
                      </span>
                    ))}
                    {(acc.missing_permissions || []).map((perm, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200 animate-pulse">
                        ✕ Thiếu: {perm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Discovered Pages */}
                {pagesDiscovered.length > 0 && (
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-blue-600" />
                        Fanpage phát hiện được ({pagesDiscovered.length}):
                      </span>
                      <button
                        onClick={() => handleSyncPagesToChannels(acc.id)}
                        disabled={syncingId === acc.id}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-all flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${syncingId === acc.id ? 'animate-spin' : ''}`} />
                        <span>{syncingId === acc.id ? 'Đang đồng bộ...' : 'Đồng bộ vào kênh đăng'}</span>
                      </button>
                    </div>

                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {pagesDiscovered.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-[11px] text-slate-700 bg-white p-1.5 rounded border border-slate-100">
                          <span className="font-semibold truncate max-w-[200px]">{p.name}</span>
                          <span className="text-[10px] text-emerald-600 font-bold">✓ Quyền đăng bài</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Error if any */}
                {acc.last_error && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                    <strong>Lỗi gần nhất:</strong> {acc.last_error}
                  </div>
                )}
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(acc.id)}
                    disabled={testingId === acc.id}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingId === acc.id ? 'animate-spin' : ''}`} />
                    <span>{testingId === acc.id ? 'Đang kiểm tra...' : 'Làm mới trạng thái'}</span>
                  </button>

                  {(acc.connection_status === 'REAUTH_REQUIRED' || acc.connection_status === 'TOKEN_EXPIRED' || acc.connection_status === 'PERMISSION_MISSING') && (
                    <button
                      onClick={() => handleReauth(acc.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Kết nối lại</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleRevoke(acc.id, acc.connection_name)}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ngắt kết nối</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* REAL PLAYWRIGHT BROWSER LOGIN MODAL (NO OAUTH / APP ID REQUIRED) */}
      {showBrowserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <FacebookIcon className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Đăng nhập Facebook (Playwright Chromium)</h3>
                  <p className="text-[11px] text-blue-100">Mở trực tiếp tại https://www.facebook.com/</p>
                </div>
              </div>
              <button
                onClick={handleCloseBrowser}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {browserStatus?.status === 'connected' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-emerald-900">Đã đăng nhập Facebook thành công!</h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Đã phát hiện cookie <strong>c_user</strong>. UID tài khoản: <code className="bg-white px-2 py-0.5 rounded font-mono font-bold text-emerald-900">{browserStatus.uid}</code>
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-1">Trạng thái tài khoản đã được lưu vào Database là Connected.</p>
                  </div>
                  <button
                    onClick={() => setShowBrowserModal(false)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                  >
                    Hoàn tất & Đóng
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase">
                      <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
                      <span>Cửa sổ Chromium đang hoạt động</span>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Cửa sổ trình duyệt Chromium thật đã mở trang chủ <strong>https://www.facebook.com/</strong>.
                    </p>
                    <p className="text-[11px] text-blue-700">
                      Hãy chuyển sang cửa sổ trình duyệt đó và tự nhập thông tin đăng nhập Facebook của bạn.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                        <span>Đang chờ phát hiện cookie c_user...</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Tự động quét mỗi 2s</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Ngay khi bạn đăng nhập thành công trên Facebook, hệ thống sẽ tự động bắt cookie <strong>c_user</strong>, lưu trạng thái <strong>Connected</strong> vào Database và tự động đóng cửa sổ trình duyệt.
                    </p>
                  </div>

                  {/* NÚT 1: ĐÃ ĐĂNG NHẬP XONG - KIỂM TRA NGAY */}
                  <button
                    type="button"
                    onClick={handleCheckCookiesNow}
                    disabled={isCheckingCookies}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isCheckingCookies ? 'animate-spin' : ''}`} />
                    <span>{isCheckingCookies ? 'Đang kiểm tra cookie c_user...' : 'Tôi đã đăng nhập xong (Kiểm tra ngay)'}</span>
                  </button>

                  {/* NÚT 2 & TEXTAREA: NẠP COOKIE NHANH */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Nạp Cookie nhanh (Dán trực tiếp)</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">c_user=...; xs=...;</span>
                    </div>
                    <textarea
                      rows={2}
                      value={quickCookieInput}
                      onChange={(e) => setQuickCookieInput(e.target.value)}
                      placeholder="Dán chuỗi cookie (ví dụ: c_user=1000...; xs=...;) tại đây để kết nối tức thì..."
                      className="w-full text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleImportRawCookie}
                      disabled={isImportingCookie || !quickCookieInput.trim()}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isImportingCookie ? 'Đang xác thực & nạp cookie...' : 'Nạp Cookie nhanh & Kết nối ngay'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-slate-400 font-mono">Profile: ./data/fb_profiles/default_user</span>
                    <button
                      type="button"
                      onClick={handleCloseBrowser}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200"
                    >
                      Đóng trình duyệt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
