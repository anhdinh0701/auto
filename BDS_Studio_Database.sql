-- ==============================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU BẤT ĐỘNG SẢN STUDIO (MICROSOFT SQL SERVER)
-- Khởi tạo theo đúng Sơ đồ ERD chuẩn hóa
-- Tương thích: SQL Server 2016, 2017, 2019, 2022 & Azure SQL
-- ==============================================================================

-- 1. TẠO CƠ SỞ DỮ LIỆU MỚI (NẾU CHƯA CÓ)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'BDS_Studio_DB')
BEGIN
    CREATE DATABASE BDS_Studio_DB;
    PRINT N'[OK] Đã tạo thành công cơ sở dữ liệu BDS_Studio_DB';
END
GO

USE BDS_Studio_DB;
GO

-- XÓA BẢNG CŨ THEO THỨ TỰ PHỤ THUỘC (NẾU ĐÃ TỒN TẠI ĐỂ TẠO MỚI SẠCH SẼ)
IF OBJECT_ID(N'dbo.BAI_DANG', N'U') IS NOT NULL DROP TABLE dbo.BAI_DANG;
IF OBJECT_ID(N'dbo.NOI_THAT', N'U') IS NOT NULL DROP TABLE dbo.NOI_THAT;
IF OBJECT_ID(N'dbo.HinhAnh_CanHo', N'U') IS NOT NULL DROP TABLE dbo.HinhAnh_CanHo;
IF OBJECT_ID(N'dbo.BANG_GIA', N'U') IS NOT NULL DROP TABLE dbo.BANG_GIA;
IF OBJECT_ID(N'dbo.THONG_TIN_CAN_HO', N'U') IS NOT NULL DROP TABLE dbo.THONG_TIN_CAN_HO;
IF OBJECT_ID(N'dbo.DU_AN', N'U') IS NOT NULL DROP TABLE dbo.DU_AN;
GO

-- ==============================================================================
-- 2. TẠO CÁC BẢNG DỮ LIỆU THEO ĐÚNG SƠ ĐỒ ERD
-- ==============================================================================

-- BẢNG 1: DỰ ÁN (DU_AN)
CREATE TABLE dbo.DU_AN (
    ma_du_an INT IDENTITY(1,1) NOT NULL,
    ten_du_an NVARCHAR(60) NOT NULL,
    chu_dau_tu NVARCHAR(60) NULL,
    vi_tri NVARCHAR(60) NULL,
    CONSTRAINT PK_DU_AN PRIMARY KEY CLUSTERED (ma_du_an ASC)
);
PRINT N'[OK] Đã tạo bảng DU_AN';
GO

-- BẢNG 2: THÔNG TIN CĂN HỘ (THONG_TIN_CAN_HO)
CREATE TABLE dbo.THONG_TIN_CAN_HO (
    MaCanHo VARCHAR(50) NOT NULL,
    ma_du_an INT NULL,                            -- Khóa ngoại liên kết tới DU_AN
    PhapLy NVARCHAR(50) NULL,                     -- Ví dụ: 'Sổ hồng lâu dài', 'HĐMB'
    PhanKhu NVARCHAR(50) NULL,                    -- Ví dụ: 'Tòa A1', 'Phân khu K1'
    SoPhongNgu INT NOT NULL DEFAULT 1,            -- Số phòng ngủ: 1, 2, 3...
    SoWC INT NOT NULL DEFAULT 1,                  -- Số WC
    DienTich FLOAT NOT NULL,                      -- Diện tích m2 (VD: 77.5, 89.0)
    TrangThaiCanHo NVARCHAR(30) DEFAULT N'Chưa bán', -- 'Chưa bán', 'Đang giao dịch', 'Đã bán'
    SoLanDaDang INT NOT NULL DEFAULT 0,           -- Đếm số lần bài về căn hộ này đã đăng
    TinhTrangBanGiao NVARCHAR(50) NULL,           -- 'Bàn giao thô', 'Full nội thất', 'Cơ bản'
    PhongThuy NVARCHAR(200) NULL,                 -- Hướng cửa, hướng ban công (VD: 'Cửa Tây Nam, Ban công Đông Bắc mát mẻ')
    NgayTao DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_THONG_TIN_CAN_HO PRIMARY KEY CLUSTERED (MaCanHo ASC),
    CONSTRAINT FK_CANHO_DUAN FOREIGN KEY (ma_du_an) REFERENCES dbo.DU_AN(ma_du_an) ON DELETE SET NULL
);
PRINT N'[OK] Đã tạo bảng THONG_TIN_CAN_HO';
GO

