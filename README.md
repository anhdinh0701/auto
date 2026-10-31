# Real Estate Marketing Hub — Giai Đoạn 1 & Giai Đoạn 2

Hệ thống Marketing và Tự động hóa Nội dung Bất Động Sản chuyên nghiệp, hỗ trợ môi giới và chuyên viên marketing soạn thảo bài đăng, quản lý hình ảnh gốc chất lượng cao, tự động sinh nội dung theo mẫu và khám phá kênh tiếp thị (Channel Discovery) với hệ thống chấm điểm liên quan minh bạch (Relevance Score 0 - 100).

---

## 1. Công Nghệ & Kiến Trúc

- **Frontend**: React 19, Tailwind CSS v4, Lucide React, Vite 8
- **Backend**: Node.js, Express.js REST API, Multer (xử lý upload ảnh đa tệp)
- **Cơ sở dữ liệu**: SQLite (`better-sqlite3`) ở chế độ WAL Mode với tính toàn vẹn và tốc độ cao
- **Lưu trữ**: 
  - `data/realestate.db`: Lưu trữ bền vững tin đăng, mẫu bài viết, kênh tiếp thị, bộ sưu tập kênh và trọng số tính điểm.
  - `uploads/`: Lưu trữ ảnh gốc nguyên bản, không giảm chất lượng.
- **Tính bền vững**: Dữ liệu và tệp lưu trữ vật lý trên ổ đĩa, hoàn toàn không bị mất sau khi tải lại trang hoặc khởi động lại máy chủ.

---

## 2. Giai Đoạn 2 — Channel Discovery (Tìm Kiếm Kênh Tiếp Thị)

### A. Bộ Tiêu Chí Tìm Kiếm & Khớp Nối (Search & Matching Form)
- Hỗ trợ chọn **Tin BĐS đã có** để tự động điền thông số và chấm điểm kênh.
- Các trường tiêu chí: Loại hình BĐS, Nhu cầu (Bán/Thuê), Tỉnh/Thành phố, Quận/Huyện, Phân khúc giá (Bình dân, Trung cấp, Cao cấp, Siêu sang), Tệp khán giả (Mua ở, Đầu tư, Thuê, Môi giới), Loại kênh, Điểm liên quan tối thiểu.

### B. Bảng Kết Quả Kênh & Thao Tác Hàng Loạt
- Bảng danh sách kênh đầy đủ thông tin: Tên kênh, URL liên kết ngoài, Loại kênh, Địa bàn / Quy mô thành viên, Điểm liên quan (Relevance Score), Trạng thái kiểm minh, Khả năng đăng bài, Thao tác.
- **Thao tác hàng loạt (Bulk actions)**:
  - Chọn nhiều kênh cùng lúc (Multi-select)
  - Xác minh hàng loạt (Bulk Verify)
  - Thêm hàng loạt vào Bộ sưu tập (Bulk Add to Collection)
  - Xóa hàng loạt (Bulk Delete với Modal xác nhận)
- Chuyển đổi trạng thái yêu thích (Star toggle) và trạng thái xác minh trực tiếp trên bảng.

### C. Xem Chi Tiết Kênh (Channel Detail Modal)
- Hiển thị đầy đủ URL, phân loại, địa bàn phủ sóng, nguồn kênh, trạng thái kiểm minh, ngày kiểm minh gần nhất.
- **Giải trình điểm số chi tiết (Explainable Score Breakdown)**:
  - Hiển thị điểm thành phần của 6 yếu tố: Địa bàn, Loại BĐS, Phân khúc giá, Tệp khán giả, Độ mới & kiểm minh, Khả năng xuất bản.
  - Hiển thị tỷ trọng (weights), điểm số đóng góp và lý do tính điểm cụ thể.

### D. Định Nghĩa Khả Năng Xuất Bản (Publishing Capability)
Tuân thủ nghiêm ngặt nguyên tắc bảo mật và chính sách API nền tảng:
- `api_supported`: Hỗ trợ đăng qua API chính thức đã kiểm chứng (Cổng BĐS tích hợp).
- `manual_only`: Chỉ hỗ trợ xuất bản thủ công (Quy định bắt buộc cho Hội nhóm Facebook và nhóm Zalo để không vi phạm chính sách Meta / Zalo).
- `unknown`: Chưa xác minh khả năng đăng.
- `unsupported`: Kênh không hỗ trợ xuất bản (chỉ tham khảo).

### E. Quản Lý Bộ Sưu Tập Kênh (Channel Collections)
- Tạo, sửa, xóa các bộ sưu tập kênh (ví dụ: *Kênh BĐS Thủ Đức*, *Kênh Biệt Thự Cao Cấp*).
- Gán kênh vào bộ sưu tập, lọc danh sách kênh theo bộ sưu tập.
- Sẵn sàng liên kết với tin đăng và kế hoạch đăng bài ở Giai đoạn 3.

### F. Nhập & Xuất CSV (CSV Import / Export)
- **Xuất CSV**: Tải về tệp CSV mã hóa UTF-8 với BOM (`\uFEFF`) để mở tiếng Việt trên Microsoft Excel không bị lỗi font.
- **Nhập CSV**:
  - Hỗ trợ tải tệp hoặc dán trực tiếp nội dung CSV.
  - Tải về tệp CSV mẫu chuẩn hóa.
  - Tự động phát hiện trùng lặp URL hoặc Tên kênh với 2 chế độ: **Bỏ qua (Skip)** hoặc **Cập nhật (Update)**.
  - Báo cáo chi tiết số dòng thêm mới, cập nhật, bỏ qua và lỗi định dạng.

### G. Giao Diện Provider & Tìm Kiếm Trực Tuyến
- Kiến trúc module `channelSearchProvider.js` sẵn sàng tích hợp Google Custom Search hoặc Facebook Graph API.
- Nếu chưa có API keys, hiển thị thông báo chuẩn mực:
  > *"Search provider not configured. External search API key is not configured."*
- Cung cấp liên kết mở sẵn câu truy vấn tìm kiếm thủ công an toàn trên Google.
- Tuyệt đối không cào dữ liệu trái phép (scraping), không bypass login/CAPTCHA và không bịa đặt kênh ảo.

### H. Cấu Hình Trọng Số Tính Điểm (Score Weights Settings)
- Cho phép người dùng tùy chỉnh tỷ trọng của 6 tiêu chí tính điểm qua thanh trượt trực quan.
- Tùy chọn khôi phục tỷ trọng mặc định (25%, 20%, 15%, 15%, 15%, 10%).

---

## 3. Hướng Dẫn Chạy & Kiểm Thử

### Khởi chạy hệ thống:
```bash
# Khởi chạy máy chủ (port 3001)
npm start

# Hoặc khởi chạy môi trường phát triển (port 5173):
npm run dev
```

### Chạy kiểm thử tự động Giai đoạn 2:
```bash
node server/test-phase2.js
```
Kết quả kiểm tra 11/11 bài test đạt 100%.

### Chạy kiểm thử hồi quy Giai đoạn 1:
```bash
node server/test-suite.js
```
Kết quả kiểm tra 11/11 bài test Giai đoạn 1 đạt 100% không phát sinh lỗi.
