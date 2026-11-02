#!/usr/bin/env node
/**
 * ==============================================================================
 * BUILD-PORTABLE.JS
 * Script tự động đóng gói ứng dụng BĐS Studio thành bộ Portable 1-Click:
 * - Nhúng sẵn node.exe từ process.execPath (máy khác không cần cài đặt Node.js)
 * - Đóng gói toàn bộ code Backend, Frontend (dist), database SQLite, uploads
 * - Cấu hình 100% đường dẫn tương đối (chạy trên bất kỳ ổ cứng/thư mục nào)
 * - Tạo file VBScript ẩn terminal (Khoi_Dong_BDS_Studio.vbs) và file batch (Chay_BDS_Studio.bat)
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname);
const portableDir = path.join(rootDir, 'BDS_Studio_Portable');
const runtimeDir = path.join(portableDir, 'runtime');
const appDir = path.join(portableDir, 'app');

console.log('==============================================================================');
console.log('       BẮT ĐẦU ĐÓNG GÓI BĐS STUDIO PORTABLE 1-CLICK (KHÔNG CẦN CÀI NODE)       ');
console.log('==============================================================================\n');

// 1. Kiểm tra và Build Frontend
console.log('[1/6] Kiểm tra bản build Frontend (Vite dist)...');
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
  console.log('       -> Chưa có thư mục dist hoặc chưa build, tiến hành chạy npm run build...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
} else {
  console.log('       -> Thư mục dist đã sẵn sàng.');
}

// 2. Tạo cấu trúc thư mục BDS_Studio_Portable
console.log('\n[2/6] Tạo cấu trúc thư mục Portable...');
if (!fs.existsSync(portableDir)) fs.mkdirSync(portableDir, { recursive: true });
if (!fs.existsSync(runtimeDir)) fs.mkdirSync(runtimeDir, { recursive: true });
if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });
console.log('       -> Đã chuẩn bị thư mục: ' + portableDir);

// 3. Nhúng node.exe vào runtime/
console.log('\n[3/6] Tự động nhúng động cơ Node.js (node.exe)...');
const currentNodeExe = process.execPath;
const targetNodeExe = path.join(runtimeDir, 'node.exe');
console.log(`       -> Sao chép: ${currentNodeExe} -> ${targetNodeExe}`);
fs.copyFileSync(currentNodeExe, targetNodeExe);
console.log('       -> Đã nhúng thành công node.exe (' + Math.round(fs.statSync(targetNodeExe).size / (1024 * 1024)) + ' MB).');

// 4. Sao chép toàn bộ code và dữ liệu sang app/
console.log('\n[4/6] Sao chép toàn bộ mã nguồn ứng dụng & dữ liệu sang app/...');

function copyDirFast(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  try {
    execSync(`robocopy "${src}" "${dest}" /E /MT:16 /NP /NFL /NDL /R:1 /W:1`, { stdio: 'ignore' });
  } catch (err) {
    if (err.status >= 8) {
      console.warn(`       [!] Robocopy gặp cảnh báo, chuyển sang copy chuẩn:`, err.message);
      fs.cpSync(src, dest, { recursive: true });
    }
  }
}

// A. Sao chép Backend (server/)
console.log('       -> Sao chép server/...');
copyDirFast(path.join(rootDir, 'server'), path.join(appDir, 'server'));

// B. Sao chép Frontend Build (dist/)
console.log('       -> Sao chép dist/...');
copyDirFast(distDir, path.join(appDir, 'dist'));

// C. Sao chép Thư mục Ảnh (uploads/)
console.log('       -> Sao chép uploads/...');
copyDirFast(path.join(rootDir, 'uploads'), path.join(appDir, 'uploads'));

// D. Khởi tạo & sao chép Thư mục Dữ liệu (data/)
console.log('       -> Chuẩn bị thư mục data (SQLite & Chrome Profile)...');
const targetDataDir = path.join(appDir, 'data');
if (!fs.existsSync(targetDataDir)) fs.mkdirSync(targetDataDir, { recursive: true });
const targetChromeProfileDir = path.join(targetDataDir, 'chrome_profile');
if (!fs.existsSync(targetChromeProfileDir)) fs.mkdirSync(targetChromeProfileDir, { recursive: true });

// Sao chép database sqlite nếu có
const srcDb = path.join(rootDir, 'data', 'realestate.db');
if (fs.existsSync(srcDb)) {
  fs.copyFileSync(srcDb, path.join(targetDataDir, 'realestate.db'));
  console.log('       -> Đã sao chép database SQLite hiện có sang app/data/realestate.db.');
}

// E. Sao chép .env & package.json
console.log('       -> Sao chép .env & package.json...');
if (fs.existsSync(path.join(rootDir, '.env'))) {
  fs.copyFileSync(path.join(rootDir, '.env'), path.join(appDir, '.env'));
}
if (fs.existsSync(path.join(rootDir, 'package.json'))) {
  fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(appDir, 'package.json'));
}

// F. Sao chép node_modules/
console.log('       -> Sao chép node_modules (đa luồng qua Robocopy)...');
copyDirFast(path.join(rootDir, 'node_modules'), path.join(appDir, 'node_modules'));
console.log('       -> Sao chép node_modules hoàn tất.');

// 5. Tạo file khởi chạy ẩn & script batch
console.log('\n[5/6] Tạo file khởi chạy 1-Click (VBScript & Batch)...');

// File 1: Chay_BDS_Studio.bat
const batContent = `@echo off
chcp 65001 >nul
title BĐS Studio - Hệ Thống Đăng Bài Facebook Tự Động (Portable)
cd /d "%~dp0"

echo ==============================================================================
echo        BĐS STUDIO - PHẦN MỀM ĐĂNG BÀI FACEBOOK TỰ ĐỘNG (PORTABLE 1-CLICK)
echo ==============================================================================
echo.
echo [*] Đang khởi động hệ thống và máy chủ cục bộ...

if not exist "runtime\\node.exe" (
    echo [!] LỖI: Không tìm thấy thư mục runtime\\node.exe!
    echo Vui lòng đảm bảo bạn đã giải nén đầy đủ thư mục BDS_Studio_Portable.
    pause
    exit /b 1
)

:: Tự động bật giao diện ứng dụng trên trình duyệt web sau 2 giây (tương thích 100% mọi bản Windows)
start "" cmd /c "ping 127.0.0.1 -n 3 >nul & start http://localhost:3001"

:: Thiết lập biến môi trường chạy Portable
set NODE_ENV=production
set PORT=3001
set CHROME_USER_DATA_DIR=%~dp0app\\data\\chrome_profile

echo [*] Máy chủ đang lắng nghe tại: http://localhost:3001
echo [*] Để dừng phần mềm, bạn có thể đóng cửa sổ này hoặc chạy Dung_BDS_Studio.bat
echo ------------------------------------------------------------------------------
"runtime\\node.exe" "app\\server\\server.js"

pause
`;
fs.writeFileSync(path.join(portableDir, 'Chay_BDS_Studio.bat'), batContent, 'utf8');

// File 2: Khoi_Dong_BDS_Studio.vbs (Chạy ẩn 1-Click không hiện terminal)
const vbsContent = `' ==============================================================================
' KHỞI ĐỘNG BĐS STUDIO (CHẾ ĐỘ ẨN MÀN HÌNH ĐEN CONSOLE)
' Nhấp đúp chuột vào file này để khởi chạy ứng dụng như một phần mềm thực thụ
' ==============================================================================
Set WshShell = CreateObject("WScript.Shell")
strCurDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strCurDir
WshShell.Run "cmd.exe /c """ & strCurDir & "\\Chay_BDS_Studio.bat""", 0, False
`;
fs.writeFileSync(path.join(portableDir, 'Khoi_Dong_BDS_Studio.vbs'), vbsContent, 'utf8');

// File 3: Dung_BDS_Studio.bat
const stopBatContent = `@echo off
chcp 65001 >nul
title Dừng BĐS Studio Portable
cd /d "%~dp0"

echo ==============================================================================
echo                   DỪNG HỆ THỐNG BĐS STUDIO PORTABLE
echo ==============================================================================
echo.

:: Tìm PID đang chiếm port 3001 và dừng tiến trình
set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo [*] Đang dừng tiến trình BĐS Studio (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
    set FOUND=1
)

if "%FOUND%"=="1" (
    echo [OK] Đã dừng toàn bộ dịch vụ BĐS Studio thành công!
) else (
    echo [*] Không có tiến trình BĐS Studio nào đang chạy trên cổng 3001.
)

timeout /t 2 >nul
`;
fs.writeFileSync(path.join(portableDir, 'Dung_BDS_Studio.bat'), stopBatContent, 'utf8');

// File 4: Huong_Dan_Su_Dung.txt
const readmeContent = `==============================================================================
   HƯỚNG DẪN SỬ DỤNG BỘ PORTABLE 1-CLICK: BĐS STUDIO FACEBOOK AUTO POSTING
==============================================================================

1. CÁCH KHỞI ĐỘNG PHẦN MỀM:
   - Cách 1 (Khuyên dùng): Nhấp đúp vào "Khoi_Dong_BDS_Studio.vbs"
     -> Phần mềm sẽ khởi động hoàn toàn ẩn và tự động mở giao diện trên trình duyệt web.
   - Cách 2: Nhấp đúp vào "Chay_BDS_Studio.bat"
     -> Nếu bạn muốn theo dõi chi tiết màn hình nhật ký (log) của hệ thống.

2. CÁCH TẮT PHẦN MỀM:
   - Nhấp đúp vào file "Dung_BDS_Studio.bat".

3. KẾT NỐI TRẠM ĐĂNG BÀI (CHROME HOẶC EDGE):
   - Khi vào giao diện, bấm nút "Khởi động Chrome Trạm 24/24" (hoặc khi bấm Đăng bài).
   - Hệ thống tự động nhận diện Google Chrome hoặc Microsoft Edge (Edge có sẵn 100% trên mọi máy Windows 10 & 11).
   - Cửa sổ trình duyệt sẽ mở ra với hồ sơ riêng độc lập lưu tại: app/data/chrome_profile.
   - Bạn chỉ cần đăng nhập tài khoản Facebook 1 lần duy nhất tại cửa sổ này. Phiên làm việc sẽ được lưu vĩnh viễn trong thư mục phần mềm.

4. CÁC TÍNH NĂNG ĐĂNG BÀI:
   - Mục 1: Chọn hoặc tải ảnh căn hộ/nhà đất.
   - Mục 2: Soạn nội dung & link nhóm:
     + Đăng chéo siêu tốc (+ Thêm nhóm): Tự động tích chọn cùng lúc tối đa 8-9 nhóm liên quan để phủ sóng đồng loạt chỉ trong vài giây.
     + Hàng đợi đa nhóm (Multi-Group Queue): Dán danh sách KHÔNG GIỚI HẠN các nhóm Facebook, hệ thống tự động đăng tuần tự trong nền.
     + Giãn cách thông minh (Smart Delay): Nghỉ ngẫu nhiên 90s - 180s giữa mỗi nhóm để chống khóa nick.
     + Groq AI Micro-Spin: Tự động đổi nhẹ câu chào & icon cho từng bài nhưng giữ nguyên 100% diện tích, giá và SĐT.
   - Bấm nút "Bắt đầu đăng" để hệ thống tự động xử lý.

5. ĐẶC ĐIỂM BẢN PORTABLE (MANG ĐI MÁY KHÁC):
   - Bạn có thể nén ZIP hoặc chép toàn bộ thư mục "BDS_Studio_Portable" này sang USB hoặc máy tính Windows khác (Win 10, Win 11).
   - MÁY TÍNH MỚI HOÀN TOÀN KHÔNG CẦN CÀI ĐẶT NODE.JS HOẶC BẤT KỲ CÔNG CỤ NÀO KHÁC (động cơ node.exe đã được nhúng sẵn bên trong runtime/).
==============================================================================
`;
fs.writeFileSync(path.join(portableDir, 'Huong_Dan_Su_Dung.txt'), readmeContent, 'utf8');

// 6. Kiểm tra tính toàn vẹn của gói Portable
console.log('\n[6/6] Kiểm tra tính toàn vẹn của bộ đóng gói Portable...');
try {
  const nodeVer = execSync(`"${targetNodeExe}" -v`, { encoding: 'utf8' }).trim();
  console.log(`       -> Động cơ nhúng hoạt động tốt: ${nodeVer}`);

  execSync(`"${targetNodeExe}" -c "app/server/server.js"`, { cwd: portableDir });
  console.log('       -> Cú pháp Backend server.js chuẩn xác 100%.');
} catch (testErr) {
  console.error('       [!] Cảnh báo kiểm tra:', testErr.message);
}

console.log('\n==============================================================================');
console.log('             ĐÓNG GÓI THÀNH CÔNG BỘ BĐS STUDIO PORTABLE 1-CLICK!               ');
console.log('==============================================================================');
console.log('Thư mục đầu ra: ' + portableDir);
console.log('Để chạy thử: Nhấp đúp vào "Khoi_Dong_BDS_Studio.vbs" hoặc "Chay_BDS_Studio.bat".');
console.log('==============================================================================\n');