-- BẢNG 3: BẢNG GIÁ (BANG_GIA)
CREATE TABLE dbo.BANG_GIA (
    MaGia INT IDENTITY(1,1) NOT NULL,
    MaCanHo VARCHAR(50) NOT NULL,
    LoaiGiaoDich NVARCHAR(20) NOT NULL DEFAULT N'Bán', -- 'Bán' hoặc 'Cho thuê'
    GiaBan DECIMAL(18,2) NULL,                         -- Giá bán tỷ VNĐ (VD: 5.60, 6.40)
    GiaThue NVARCHAR(30) NULL,                         -- Giá thuê triệu/tháng (VD: N'15 triệu/tháng')
    DonGia_m2 AS (CASE WHEN DienTich_Ref > 0 THEN ROUND(GiaBan * 1000 / DienTich_Ref, 1) ELSE NULL END), -- Cột tự tính (triệu/m2)
    DienTich_Ref FLOAT NULL,                           -- Tham chiếu diện tích nếu cần tính nhanh
    GhiChu NVARCHAR(255) NULL,
    NgayCapNhat DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_BANG_GIA PRIMARY KEY CLUSTERED (MaGia ASC),
    CONSTRAINT FK_BANGGIA_CANHO FOREIGN KEY (MaCanHo) REFERENCES dbo.THONG_TIN_CAN_HO(MaCanHo) ON DELETE CASCADE
);
PRINT N'[OK] Đã tạo bảng BANG_GIA';
GO

-- BẢNG 4: NỘI THẤT (NOI_THAT)
CREATE TABLE dbo.NOI_THAT (
    MaNoiThat NVARCHAR(50) NOT NULL,
    MaCanHo VARCHAR(50) NOT NULL,
    MaGia INT NULL,
    NoiThat NVARCHAR(100) NULL,    -- Gói nội thất (VD: 'Full đồ gỗ An Cường cao cấp, sofa da nhập khẩu')
    DoDien NVARCHAR(100) NULL,     -- Đồ điện tử (VD: '3 Điều hòa Daikin, Bếp từ Bosch, Tủ lạnh Side-by-Side')
    CONSTRAINT PK_NOI_THAT PRIMARY KEY CLUSTERED (MaNoiThat ASC),
    CONSTRAINT FK_NOITHAT_CANHO FOREIGN KEY (MaCanHo) REFERENCES dbo.THONG_TIN_CAN_HO(MaCanHo) ON DELETE CASCADE,
    CONSTRAINT FK_NOITHAT_BANGGIA FOREIGN KEY (MaGia) REFERENCES dbo.BANG_GIA(MaGia)
);
PRINT N'[OK] Đã tạo bảng NOI_THAT';
GO

-- BẢNG 5: HÌNH ẢNH CĂN HỘ (HinhAnh_CanHo)
CREATE TABLE dbo.HinhAnh_CanHo (
    MaHinhAnh INT IDENTITY(1,1) NOT NULL,
    MaCanHo VARCHAR(50) NOT NULL,
    DuongDanFile NVARCHAR(500) NOT NULL, -- Đường dẫn file ảnh trên ổ cứng hoặc URL
    GocChup NVARCHAR(50) NULL,           -- 'Phòng khách', 'Phòng ngủ Master', 'Ban công view hồ', 'Bếp'
    ContentTheoAnh NVARCHAR(300) NULL,   -- Chú thích nội dung riêng gắn liền với bức ảnh này
    ThuTuUuTien INT DEFAULT 1,           -- Thứ tự xuất hiện khi tải ảnh lên Facebook
    NgayThem DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_HinhAnh_CanHo PRIMARY KEY CLUSTERED (MaHinhAnh ASC),
    CONSTRAINT FK_HINHANH_CANHO FOREIGN KEY (MaCanHo) REFERENCES dbo.THONG_TIN_CAN_HO(MaCanHo) ON DELETE CASCADE
);
PRINT N'[OK] Đã tạo bảng HinhAnh_CanHo';
GO

-- BẢNG 6: BÀI ĐĂNG (BAI_DANG)
CREATE TABLE dbo.BAI_DANG (
    MaBaiDang INT IDENTITY(1,1) NOT NULL,
    MaCanHo VARCHAR(50) NOT NULL,
    MaGia INT NULL,
    MaHinhAnh INT NULL,
    MaNhom NVARCHAR(150) NULL,           -- Link hoặc ID nhóm Facebook đã đăng
    Contend NVARCHAR(MAX) NOT NULL,      -- Toàn bộ nội dung bài viết đã soạn hoặc AI đã sinh
    ThoiGianDang DATETIME DEFAULT GETDATE(), -- Thời gian đăng bài lên Facebook
    TrangThaiDang NVARCHAR(30) DEFAULT N'Thành công',
    CONSTRAINT PK_BAI_DANG PRIMARY KEY CLUSTERED (MaBaiDang ASC),
    CONSTRAINT FK_BAIDANG_CANHO FOREIGN KEY (MaCanHo) REFERENCES dbo.THONG_TIN_CAN_HO(MaCanHo) ON DELETE CASCADE,
    CONSTRAINT FK_BAIDANG_BANGGIA FOREIGN KEY (MaGia) REFERENCES dbo.BANG_GIA(MaGia),
    CONSTRAINT FK_BAIDANG_HINHANH FOREIGN KEY (MaHinhAnh) REFERENCES dbo.HinhAnh_CanHo(MaHinhAnh)
);
PRINT N'[OK] Đã tạo bảng BAI_DANG';
GO

-- ==============================================================================
-- 3. NẠP DỮ LIỆU MẪU THỰC TẾ (KHAI SƠN CITY LONG BIÊN) ĐỂ DÙNG ĐƯỢC NGAY
-- ==============================================================================

-- A. Thêm Dự Án
INSERT INTO dbo.DU_AN (ten_du_an, chu_dau_tu, vi_tri)
VALUES 
(N'Khai Sơn City', N'Công ty Cổ phần Khai Sơn', N'Ngọc Thụy, Long Biên, Hà Nội'),
(N'Vinhomes Riverside', N'Tập đoàn Vingroup', N'Phúc Đồng, Long Biên, Hà Nội');

-- B. Thêm 4 Căn Hộ Khai Sơn City
INSERT INTO dbo.THONG_TIN_CAN_HO (MaCanHo, ma_du_an, PhapLy, PhanKhu, SoPhongNgu, SoWC, DienTich, TrangThaiCanHo, SoLanDaDang, TinhTrangBanGiao, PhongThuy)
VALUES 
('KS-77-A1', 1, N'Sổ hồng lâu dài', N'Tòa A1', 2, 2, 77.0, N'Chưa bán', 1, N'Full nội thất cao cấp', N'Cửa Tây Nam, Ban công Đông Bắc view hồ'),
('KS-89-A2', 1, N'Sổ hồng lâu dài', N'Tòa A2', 2, 2, 89.0, N'Chưa bán', 1, N'Nội thất cơ bản', N'Cửa Đông Nam mát mẻ'),
('KS-96-B1', 1, N'Sổ hồng lâu dài', N'Tòa B1', 3, 2, 96.0, N'Chưa bán', 1, N'Full nội thất xịn sò', N'Căn góc 2 mặt thoáng view công viên'),
('KS-101-B2', 1, N'Sổ hồng lâu dài', N'Tòa B2', 3, 2, 101.0, N'Chưa bán', 1, N'Full nội thất tối ưu', N'Ban công Nam mát quanh năm');

-- C. Thêm Bảng Giá
INSERT INTO dbo.BANG_GIA (MaCanHo, LoaiGiaoDich, GiaBan, GiaThue, DienTich_Ref, GhiChu)
VALUES 
('KS-77-A1', N'Bán', 5.65, N'16 triệu/tháng', 77.0, N'Hàng cắt lỗ sâu full nội thất'),
('KS-89-A2', N'Bán', 5.95, N'18 triệu/tháng', 89.0, N'Giá cực tốt'),
('KS-96-B1', N'Bán', 6.40, N'20 triệu/tháng', 96.0, N'Full nội thất cao cấp chuẩn chỉnh'),
('KS-101-B2', N'Bán', 6.50, N'22 triệu/tháng', 101.0, N'Diện tích rộng, thiết kế tối ưu');

-- D. Thêm Gói Nội Thất
INSERT INTO dbo.NOI_THAT (MaNoiThat, MaCanHo, MaGia, NoiThat, DoDien)
VALUES 
('NT-77-01', 'KS-77-A1', 1, N'Sofa da Ý, Giường tủ An Cường, Bàn ăn mặt đá', N'3 Điều hòa Daikin Inverter, Tủ lạnh, Smart TV 65 inch, Bếp từ Bosch'),
('NT-96-01', 'KS-96-B1', 3, N'Nội thất gỗ óc chó cao cấp sang trọng', N'Hệ thống Smarthome điều khiển giọng nói, Điều hòa âm trần');

-- E. Thêm Hình Ảnh Căn Hộ
INSERT INTO dbo.HinhAnh_CanHo (MaCanHo, DuongDanFile, GocChup, ContentTheoAnh, ThuTuUuTien)
VALUES 
('KS-77-A1', N'uploads/1793541663932-771215949-1793541557952_2056225909875972690_2056225909875972690_cebbeb1f9663cc0dd8f13f1038abe47b.jpg', N'Phòng khách', N'Phòng khách tràn ngập ánh sáng tự nhiên, full nội thất hiện đại', 1),
('KS-77-A1', N'uploads/can77_phongngu.jpg', N'Phòng ngủ', N'Phòng ngủ master ấm cúng sàn gỗ chuẩn 5 sao', 2),
('KS-96-B1', N'uploads/can96_bancong.jpg', N'Ban công', N'View hồ điều hòa và công viên Khai Sơn xanh mát', 1);

-- F. Thêm Lịch Sử Bài Đăng Mẫu
INSERT INTO dbo.BAI_DANG (MaCanHo, MaGia, MaNhom, Contend, ThoiGianDang, TrangThaiDang)
VALUES 
('KS-77-A1', 1, N'https://www.facebook.com/groups/1857977624574831', 
N'🔥 HÀNG CẮT LỖ SÂU – CĂN HỘ KHAI SƠN CITY FULL NỘI THẤT – GIÁ TỐT NHẤT THỊ TRƯỜNG!
📌 Căn 77m2 | Full nội thất xịn sò | Giá chỉ 5,6x tỷ
👉 Sổ hồng lâu dài, sẵn sàng công chứng sang tên.
📞 Hotline xem nhà: 033.8866.058', 
GETDATE(), N'Thành công');

PRINT N'[OK] Đã nạp thành công bộ dữ liệu mẫu thực tế!';
GO

-- ==============================================================================
-- 4. TẠO VIEW TỰ ĐỘNG GHÉP THÔNG TIN CĂN HỘ + NỘI THẤT + BẢNG GIÁ + ẢNH
-- Dùng để lấy trực tiếp dữ liệu nạp vào AI Groq soạn bài hoặc đăng chéo Facebook
-- ==============================================================================
CREATE OR ALTER VIEW dbo.v_ThongTinDangBaiChiTiet AS
SELECT 
    c.MaCanHo,
    d.ten_du_an,
    d.vi_tri,
    c.PhanKhu,
    c.SoPhongNgu,
    c.SoWC,
    c.DienTich,
    g.LoaiGiaoDich,
    g.GiaBan,
    g.GiaThue,
    g.DonGia_m2,
    c.TinhTrangBanGiao,
    c.PhongThuy,
    nt.NoiThat,
    nt.DoDien,
    img.DuongDanFile AS AnhDaiDien,
    img.ContentTheoAnh AS MoTaAnh,
    -- Tạo mẫu nội dung đăng bài tự động từ database
    N'🔥 BÁN CĂN HỘ ' + UPPER(d.ten_du_an) + N' - ' + c.PhanKhu + N' 🔥' + CHAR(13) + CHAR(10) +
    N'📌 Diện tích: ' + CAST(c.DienTich AS NVARCHAR(10)) + N'm² (' + CAST(c.SoPhongNgu AS NVARCHAR(5)) + N'PN - ' + CAST(c.SoWC AS NVARCHAR(5)) + N'WC)' + CHAR(13) + CHAR(10) +
    N'💰 Giá bán: ' + CAST(g.GiaBan AS NVARCHAR(20)) + N' tỷ (Chỉ ~' + CAST(ISNULL(g.DonGia_m2, 0) AS NVARCHAR(20)) + N' tr/m²)' + CHAR(13) + CHAR(10) +
    N'🛋️ Nội thất: ' + ISNULL(c.TinhTrangBanGiao, N'Đầy đủ') + CHAR(13) + CHAR(10) +
    N'📜 Pháp lý: ' + ISNULL(c.PhapLy, N'Chuẩn chỉ') + CHAR(13) + CHAR(10) +
    N'📞 Liên hệ trực tiếp xem nhà: 033.8866.058' AS NoiDungDangBaiMau
FROM dbo.THONG_TIN_CAN_HO c
INNER JOIN dbo.DU_AN d ON c.ma_du_an = d.ma_du_an
LEFT JOIN dbo.BANG_GIA g ON c.MaCanHo = g.MaCanHo
LEFT JOIN dbo.NOI_THAT nt ON c.MaCanHo = nt.MaCanHo
OUTER APPLY (
    SELECT TOP 1 DuongDanFile, ContentTheoAnh 
    FROM dbo.HinhAnh_CanHo 
    WHERE MaCanHo = c.MaCanHo 
    ORDER BY ThuTuUuTien ASC
) img;
GO

PRINT N'==============================================================================';
PRINT N'  KHỞI TẠO CƠ SỞ DỮ LIỆU SQL SERVER HOÀN TẤT VÀ SẴN SÀNG NHẬP DATA 100%!       ';
PRINT N'==============================================================================';
PRINT N'Gợi ý: Chạy lệnh "SELECT * FROM dbo.v_ThongTinDangBaiChiTiet;" để kiểm tra kết quả!';
GO
