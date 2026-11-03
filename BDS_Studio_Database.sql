-- ==============================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU BẤT ĐỘNG SẢN STUDIO (MICROSOFT SQL SERVER)
-- DỮ LIỆU THẬT 100%: QUỸ CĂN CHUYỂN NHƯỢNG & CHO THUÊ KHAI SƠN CITY & CÁC DỰ ÁN
-- Tương thích: SQL Server 2016, 2017, 2019, 2022 & Azure SQL
-- ==============================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'BDS_Studio_DB')
BEGIN
    CREATE DATABASE BDS_Studio_DB;
    PRINT N'[OK] Đã tạo thành công cơ sở dữ liệu BDS_Studio_DB';
END
GO

USE BDS_Studio_DB;
GO

-- XÓA BẢNG CŨ THEO THỨ TỰ PHỤ THUỘC ĐỂ NẠP DATA THẬT
IF OBJECT_ID(N'dbo.BAI_DANG', N'U') IS NOT NULL DROP TABLE dbo.BAI_DANG;
IF OBJECT_ID(N'dbo.NOI_THAT', N'U') IS NOT NULL DROP TABLE dbo.NOI_THAT;
IF OBJECT_ID(N'dbo.HinhAnh_CanHo', N'U') IS NOT NULL DROP TABLE dbo.HinhAnh_CanHo;
IF OBJECT_ID(N'dbo.BANG_GIA', N'U') IS NOT NULL DROP TABLE dbo.BANG_GIA;
IF OBJECT_ID(N'dbo.THONG_TIN_CAN_HO', N'U') IS NOT NULL DROP TABLE dbo.THONG_TIN_CAN_HO;
IF OBJECT_ID(N'dbo.DU_AN', N'U') IS NOT NULL DROP TABLE dbo.DU_AN;
GO

-- ==============================================================================
-- 1. TẠO CÁC BẢNG DỮ LIỆU CHUẨN THEO ERD
-- ==============================================================================

CREATE TABLE dbo.DU_AN (
    ma_du_an INT IDENTITY(1,1) NOT NULL,
    ten_du_an NVARCHAR(60) NOT NULL,
    chu_dau_tu NVARCHAR(60) NULL,
    vi_tri NVARCHAR(60) NULL,
    CONSTRAINT PK_DU_AN PRIMARY KEY CLUSTERED (ma_du_an ASC)
);

CREATE TABLE dbo.THONG_TIN_CAN_HO (
    MaCanHo VARCHAR(50) NOT NULL,
    ma_du_an INT NULL,
    PhapLy NVARCHAR(80) NULL,
    PhanKhu NVARCHAR(50) NULL,
    SoPhongNgu INT NOT NULL DEFAULT 1,
    SoWC INT NOT NULL DEFAULT 1,
    DienTich FLOAT NOT NULL,
    TrangThaiCanHo NVARCHAR(50) DEFAULT N'Sẵn sàng giao dịch',
    SoLanDaDang INT NOT NULL DEFAULT 0,
    TinhTrangBanGiao NVARCHAR(100) NULL,
    PhongThuy NVARCHAR(255) NULL,
    NgayTao DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_THONG_TIN_CAN_HO PRIMARY KEY CLUSTERED (MaCanHo ASC),
    CONSTRAINT FK_CANHO_DUAN FOREIGN KEY (ma_du_an) REFERENCES dbo.DU_AN(ma_du_an) ON DELETE SET NULL
);

CREATE TABLE dbo.BANG_GIA (
    MaGia INT IDENTITY(1,1) NOT NULL,
    MaCanHo VARCHAR(50) NOT NULL,
    LoaiGiaoDich NVARCHAR(20) NOT NULL DEFAULT N'Bán',
    GiaBan DECIMAL(18,2) NULL,
    GiaThue NVARCHAR(50) NULL,
    DonGia_m2 AS (CASE WHEN DienTich_Ref > 0 THEN ROUND(GiaBan * 1000 / DienTich_Ref, 1) ELSE NULL END),
    DienTich_Ref FLOAT NULL,
    GhiChu NVARCHAR(500) NULL,
    NgayCapNhat DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_BANG_GIA PRIMARY KEY CLUSTERED (MaGia ASC),
    CONSTRAINT FK_BANGGIA_CANHO FOREIGN KEY (MaCanHo) REFERENCES dbo.THONG_TIN_CAN_HO(MaCanHo) ON DELETE CASCADE
);

CREATE TABLE dbo.NOI_THAT (
    MaNoiThat INT IDENTITY(1,1) NOT NULL,
    MaCanHo VARCHAR(50) NOT NULL,
    MaGia INT NULL,
    NoiThat NVARCHAR(255) NULL,
    DoDien NVARCHAR(255) NULL,
    CONSTRAINT PK_NOI_THAT PRIMARY KEY CLUSTERED (MaNoiThat ASC),
    CONSTRAINT FK_NOITHAT_CANHO FOREIGN KEY (MaCanHo) REFERENCES dbo.THONG_TIN_CAN_HO(MaCanHo) ON DELETE CASCADE,
    CONSTRAINT FK_NOITHAT_BANGGIA FOREIGN KEY (MaGia) REFERENCES dbo.BANG_GIA(MaGia)
);

CREATE TABLE dbo.HinhAnh_CanHo (
    MaHinhAnh INT IDENTITY(1,1) NOT NULL,
    MaCanHo VARCHAR(50) NOT NULL,
    DuongDanFile NVARCHAR(500) NOT NULL,
    GocChup NVARCHAR(50) NULL,
    ContentTheoAnh NVARCHAR(300) NULL,
    ThuTuUuTien INT DEFAULT 1,
    NgayThem DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_HinhAnh_CanHo PRIMARY KEY CLUSTERED (MaHinhAnh ASC),
    CONSTRAINT FK_HINHANH_CANHO FOREIGN KEY (MaCanHo) REFERENCES dbo.THONG_TIN_CAN_HO(MaCanHo) ON DELETE CASCADE
);

CREATE TABLE dbo.BAI_DANG (
    MaBaiDang INT IDENTITY(1,1) NOT NULL,
    MaCanHo VARCHAR(50) NOT NULL,
    MaGia INT NULL,
    MaNhom NVARCHAR(150) NULL,
    Contend NVARCHAR(MAX) NOT NULL,
    ThoiGianDang DATETIME DEFAULT GETDATE(),
    TrangThaiDang NVARCHAR(30) DEFAULT N'Đã soạn',
    CONSTRAINT PK_BAI_DANG PRIMARY KEY CLUSTERED (MaBaiDang ASC),
    CONSTRAINT FK_BAIDANG_CANHO FOREIGN KEY (MaCanHo) REFERENCES dbo.THONG_TIN_CAN_HO(MaCanHo) ON DELETE CASCADE,
    CONSTRAINT FK_BAIDANG_BANGGIA FOREIGN KEY (MaGia) REFERENCES dbo.BANG_GIA(MaGia)
);
GO

-- ==============================================================================
-- 2. NẠP DỮ LIỆU CÁC DỰ ÁN
-- ==============================================================================
SET IDENTITY_INSERT dbo.DU_AN ON;
INSERT INTO dbo.DU_AN (ma_du_an, ten_du_an, chu_dau_tu, vi_tri) VALUES
(1, N'Khai Sơn City', N'Công ty Cổ phần Khai Sơn', N'Ngọc Thụy, Long Biên, Hà Nội'),
(2, N'Toà Fantasy (Khai Sơn)', N'Khai Sơn', N'Khai Sơn City, Long Biên, Hà Nội'),
(3, N'Toà Tropical (Khai Sơn)', N'Khai Sơn', N'Khai Sơn City, Long Biên, Hà Nội'),
(4, N'Toà Zen Tower (Khai Sơn)', N'Khai Sơn', N'Khai Sơn City, Long Biên, Hà Nội'),
(5, N'Trinity Tower', N'Hợp tác xã Thành Công', N'145 Mễ Trì, Nam Từ Liêm, Hà Nội'),
(6, N'Times City', N'Tập đoàn Vingroup', N'458 Minh Khai, Hai Bà Trưng, Hà Nội');
SET IDENTITY_INSERT dbo.DU_AN OFF;
GO

-- ==============================================================================
-- 3. NẠP TOÀN BỘ 321 CĂN HỘ THẬT TỪ QUỸ CĂN
-- ==============================================================================
PRINT N'Đang nạp dữ liệu 321 căn hộ thật vào THONG_TIN_CAN_HO...';

INSERT INTO dbo.THONG_TIN_CAN_HO (MaCanHo, ma_du_an, PhapLy, PhanKhu, SoPhongNgu, SoWC, DienTich, TrangThaiCanHo, SoLanDaDang, TinhTrangBanGiao, PhongThuy) VALUES
(N'K6-407', 1, N'HĐMB', N'K6', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Nội thất liền tường', N'Nguồn: Thúy | Ghi chú: 4023 5% 201tr, chủ không vay'),
(N'K5-707', 1, N'HĐMB', N'K5', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy - sale 50tr | Ghi chú: 4179'),
(N'K6-804', 1, N'HĐMB', N'K6', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: 4800'),
(N'K5-1804', 1, N'HĐMB', N'K5', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 6140'),
(N'K3-1804', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy - 1% | Ghi chú: mk là 200220#  K3 1804'),
(N'K5-404', 1, N'HĐMB', N'K5', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K2-1904', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K2', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6A-1404', 1, N'HĐMB', N'K6A', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Dung'),
(N'K6-1007', 1, N'HĐMB', N'K6', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Liên'),
(N'K6A-1004', 1, N'HĐMB', N'K6A', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: K6a 1004: 100788#, 5% 235tr'),
(N'K1-1704', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K1', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6-1207', 1, N'HĐMB', N'K6', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 4962, tts'),
(N'K1-1907', 1, N'HĐMB', N'K1', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: Khách thuê đang ở, chủ không muốn cho khách lên xem, đang xin hình ảnh căn hộ căn này bất tiện việc đi xem, ai thực sự thiện chí chủ mới cho vào xem'),
(N'K3-1607', 1, N'HĐMB', N'K3', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: đang cho thuê'),
(N'K5-1104', 1, N'HĐMB', N'K5', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: khách đi xem hẹn trc 1 ngày'),
(N'K1-1507', 1, N'HĐMB', N'K1', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Nguồn chị Dung'),
(N'K3-1207', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: chủ đang ở  vay 1 tỷ sổ cắm ngân hàng VCB, k cần khách tất toán'),
(N'K6A-1804', 1, N'HĐMB', N'K6A', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6A-1604', 1, N'HĐMB', N'K6A', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K2-704', 1, N'HĐMB', N'K2', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-610', 1, N'HĐMB', N'K6', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Nội thất liền tường', N'Nguồn: Thúy | Ghi chú: 4400'),
(N'K6A-701', 1, N'HĐMB', N'K6A', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 5% 214, HĐ 4280, tts'),
(N'K2-1610', 1, N'HĐMB', N'K2', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: chủ đang vay 2ty, cần vốn khách tất toán'),
(N'K6-1601', 1, N'HĐMB', N'K6', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 5684 5% 284 chủ đang vay vcb'),
(N'K6-1810', 1, N'HĐMB', N'K6', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 6290'),
(N'K6-510', 1, N'HĐMB', N'K6', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy - sale 60tr | Ghi chú: giá gốc 4ty1, ko hỗ trợ vay, chủ ko vay K6 510: 123321#'),
(N'K6-1410', 1, N'HĐMB', N'K6', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 5% 242 HĐ 4857'),
(N'K2-1810', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K2', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K3-1201', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K1-810', 1, N'HĐMB', N'K1', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K2-601', 1, N'HĐMB', N'K2', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6-1710', 1, N'HĐMB', N'K6', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K5-1410', 1, N'HĐMB', N'K5', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: 5300'),
(N'K1-1201', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K1', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Dung | Ghi chú: sẵn sổ đỏ'),
(N'K3-610', 1, N'HĐMB', N'K3', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: 5% 195tr'),
(N'K2-401', 1, N'HĐMB', N'K2', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: 5% 200'),
(N'K1-710', 1, N'HĐMB', N'K1', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Liên'),
(N'K2-1501', 1, N'HĐMB', N'K2', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: thúy'),
(N'K1-610', 1, N'HĐMB', N'K1', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K6-403', 1, N'HĐMB', N'K6', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy 60tr | Ghi chú: 5610 5% 280'),
(N'K1-1608', 1, N'HĐMB', N'K1', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Liên'),
(N'K6-808', 1, N'HĐMB', N'K6', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu | Ghi chú: 090380#'),
(N'K6A-1008', 1, N'HĐMB', N'K6A', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu -60tr | Ghi chú: 5858'),
(N'K1-403', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K1', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-703', 1, N'HĐMB', N'K6', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Liên sale 80 | Ghi chú: 5789.'),
(N'K1-508', 1, N'HĐMB', N'K1', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Lưu | Ghi chú: Khách cần đi xem ib chị'),
(N'K6-1203', 1, N'HĐMB', N'K6', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu | Ghi chú: Khách muốn xem báo trước 30p hẹn chủ nhé'),
(N'K1-1603', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K1', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K3-1108', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Dung'),
(N'K6A-1508', 1, N'HĐMB', N'K6A', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy');
GO

INSERT INTO dbo.THONG_TIN_CAN_HO (MaCanHo, ma_du_an, PhapLy, PhanKhu, SoPhongNgu, SoWC, DienTich, TrangThaiCanHo, SoLanDaDang, TinhTrangBanGiao, PhongThuy) VALUES
(N'K1-1708', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K1', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Dung | Ghi chú: đã có sổ'),
(N'K6A-1408', 1, N'HĐMB', N'K6A', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu'),
(N'K5-1003', 1, N'HĐMB', N'K5', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Nội thất liền tường', N'Nguồn: Thúy | Ghi chú: 6350'),
(N'K2-603', 1, N'HĐMB', N'K2', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu'),
(N'K5-808', 1, N'HĐMB', N'K5', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu'),
(N'K3-1808', 1, N'HĐMB', N'K3', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu | Ghi chú: HĐ:'),
(N'K5-803', 1, N'HĐMB', N'K5', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thuyz | Ghi chú: K5 803 pass 818900#'),
(N'K3-1708', 1, N'HĐMB', N'K3', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K2-1803', 1, N'HĐMB', N'K2', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K5-1903', 1, N'HĐMB', N'K5', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Ghi chú: giá gốc 7ty6'),
(N'K6A-1703', 1, N'HĐMB', N'K6A', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Doanh | Ghi chú: 8467 chủ đang vay BIDV 5 tỷ'),
(N'K6A-905', 1, N'HĐMB', N'K6A', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Lưu | Ghi chú: Ai có khách đi xem ib 5% 280'),
(N'K2-1006', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K2', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: THÚY | Ghi chú: K2 1006 787878#'),
(N'K6A-1906', 1, N'HĐMB', N'K6A', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Nội thất liền tường', N'Nguồn: Thúy | Ghi chú: 7548, vay BIDV 5% 377'),
(N'K3-1805', 1, N'HĐMB', N'K3', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Lưu | Ghi chú: Khóa ở vp'),
(N'K6-706', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 5091, 5% 245tr pass K6 706: 123581#'),
(N'K6-1005', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 5747 chủ đang vay BIDV 4ty500'),
(N'K2-505', 1, N'HĐMB', N'K2', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu | Ghi chú: Khách xem nhắn Lưu'),
(N'K6-805', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: Pass k6 805: 273311# 289 tr : 5%'),
(N'K6-1205', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: 6200, chủ vay BIDV 4ty'),
(N'K2-906', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K2', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Liên | Ghi chú: Pass K2-906 . 080972#'),
(N'K1-1505', 1, N'HĐMB', N'K1', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Nội thất liền tường', N'Nguồn: Lưu'),
(N'K5-1605', 1, N'HĐMB', N'K5', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: K5-1605: 27193012#'),
(N'K5-1905', 1, N'HĐMB', N'K5', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: liên'),
(N'K6-1405', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Dung | Ghi chú: có thẻ ở vp'),
(N'K6-505', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6A-1006', 1, N'HĐMB', N'K6A', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Liên | Ghi chú: 818186'),
(N'K3-905', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Nội thất liền tường', N'Nguồn: Thúy | Ghi chú: đã có sổ'),
(N'K6A-1005', 1, N'HĐMB', N'K6A', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Dung'),
(N'K1-1705', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K1', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Nội thất liền tường', N'Nguồn: Dung'),
(N'K5-1106', 1, N'HĐMB', N'K5', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu | Ghi chú: 6ty2'),
(N'K6A-1705', 1, N'HĐMB', N'K6A', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu | Ghi chú: giá gốc 8ty083'),
(N'K3-1906', 1, N'HĐMB', N'K3', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: chủ có thể đồng ý 8400'),
(N'K3-505', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K1-406', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K1', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K2-1505', 1, N'HĐMB', N'K2', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K6-1606', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K1-1406', 1, N'HĐMB', N'K1', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K2-1106', 1, N'HĐMB', N'K2', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K1-705', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K1', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K6-1605', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu | Ghi chú: 6232'),
(N'K2-806', 1, N'HĐMB', N'K2', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thuý sale 1% | Ghi chú: Giá hợp đồng 3930'),
(N'K6-602', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 090380#'),
(N'K2-1002', 1, N'HĐMB', N'K2', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Dung | Ghi chú: công chứng chủ để 7ty'),
(N'K3-502', 1, N'HĐMB', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K6A-709', 1, N'HĐMB', N'K6A', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Dung'),
(N'K2-1202', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K2', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-402', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6-1409', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu | Ghi chú: mk: 258369#'),
(N'K6-802', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Lưu mk: 070313# | Ghi chú: 6.428 Chủ đang vay 2tỷ VCB');
GO

INSERT INTO dbo.THONG_TIN_CAN_HO (MaCanHo, ma_du_an, PhapLy, PhanKhu, SoPhongNgu, SoWC, DienTich, TrangThaiCanHo, SoLanDaDang, TinhTrangBanGiao, PhongThuy) VALUES
(N'K5-409', 1, N'HĐMB', N'K5', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 6200 203206# K5 409'),
(N'K6A-702', 1, N'HĐMB', N'K6A', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: gốc 6ty5. pass 241113'),
(N'K1-709', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K1', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: đã có sổ, không vay'),
(N'K3-1209', 1, N'HĐMB', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: K3 1209: 231211#'),
(N'K3-609', 1, N'HĐMB', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: hiện đang có khách thuê'),
(N'K3-909', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K3-1109', 1, N'HĐMB', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: hiện đang có khách thuê'),
(N'K3-809', 1, N'HĐMB', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: liên | Ghi chú: đang cho thuê'),
(N'K2-1109', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K2', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: đã có sổ đang trống'),
(N'K5-802', 1, N'HĐMB', N'K5', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K6-1209', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy sale 60tr | Ghi chú: 6835, chủ đang vay bank'),
(N'K3-709', 1, N'HĐMB', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K6-609', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Liên'),
(N'K6-1109', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu | Ghi chú: 6ty4'),
(N'K6-1909', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K1-1609', 1, N'HĐMB', N'K1', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K3-1809', 1, N'HĐMB', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 6ty2'),
(N'K6-1609', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Lưu | Ghi chú: HĐ: 8,2tỷ'),
(N'K3-702', 1, N'HĐMB', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K5-1502', 1, N'HĐMB', N'K5', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K3-1902', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K5-1402', 1, N'HĐMB', N'K5', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu | Ghi chú: Chủ vay bank, có thế TT dc'),
(N'K6A-2007', 1, N'HĐMB', N'K6A', 3, 2, 147, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 13500 5% 675 đang vay VCB, tới tháng 8/26 hết HTLS'),
(N'K5-2001', 1, N'HĐMB', N'K5', 4, 2, 167, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 10ty526, 5% ~ 516tr chủ có hỗ trợ vay phong tỏa, trong vòng max 20 ngày'),
(N'K3-2003', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 4, 2, 238.33, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Liên | Ghi chú: 5% làm sổ: 691tr 2% bảo trì: 276tr giá HĐMB: 13ty830 Khách cần chuẩn bị TC 17ty279 để giao dịch căn này'),
(N'K6-2003', 1, N'HĐMB', N'K6', 4, 2, 181, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Liên'),
(N'K5-2005', 1, N'HĐMB', N'K5', 3, 2, 271, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 19ty'),
(N'K1-GTM07', 1, N'HĐMB', N'K1', 1, 1, 40, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K1-GTM17', 1, N'HĐMB', N'K1', 1, 1, 45, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K3-GTM03', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 1, 1, 44, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K3-GTM08', 1, N'HĐMB', N'K3', 1, 1, 44, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K3-GTM05', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 1, 1, 46, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: đã có sổ'),
(N'K3-GTM06', 1, N'HĐMB', N'K3', 1, 1, 46, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K3-GTM10', 1, N'HĐMB', N'K3', 1, 1, 48, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K3-GTM12', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 1, 1, 45, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K3-GTM15', 1, N'HĐMB', N'K3', 1, 1, 44, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: chủ đang cho thuê 6tr/tháng'),
(N'K3-GTM17', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 2, 1, 52, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: đã có sổ'),
(N'K3-GTM22', 1, N'HĐMB', N'K3', 1, 1, 50, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: HĐ 2,116 chưa có sổ'),
(N'K5-GTM04', 1, N'HĐMB', N'K5', 1, 1, 40, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: pass 3 căn: 868686#'),
(N'K5-GTM14', 1, N'HĐMB', N'K5', 1, 1, 45, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Dung'),
(N'K5-GTM17', 1, N'HĐMB', N'K5', 2, 1, 52, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: K5 GTM17: 555111# 3365, đang vay vpbank'),
(N'K5-GTM19', 1, N'HĐMB', N'K5', 1, 1, 44, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Doanh | Ghi chú: 5% 116tr'),
(N'K6-GTM04', 1, N'HĐMB', N'K6', 1, 1, 40, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy 50tr | Ghi chú: 2000'),
(N'K6-GTM07', 1, N'HĐMB', N'K6', 1, 1, 45, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 2055 k vay'),
(N'K6-GTM03', 1, N'HĐMB', N'K6', 1, 1, 45, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: liên'),
(N'K3-607', 1, N'HĐMB', N'K3', 1, 1, 77, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: loan'),
(N'K1-1807', 1, N'HĐMB', N'K1', 1, 1, 77, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: loan'),
(N'K6-1907', 1, N'HĐMB', N'K6', 2, 1, 51, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy CĐT'),
(N'K6A-1607', 1, N'HĐMB', N'K6A', 1, 1, 77, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K2-1001', 1, N'HĐMB', N'K2', 1, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 211223#  K2 1001');
GO

INSERT INTO dbo.THONG_TIN_CAN_HO (MaCanHo, ma_du_an, PhapLy, PhanKhu, SoPhongNgu, SoWC, DienTich, TrangThaiCanHo, SoLanDaDang, TinhTrangBanGiao, PhongThuy) VALUES
(N'K1-1801', 1, N'HĐMB', N'K1', 1, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 688668# K1 1801'),
(N'K1-1710', 1, N'HĐMB', N'K1', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K5-901', 1, N'HĐMB', N'K5', 1, 1, 89, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6A-1510', 1, N'HĐMB', N'K6A', 1, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K1-1110', 1, N'HĐMB', N'K1', 1, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: loan'),
(N'K6-1901', 1, N'HĐMB', N'K6', 1, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-401', 1, N'HĐMB', N'K6', 1, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K6-1801', 1, N'HĐMB', N'K6', 1, 1, 89, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: tam anh | Ghi chú: K6-1801: 96730418#'),
(N'K6-810', 1, N'HĐMB', N'K6', 1, 1, 89, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: loan | Ghi chú: đang cho người thân ở nhờ'),
(N'K5-1808', 1, N'HĐMB', N'K5', 2, 1, 96, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: loan | Ghi chú: K5 1808 MK 160400#'),
(N'K3-708', 1, N'HĐMB', N'K3', 1, 1, 1, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Loan | Ghi chú: MK 117117#'),
(N'K6-1903', 1, N'HĐMB', N'K6', 2, 1, 87, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy CĐT'),
(N'K6A-908', 1, N'HĐMB', N'K6A', 1, 1, 96, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K2-1503', 1, N'HĐMB', N'K2', 1, 1, 96, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: loan'),
(N'K6-608', 1, N'HĐMB', N'K6', 1, 1, 96, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6A-406', 1, N'HĐMB', N'K6A', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Lưu'),
(N'K6-1106', 1, N'HĐMB', N'K6', 1, 1, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: K6 1106: 141780#'),
(N'K5-706', 1, N'HĐMB', N'K5', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: loan'),
(N'K6A-1706', 1, N'HĐMB', N'K6A', 1, 1, 101, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: loan'),
(N'K3-409', 1, N'HĐMB', N'K3', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Loan'),
(N'K6-702', 1, N'HĐMB', N'K6', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-509', 1, N'HĐMB', N'K6', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Lưu | Ghi chú: mk: 222812#'),
(N'K6A-1509', 1, N'HĐMB', N'K6A', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Lưu'),
(N'K6-709', 1, N'HĐMB', N'K6', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: loan -phí 50%'),
(N'K6-1402', 1, N'HĐMB', N'K6', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: loan | Ghi chú: Căn chị Lệ không ưu tiên'),
(N'K1-402', 1, N'HĐMB', N'K1', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Loan - trả phí tiến độ loại'),
(N'K1-GTM21', 1, N'HĐMB', N'K1', 1, 1, 45, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: loan'),
(N'K5-GTM11', 1, N'HĐMB', N'K5', 1, 1, 45, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-GTM18', 1, N'HĐMB', N'K6', 1, 1, 52, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: loan'),
(N'K6-GTM23', 1, N'HĐMB', N'K6', 1, 1, 45, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: loan | Ghi chú: 210457#'),
(N'TOWN-7-22', 1, N'HĐMB', N'T', 1, 1, 45, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: doanh'),
(N'TOWN-8-9', 1, N'HĐMB', N'T', 1, 1, 45, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: doanh'),
(N'TOWN-2-15', 1, N'HĐMB', N'T', 1, 1, 45, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Doanh'),
(N'K6A-704', 1, N'HĐMB', N'K6A', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-507', 1, N'HĐMB', N'K6', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy  50tr | Ghi chú: 4057'),
(N'K5-1004', 1, N'HĐMB', N'K5', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 4600 5% 230tr'),
(N'K5-1904', 1, N'HĐMB', N'K5', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: HĐ 5479'),
(N'K1-510', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K1', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Dung'),
(N'K5-601', 1, N'HĐMB', N'K5', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6A-601', 1, N'HĐMB', N'K6A', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 4450'),
(N'K5-1910', 1, N'HĐMB', N'K5', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Liên'),
(N'K6-1504', 1, N'HĐMB', N'K6', 1, 1, 5, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy -  phí sale 100tr'),
(N'K6A-901', 1, N'HĐMB', N'K6A', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 4000'),
(N'K6A-810', 1, N'HĐMB', N'K6A', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: HĐ 5100, chủ đang vay'),
(N'K5-1101', 1, N'HĐMB', N'K5', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: HĐ 4500'),
(N'K1-910', 1, N'HĐMB', N'K1', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'K1-601', 1, N'HĐMB', N'K1', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'K1-1101', 1, N'HĐMB', N'K1', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: HĐ 3815'),
(N'K5-610', 1, N'HĐMB', N'K5', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'K2-501', 1, N'HĐMB', N'K2', 2, 1, 89, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy');
GO

INSERT INTO dbo.THONG_TIN_CAN_HO (MaCanHo, ma_du_an, PhapLy, PhanKhu, SoPhongNgu, SoWC, DienTich, TrangThaiCanHo, SoLanDaDang, TinhTrangBanGiao, PhongThuy) VALUES
(N'K6A-1103', 1, N'HĐMB', N'K6A', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 6160 nhiệt tình bán K6a 1103: 121213#'),
(N'K1-1108', 1, N'HĐMB', N'K1', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: căn này tham khảo thui đã nhé, ck  bảo bán, vợ bảo không'),
(N'K6A-1503', 1, N'HĐMB', N'K6A', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K5-1803', 1, N'HĐMB', N'K5', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6A-503', 1, N'HĐMB', N'K6A', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 5800, chủ đang vay VCB 65%'),
(N'K6-1808', 1, N'HĐMB', N'K6', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: HĐ 7631'),
(N'K6A-1003', 1, N'HĐMB', N'K6A', 3, 2, 96, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: 5889'),
(N'K6-905', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K2-1606', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K2', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: HĐ 4296'),
(N'K6-1806', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: HĐ 6808'),
(N'K5-905', 1, N'HĐMB', N'K5', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 8/7: mới cập nhật'),
(N'K6A-1406', 1, N'HĐMB', N'K6A', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: C Lưu'),
(N'K6-606', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: Giá hđ 5.3tỷ.'),
(N'K6A-806', 1, N'HĐMB', N'K6A', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6A-605', 1, N'HĐMB', N'K6A', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 5735, chủ đang vay BIDV 65% 5% 286'),
(N'K6-806', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'K1-405', 1, N'HĐMB', N'K1', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: HD 4000
5% 200tr'),
(N'K3-506', 1, N'HĐMB', N'K3', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: chủ đang vay 2ty860, cần vốn của khách rút HĐ
5% ~211tr

khách cần chuẩn bị tài chính 5ty189 để giao dịch căn này'),
(N'K6A-1405', 1, N'HĐMB', N'K6A', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: liên | Ghi chú: 5ty969.'),
(N'K1-1905', 1, N'HĐMB', N'K1', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'K6A-902', 1, N'HĐMB', N'K6A', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: lưu | Ghi chú: 5% 334tr'),
(N'K6-409', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 5tỷ5'),
(N'K5-1609', 1, N'HĐMB', N'K5', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: dc hỗ trợ lãi suất 9/2026 - VCB 8599tr,'),
(N'K5-1909', 1, N'HĐMB', N'K5', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Nhập căn k5 1909 giá 9,4 tỷ  bao thuế phí cả bảo trì | Ghi chú: Thúy'),
(N'K6A-609', 1, N'HĐMB', N'K6A', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Liên | Ghi chú: chủ đang vay 4 tỷ'),
(N'K1-1209', 1, N'HĐMB', N'K1', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: 2% bảo trì 85tr
5% 220tr'),
(N'K5-1009', 1, N'HĐMB', N'K5', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: c Lưu'),
(N'K1-1402', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K1', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 5450'),
(N'K2-1710', 1, N'HĐMB', N'K2', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: 19/11: chủ đã nhận nhà'),
(N'K1-502', 1, N'HĐMB', N'K1', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: 19/11: chủ đã nhận nhà'),
(N'K2-2004', 1, N'HĐMB', N'K2', 3, 2, 146, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: HĐ 7818 Chủ đang vay VCB'),
(N'K2-1705', 1, N'HĐMB', N'K2', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'K5-GTM05', 1, N'HĐMB', N'K5', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K5-GTM06', 1, N'HĐMB', N'K5', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K6A-1410', 1, N'HĐMB', N'K6A', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 4773, chủ không vay 5% 238 K6a 1410: 121067#'),
(N'K1-501', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K1', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: K1 501: 040711#'),
(N'K6-1702', 1, N'HĐMB', N'K6', 2, 1, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: k6 1702: 170268#'),
(N'K5-501', 1, N'HĐMB', N'K5', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: 4074, 5% 203tr, chủ k vay'),
(N'K3-903', 1, N'Sổ đỏ lâu dài (sẵn sàng công chứng)', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 101187# 903 k3 8/5: đang xin dc chủ nét giá 8200'),
(N'K6-1608', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Liên | Ghi chú: 7360, chủ vay bidv. có thẻ từ'),
(N'K6A-1206', 1, N'HĐMB', N'K6A', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: loan | Ghi chú: Pass 171014'),
(N'K3-603', 1, N'HĐMB', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Dung | Ghi chú: 061530# k3 603'),
(N'K6-1707', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 5800 đang vay VCB'),
(N'K2-902', 1, N'HĐMB', N'K2', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: loan'),
(N'K2-1510', 1, N'HĐMB', N'K2', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Dung'),
(N'K6-1503', 1, N'HĐMB', N'K6', 2, 1, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: loan'),
(N'K3-1106', 1, N'HĐMB', N'K3', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Dung'),
(N'TOWN-7-20', 1, N'HĐMB', N'T', 1, 1, 68, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K6-1904', 1, N'HĐMB', N'K6', 2, 1, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Hàng CĐT/Thúy'),
(N'K5-GTM08', 1, N'HĐMB', N'K5', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: loan');
GO

INSERT INTO dbo.THONG_TIN_CAN_HO (MaCanHo, ma_du_an, PhapLy, PhanKhu, SoPhongNgu, SoWC, DienTich, TrangThaiCanHo, SoLanDaDang, TinhTrangBanGiao, PhongThuy) VALUES
(N'K6-1404', 1, N'HĐMB', N'K6', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K3-GTM20', 1, N'HĐMB', N'K3', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy'),
(N'K1-1504', 1, N'HĐMB', N'K1', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: loan'),
(N'K3-608', 1, N'HĐMB', N'K3', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K5-509', 1, N'HĐMB', N'K5', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: liên | Ghi chú: K5 509: pass 666888# 5 %~ 314tr bảo trì 124tr'),
(N'K6A-1407', 1, N'HĐMB', N'K6A', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy - ctv sale 1/4'),
(N'K1-1403', 1, N'HĐMB', N'K1', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: loan'),
(N'K2-802', 1, N'HĐMB', N'K2', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: loan | Ghi chú: K2 802 120469#'),
(N'K6-1206', 1, N'HĐMB', N'K6', 3, 2, 101, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: loan | Ghi chú: k6 1206: 010911#'),
(N'K1-GTM03', 1, N'HĐMB', N'K1', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: khách thuê đang ở'),
(N'K6-GTM20', 1, N'HĐMB', N'K6', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Lưu | Ghi chú: Đầu t11, khách ở'),
(N'K1-1903', 1, N'HĐMB', N'K1', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Nội thất liền tường', N'Nguồn: THÚY'),
(N'K5-1505', 1, N'HĐMB', N'K5', 2, 1, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Dung'),
(N'K6-1009', 1, N'HĐMB', N'K6', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy - CTV  45tr | Ghi chú: 6ty559,  bảo trì 112tr 120612# K6 1009'),
(N'K5-GTM12', 1, N'HĐMB', N'K5', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: thuý | Ghi chú: K5 gtm12: 951951#'),
(N'K6A-1905', 1, N'HĐMB', N'K6A', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Full nội thất xịn', N'Nguồn: loan'),
(N'K1-702', 1, N'HĐMB', N'K1', 3, 2, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Liên | Ghi chú: Mk căn K1-702. 020603'),
(N'K6-GTM12', 1, N'HĐMB', N'K6', 1, 1, 40, N'Sẵn sàng giao dịch', 0, N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6A-1808', 1, N'HĐMB', N'K6A', 1, 1, 120, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: Thúy | Ghi chú: K6a 1808: 191178#'),
(N'ZB1807', 2, N'HĐMB', N'ZB', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'Nguồn: 1/5: làm full cho thuê'),
(N'F2212A', 2, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F2105', 2, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F2710', 2, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F0703', 2, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F2709', 2, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F1508', 2, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F0311', 2, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'T0205', 3, N'HĐMB', N'T', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'T1005', 3, N'HĐMB', N'T', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA2705', 4, N'HĐMB', N'ZA', 1, 1, 45, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA0806', 4, N'HĐMB', N'ZA', 2, 1, 63, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA2006', 4, N'HĐMB', N'ZA', 2, 1, 63, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA0908', 4, N'HĐMB', N'ZA', 2, 1, 73, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA2608', 4, N'HĐMB', N'ZA', 2, 1, 73, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB2104', 4, N'HĐMB', N'ZB', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA2702', 4, N'HĐMB', N'ZA', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB0404', 4, N'HĐMB', N'ZB', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA2309', 4, N'HĐMB', N'ZA', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB0307', 4, N'HĐMB', N'ZB', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA0402', 4, N'HĐMB', N'ZA', 2, 1, 77, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA2704', 4, N'HĐMB', N'ZA', 2, 1, 90, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB0402', 4, N'HĐMB', N'ZB', 2, 1, 90, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB0905', 4, N'HĐMB', N'ZB', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB2405', 4, N'HĐMB', N'ZB', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB2305', 4, N'HĐMB', N'ZB', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA1710', 4, N'HĐMB', N'ZA', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA310', 4, N'HĐMB', N'ZA', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA2710', 4, N'HĐMB', N'ZA', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA0610', 4, N'HĐMB', N'ZA', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB2302', 4, N'HĐMB', N'ZB', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'');
GO

INSERT INTO dbo.THONG_TIN_CAN_HO (MaCanHo, ma_du_an, PhapLy, PhanKhu, SoPhongNgu, SoWC, DienTich, TrangThaiCanHo, SoLanDaDang, TinhTrangBanGiao, PhongThuy) VALUES
(N'ZB2103', 4, N'HĐMB', N'ZB', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB1508', 4, N'HĐMB', N'ZB', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB0508', 4, N'HĐMB', N'ZB', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA1507', 4, N'HĐMB', N'ZA', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA1805', 4, N'HĐMB', N'ZA', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'T0607', 4, N'HĐMB', N'T', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZA0305', 4, N'HĐMB', N'ZA', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB0706', 4, N'HĐMB', N'ZB', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB0409', 4, N'HĐMB', N'ZB', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB2704', 4, N'HĐMB', N'ZB', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'ZB1605', 4, N'HĐMB', N'ZB', 1, 1, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F210', 4, N'HĐMB', N'F', 1, 1, 9, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F0310', 4, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F0207', 4, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F0212', 6, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F0514', 6, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F2112', 6, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F0510', 6, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F2005', 6, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F703', 6, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N''),
(N'F2115', 6, N'HĐMB', N'F', 3, 2, 114, N'Sẵn sàng giao dịch', 0, N'Cơ bản', N'');
GO

-- ==============================================================================
-- 4. NẠP BẢNG GIÁ THẬT (BÁN & CHO THUÊ)
-- ==============================================================================
PRINT N'Đang nạp bảng giá thật vào BANG_GIA...';

INSERT INTO dbo.BANG_GIA (MaCanHo, LoaiGiaoDich, GiaBan, GiaThue, DienTich_Ref, GhiChu) VALUES
(N'K6-407', N'Bán', 5.8, NULL, 77, N'Nhập căn bán K6 407 giá 5ty800 bao thuế phí chị để lại đồ liền tường cho khách (tủ quần áo, giường, tủ bếp, nóng lạnh)'),
(N'K5-707', N'Bán', 6, NULL, 77, N'căn K5 707 giá 6 tỷ bao thuế phí nội thất có: điều hòa, rèm. nóng lạnh đang có khách thuê'),
(N'K6-804', N'Bán', 5.7, N'10 triệu/tháng', 77, N'Nhập căn K6 804 bán 5700 bao phí full nội thất, chủ đang cho thuê - 10tr500 Chủ TTS'),
(N'K5-1804', N'Bán', 4.614, NULL, 77, N'Nhập căn bán K5 1804 giá 6300 nhà nguyên bản CĐT (chủ sẽ mang hết nội thất đi) khách lấy nội thất thì +200tr chị đang vay VCB  4ty'),
(N'K5-1804', N'Cho thuê', NULL, N'13 triệu/tháng', 77, N'căn K5 1804 Cho thuê full đồ giá 13 triệu  Cọc 1 đóng 3 HĐ 1 năm (ưu tiên thuê 6 tháng), 15/9 mới vào ở dc chủ đang muốn bán, k nên giới thiệu sâu'),
(N'K3-1804', N'Bán', 6.1, NULL, 77, N'BS căn K3-1804: giá 6ty100 bao phí Nhà nguyên bản CĐT , sẵn sổ giao dịch  đi xem nhà dc thoải mái'),
(N'K3-1804', N'Cho thuê', NULL, NULL, 77, N'Nhập căn K3-1804: giá 7ty100 bao 102% Nhà nguyên bản CĐT   đi xem nhà dc thoải mái'),
(N'K5-404', N'Bán', 6.59, NULL, 77, N'Nhập bán k5 404 giá 6ty590 bao thuế phí'),
(N'K2-1904', N'Bán', 6.9, NULL, 77, N'bán K2 1904 giá 6900, có rèm, bàn ăn, 2 điều hòa sẵn sổ đỏ công chứng'),
(N'K6A-1404', N'Bán', 9, NULL, 77, N'K6a- 1404: 6.9 tỷ bao phí, để lại full đồ, đang cho KH thuê - 12tr/tháng (khó đi xem)'),
(N'K6A-1404', N'Cho thuê', NULL, NULL, 77, N'Thúy'),
(N'K6-1007', N'Bán', 6.9, NULL, 77, N'K6-1007 bán 6ty9 bao phí. Có nội thất cơ bản.  Đang có khách thuê. chủ đang vay 1,4 tỷ VCB . có hỗ trợ vay phong tỏa.'),
(N'K6-1007', N'Cho thuê', NULL, NULL, 77, N'bán 6ty780 bao phí 102%. chủ đang vay 1tỷ4'),
(N'K6A-1004', N'Bán', 7.15, N'235 triệu/tháng', 77, N'Nhập căn bán K6a 1004 giá 7150 bao thuế phí  để lại full đồ nội thất có trong căn hộ'),
(N'K6A-1004', N'Cho thuê', NULL, N'11 triệu/tháng', 77, N'Nhập căn K6a 1004 giá 11tr cọc 1 đóng 3 HĐ 1 năm đồ như trên căn hộ (thiếu tivi tủ lạnh máy giặt)'),
(N'K1-1704', N'Bán', 7, NULL, 77, N'bán 7 tỷ bao hết thuế phí , đã có sổ, chủ ko vay, nhà nguyên bản CĐT chủ nhà đang cho thuê'),
(N'K1-1704', N'Cho thuê', NULL, NULL, 77, N'Duy Anh'),
(N'K6-1207', N'Bán', 7, NULL, 77, N'Nhập căn K6 1207: giá 7 tỷ bao 102%, nhà nguyên bản, đang cho thuê'),
(N'K1-1907', N'Bán', 7.25, NULL, 77, N'Nhập căn K1 1907:  7250 bao thuế phí chuyển nhượng bàn giao full nội thất liền tường (K có đồ điện tử)'),
(N'K1-1907', N'Cho thuê', NULL, NULL, 77, N'Thúy'),
(N'K3-1607', N'Bán', 7.4, NULL, 77, N'Nhập k3 1607: 7400 bao phí  full nội thất  Khách thuê đến t9/26 hết hạn'),
(N'K5-1104', N'Bán', 7.3, NULL, 77, N'Nhập căn K5 1104 bán  7ty300 chủ bao thuế phí chuyển nhượng 102% bàn giao full đồ liền tường (chưa có ảnh)'),
(N'K1-1507', N'Bán', 460, NULL, 77, N'Nhập căn K1 1507: bán 7.460 tỷ bao phí chuyển nhượng, để lại full đồ.'),
(N'K3-1207', N'Bán', 1, NULL, 77, N'Nhập bán K3 1207 giá 6500 bao phí, đã có sổ Để lại full đồ liền tường'),
(N'K3-1207', N'Cho thuê', NULL, NULL, 77, N'K3 1207'),
(N'K6A-1804', N'Bán', 7.5, NULL, 77, N'Nhập căn bán K6a 1804 giá 7500 bao tất cả thuế phí nhà nguyên bản CĐT, khách thuê đang ở chủ đang vay VCB ~4154tr, dc hỗ trợ lãi xuất đến tháng 2/2027 (đang check xem có dc tiếp nối khoản vay k) @All'),
(N'K6A-1804', N'Cho thuê', NULL, N'8 triệu/tháng', 77, N'Nhập căn thuê k6a 1804 giá 8tr Cọc 1 đóng 3 HĐ 1 năm Nhà nguyên bản CĐT'),
(N'K6A-1604', N'Bán', 7.4, NULL, 77, N'nhập căn K6a 1604 giá 7400 có full đồ'),
(N'K2-704', N'Bán', 7.7, NULL, 77, N'Nhập nguồn K2-704: bán 7700 bao phí'),
(N'K2-704', N'Cho thuê', NULL, N'11 triệu/tháng', 77, N'K2 704: 2PN -77m K2 Đông Nam - View Công Viên Trái Tim ♥️  Gồm Nội Thất Giường Tủ Liền Tường , 2 Điều Hoà , Máy Giặt , Sofa giường , Bàn Ghế Ăn, máy giặt, tivi nhỏ,  có tủ lạnh (nhưng khách nào giữ gìn thì chủ mới để lại  Giá Thuê : 11 tr/ tháng Đóng'),
(N'K6-610', N'Bán', 6, N'9 triệu/tháng', 89, N'Nhập căn K6 610 bán 6ty chủ bao thuế phí 5% 220  đang cho thuê có dòng tiền  9tr có đồ liền tường: tủ bếp, điều hòa, giường tủ'),
(N'K6-610', N'Cho thuê', NULL, N'225 triệu/tháng', 89, N'K6 610 :  Bán 6.9  tỷ  bao thuế phí cả bảo trì  5% sổ đỏ: 225tr  chủ đang vay 2925tr'),
(N'K6A-701', N'Bán', 6.1, NULL, 89, N'Nhập căn bán K6a 701 : 6100 bao phí nhà nguyên bản CĐT'),
(N'K2-1610', N'Bán', 3, NULL, 89, N'Nhập căn K2 1610 bán 6,3 tỷ bao thuế phí, nhà có full đồ'),
(N'K6-1601', N'Bán', 6.4, NULL, 89, N'Nhập căn K6-1601: bán 6ty400 bao thuế phí'),
(N'K6-1810', N'Bán', 4.1, NULL, 89, N'Nhập căn bán K6 1810 giá 6600 chủ bao thuế phí chuyển nhượng chị đang vay 4ty100 nhà đang để trống, k cho thuê'),
(N'K6-510', N'Bán', 7.1, NULL, 89, N'K6-510 bán 7ty100 bao phí cả bảo trì 102%  chị nhận khách trả thẳng full nội thất liền tường'),
(N'K6-1410', N'Bán', 7.2, NULL, 89, N'Bs căn  K6 12a10: Bán 7ty200 bao 102% K6 1410: Bán 7ty200 bao 102% Cùng 1 chủ, họ sẽ bán 1 trong 2 căn'),
(N'K2-1810', N'Bán', 7.25, NULL, 89, N'Nhập căn K2 1810 giá 7250 bao thuế phí bàn giao full nội thất khách thuê đang ở, đã có sổ đỏ đang thế chấp ngân hàng'),
(N'K3-1201', N'Bán', 7.7, NULL, 89, N'Nhập bán K3 1201 : 7ty700 chủ bao thuế phí, nhà full nội thất, đã có sổ đang cho khách thuê'),
(N'K1-810', N'Bán', 7.7, NULL, 89, N'Nhập căn K1 810 giá net 7ty700 bao thuê phí,  bàn giao full nội thất như trong ả này nh , đang vay 2ty400'),
(N'K1-810', N'Cho thuê', NULL, N'12 triệu/tháng', 89, N'Ngập căn k1 810 Giá thuê 12 triệu nội thất full đồ thiếu tủ lạnh  Cọc 1 đóng 3 HĐ 1 năm  Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê'),
(N'K2-601', N'Bán', 7.77, NULL, 89, N'Nhập căn K2 601 : 7ty770 bao tất cả thuế phí chủ nhà đang cho thuê nguyên bản CĐT (chủ đang lung lay)'),
(N'K6-1710', N'Bán', 8, NULL, 89, N'nhập căn K6 1710 bán 8 tỷ bao phí, full đồ'),
(N'K5-1410', N'Bán', 8.25, NULL, 89, N'BS K5-1410: bán 8ty250 bao 102%, có full nội thất'),
(N'K1-1201', N'Bán', 685, NULL, 89, N'K1 1201 bán 8.685 tỷ bao phí, full nội thất liền tường,  (đồ điện tử chủ mang đi)'),
(N'K3-610', N'Bán', 8.5, NULL, 89, N'nhập căn K3 610 giá 8500  bao thuế phí bàn giao full đồ'),
(N'K2-401', N'Bán', 8.7, NULL, 89, N'Nhập K2 401 bán 8700 bao thuế phí, bàn giao full nội thất'),
(N'K1-710', N'Bán', 7.8, NULL, 89, N'K1-710 bán 7ty8  full hết đồ như hình. cần bán nhanh. tạm thời ko bán nữa đang cho thuê'),
(N'K2-1501', N'Bán', 6.3, NULL, 89, N'Nhập căn K2- 1501: 89m2 giá  6tỷ300 bao phí . chưa bảo trì');
GO

INSERT INTO dbo.BANG_GIA (MaCanHo, LoaiGiaoDich, GiaBan, GiaThue, DienTich_Ref, GhiChu) VALUES
(N'K1-610', N'Bán', 6.5, NULL, 89, N'K1.610.  bán 6ty500 bao phí (trong đó phí sale 1%), đã làm full nội thất'),
(N'K6-403', N'Bán', 6.4, NULL, 96, N'Nhập căn K6 403 giá 6ty400 chủ bao thuế phí  full nội thất liền tường'),
(N'K1-1608', N'Bán', 7.7, NULL, 96, N'K1-1608 bán 7ty7 bao phí, nhà nguyên bản CĐT'),
(N'K1-1608', N'Cho thuê', NULL, N'242 triệu/tháng', 96, N'Mã căn hộ: K1.1608 DT: 96m2  số pn: 3n bán  giá bán 7ty280 (100% căn hộ) bao thuế phí chuyển nhượng phí sale , đã có bảo trì.'),
(N'K6-808', N'Bán', 5, NULL, 96, N'K6-808  : bán 7,5tỷ bao phí 102% . (có thương lượng nếu khách vào sớm)'),
(N'K6-808', N'Cho thuê', NULL, N'129 triệu/tháng', 96, N'Giá bán 7,9tỷ bao phí chưa có BT 129tr. Chủ đang vay BIDV (Đang khó gọi chủ nhà. Mọi người tạm thời đừng dồn vội căn này)'),
(N'K6A-1008', N'Bán', 8, NULL, 96, N'Bán 8tỷ bao hết thuế phí 102%. (trừ 5%: 293triệu). Mua nhanh có thương lượng'),
(N'K1-403', N'Bán', 8.2, NULL, 96, N'Nhập căn K1 403 giá 8ty200 chủ bao thuế phí, nhà nguyen bản CĐT, chủ đang cho thuê đã có sổ, chủ không vay'),
(N'K1-403', N'Cho thuê', NULL, N'15 triệu/tháng', 96, N'Mã căn K1-403 . Chủ ngáo giá Nguyên bản.  Giá thuê : 15tr HĐ lâu dài có thương lượng thêm .  Đã nhận nhà'),
(N'K6-703', N'Bán', 8.2, NULL, 96, N'K6-703 bán 8ty200 bao phí, chưa bảo trì 2%~ 105 triệu. chủ ko vay .'),
(N'K1-508', N'Bán', 3, NULL, 96, N'K1-508. Bán 8,3tỷ bao hết, full nội thất'),
(N'K1-508', N'Cho thuê', NULL, N'16 triệu/tháng', 96, N'K1 508:  cho thuê full đồ thiếu điều hòa PK 15-16tr  , cọc 1 đóng 3 HĐ 1 năm'),
(N'K6-1203', N'Bán', 3, NULL, 96, N'Nhập căn K6 1203 cần bán. Giá 8,3tỷ bao 102%'),
(N'K6-1203', N'Cho thuê', NULL, N'8 triệu/tháng', 96, N'BS Căn k6 1203 cho thuê nguyên bản CĐT dc 8tr/tháng Cọc 1 đóng 3 HĐ 1 năm'),
(N'K1-1603', N'Bán', 8.4, NULL, 96, N'Nhập căn K1 1603 giá 8400 bao thuê phí  nhà có tủ bếp, điều hòa, rèm đã có sổ khách thuê đang ở'),
(N'K3-1108', N'Bán', 8.4, NULL, 96, N'Nhập căn bán K3 1108 bán 8400 bao thuế phí có thương lượng (chưa có lệ phí trước bạ ra sổ tên khách ~22tr) nhà nguyên bản CĐT, đã có sổ'),
(N'K6A-1508', N'Bán', 8.6, NULL, 96, N'căn K6A 1508 a bán 8600 bao phí cả bảo trì'),
(N'K6A-1508', N'Cho thuê', NULL, N'14.5 triệu/tháng', 96, N'Bs căn thuê K6a 1508 giá 14,5tr cọc 1 đóng 3 HĐ 1 năm full đồ  @All'),
(N'K1-1708', N'Bán', 7, NULL, 96, N'Nhập căn: K1 - 1708 bán 8.7 tỷ bao phí, nhà có nội thất cơ bản: tủ bếp, điều hòa, nóng lạnh, sofa, rèm.'),
(N'K6A-1408', N'Bán', 55, NULL, 96, N'Nhập căn K6a-1408. Bán 8,55tỷ bao hết thuế phí'),
(N'K5-1003', N'Bán', 8600, NULL, 96, N'Nhập căn bán k5 1003 giá 8600 tỷ Chủ bao hết thuế phí có đồ liền tường + đang cho khách 12tr'),
(N'K5-1003', N'Cho thuê', NULL, N'12 triệu/tháng', 96, N'Nhập căn k5 1003  cho thuê giá 12tr có đồ cơ bản,rèm,điều hòa,nóng lạnh cọc 1 đóng 3 HĐ 1 năm  phí sale 1 tháng tiền nhà nhận đủ khi khách ký hđ thuê ạ đầu tháng 12 trống'),
(N'K2-603', N'Bán', 8.8, NULL, 96, N'bán 8tỷ8 bao phí 102%'),
(N'K5-808', N'Bán', 8, NULL, 96, N'Bán giá 8,8tỷ bao hết.'),
(N'K5-808', N'Cho thuê', NULL, N'107 triệu/tháng', 96, N'Nhập căn K5 808 bán 8300 bao thuế phí, chưa bảo trì 107tr chủ đang vay VCB cọc trong tháng 11 chủ giảm 100tr'),
(N'K3-1808', N'Bán', 8, NULL, 96, N'Nhập căn K3-1808. Bán 8,8 tỷ bao hết thuế phí chuyển nhượng.'),
(N'K3-1808', N'Cho thuê', NULL, N'9 triệu/tháng', 96, N'Cho thuê nguyên bản CĐT giá 9triệu. Cọc 1 đóng 3 hđ 1 năm. Phí 1 tháng'),
(N'K5-803', N'Bán', 8.8, N'293 triệu/tháng', 96, N'Nhập căn K5 803: 8ty800  bao thuế phí cả bảo trì Nhà nguyên bản CĐT, đi xem dc luôn 5% 293tr đã cho thuê'),
(N'K5-803', N'Cho thuê', NULL, N'293 triệu/tháng', 96, N'Nhập căn K5 803: 8ty530  bao thuế phí cả bảo trì Nhà nguyên bản CĐT, đi xem dc luôn 5% 293tr bán trong tháng 3, công chứng trong tháng 3 10/4 chủ đi nc ngoài tháng 10 về bán sau'),
(N'K3-1708', N'Bán', 9, NULL, 96, N'Bán 9tỷ thu về Full nội thất'),
(N'K3-1708', N'Cho thuê', NULL, N'15.5 triệu/tháng', 96, N'nhập lại k3-1708 cho thuê 15,5 triệu Full nội thất. phí 1 tháng.'),
(N'K2-1803', N'Bán', 9.5, NULL, 96, N'bán 9ty5  bao phí 102% . full nội thất cao cấp . tạm thời ko bán nữa'),
(N'K5-1903', N'Bán', 9.7, NULL, 96, N'Bán 9ty7 bao phí 102% . chủ có vay. tạm thời đang cho thuê chưa bán'),
(N'K5-1903', N'Cho thuê', NULL, NULL, 96, N'Thúy'),
(N'K6A-1703', N'Bán', 9.42, N'16 triệu/tháng', 96, N'K6A - 1703  Chủ bán: 9tỷ420 bao thuế phí  có full nội thất như video chủ đang cho thuê 16tr500/tháng'),
(N'K6A-1703', N'Cho thuê', NULL, N'18 triệu/tháng', 96, N'Nhập căn K6A - 1703 Full nội thất Giá thuê: 18 triệu cọc 1 đóng 3 HĐ 1 năm  Sale 1 tháng'),
(N'K6A-905', N'Bán', 7, NULL, 101, N'K6a-905 Giá bán 6,7tỷ bao thuế phí, nhà nguyên bản CĐt, ko vay NH, phí 1% (Ai có khách ib chị nhé, ko liên quan tới Văn phòng mình HNLand nhé. * Giá 6,5tỷ là bán trong tháng 10, phí còn 30triệu.  * Giá khách vay ko bán 6,5tỷ. Không ưu tiên khách vay '),
(N'K2-1006', N'Bán', 7.3, NULL, 101, N'BS căn K2 1006 bán 7ty300 bao phí sẵn sổ giao dịch, nhà nguyên bản cđt khách đi xem chủ đọc pass'),
(N'K6A-1906', N'Bán', 7.5, NULL, 101, N'Nhập căn K6a 1906: giá 7500 chủ bao thuế phí trừ lại 5%~ 380 nhà có nội thất liền tường (chưa có điều hòa)'),
(N'K3-1805', N'Bán', 7, NULL, 101, N'Nhập căn K3 1805 giá 7,7tỷ chủ bao phí, nhà nguyên bản'),
(N'K3-1805', N'Cho thuê', NULL, N'7 triệu/tháng', 101, N'Nhập căn  - K3 1805 cho thuê nguyên bản CĐT, giá nét 7tr/tháng không bao gồm điện, nước, phí dịch vụ, wifi... - Cọc 1 đóng 3, ký Hợp đồng ít nhất 1 năm. - Phí sale 1 tháng tiền nhà bên em nhận khi 2 bên ký HĐ thuê ạ C dung'),
(N'K6-706', N'Bán', 7.4, NULL, 101, N'K6 706 giá  7400 bao 102% Nhà nguyên bản CĐT'),
(N'K6-706', N'Cho thuê', NULL, N'93 triệu/tháng', 101, N'K6 706 giá 6ty600 bao phí chưa bảo trì 93tr (chủ nhà đang phân vân 50/50)'),
(N'K6-1005', N'Bán', 8, N'10 triệu/tháng', 101, N'Nhập căn K6 1005 giá 8ty bao phí nhà nguyên bản, đang cho thuê 10tr/tháng'),
(N'K6-1005', N'Cho thuê', NULL, N'110 triệu/tháng', 101, N'nhập căn  k6 1005 giá 7 tỷ bao thuế phí chưa bảo trì ~ 110tr chủ đang vay thương mại, cần vốn khách 4500 rút HĐ , 5% 290 (chủ đang 50/50)'),
(N'K2-505', N'Bán', 8, NULL, 101, N'K2-505 Bán 8tỷ bao thuế phí. Nhà NBCĐT, Có sổ sẵn.'),
(N'K6-805', N'Bán', 8.05, NULL, 101, N'Nhập căn k6 805 giá nét 8ty050 bao 102%'),
(N'K6-805', N'Cho thuê', NULL, N'16 triệu/tháng', 101, N'nhập căn k6 805 Cho thuê nội thất full đồ:có,điều hoà,nóng lạnh,giàn phơi,giường tủ,tủ lạnh,máy giặt,bếp..... giá thuê 16 triệu Cọc 1 đóng 3 HĐ 1 năm Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê 23/10 cô đang làm Nt 1 tháng nữa xong'),
(N'K6-1205', N'Bán', 8, NULL, 101, N'Nhập căn K6 1205 bán giá 8tỷ  bao tất cả thuế phí chuyển nhượng để lại full đồ'),
(N'K2-906', N'Bán', 5, NULL, 101, N'K2-906 bán 7.5 ty bao phí, đã có sổ, nhà nguyên bản CĐT');
GO

INSERT INTO dbo.BANG_GIA (MaCanHo, LoaiGiaoDich, GiaBan, GiaThue, DienTich_Ref, GhiChu) VALUES
(N'K1-1505', N'Bán', 8.2, NULL, 101, N'Nhập bán K1 1505:  8200 bao thuế phí ,  bàn giao có đồ cơ bản liền tường giống ảnh, khách thuê đang ở'),
(N'K1-1505', N'Cho thuê', NULL, NULL, 101, N'Nhập bán K1 1505:  8300 bao thuế phí chưa có lệ phí trước bạ  bàn giao có đồ cơ bản liền tường giống ảnh có khách cọc chủ làm dịch vụ sổ đỏ, chủ tạm dừng k bán nữa'),
(N'K5-1605', N'Bán', 8.2, NULL, 101, N'Bán 8ty200 bao phí , chủ đang vay 65% bên viecombank, gốc 6ty1. có hỗ trợ vay và chuyển đổi gói vay'),
(N'K5-1605', N'Cho thuê', NULL, N'17 triệu/tháng', 101, N'Nhập căn k5 1605  Cho thuê giá 17tr đồ cơ bản có điều hoà , nóng lạnh, tủ bếp,rèm giường tủ 2pn Cọc 1 đóng 3 HĐ 1 năm   chủ ưu tiên bán'),
(N'K5-1905', N'Bán', 8.2, NULL, 101, N'bán. 8tỷ 2 bao phí , chủ vay 4 tỷ VCB, có hỗ trợ vay phong tỏa. cần bán sớm, có thương lượng'),
(N'K5-1905', N'Cho thuê', NULL, N'11 triệu/tháng', 101, N'Nhập căn: 101m2 K5-1905 ( 3pn + 2wc ) ban công Đông Nam: 1) Cho thuê nguyên bản của CĐT bàn giao . 2) Hợp đồng cọc 1 đóng 3 ( lâu dài tầm 1 năm - 2 năm )  3) Giá thuê: 11 triệu/tháng'),
(N'K6-1405', N'Bán', 3, NULL, 101, N'Nhập K6 1405, k rác: bán 8,3tỷ bao phí, có gần full nội thất, thiếu 1 điều hoà phòng khách. Có hỗ trợ Kh vay phong toả'),
(N'K6-1405', N'Cho thuê', NULL, N'12 triệu/tháng', 101, N'K6 1405: giá thuê 12tr,(có thương lượng) thiếu điều hoà PK, cọc 1 đóng 3. Phí sale 1 tháng nhận khi ký HĐ. Ký HĐ 1 năm C dung'),
(N'K6-505', N'Bán', 8.3, NULL, 101, N'Nhập căn K6 505 bán 8300 chủ bao thuê thuế phí 102%'),
(N'K6-505', N'Cho thuê', NULL, NULL, 101, N'Thúy'),
(N'K6A-1006', N'Bán', 7.6, NULL, 101, N'Bán 7tỷ6  bao phí , chủ đang vay 770 tr bên bidv, . ko hỗ trợ vay phong tỏa.'),
(N'K6A-1006', N'Cho thuê', NULL, N'101 triệu/tháng', 101, N'k6a 1006: 7500 bao thuế phí chưa bảo trì 101tr  (chủ có nhận cọc nhưng công chứng trong vòng 10 ngày, không hỗ trợ vay Phong tỏa) 11/9: đi lấy xác nhận thanh toán'),
(N'K3-905', N'Bán', 8.5, NULL, 101, N'Nhập căn bán K3 905 giá 8500 chủ bao tất cả thuế phí, đã có sổ, không vay nhà có đồ nội thất liền tường: tủ bếp, giưởng tủ 3 phòng, tủ giày, vách kích, điều hòa (chưa có ảnh) chủ đang cho thuê'),
(N'K6A-1005', N'Bán', 5, NULL, 101, N'Nhập căn K6a - 1005, k rác: 8.5 tỷ bao phí nhé, nhà nguyên bản CĐT'),
(N'K6A-1005', N'Cho thuê', NULL, NULL, 101, N'Nhập căn k6a 1005 giá 7ty bao thuế phí chưa bảo trì (trong đó phí sale 1%)'),
(N'K1-1705', N'Bán', 5, NULL, 101, N'nhập nguồn  K1 -1705 bán 8.5 tỷ bao phí, để lại nội thất liền tường như ảnh, đã có sổ đỏ, (đồ điện tử mang đi) chủ đang vay 3ty, có hỗ trợ khách vay'),
(N'K5-1106', N'Bán', 8.58, NULL, 101, N'Bán 8ty580 bao phí 102%, chủ đang vay'),
(N'K5-1106', N'Cho thuê', NULL, N'124 triệu/tháng', 101, N'K5-1106 bán giá 7050 tỷ bao 100% bảo trì 124tr (chủ đang 50/50)'),
(N'K6A-1705', N'Bán', 1, NULL, 101, N'nhập căn K6a-1705 bán 8,1tỷ bao phí'),
(N'K3-1906', N'Bán', 8.4, NULL, 101, N'Nhập căn K3 1906 bán 8ty400 bao tất cả thuế phí chuyển nhượng cả lệ phí sang tên sổ khách để lại full đồ'),
(N'K3-505', N'Bán', 8.5, NULL, 101, N'nhập căn: K3 505 bán 8ty500 bao phí, có full đồ đang cho thuê, đã có sổ'),
(N'K1-406', N'Bán', 2, NULL, 101, N'Nhập căn bán K1 406 bán 8150 bao thuế phí (chưa có lệ phí trước bạ ra sổ tên khách ~22tr) bàn giao full đồ có trong căn hộ  chủ đang vay 2ty  (có thể cần khách tất toán) đầu tháng 7 có sổ đỏ'),
(N'K2-1505', N'Bán', 9, NULL, 101, N'Giá bán 9tỷ bao phí Full nội thất'),
(N'K6-1606', N'Bán', 9, NULL, 101, N'Nhập bán k6 1606: 9ty bao phí'),
(N'K6-1606', N'Cho thuê', NULL, N'10 triệu/tháng', 101, N'Nhập căn thuê k6 1606 giá 10tr Cọc 1 đóng 3 HĐ 1 năm, nhà nguyên bản'),
(N'K1-1406', N'Bán', 9, NULL, 101, N'Nhập căn K1 1406: bán 9ty để lại full nội thất, bao hết thuế phí (không có ảnh, ace hẹn lịch trc 2 tiếng)'),
(N'K2-1106', N'Bán', 7, NULL, 101, N'Mã căn hộ: K2.1106 DT: 101m2 số pn: 3n bán  giá bán 7ty bao phí chưa bảo trì Chủ đang phân vân 50/50'),
(N'K2-1106', N'Cho thuê', NULL, N'7 triệu/tháng', 101, N'K2 1106: nguyên bản CĐT giá nét  7tr Cọc 1 đóng 3 hd 1 năm (nhận khách văn phòng, gia đình ít ng k có trẻ nhỏ)'),
(N'K1-705', N'Bán', NULL, NULL, 101, N'Tham khảo  bán K1 705: giá hiện tại bao thuế phí để lại full nội thất cho khách khi nào ra sổ đỏ sẽ cân đối lại giá chủ không vội bao giờ có sổ đỏ dc giá mới bán, nên ace nắm thông tin, k chào khách'),
(N'K6-1605', N'Bán', 6, NULL, 101, N'K6-1505. Bán 8,6tỷ bao hết.'),
(N'K2-806', N'Bán', 7.3, NULL, 101, N'Mã căn hộ: K2.806 DT: 101m2 số pn: 3n bán  giá bán 7ty300 bao phí cả bảo trì'),
(N'K6-602', N'Bán', 7.45, NULL, 120, N'Bs bán k6 602 giá 7ty450 chủ bao thuế phí Nhà nguyên bản Có vay bank'),
(N'K6-602', N'Cho thuê', NULL, N'120 triệu/tháng', 120, N'Nhập căn K6 602: 120m giá 7tỷ550 bao phí, chưa có bảo trì 120tr'),
(N'K2-1002', N'Bán', 8.1, NULL, 120, N'Bs K2 1002 bán 8ty100 có nội thất, bao thuế phí (K có đồ điện tử, sofa, điều hoà)'),
(N'K3-502', N'Bán', 8.2, NULL, 120, N'Nhập căn K3 502 giá 8ty200 bao phí, full nội thất liền tường , đồ điện tử chủ mang đi'),
(N'K3-502', N'Cho thuê', NULL, N'260 triệu/tháng', 120, N'K3-502: giá 8ty150 bao phí 102%, full đồ  khi giao dịch khách dc bớt lại 5%~ 260tr  chủ đang vay 65%~ 3380tr cần vốn khách rút HĐ'),
(N'K6A-709', N'Bán', 2, NULL, 120, N'Nhập căn K6a 709 bán 8.2 tỷ bao phí 102% 5% ~ 300tr  nguồn dung'),
(N'K2-1202', N'Bán', 8.05, N'14 triệu/tháng', 120, N'Nhập căn K2 1202: bán 8ty050 bao thuế phí,sổ đỏ cầm tay  -Nội thất : tủ bếp, đhoa, nóng lạnh, rèm giàn phơi  - Hiện đang cho thuê giá 14tr/1th.  Hợp đồng cho thuê đến 9/3.2027'),
(N'K6-402', N'Bán', 8.5, NULL, 120, N'Nhập căn k6 402 giá 8ty500 bao thuế phí Nhà nguyên bản 5% 262 chủ đang ở'),
(N'K6-402', N'Cho thuê', NULL, N'14.5 triệu/tháng', 120, N'Nhập căn k6 402 và k6 902  Cho thuê full đồ liền tường giá 14,5 triệu  Cho thuê nội thất full đồ giá 16 triệu  (Có thương lượng) Cọc 1 đóng 3 HĐ 1 năm  Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ Thuê (Khoảng giữa tháng 12 chủ làm xong NT)'),
(N'K6-1409', N'Bán', NULL, NULL, 120, N'Chủ dừng bán. Tạm thời ai cần xem view vẫn lên xem'),
(N'K6-802', N'Bán', 5, NULL, 120, N'K6-802 bán giá NET 8,5tỷ bao hết để lại Full nội thất liền tường. (Căn này tạm thời dừng bán cho thuê). Anh em tập trung căn 509 k5 nhé'),
(N'K6-802', N'Cho thuê', NULL, N'13 triệu/tháng', 120, N'Cho thuê k6-802 Nội thất liền tường Giá 13triệu. Thiếu đồ điện tử'),
(N'K5-409', N'Bán', 8, NULL, 120, N'Nhập căn k5 409 giá 8ty bao phí Chủ đang vay'),
(N'K6A-702', N'Bán', 8.55, NULL, 120, N'Bán 8ty550  bao thuế phí, cả  bảo trì 117tr. 5% ~ 325 tr .chủ ko vay, có hỗ trợ vay cho khách mới'),
(N'K6A-702', N'Cho thuê', NULL, N'15 triệu/tháng', 120, N'Nhập căn  K6a 702 giá 15 triệu cho thuê nội thất full đồ: rèm, bếp, điều hòa, giường tủ,tủ lạnh máy giặt,tivi.... Cọc 1 đóng 3 HĐ 1 năm'),
(N'K1-709', N'Bán', 8.65, NULL, 120, N'Nhập căn K1 709 bán 8ty650 bao thuế phí, có full đồ khách đang thuê'),
(N'K3-1209', N'Bán', 8.8, NULL, 120, N'BS K3-1209 	bán 8ty8 bao phí sang sổ, nhà có đồ cơ bản,  nhà đang trống đi xem dc luôn'),
(N'K3-609', N'Bán', 9, NULL, 120, N'Bán 9 tỷ bao phí sang tên sổ  full đồ, có cả máy rửa bát, đồ điện tử hiện đại'),
(N'K3-909', N'Bán', 9.1, NULL, 120, N'căn bán K3 909 giá 9ty100  bao tất cả thuế phí đã có sổ đỏ, sẵn sàng giao dịch, nhà  nguyên bản CĐT');
GO

INSERT INTO dbo.BANG_GIA (MaCanHo, LoaiGiaoDich, GiaBan, GiaThue, DienTich_Ref, GhiChu) VALUES
(N'K3-1109', N'Bán', 9.2, NULL, 120, N'bán 9ty2 bao phí sang sổ full đồ nội thất  .có cả máy rửa bát đồ điện tử hàng hiệu'),
(N'K3-1109', N'Cho thuê', NULL, NULL, 120, N'Nhập nguồn K3 1109 Bán 9.4 tỷ bao thuế phí, để lại full đồ'),
(N'K3-809', N'Bán', 8.5, NULL, 120, N'bán 8ty500 bao phí sang sổ full đồ .chủ ko vay'),
(N'K2-1109', N'Bán', 9.2, NULL, 120, N'Nhập căn k2 1109 giá 9ty200 bao tất cả thuế phí Bàn giao full đồ, đã có sổ'),
(N'K2-1109', N'Cho thuê', NULL, N'17 triệu/tháng', 120, N'Nhập căn k2 1109 Cho thuê nội thất full đồ  Giá 17 triệu  Cọc 1 đóng 3 HĐ 1 năm'),
(N'K5-802', N'Bán', 2, NULL, 120, N'Nhập căn: K5-802 bán 9,2tỷ bao hết nguyên bản cđt. 9,7tỷ full nội thất. Hiện chủ đang làm full đồ cả 2 căn . Hai căn này chủ tạm thời dừng bán vì giờ giá chưa tốt'),
(N'K6-1209', N'Bán', 8.5, NULL, 120, N'BS căn K6-1209 giá nét 8ty500 bao thuế phí , chưa bảo trì 125tr 5% 342tr (k ưu tiên bán căn này vì mình k chính chủ)'),
(N'K3-709', N'Bán', 9.6, NULL, 120, N'bán 9ty6 full đồ, bao phí sang sổ .'),
(N'K6-609', N'Bán', 9.6, NULL, 120, N'K6-602. K6-609 dk giá thì bán 9ty6 bao phí 102%'),
(N'K6-1109', N'Bán', 5, NULL, 120, N'bán 8,5tỷ thu về, nội thất đồ cơ bản (ĐH, NL, bếp, rèm, GP) . có đang vay BIDV 65% hdmb'),
(N'K6-1109', N'Cho thuê', NULL, N'12 triệu/tháng', 120, N'Nhập căn  k6 1109 cho thuê giá 12tr có đồ cơ bản tủ bếp,điều hòa,nóng lạnh cọc 1 đóng 3 HĐ 1 năm'),
(N'K6-1909', N'Bán', 9.2, NULL, 120, N'BS k6-1909 bán 9200 full đồ. bao phí chủ đang cho thuê'),
(N'K1-1609', N'Bán', 10.26, NULL, 120, N'Nhập căn k1 1609 giá 10ty260 bao thuế phí Nhà nguyên bản CĐT'),
(N'K3-1809', N'Bán', 9.7, NULL, 120, N'k3-1809 bán 9ty7 có thương lượng, đồ cơ bản, chuẩn bị có sổ .  chủ đang cho thuê, k thiện chí bán'),
(N'K6-1609', N'Bán', 5, NULL, 120, N'Giá bán 9,5tỷ bao hết, nguyên bản CĐT, chủ vay BIĐV 65%'),
(N'K3-702', N'Bán', 10, N'16 triệu/tháng', 120, N'bán 10 tỷ full đồ , bao phí sang tên sổ. hiện tại đang cho thuê giá 16 tr. tháng 6 hét hạn hợp đồng'),
(N'K5-1502', N'Bán', NULL, NULL, 120, N'Nhập căn k5-1502 bán 10800  bao phí chủ đang cho thuê'),
(N'K3-1902', N'Bán', 11, NULL, 120, N'Bán 11 tỷ full đồ, nội thất làm cả 1 tỷ . đã có sổ'),
(N'K5-1402', N'Bán', 5, NULL, 120, N'Nhập căn K5-1402. Giá bán 9,5tỷ thu về'),
(N'K6A-2007', N'Bán', 15, NULL, 147, N'Nhập căn K6a 2007 giá 15ty chủ bao thuế phí  BC Đông Nam, 3PN, 147m2'),
(N'K5-2001', N'Bán', 16.3, NULL, 167, N'Nhập căn K5 2001: giá 16ty300 bao thuế phí 102% 167m2- 4PN: Bc Tây Bắc chủ đã 95% với CĐT'),
(N'K3-2003', N'Bán', 19, NULL, 238.33, N'Mã: K3-2003, DT 238.33m²,  4 phòng ngủ., BC Đông Nam Gía 19 tỷ bao thuế phí, chủ đang làm sổ đỏ'),
(N'K6-2003', N'Bán', 22.7, NULL, 181, N'Nhập căn K6 2003: bán 22ty7 giá bao phí , cả bảo trì, đông nam, 4PN, 181m  Giá gốc 20ty463'),
(N'K5-2005', N'Bán', 24.5, NULL, 271, N'Nhập căn K5 2005, DT 271m2 bán 24ty500 bao hết thuế phí Ban công Đông Nam'),
(N'K1-GTM07', N'Bán', 3.15, NULL, 40, N'Nhập bán K1 GTM07 - Stu - 40m, Tầy Băc: bán giá  3150 bao phí có đồ điều hoà, tủ lạnh, máy giat, bình nóng lạnh , rèm: đang cho khách thue'),
(N'K1-GTM17', N'Bán', 3.2, NULL, 45, N'Nhập căn K1 GTM17 bán 3200 bao phí có sổ, chủ đang vay bank 1240 tự tất toán dc có đồ điều hòa và rèm'),
(N'K3-GTM03', N'Bán', 3.5, NULL, 44, N'nhập căn K3 GTM03 - stu, 44m, BC Tây Bắc bán  3500  chủ bao thuế phí (khách chịu lệ phí trước bạ) đã có sổ đỏ  Đang cho thuê'),
(N'K3-GTM08', N'Bán', 3.5, NULL, 44, N'Nhập căn k3 gtm08 - stu, 44m, giá 3ty500 bao thuế phí Nhà full đồ Khách thuê đang ở - 8tr500'),
(N'K3-GTM08', N'Cho thuê', NULL, N'9 triệu/tháng', 44, N'Căn k3 gtm08 full giá 9tr cọc 1 đóng 3 HĐ 1 năm  1/11 trống'),
(N'K3-GTM05', N'Bán', 3.45, NULL, 46, N'Nhập căn k3 gtm05 - 1N1K - 46m, BC Tây Bắc, giá 3ty450 bao thuế phí Nhà nguyên bản + vách kích + 1 nóng lạnh (còn lại toàn đồ của khách thuê)'),
(N'K3-GTM06', N'Bán', 3.9, NULL, 46, N'Nhập căn k3 GTM06 1 ngủ 1 khách, diện tích 46m, bc Tây Bắc Bán 3ty900 bao phí Nhà full nội thất Đang cho thuê Tháng 8 có sổ'),
(N'K3-GTM10', N'Bán', 3.2, NULL, 48, N'Nhập K3 GTM10 - 1N1K - 48m, TB: bán 3200 bao thuế phí đang cho thuê, nhà có đồ 2 điều hòa, rèm'),
(N'K3-GTM10', N'Cho thuê', NULL, N'7 triệu/tháng', 48, N'Nhập căn  thuê K3 GTM10: giá 7tr, cọc 1 đóng 3 HĐ 1 năm nhà có điều hòa, rèm 1/12 trống nhà'),
(N'K3-GTM12', N'Bán', 2.6, NULL, 45, N'Nhập căn bán K3 GTM12 giá 2600 bao phí đã có sổ, chủ TTS nhà có điều hòa, rèm, nóng lạnh anh đang cho thuê'),
(N'K3-GTM15', N'Bán', 3.1, N'6 triệu/tháng', 44, N'BC Đông Nam, 44m2 - Stu bán 3ty100 bao hết thuế phí ,'),
(N'K3-GTM15', N'Cho thuê', NULL, N'6 triệu/tháng', 44, N'Nhập căn  K3-gtm 315 ( 44m2 hướng bc Đông Nam)  Có 1 điều hòa cho thuê giá 6tr ( nếu lắp rèm + nóng lạnh giá 6,5tr )  Phí sale e nhận 1 tháng tiền nhà ngay sau khi kí hđ thuê C nhé.  ( ưu tiên khách hàng ở văn phòng) Nguồn Tam Anh'),
(N'K3-GTM17', N'Bán', 4, NULL, 52, N'Nhập căn K3 GTM17, 52m, 1N1K, BC ĐN: bán 4ty, full nội thất chủ đang ở, chưa có ảnh khách thiện chí chủ mới cho xem'),
(N'K3-GTM22', N'Bán', 3.3, NULL, 50, N'Nhập bán K3 GTM22 -  1N1K - 50m:   giá 3ty300 bao thuế chủ đang ở có full đồ  chủ đang vay 1ty2'),
(N'K5-GTM04', N'Bán', 3, NULL, 40, N'Nhập căn: 1.  K5 GTM04 - 40m:  bán nết 3ty bao phí (102%) cả bảo trì 39tr, 5% 107tr'),
(N'K5-GTM04', N'Cho thuê', NULL, N'5 triệu/tháng', 40, N'nhập căn k5 gtm04 giá 5tr500, stu Nguyên bản CĐT Cọc 1 đóng 3 HĐ 1 năm  Phí sale 1 tháng tiền nhà  nhận đủ khi khách ký hđ thuê Kh thuê tự đi làm điện'),
(N'K5-GTM14', N'Bán', 2.7, NULL, 45, N'Bán 2ty7 bao thuế phí 102% . full đồ , thiếu tivi.'),
(N'K5-GTM17', N'Bán', 3.8, NULL, 52, N'Nhập căn K5 GTM17 - 1N1K- 52m, bán: 3800 bao thuế phí chuyển nhượng'),
(N'K5-GTM17', N'Cho thuê', NULL, N'7 triệu/tháng', 52, N'Nhập căn thuê K5 GTM17 giá 7tr cọc 1 đóng 3 HĐ 1 năm nhà nguyên bản CĐT'),
(N'K5-GTM19', N'Bán', 550, NULL, 44, N'Nhập căn K5 - GTM 19. ( Căn Studio - 44m) 3.550 tỷ bao hết thuế phí, chưa bảo trì 42tr'),
(N'K5-GTM19', N'Cho thuê', NULL, N'5 triệu/tháng', 44, N'Nhập căn thuê K5 GTM19, stu - giá 5tr cọc 1 đóng 3 HĐ 1 năm nhà nguyên bản CĐT'),
(N'K6-GTM04', N'Bán', 2.85, NULL, 40, N'Nhập căn k6 gtm04 - 40m:  giá 2ty850 bao phí, chưa bảo trì 37tr,  5%- 100tr BC Tây Bắc'),
(N'K6-GTM04', N'Cho thuê', NULL, N'6 triệu/tháng', 40, N'nhập căn k6 gtm04  cho thuê đồ cơ bản giá (net)6 triệu/tháng cọc 1 đóng 3 HD 1 năm  phí sale 1 tháng tiền nhà nhận đủ khi khách ký HD thuê'),
(N'K6-GTM07', N'Bán', 2.8, NULL, 45, N'Nhập căn K6 GTM07: giá 2800 bao thuế phí, chưa bảo trì 37tr chủ đang đóng 70% khi công chứng chị bớt cho khách 30% ~ 616tr'),
(N'K6-GTM03', N'Bán', 3.2, NULL, 45, N'bán 3ty2 bao hết thuế phí'),
(N'K3-607', N'Cho thuê', NULL, N'12.5 triệu/tháng', 77, N'BS  k3 607 giá thuê 12,5 triệu nội thất full đồ Cọc 1 thanh toán 12 tháng HĐ 1 năm ( phí sale 15 triệu) Giá thuê 13 triệu nội thất full đồ  Cọc 1 đóng 6 HĐ 1 năm (phí sale 1 tháng)');
GO

INSERT INTO dbo.BANG_GIA (MaCanHo, LoaiGiaoDich, GiaBan, GiaThue, DienTich_Ref, GhiChu) VALUES
(N'K1-1807', N'Cho thuê', NULL, N'13 triệu/tháng', 77, N'Nhập căn k1 1807 cho thuê nội thất full đồ  hợp đồng 1 năm: đóng 3 cọc 1 giá 13tr/ tháng,  đóng 6 cọc 1 giá 12.5tr/tháng, đóng 12 cọc 1 giá 12tr/tháng Phí sale nửa tháng nhận đủ khi khách ký HĐ thuê.'),
(N'K6-1907', N'Cho thuê', NULL, N'7 triệu/tháng', 51, N'CĐT cho thuê 4 căn hộ cho thuê (nguyên bản của CĐT)  K6-1907 - 77,51m 7tr cọc 1 đóng 3/6 HĐ 2 năm'),
(N'K6A-1607', N'Cho thuê', NULL, N'7 triệu/tháng', 77, N'BS căn thuê K6a 1607 giá 7tr/ tháng, cọc 1 đóng 3, HĐ 1 năm, nhà nguyên bản CĐT chọn khách gia đình giữ nhà, có thể cho thuê ổn đỉnh lâu dài'),
(N'K2-1001', N'Cho thuê', NULL, N'11 triệu/tháng', 89, N'Nhập căn cho thuê k2 1001 giá 11tr, cọc 1 đóng 3 HĐ 1 năm,  Có đồ cơ bản + giường tủ  1/11: nhà trống'),
(N'K1-1801', N'Cho thuê', NULL, N'14 triệu/tháng', 89, N'Nhập căn K1 1801 giá 13-14tr , cọc 1 đóng 3 HĐ 1 năm'),
(N'K1-1710', N'Cho thuê', NULL, N'8 triệu/tháng', 89, N'Nhập căn cho thuê k1 1710 giá 8tr cọc 1 đóng 3 HĐ 1 or 2 năm  1/12 trống Nhà nguyên bản'),
(N'K5-901', N'Cho thuê', NULL, N'8 triệu/tháng', 89, N'Nhập căn K5 901 giá 8tr cọc 1 đóng 3 HĐ 1 năm nhà nguyên bản CĐT 1/11 trống'),
(N'K6A-1510', N'Cho thuê', NULL, N'10 triệu/tháng', 89, N'Nhâp căn cho thuê K6a 1510 giá 10tr/ tháng cọc 1 đóng 3 HĐ 1 năm có đồ cơ bản: điều hòa tủ bếp rèm nóng lạnh khoảng đầu tháng 11 ở dc'),
(N'K1-1110', N'Cho thuê', NULL, N'15.5 triệu/tháng', 89, N'Nhập căn  K1 1110 giá thuê 15,5tr Cho thuê nội thất full đồ (thiếu máy giặt) Cọc 1 đóng 3 HĐ 1 năm  Phí sale 1 tháng tiền nhà (nhận đủ khi khách ký HĐ thuê)'),
(N'K6-1901', N'Cho thuê', NULL, N'10 triệu/tháng', 89, N'Nhập căn K6 1901 giá 10tr, có điều hòa và rèm cọc 1 đóng 3 HĐ 1 năm chủ nhà đang muốn lắp thêm đồ, nên mn chưa sale'),
(N'K6-401', N'Cho thuê', NULL, N'16 triệu/tháng', 89, N'Nhập căn K6 401 giá 16tr cọc 1 đóng 3 HĐ 1 năm full đồ đang trống, Chủ kén khách: nhận gia đình nhỏ, hoặc các bạn nữ k nhận nhóm bạn nam, đặc biệt k thích hút thuốc lá (Hình ảnh đang cập nhật)'),
(N'K6-1801', N'Cho thuê', NULL, N'8 triệu/tháng', 89, N'K6-1801  1. Thuê nguyên bản: giá 8triệu/tháng 2. Hợp đồng cọc 1 đóng 3 tối thiểu 1 năm.'),
(N'K6-810', N'Cho thuê', NULL, N'8 triệu/tháng', 89, N'nhập căn k6 810  Nguyên bản CĐT giá 8tr (anh chủ đang chốt NT) cọc 1 đóng 3 Hđ 1 năm'),
(N'K5-1808', N'Cho thuê', NULL, N'15 triệu/tháng', 96, N'Nhập căn k5 1808 cho thuê full đồ liền tường như ảnh   Giá 15tr Cọc 1 đóng 3 HĐ 1-2 năm  phí 1 tháng'),
(N'K3-708', N'Cho thuê', NULL, N'12.5 triệu/tháng', 1, N'Nhập căn k3 708 giá thuê 12,5 triệu có :điều hoà, nóng lạnh, tủ bếp, bếp, giàn phơi, rèm, 2 giường, 1 bộ bàn ghế tiếp khách gỗ, 1 máy giặt - về giá thuê 11 triệu nét những khách phải đóng 6 Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê'),
(N'K6-1903', N'Cho thuê', NULL, N'8 triệu/tháng', 87, N'CĐT cho thuê 4 căn hộ cho thuê (nguyên bản của CĐT) K6-1903 - 96,87m  8tr  cọc 1 đóng 3/6 HĐ 2 năm'),
(N'K6A-908', N'Cho thuê', NULL, N'8 triệu/tháng', 96, N'Nhập nguồn K6a 908: giá 8tr, đóng 3 cọc 1 HĐ 1 năm nhà nguyên bản CĐT'),
(N'K2-1503', N'Cho thuê', NULL, N'9 triệu/tháng', 96, N'Nhập căn k2 1503 cho thuê nguyên bản CĐT giá 9tr  Cọc 1 đóng 3 HĐ 1 năm  (chủ khó làm việc)'),
(N'K6-608', N'Cho thuê', NULL, N'10 triệu/tháng', 96, N'Nhận căn K6 608 giá chủ đang muốn 10tr( chị đang kéo xuống 9tr) cọc 1 đóng 3 HĐ 1 năm, nhà nguyên bản CĐT'),
(N'K6A-406', N'Cho thuê', NULL, N'8 triệu/tháng', 101, N'Nhập căn: K6a-406 cho thuê nguyên bản cđt. Giá 8triệu/ tháng. Phí sale 1 tháng tiền nhà'),
(N'K6-1106', N'Cho thuê', NULL, N'12 triệu/tháng', 101, N'Nhập căn thuê K6 1106 giá 12tr cọc 1 đóng 3 HĐ 1 năm có đồ cơ bản: điều hòa tủ bếp rèm nóng lạnh khách thuê đang ở hết tháng 9 trả nhà'),
(N'K5-706', N'Cho thuê', NULL, N'12 triệu/tháng', 101, N'nhập căn k5 706 Giá 12 triệu nội thất cơ bản Có rèm, điều hòa, nóng lạnh,giàn phơi, hệ thống bếp từ hút mùi đầy đủ   Đầu tháng 8 chủ làm xong NT'),
(N'K6A-1706', N'Cho thuê', NULL, N'12 triệu/tháng', 101, N'Nhập căn k6a 1706  Cho thuê nguyên bản giá 12tr  Đồ cơ bản 14-15tr Cọc 1 đóng 3 HĐ 1 năm'),
(N'K3-409', N'Cho thuê', NULL, N'16 triệu/tháng', 120, N'nhập căn:k3 409  Giá 16tr full đồ  Cọc 1 đóng 3 tháng HĐ 1 năm 12/11: trống Phí sale 1 tháng tiền nhà ( nhận đủ khi khách ký HĐ thuê ạ)'),
(N'K6-702', N'Cho thuê', NULL, N'9 triệu/tháng', 120, N'Nhập căn  thuê K6 702: giá 9tr500 , cọc 1 đóng 3 HĐ 1 năm (có ký dài nhưng giá đàm phán) tìm khách gia đình chuẩn chỉ, giữ gìn nhà'),
(N'K6-509', N'Cho thuê', NULL, N'8 triệu/tháng', 120, N'Cho thuê nguyên bản CĐT giá 8triệu. Cọc 1 đóng 3 hđ 1 năm. Phí 1 tháng'),
(N'K6A-1509', N'Cho thuê', NULL, N'9 triệu/tháng', 120, N'Cho thuê nguyên bản CĐt 9triệu. Cọc 1 đóng 3, hđ 1 năm. Phí 1 tháng'),
(N'K6-709', N'Cho thuê', NULL, N'10 triệu/tháng', 120, N'Nhập căn k6 709 Giá 10tr cho thuê nguyên bản CĐT  Cọc 1 đóng 3 HĐ 1 năm'),
(N'K6-1402', N'Cho thuê', NULL, N'16 triệu/tháng', 120, N'em note lại tt căn  k6 1402 giá 16tr k6 510 gia 13tr k6 403 giá 15tr cho thuê nội thất full đồ  cọc 1 đóng 3 HD 1 năm'),
(N'K1-402', N'Cho thuê', NULL, N'13 triệu/tháng', 120, N'Mã căn hộ: K1.402  DT: 120 m2- 3n PA:  nguyên bản CĐT 13tr/ tháng  chủ sẵn sàng nhận khách 2 năm'),
(N'K1-GTM21', N'Cho thuê', NULL, N'5 triệu/tháng', 45, N'Nhập căn k1 gtm21  Giá thuê 5-5tr500  Nhà nguyên bản CĐT  Cọc 1 đóng 3 HĐ 1 năm  Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê Đầu tháng 12 trống'),
(N'K5-GTM11', N'Cho thuê', NULL, N'10 triệu/tháng', 45, N'Nhập căn K5 GTM11 giá 10tr cọc 1 đóng 3 HĐ 1 năm có đồ: tủ bếp, điều hòa, rèm nóng lạnh'),
(N'K6-GTM18', N'Cho thuê', NULL, N'7 triệu/tháng', 52, N'nhập căn, 52m 1ngu, ĐN K6 gtm18 Giá 7tr nguyên bản CĐT Cọc 1 đóng 3 HĐ 1 năm Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê'),
(N'K6-GTM23', N'Cho thuê', NULL, N'8 triệu/tháng', 45, N'Nhập căn k6 gtm23  Cho thuê giá 8tr có thương lượng nội thất điều hòa, rèm, nóng lạnh, giường,tủ bếp,bàn ăn ( ko có đồ điện tử).        Cọc 1 đóng 3 HĐ 1 năm ,'),
(N'TOWN-7-22', N'Cho thuê', NULL, N'15 triệu/tháng', 45, N'Town 7.22 1. Thuê Tầng 1  2. Nội thất có: Điều hoà.  3. Giá: 15 triệu Cọc 1 tháng. Đóng 3 tháng/ lần. HĐ 1 năm 4. Phí sale: 1 tháng. Nhận đủ khi khách ký HĐ thuê + đóng đủ 3 tháng tiền nhà Nguồn Doanh'),
(N'TOWN-8-9', N'Cho thuê', NULL, N'15 triệu/tháng', 45, N'Town 8.9 1. Nội thất: Nhà thô 2. Giá 15 triệu. Cọc 1 đóng 3. HĐ lâu dài.  (Giá 15 triệu trong năm đầu tiên,  năm thứ 2 trở đi điều chỉnh theo thị trường, nhưng ko tăng QUÁ 15%/năm) 3. Phí sale: 1 tháng nguồn doanh'),
(N'TOWN-2-15', N'Cho thuê', NULL, N'7 triệu/tháng', 45, N'Nhập Căn Thuê - Tầng 3 - Town 2.15  1. Khách thuê làm văn phòng ( ko nhận khách để ở) 2. Nội thất: Điều hoà, rèm, quạt trần, full vệ sinh. 2. Giá thuê 7 triệu 3. Cọc 1 tháng. Đóng 3 tháng/ lần. HĐ 1 năm.  Phí sale  là: 1 tháng.  (Nhận đủ khi kí HĐ Th'),
(N'K6A-704', N'Cho thuê', NULL, N'223 triệu/tháng', 77, N'Nhập căn K6a 704 chị bán 7ty bao tất cả thuế phí, cả bảo trì 5% ~ 223tr, chủ TTS'),
(N'K6-507', N'Cho thuê', NULL, N'74 triệu/tháng', 77, N'Nhập căn K6 507: bán 6150  bao phí, chưa bảo trì ~ 74tr khách dc bớt lại 5% làm sổ 202tr chủ có hỗ trợ vay phong tỏa'),
(N'K5-1004', N'Cho thuê', NULL, N'83 triệu/tháng', 77, N'Nhập căn K5 1004: 7 tỷ bao 100%, bảo trì 83tr, chủ chưa thiện chí bán, để cho thuê'),
(N'K5-1904', N'Cho thuê', NULL, NULL, 77, N'Thúy'),
(N'K1-510', N'Cho thuê', NULL, NULL, 89, N'Nhập căn K1 510 bán: 8 tỷ bao hết thuế phí, để lại full đồ (cả đồ điện), đã có sổ đỏ. (không nhiệt tình bán)'),
(N'K5-601', N'Cho thuê', NULL, N'222 triệu/tháng', 89, N'Nhập căn bán k5 601 giá 6ty950 bao hết thuế phí cả bảo trì 5% 222tr, chủ tts'),
(N'K6A-601', N'Cho thuê', NULL, N'80 triệu/tháng', 89, N'Nhập căn K6a 601 giá  6ty700 bao thuế phí (102%) cả bảo trì 80tr chủ đang vay bank 2ty900 VCB  5% 222tr'),
(N'K5-1910', N'Cho thuê', NULL, NULL, 89, N'K5 1910 : Giá bán 6.7 tỷ bao phí, chưa có 2% bảo trì  Hiện trạng chưa gọi được, chưa muốn bán nên tạm  ko chào'),
(N'K6-1504', N'Cho thuê', NULL, NULL, 5, N'nhập căn hộ: K6.1504 -  77,5m2 Giá : 6 tỷ300 bao thuế phí chưa bảo trì  Chủ đang vay VCB 65%'),
(N'K6A-901', N'Cho thuê', NULL, N'75 triệu/tháng', 89, N'Nhập căn K6A-901. Bán nét 6tỷ130 bao thuế phí 100%. chưa bảo trì ~ 75tr 5% 200tr, chủ thanh toán sớm chủ đang phân vân 50/50'),
(N'K6A-810', N'Cho thuê', NULL, N'95 triệu/tháng', 89, N'Nhập căn K6a 810 muốn bán giá 5tỷ950 bao phí, chưa bảo trì ~ 95tr'),
(N'K5-1101', N'Cho thuê', NULL, N'85 triệu/tháng', 89, N'K5 1101 bán 6100 bao 100%, chưa bảo trì 85tr'),
(N'K1-910', N'Cho thuê', NULL, NULL, 89, N'Thúy');
GO

INSERT INTO dbo.BANG_GIA (MaCanHo, LoaiGiaoDich, GiaBan, GiaThue, DienTich_Ref, GhiChu) VALUES
(N'K1-601', N'Cho thuê', NULL, NULL, 89, N'bán K1 601 giá  5ty850 bao 102%'),
(N'K1-1101', N'Cho thuê', NULL, NULL, 89, N'Thúy'),
(N'K5-610', N'Cho thuê', NULL, NULL, 89, N'K5 610: muốn dc giá bán'),
(N'K2-501', N'Cho thuê', NULL, N'74 triệu/tháng', 89, N'Mã căn K2-501 . 89m2 (qua tết mới bán)  bao thuế phí, chưa bảo trì 74tr   (chủ đang cân đối bán, mn có khách thiện chí ib riêng nhé)'),
(N'K6A-1103', N'Cho thuê', NULL, N'308 triệu/tháng', 96, N'Nhập căn K6a 1103 giá 8300 bao thuế phí cả bảo trì 5% 308tr'),
(N'K1-1108', N'Cho thuê', NULL, NULL, 96, N'Nhập căn K1 1108 bán 8600 chủ bao thuế phí chuyển nhượng tất cả'),
(N'K6A-1503', N'Cho thuê', NULL, NULL, 96, N'Nhập căn K6a 1503 giá 8500 bao thuế phí chưa có bảo trì'),
(N'K5-1803', N'Cho thuê', NULL, NULL, 96, N'Nhập căn k5-1803 : giá bán 8ty bao phí cả bảo trì 102% chủ k thiện chí bán'),
(N'K6A-503', N'Cho thuê', NULL, N'110 triệu/tháng', 96, N'Nhập mã căn K6a- 503 : Giá bán 7 tỷ bao phí,  chưa có bảo trì  110tr (chủ đang phân vân 50/50)'),
(N'K6-1808', N'Cho thuê', NULL, N'145 triệu/tháng', 96, N'Nhập mã căn K6- 1808 : Giá bán 8.330 tỷ bao phí,  chưa có bảo trì  145tr chủ tts 95% chủ 50/50, rất kiêu, khó làm việc'),
(N'K6A-1003', N'Cho thuê', NULL, NULL, 96, N'Thúy'),
(N'K6-905', N'Cho thuê', NULL, NULL, 101, N'Nhập căn K6 905: bán 7800 bao phí chưa bảo trì'),
(N'K2-1606', N'Cho thuê', NULL, N'30 triệu/tháng', 101, N'Nhập căn K2 1606 bán 7tỷ450( có gia lộc )chủ bao thuế 2%, chưa có lệ phí trước bạ 0,65%~ 30tr chủ đang rút hồ sơ về làm sổ đỏ'),
(N'K6-1806', N'Cho thuê', NULL, N'124 triệu/tháng', 101, N'Nhập căn K6-1806. Giá bán 7.5tỷ  bao thuế phí 100% , chưa bảo trì 124tr, chủ mới đóng 70%  chủ đổi ý chưa muốn bán'),
(N'K5-905', N'Cho thuê', NULL, N'93 triệu/tháng', 101, N'Nhập căn K5-905  giá 7100 bao thuế phí 100%. bảo trì 93tr , chủ có hỗ trợ vay phong toả, Giá hđ 5.354tỷ.'),
(N'K6A-1406', N'Cho thuê', NULL, NULL, 101, N'Nhập căn K6a-1406. Bán 7tỷ bao thuế phí có bảo trì. Đang Vay BIDV 65%.'),
(N'K6-606', N'Cho thuê', NULL, N'100 triệu/tháng', 101, N'Nhập căn K6-606. Giá bán 6.5tỷ  bao thuế phí 100%, chưa bảo trì 100tr.    chủ TTS 95%'),
(N'K6A-806', N'Cho thuê', NULL, N'100 triệu/tháng', 101, N'Nhập căn K6a 806 : 6550  chủ bao thuế phí , chưa có bảo trì (chủ muốn bán đổi lên tầng cao, nhưng chỉ có 100tr để bù khoai)'),
(N'K6A-605', N'Cho thuê', NULL, N'110 triệu/tháng', 101, N'Nhập căn K6a 605: giá 6650 bao thuế phí, chưa bảo trì 110tr'),
(N'K6-806', N'Cho thuê', NULL, NULL, 101, N'Lưu'),
(N'K1-405', N'Cho thuê', NULL, NULL, 101, N'Thúy'),
(N'K3-506', N'Cho thuê', NULL, NULL, 101, N'Thúy'),
(N'K6A-1405', N'Cho thuê', NULL, N'300 triệu/tháng', 101, N'Bán 7ty530  bao thuế phí, chưa bảo trì. 5% là 300 triệu .  thiện chí bán. ko hỗ trợ vay phong tỏa  Tạm dừng bán  hỗ trợ vay bank +30tr'),
(N'K1-1905', N'Cho thuê', NULL, NULL, 101, N'Mã căn K1-1905 : 101m2  Giá bán : 5.75tỷ thu về (100%) chưa bảo trì 2%   Chủ đã đóng 95%, ko vay Phí sale 1%'),
(N'K6A-902', N'Cho thuê', NULL, N'334 triệu/tháng', 120, N'Nhập căn: K6A - 902 Giá  9.2 tỷ (có thương lượng)bao thuế phí cả bảo trì  Nguyên bản CĐT'),
(N'K6-409', N'Cho thuê', NULL, NULL, 120, N'Bán 8ty2  bao phí 102%. chủ đang vay'),
(N'K5-1609', N'Cho thuê', NULL, N'156 triệu/tháng', 120, N'Nhập căn K5 1609: bán 9ty300 chủ bao hết thuế phí cả bảo trì 156tr chủ đang vay bank,'),
(N'K5-1909', N'Cho thuê', NULL, NULL, 120, N'k5 1909'),
(N'K6A-609', N'Cho thuê', NULL, NULL, 120, N'Bán 7ty4 bao thuế phí, chưa bảo trì. giá gốc 6ty028. chủ đang song song tìm nhà bên KĐT Việt Hưng, bán bên này mua bên khác . tạm dừng bán .'),
(N'K1-1209', N'Cho thuê', NULL, NULL, 120, N'Thúy - sale 1%'),
(N'K5-1009', N'Cho thuê', NULL, NULL, 120, N'Nhập bán K5-1009. Bán 8tỷ bao thuế phí 100%  nguồn:  c Lưu, chủ đang 50/50'),
(N'K1-1402', N'Cho thuê', NULL, N'160 triệu/tháng', 120, N'Nhập căn k1 1402 giá 8tỷ550 có phí sale + công chứng, chưa có 2,65 thuế ~ 160tr,  công chứng khi có sổ đỏ không vay! đang làm sổ đỏ, giao dịch bằng sổ đỏ nhà nguyên bản CĐT, đi xem hẹn trc'),
(N'K2-1710', N'Cho thuê', NULL, NULL, 120, N'Thúy'),
(N'K1-502', N'Cho thuê', NULL, NULL, 120, N'Thúy'),
(N'K2-2004', N'Cho thuê', NULL, N'391 triệu/tháng', 146, N'Nhập Mã K2-2004, DT 146m, 3PN, BC Đông Nam giá bán 12ty bao phí 102% (có thương lượng) 5% 391tr chủ đang vay 65% ~ 5100tr,  (ưu tiền đẩy trc)'),
(N'K2-1705', N'Cho thuê', NULL, NULL, 120, N'liên. đợi nhận sổ xong mới bán'),
(N'K5-GTM05', N'Cho thuê', NULL, NULL, 120, N'2. K5 GTM05 - 46m : bán 3ty450 bao phí (102%) cả  bảo trì 44tr, 5% 125tr (Đang cho thuê)'),
(N'K5-GTM06', N'Cho thuê', NULL, NULL, 120, N'3. K5 GTM06- 46m:  bán 3ty450 bao phí (102%) cả bảo trì 44tr, 5% 125tr (Đang cho thuê)'),
(N'K6A-1410', N'Cho thuê', NULL, NULL, 120, N'Nhập căn K6a 1410 giá 6ty900 chủ bao thuế phí 102%'),
(N'K1-501', N'Cho thuê', NULL, NULL, 120, N'Nhập căn: K1 501 bán 7ty100 bao thuê phí đã có sổ chủ k vay, nhà nguyên bản CĐT (đi xem nhà dc luôn)'),
(N'K6-1702', N'Cho thuê', NULL, N'16 triệu/tháng', 120, N'Nhập căn  -K6 1702 cho thuê nội thất full đồ cả đồ điện tử giá 16tr Cọc 1 đóng 3 HĐ 1-2 năm  Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê'),
(N'K5-501', N'Cho thuê', NULL, N'203 triệu/tháng', 120, N'Nhập căn K5 501 bán 7550 chủ bao thuê thuế phí 102%, full đồ'),
(N'K3-903', N'Cho thuê', NULL, NULL, 120, N'Nhập bán K3 903 giá 8ty300 chủ bao tất cả thuê phí nhà nguyên bản CĐT đã có sổ, không vay'),
(N'K6-1608', N'Cho thuê', NULL, N'132 triệu/tháng', 120, N'Nhập bán k6 1608 bán 8350 bao thuế phí cả bảo trì 132tr có hỗ trợ vay phong toả . phải công chứng  ngày 11/7'),
(N'K6A-1206', N'Cho thuê', NULL, N'12 triệu/tháng', 120, N'Nhập căn k6a 1206 Nội thất cơ bản rèm, nóng lạnh,tủ bếp,giàn phơi, điều hòa, nóng lạnh.giá 12tr.(nét  Phí sale1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê cho thuê trong vòng 2 tuần 19/5'),
(N'K3-603', N'Cho thuê', NULL, NULL, 120, N'Nhập căn K3 603: bán 8200 chủ bao tất cả thuế phí, bàn giao full nội thất'),
(N'K6-1707', N'Cho thuê', NULL, N'290 triệu/tháng', 120, N'Nhập bán K6 1707 giá net  6900 chủ bao hết thuế phí 102% 5% 290tr'),
(N'K2-902', N'Cho thuê', NULL, N'17 triệu/tháng', 120, N'Nhập căn k2 902 Cho thuê Giá 17 triệu nội thất full đồ  Cọc 1 đóng 3 HĐ 1 năm  Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê'),
(N'K2-1510', N'Cho thuê', NULL, N'11 triệu/tháng', 120, N'K2 1510: cho thuê 11tr/tháng đồ cơ bản Cọc 1 đóng 3, ký HĐ thuê 1 năm Phí sale 1 tháng nhận khi khách ký HĐ thuê'),
(N'K6-1503', N'Cho thuê', NULL, N'15 triệu/tháng', 120, N'nhập căn k6 1503 Giá thuê 15 triệu nội thất full đồ Cọc 1 đóng 3 HĐ 1 -2 năm');
GO

INSERT INTO dbo.BANG_GIA (MaCanHo, LoaiGiaoDich, GiaBan, GiaThue, DienTich_Ref, GhiChu) VALUES
(N'K3-1106', N'Cho thuê', NULL, N'13 triệu/tháng', 120, N'K3-1106   1. Full đồ: giá 13 triệu/tháng 2. Hợp đồng cọc 1 đóng 3 tối thiểu 1 năm.'),
(N'TOWN-7-20', N'Cho thuê', NULL, N'30 triệu/tháng', 68, N'Nhập căn thuê LK 7.20: 68m, nhà 4 tầng 1 tum, đã làm đồ cơ bản có điều hòa, thiết bị vệ sinh đầy đủ giá 30 tr - k có thang máy,  giá 38tr - có thang máy Chỉ cho thuê văn phòng, trung tâm, lớp học (k cho thuê quán ăn) cọc 1 đóng 3 HĐ từ 1 năm  phí sal'),
(N'K6-1904', N'Cho thuê', NULL, N'13 triệu/tháng', 120, N'nhập căn k6 1904 Giá nét 13tr nội thất full đồ (thiếu máy giặt) Cọc 1 đóng 3 HĐ 2 năm  Hàng CĐT cho thuê'),
(N'K5-GTM08', N'Cho thuê', NULL, N'7 triệu/tháng', 120, N'nhập căn k5 gtm08  Đồ như ảnh giá 7 triệu (net) có: rèm, điều hòa, nóng lạnh,tủ bếp,tủ lạnh, bếp từ, hút mùi, giường,máy giặt,sấy. Cọc 1 đóng  6 tháng hoặc 1 năm HĐ 2 năm  Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ'),
(N'K6-1404', N'Cho thuê', NULL, N'7 triệu/tháng', 120, N'Nhập căn thuê K6 1404 giá 7tr/ tháng, cọc 1 đóng 3, HĐ 1 năm, nhà nguyên bản CĐT  Phí Sale 1 tháng tiền nhà (nhận đủ khi khách ký hợp đồng thuê)'),
(N'K3-GTM20', N'Cho thuê', NULL, NULL, 120, N'Nhập căn K3 GTM20 bán 2950 chủ bao thuế phí  đang có khách thuê'),
(N'K1-1504', N'Cho thuê', NULL, N'12 triệu/tháng', 120, N'nhập  k1 1504  Giá thuê 12 triệu nội thất full đồ  Cọc 1 đóng 3 HĐ 1 năm  Phí đang xin 1 tháng  Chủ đang cân đối chia làm 2 lần'),
(N'K3-608', N'Cho thuê', NULL, N'15 triệu/tháng', 120, N'CHo thuê Full nội thất. Giá 15triệu. Sau 10/8 trống. cọc 1 đóng 3 hđ 1 năm. Nhà đang trống'),
(N'K5-509', N'Cho thuê', NULL, N'314 triệu/tháng', 120, N'Bán 7ty800 bao phí 102%  , chủ đang vay vietcombank 4 tỷ.'),
(N'K6A-1407', N'Cho thuê', NULL, N'10 triệu/tháng', 120, N'Nhập căn K6a 1407: giá nét 10tr500 cọc 1 đóng 3 HĐ 1 năm đang trống'),
(N'K1-1403', N'Cho thuê', NULL, N'13.5 triệu/tháng', 120, N'BS Nhập căn k1 1403 giá thuê 13.5 triệu  Giá 13 triệu chủ xem kh Nội thất như ảnh  Cọc 1 đóng 3 HĐ 1 năm  Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê'),
(N'K2-802', N'Cho thuê', NULL, N'17 triệu/tháng', 120, N'Nhập căn  K2 802 giá thuê 17tr Nội thất full đồ Cọc 1 đóng 3 HĐ 1 năm đang trống'),
(N'K6-1206', N'Cho thuê', NULL, N'14 triệu/tháng', 101, N'Nhập căn k6-1206, 3 ngủ 2 wc; 101m2 Đầy đủ nội thất cơ bản như hình: bếp từ, bếp từ, hút mùi, THÊM MÁY RỬA BÁT BOSS, điều hòa, bình nóng lạnh rèm cửa, giàn phơi. Giá Thuê 14 tr/ 1 tháng ( có thương lượng). Cọc 1 tháng, nộp tiền 3/6 tháng 1 lần, thời '),
(N'K1-GTM03', N'Cho thuê', NULL, NULL, 120, N'Nhập căn bán K1 GTM03 giá 2ty700 bao phí Có đồ cơ bản + giường tủ'),
(N'K6-GTM20', N'Cho thuê', NULL, N'5.5 triệu/tháng', 120, N'Cho thuê đồ cb. Giá 5,5triệu. Cọc 1 đóng 3, hđ 1 năm'),
(N'K1-1903', N'Cho thuê', NULL, N'12 triệu/tháng', 120, N'Nhập căn k1 1903: 12tr cọc 1 đóng 3 HĐ 1 năm  Có đồ liền tường'),
(N'K5-1505', N'Cho thuê', NULL, N'7 triệu/tháng', 120, N'Nhập căn K5 1505, cho thuê net 7tr/tháng nhà nguyên bản cđt, cọc 1 đóng 3, ký HĐ 2 năm Có pass đi xem luôn nguồn c Dung'),
(N'K6-1009', N'Cho thuê', NULL, N'112 triệu/tháng', 120, N'bán nét 7500  bao phí 102%. chủ đang vay, chủ có hỗ trợ khách vay phong tỏa'),
(N'K5-GTM12', N'Cho thuê', NULL, N'4 triệu/tháng', 120, N'Nhập căn K5 gtm12 Cho thuê nguyên bản CĐT giá 4tr500 triệu  Cọc 1 đóng 3 HĐ 1 năm  Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thue'),
(N'K6A-1905', N'Cho thuê', NULL, N'14 triệu/tháng', 120, N'Nhập căn  -K6a 1905 cho thuê nội thất full đồ cả đồ điện tử giá 15 (có thương lượng về 14tr chủ xem kh) Cọc 1 đóng 3 HĐ 1 năm  Đầu tháng 10 trống'),
(N'K1-702', N'Cho thuê', NULL, NULL, 120, N'K1- 702 bán 7ty6 bao sổ. Chủ sẵn sàng nhận cọc'),
(N'K6-GTM12', N'Cho thuê', NULL, N'5 triệu/tháng', 40, N'Nhập căn cho thuê K6 GTM12 : 40m - Stu, BC ĐN nguyên bản CĐT: 5tr500 có đồ: điều hòa, rèm nóng lạnh: 6tr500 Cọc 1 đóng 3 HĐ 1 năm (khách chốt thuê đồ cơ bản thì chủ mới lắp)'),
(N'K6A-1808', N'Cho thuê', NULL, N'9 triệu/tháng', 120, N'Nhập căn thuê K6A 1808 giá 9tr có đồ như ảnh  cọc 1 đóng 3 HĐ 1 năm không có điều hòa'),
(N'ZB1807', N'Cho thuê', NULL, NULL, 114, N'TRIỆU TƯỜNG ANH'),
(N'F2212A', N'Bán', NULL, NULL, 114, N'Mã căn hộ: F2212A DT: 77m2 số pn: 2n bán  giá 4ty370 bao phí (đã có 2% KPBT) có đồ nội thất cơ bản, đang cho khách thuê, chủ không vay'),
(N'F2105', N'Bán', NULL, NULL, 114, N'30/4: chủ thiện chí bán, đàm phán giá dc nữa'),
(N'F2710', N'Bán', NULL, NULL, 114, N'Mã căn hộ: F2710  DT: 78m2  giá bán 4ty500 thu về (đã có 2% bảo trì)  full liền tường, đang cho thuê'),
(N'F0703', N'Bán', NULL, NULL, 114, N'thúy'),
(N'F2709', N'Bán', NULL, NULL, 114, N'thúy'),
(N'F1508', N'Bán', NULL, NULL, 114, N'Thúy'),
(N'F0311', N'Bán', NULL, NULL, 114, N'chủ đang cho khách thuê 20tr/ tháng. có khách thiện chí mua chủ mới cho xem nhà'),
(N'T0205', N'Bán', NULL, NULL, 114, N'Mã căn hộ: T0205  DT: 111m2  giá bán 5ty400 bao phí (đã có 2% bảo trì, 1% phí sale, thuế phí chuyển nhượng) - Thúy  có đồ cơ bản, đang cho thuê 13tr/tháng'),
(N'T1005', N'Bán', NULL, NULL, 114, N'T1005 - 112m , tòa Trop bán 6ty150 bao phí ( đã có 2% bảo trì), nguyên bản CDT  - Thúy'),
(N'ZA2705', N'Bán', NULL, NULL, 45, N'Mã căn hộ: ZA2705 DT: 45m2 , bán 2ty950 - 3ty bao phí (đã có 2% , 1% phí sale, thuế phí chuyển nhượng) - Thúy'),
(N'ZA0806', N'Bán', NULL, NULL, 63, N'Còn, được giá mới bán, nguồn Hiệp'),
(N'ZA2006', N'Bán', NULL, NULL, 63, N'không vay, đã đóng với CDT 70%'),
(N'ZA0908', N'Bán', 1.3, NULL, 73, N'Có vay, đã đóng 70% ( ngân hàng giải ngân 1ty300, cần vốn kh rút hd)'),
(N'ZA2608', N'Bán', NULL, NULL, 73, N'còn,'),
(N'ZB2104', N'Bán', NULL, NULL, 77, N'còn hàng'),
(N'ZA2702', N'Bán', NULL, NULL, 77, N'chủ đóng 60% có vay, đã hết HTLS'),
(N'ZB0404', N'Bán', NULL, NULL, 77, N'Mã căn hộ: ZB0404 DT: 77m2 , bán 4ty580 bao phí (đã có 2% bảo trì, thuế phí cn) dc miễn phí 1 năm dịch vụ'),
(N'ZA2309', N'Bán', NULL, NULL, 77, N'Mã căn hộ: Za2309 DT: 78m2 số pn: 2n bán  giá 4ty720 bao phí (đã có 2% bảo trì) chủ đã nhận nhà'),
(N'ZB0307', N'Bán', 1.7, NULL, 77, N'thúy chủ đã đóng 1ty700, có vay, ngân hàng đang giải ngân 400tr, vay BIDV, HTLS 12/24'),
(N'ZA0402', N'Bán', NULL, NULL, 77, N'Mã căn hộ: ZA0402 DT: 78m2 số pn: 2n bán  giá 4ty800 bao phí (đã có 2% bảo trì, phí sale 1%, thuế phí CN) có nội thất cơ bản: 1 giường 1 tủ, bếp  '),
(N'ZA2704', N'Bán', 5.3, NULL, 90, N'21/4: vẫn bán giá 5ty300, đóng dc 40% với CDT'),
(N'ZB0402', N'Bán', NULL, NULL, 90, N'3/4: chủ thiện chí bán'),
(N'ZB0905', N'Bán', NULL, NULL, 114, N'nguồn không chắc, có khách ib riêng'),
(N'ZB2405', N'Bán', NULL, NULL, 114, N'chủ đã nhận nhà, đóng hết tiền rồi, không vay, đã nộp phí dv 6 tháng'),
(N'ZB2305', N'Bán', NULL, NULL, 114, N'Hiệp'),
(N'ZA1710', N'Bán', NULL, NULL, 114, N'Hiệp');
GO

INSERT INTO dbo.BANG_GIA (MaCanHo, LoaiGiaoDich, GiaBan, GiaThue, DienTich_Ref, GhiChu) VALUES
(N'ZA310', N'Bán', NULL, NULL, 114, N'20/4: đợi hoàn thiện nội thất rùi mới bán'),
(N'ZA2710', N'Bán', NULL, NULL, 114, N'Thúy'),
(N'ZA0610', N'Bán', 2.707, NULL, 114, N'chủ vay BIDV hà đông, mới giải ngân 492tr (chủ tự rút HĐ) còn đợt 55% - 2ty707 ngân hàng chưa giải ngân, còn lại đóng hết rùi'),
(N'ZB2302', N'Bán', 4.9, NULL, 114, N'kỳ vọng 4ty900'),
(N'ZB2103', N'Bán', NULL, NULL, 114, N'ZB2103- 73m muốn bán 4ty200'),
(N'ZB1508', N'Bán', NULL, NULL, 114, N'ZB1508  bán 4ty100 bao phí cn( chưa có bảo trì)- Thúy'),
(N'ZB0508', N'Bán', NULL, NULL, 114, N'chủ không thiện chí bán lắm'),
(N'ZA1507', N'Bán', NULL, NULL, 114, N'Mã ZA1507 - DT 90m bán 4ty800 thu về chưa có 2% KPBT - Thúy'),
(N'ZA1805', N'Bán', NULL, NULL, 114, N'cần check lại - nguồn Hiệp'),
(N'T0607', N'Bán', NULL, NULL, 114, N'chủ không hợp tác, nên tạm dừng giao dịch'),
(N'ZA0305', N'Bán', NULL, NULL, 114, N'8/3: thiết kế để ở, bao giờ bán báo sau'),
(N'ZB0706', N'Bán', NULL, NULL, 114, N'8/3: c k bán nữa về ở'),
(N'ZB0409', N'Bán', NULL, NULL, 114, N'13/3: chủ về ở, sau bán báo sau'),
(N'ZB2704', N'Bán', NULL, NULL, 114, N'15/3: chủ lại chưa quyết bán, kỳ vọng giá cao hơn'),
(N'ZB1605', N'Bán', NULL, NULL, 114, N'24/3 về ở 1 năm rùi bán sau'),
(N'F210', N'Bán', NULL, NULL, 9, N'22/3: hiện tại không đi xem nhà dc! tháng 9 mới hết hợp đồng, lúc ý mới đi xem dc, còn ai chấp nhận không đi xem nhà mua thì vẫn giao dịch dc'),
(N'F0310', N'Bán', NULL, NULL, 114, N'30/3: không bán nữa, để ở'),
(N'F0207', N'Bán', NULL, NULL, 114, N'3/4: chủ nghét, cả nhà dừng sale'),
(N'F0212', N'Cho thuê', NULL, NULL, 114, N'Thuý'),
(N'F0514', N'Cho thuê', NULL, NULL, 114, N'Thuý'),
(N'F2112', N'Cho thuê', NULL, NULL, 114, N'Thuý'),
(N'F0510', N'Cho thuê', NULL, NULL, 114, N'Thuý'),
(N'F2005', N'Cho thuê', NULL, NULL, 114, N'DT: 77m số pn: 2n Nội thất: 3 điều hòa, tủ bếp, giường tủ, bàn ăn, sofa Giá: 12tr , cọc 1 đóng 3 hợp đồng 1 năm,  Hiện trạng: đang trống, dc miễn dv 7 tháng'),
(N'F703', N'Cho thuê', NULL, NULL, 114, N'DT: 108m2 số pn: 3n Nội thất: đồ cơ bản, cần có thêm sofa giường tủ, giá 13tr-14tr cọc 1 đóng 3/6 HĐ 1 năm Hiện trạng: 20/3 trống'),
(N'F2115', N'Cho thuê', NULL, NULL, 114, N'DT: 77m2 số pn: 2n Nội thất: đồ cơ bản, 12tr cọc 1 đóng 3 HĐ 1 năm Hiện trạng: đang trống');
GO

-- ==============================================================================
-- 5. NẠP NỘI THẤT VÀ ĐỒ ĐIỆN CỦA CĂN HỘ
-- ==============================================================================
PRINT N'Đang nạp thông tin nội thất vào NOI_THAT...';

INSERT INTO dbo.NOI_THAT (MaCanHo, NoiThat, DoDien) VALUES
(N'K6-407', N'Nội thất liền tường', N'Nguồn: Thúy | Ghi chú: 4023 5% 201tr, chủ không vay'),
(N'K5-707', N'Cơ bản', N'Nguồn: Thúy - sale 50tr | Ghi chú: 4179'),
(N'K6-804', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: 4800'),
(N'K5-1804', N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 6140'),
(N'K3-1804', N'Nguyên bản CĐT', N'Nguồn: Thúy - 1% | Ghi chú: mk là 200220#  K3 1804'),
(N'K5-404', N'Cơ bản', N'Nguồn: Thúy'),
(N'K2-1904', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6A-1404', N'Full nội thất xịn', N'Nguồn: Dung'),
(N'K6-1007', N'Cơ bản', N'Nguồn: Liên'),
(N'K6A-1004', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: K6a 1004: 100788#, 5% 235tr'),
(N'K1-1704', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6-1207', N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 4962, tts'),
(N'K1-1907', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: Khách thuê đang ở, chủ không muốn cho khách lên xem, đang xin hình ảnh căn hộ căn này bất tiện việc đi xem, ai thực sự thiện chí chủ mới cho vào xem'),
(N'K3-1607', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: đang cho thuê'),
(N'K5-1104', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: khách đi xem hẹn trc 1 ngày'),
(N'K1-1507', N'Full nội thất xịn', N'Nguồn: Nguồn chị Dung'),
(N'K3-1207', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: chủ đang ở  vay 1 tỷ sổ cắm ngân hàng VCB, k cần khách tất toán'),
(N'K6A-1804', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6A-1604', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K2-704', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-610', N'Nội thất liền tường', N'Nguồn: Thúy | Ghi chú: 4400'),
(N'K6A-701', N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 5% 214, HĐ 4280, tts'),
(N'K2-1610', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: chủ đang vay 2ty, cần vốn khách tất toán'),
(N'K6-1601', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 5684 5% 284 chủ đang vay vcb'),
(N'K6-1810', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 6290'),
(N'K6-510', N'Full nội thất xịn', N'Nguồn: Thúy - sale 60tr | Ghi chú: giá gốc 4ty1, ko hỗ trợ vay, chủ ko vay K6 510: 123321#'),
(N'K6-1410', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 5% 242 HĐ 4857'),
(N'K2-1810', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K3-1201', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K1-810', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K2-601', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6-1710', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K5-1410', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: 5300'),
(N'K1-1201', N'Full nội thất xịn', N'Nguồn: Dung | Ghi chú: sẵn sổ đỏ'),
(N'K3-610', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: 5% 195tr'),
(N'K2-401', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: 5% 200'),
(N'K1-710', N'Full nội thất xịn', N'Nguồn: Liên'),
(N'K2-1501', N'Cơ bản', N'Nguồn: thúy'),
(N'K1-610', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K6-403', N'Full nội thất xịn', N'Nguồn: Thúy 60tr | Ghi chú: 5610 5% 280'),
(N'K1-1608', N'Nguyên bản CĐT', N'Nguồn: Liên'),
(N'K6-808', N'Cơ bản', N'Nguồn: Lưu | Ghi chú: 090380#'),
(N'K6A-1008', N'Cơ bản', N'Nguồn: Lưu -60tr | Ghi chú: 5858'),
(N'K1-403', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-703', N'Cơ bản', N'Nguồn: Liên sale 80 | Ghi chú: 5789.'),
(N'K1-508', N'Full nội thất xịn', N'Nguồn: Lưu | Ghi chú: Khách cần đi xem ib chị'),
(N'K6-1203', N'Cơ bản', N'Nguồn: Lưu | Ghi chú: Khách muốn xem báo trước 30p hẹn chủ nhé'),
(N'K1-1603', N'Cơ bản', N'Nguồn: Thúy'),
(N'K3-1108', N'Nguyên bản CĐT', N'Nguồn: Dung'),
(N'K6A-1508', N'Cơ bản', N'Nguồn: Thúy');
GO

INSERT INTO dbo.NOI_THAT (MaCanHo, NoiThat, DoDien) VALUES
(N'K1-1708', N'Cơ bản', N'Nguồn: Dung | Ghi chú: đã có sổ'),
(N'K6A-1408', N'Cơ bản', N'Nguồn: Lưu'),
(N'K5-1003', N'Nội thất liền tường', N'Nguồn: Thúy | Ghi chú: 6350'),
(N'K2-603', N'Cơ bản', N'Nguồn: Lưu'),
(N'K5-808', N'Cơ bản', N'Nguồn: Lưu'),
(N'K3-1808', N'Cơ bản', N'Nguồn: Lưu | Ghi chú: HĐ:'),
(N'K5-803', N'Nguyên bản CĐT', N'Nguồn: Thuyz | Ghi chú: K5 803 pass 818900#'),
(N'K3-1708', N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K2-1803', N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K5-1903', N'Cơ bản', N'Ghi chú: giá gốc 7ty6'),
(N'K6A-1703', N'Full nội thất xịn', N'Nguồn: Doanh | Ghi chú: 8467 chủ đang vay BIDV 5 tỷ'),
(N'K6A-905', N'Nguyên bản CĐT', N'Nguồn: Lưu | Ghi chú: Ai có khách đi xem ib 5% 280'),
(N'K2-1006', N'Nguyên bản CĐT', N'Nguồn: THÚY | Ghi chú: K2 1006 787878#'),
(N'K6A-1906', N'Nội thất liền tường', N'Nguồn: Thúy | Ghi chú: 7548, vay BIDV 5% 377'),
(N'K3-1805', N'Nguyên bản CĐT', N'Nguồn: Lưu | Ghi chú: Khóa ở vp'),
(N'K6-706', N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 5091, 5% 245tr pass K6 706: 123581#'),
(N'K6-1005', N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 5747 chủ đang vay BIDV 4ty500'),
(N'K2-505', N'Cơ bản', N'Nguồn: Lưu | Ghi chú: Khách xem nhắn Lưu'),
(N'K6-805', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: Pass k6 805: 273311# 289 tr : 5%'),
(N'K6-1205', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: 6200, chủ vay BIDV 4ty'),
(N'K2-906', N'Nguyên bản CĐT', N'Nguồn: Liên | Ghi chú: Pass K2-906 . 080972#'),
(N'K1-1505', N'Nội thất liền tường', N'Nguồn: Lưu'),
(N'K5-1605', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: K5-1605: 27193012#'),
(N'K5-1905', N'Cơ bản', N'Nguồn: liên'),
(N'K6-1405', N'Full nội thất xịn', N'Nguồn: Dung | Ghi chú: có thẻ ở vp'),
(N'K6-505', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6A-1006', N'Cơ bản', N'Nguồn: Liên | Ghi chú: 818186'),
(N'K3-905', N'Nội thất liền tường', N'Nguồn: Thúy | Ghi chú: đã có sổ'),
(N'K6A-1005', N'Nguyên bản CĐT', N'Nguồn: Dung'),
(N'K1-1705', N'Nội thất liền tường', N'Nguồn: Dung'),
(N'K5-1106', N'Cơ bản', N'Nguồn: Lưu | Ghi chú: 6ty2'),
(N'K6A-1705', N'Cơ bản', N'Nguồn: Lưu | Ghi chú: giá gốc 8ty083'),
(N'K3-1906', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: chủ có thể đồng ý 8400'),
(N'K3-505', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K1-406', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K2-1505', N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K6-1606', N'Cơ bản', N'Nguồn: Thúy'),
(N'K1-1406', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K2-1106', N'Cơ bản', N'Nguồn: Thúy'),
(N'K1-705', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K6-1605', N'Cơ bản', N'Nguồn: Lưu | Ghi chú: 6232'),
(N'K2-806', N'Cơ bản', N'Nguồn: Thuý sale 1% | Ghi chú: Giá hợp đồng 3930'),
(N'K6-602', N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 090380#'),
(N'K2-1002', N'Cơ bản', N'Nguồn: Dung | Ghi chú: công chứng chủ để 7ty'),
(N'K3-502', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K6A-709', N'Cơ bản', N'Nguồn: Dung'),
(N'K2-1202', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-402', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6-1409', N'Cơ bản', N'Nguồn: Lưu | Ghi chú: mk: 258369#'),
(N'K6-802', N'Full nội thất xịn', N'Nguồn: Lưu mk: 070313# | Ghi chú: 6.428 Chủ đang vay 2tỷ VCB');
GO

INSERT INTO dbo.NOI_THAT (MaCanHo, NoiThat, DoDien) VALUES
(N'K5-409', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 6200 203206# K5 409'),
(N'K6A-702', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: gốc 6ty5. pass 241113'),
(N'K1-709', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: đã có sổ, không vay'),
(N'K3-1209', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: K3 1209: 231211#'),
(N'K3-609', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: hiện đang có khách thuê'),
(N'K3-909', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K3-1109', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: hiện đang có khách thuê'),
(N'K3-809', N'Full nội thất xịn', N'Nguồn: liên | Ghi chú: đang cho thuê'),
(N'K2-1109', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: đã có sổ đang trống'),
(N'K5-802', N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K6-1209', N'Cơ bản', N'Nguồn: Thúy sale 60tr | Ghi chú: 6835, chủ đang vay bank'),
(N'K3-709', N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K6-609', N'Cơ bản', N'Nguồn: Liên'),
(N'K6-1109', N'Cơ bản', N'Nguồn: Lưu | Ghi chú: 6ty4'),
(N'K6-1909', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K1-1609', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K3-1809', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 6ty2'),
(N'K6-1609', N'Nguyên bản CĐT', N'Nguồn: Lưu | Ghi chú: HĐ: 8,2tỷ'),
(N'K3-702', N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K5-1502', N'Cơ bản', N'Nguồn: Thúy'),
(N'K3-1902', N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K5-1402', N'Cơ bản', N'Nguồn: Lưu | Ghi chú: Chủ vay bank, có thế TT dc'),
(N'K6A-2007', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 13500 5% 675 đang vay VCB, tới tháng 8/26 hết HTLS'),
(N'K5-2001', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 10ty526, 5% ~ 516tr chủ có hỗ trợ vay phong tỏa, trong vòng max 20 ngày'),
(N'K3-2003', N'Cơ bản', N'Nguồn: Liên | Ghi chú: 5% làm sổ: 691tr 2% bảo trì: 276tr giá HĐMB: 13ty830 Khách cần chuẩn bị TC 17ty279 để giao dịch căn này'),
(N'K6-2003', N'Cơ bản', N'Nguồn: Liên'),
(N'K5-2005', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 19ty'),
(N'K1-GTM07', N'Cơ bản', N'Nguồn: Thúy'),
(N'K1-GTM17', N'Cơ bản', N'Nguồn: Thúy'),
(N'K3-GTM03', N'Cơ bản', N'Nguồn: Thúy'),
(N'K3-GTM08', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K3-GTM05', N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: đã có sổ'),
(N'K3-GTM06', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K3-GTM10', N'Cơ bản', N'Nguồn: Thúy'),
(N'K3-GTM12', N'Cơ bản', N'Nguồn: Thúy'),
(N'K3-GTM15', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: chủ đang cho thuê 6tr/tháng'),
(N'K3-GTM17', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: đã có sổ'),
(N'K3-GTM22', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: HĐ 2,116 chưa có sổ'),
(N'K5-GTM04', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: pass 3 căn: 868686#'),
(N'K5-GTM14', N'Full nội thất xịn', N'Nguồn: Dung'),
(N'K5-GTM17', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: K5 GTM17: 555111# 3365, đang vay vpbank'),
(N'K5-GTM19', N'Cơ bản', N'Nguồn: Doanh | Ghi chú: 5% 116tr'),
(N'K6-GTM04', N'Cơ bản', N'Nguồn: Thúy 50tr | Ghi chú: 2000'),
(N'K6-GTM07', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 2055 k vay'),
(N'K6-GTM03', N'Cơ bản', N'Nguồn: liên'),
(N'K3-607', N'Full nội thất xịn', N'Nguồn: loan'),
(N'K1-1807', N'Full nội thất xịn', N'Nguồn: loan'),
(N'K6-1907', N'Nguyên bản CĐT', N'Nguồn: Thúy CĐT'),
(N'K6A-1607', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K2-1001', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 211223#  K2 1001');
GO

INSERT INTO dbo.NOI_THAT (MaCanHo, NoiThat, DoDien) VALUES
(N'K1-1801', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 688668# K1 1801'),
(N'K1-1710', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K5-901', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6A-1510', N'Cơ bản', N'Nguồn: Thúy'),
(N'K1-1110', N'Full nội thất xịn', N'Nguồn: loan'),
(N'K6-1901', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-401', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K6-1801', N'Nguyên bản CĐT', N'Nguồn: tam anh | Ghi chú: K6-1801: 96730418#'),
(N'K6-810', N'Nguyên bản CĐT', N'Nguồn: loan | Ghi chú: đang cho người thân ở nhờ'),
(N'K5-1808', N'Full nội thất xịn', N'Nguồn: loan | Ghi chú: K5 1808 MK 160400#'),
(N'K3-708', N'Cơ bản', N'Nguồn: Loan | Ghi chú: MK 117117#'),
(N'K6-1903', N'Nguyên bản CĐT', N'Nguồn: Thúy CĐT'),
(N'K6A-908', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K2-1503', N'Nguyên bản CĐT', N'Nguồn: loan'),
(N'K6-608', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6A-406', N'Nguyên bản CĐT', N'Nguồn: Lưu'),
(N'K6-1106', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: K6 1106: 141780#'),
(N'K5-706', N'Full nội thất xịn', N'Nguồn: loan'),
(N'K6A-1706', N'Nguyên bản CĐT', N'Nguồn: loan'),
(N'K3-409', N'Full nội thất xịn', N'Nguồn: Loan'),
(N'K6-702', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-509', N'Nguyên bản CĐT', N'Nguồn: Lưu | Ghi chú: mk: 222812#'),
(N'K6A-1509', N'Nguyên bản CĐT', N'Nguồn: Lưu'),
(N'K6-709', N'Nguyên bản CĐT', N'Nguồn: loan -phí 50%'),
(N'K6-1402', N'Full nội thất xịn', N'Nguồn: loan | Ghi chú: Căn chị Lệ không ưu tiên'),
(N'K1-402', N'Nguyên bản CĐT', N'Nguồn: Loan - trả phí tiến độ loại'),
(N'K1-GTM21', N'Nguyên bản CĐT', N'Nguồn: loan'),
(N'K5-GTM11', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-GTM18', N'Nguyên bản CĐT', N'Nguồn: loan'),
(N'K6-GTM23', N'Cơ bản', N'Nguồn: loan | Ghi chú: 210457#'),
(N'TOWN-7-22', N'Cơ bản', N'Nguồn: doanh'),
(N'TOWN-8-9', N'Nguyên bản CĐT', N'Nguồn: doanh'),
(N'TOWN-2-15', N'Full nội thất xịn', N'Nguồn: Doanh'),
(N'K6A-704', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6-507', N'Cơ bản', N'Nguồn: Thúy  50tr | Ghi chú: 4057'),
(N'K5-1004', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 4600 5% 230tr'),
(N'K5-1904', N'Cơ bản', N'Nguồn: HĐ 5479'),
(N'K1-510', N'Full nội thất xịn', N'Nguồn: Dung'),
(N'K5-601', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6A-601', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 4450'),
(N'K5-1910', N'Cơ bản', N'Nguồn: Liên'),
(N'K6-1504', N'Cơ bản', N'Nguồn: Thúy -  phí sale 100tr'),
(N'K6A-901', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 4000'),
(N'K6A-810', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: HĐ 5100, chủ đang vay'),
(N'K5-1101', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: HĐ 4500'),
(N'K1-910', N'Cơ bản', N''),
(N'K1-601', N'Cơ bản', N''),
(N'K1-1101', N'Cơ bản', N'Nguồn: HĐ 3815'),
(N'K5-610', N'Cơ bản', N''),
(N'K2-501', N'Cơ bản', N'Nguồn: Thúy');
GO

INSERT INTO dbo.NOI_THAT (MaCanHo, NoiThat, DoDien) VALUES
(N'K6A-1103', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 6160 nhiệt tình bán K6a 1103: 121213#'),
(N'K1-1108', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: căn này tham khảo thui đã nhé, ck  bảo bán, vợ bảo không'),
(N'K6A-1503', N'Cơ bản', N'Nguồn: Thúy'),
(N'K5-1803', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6A-503', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 5800, chủ đang vay VCB 65%'),
(N'K6-1808', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: HĐ 7631'),
(N'K6A-1003', N'Cơ bản', N'Nguồn: 5889'),
(N'K6-905', N'Cơ bản', N'Nguồn: Thúy'),
(N'K2-1606', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: HĐ 4296'),
(N'K6-1806', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: HĐ 6808'),
(N'K5-905', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 8/7: mới cập nhật'),
(N'K6A-1406', N'Cơ bản', N'Nguồn: C Lưu'),
(N'K6-606', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: Giá hđ 5.3tỷ.'),
(N'K6A-806', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6A-605', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 5735, chủ đang vay BIDV 65% 5% 286'),
(N'K6-806', N'Cơ bản', N''),
(N'K1-405', N'Cơ bản', N'Nguồn: HD 4000
5% 200tr'),
(N'K3-506', N'Cơ bản', N'Nguồn: chủ đang vay 2ty860, cần vốn của khách rút HĐ
5% ~211tr

khách cần chuẩn bị tài chính 5ty189 để giao dịch căn này'),
(N'K6A-1405', N'Cơ bản', N'Nguồn: liên | Ghi chú: 5ty969.'),
(N'K1-1905', N'Cơ bản', N''),
(N'K6A-902', N'Nguyên bản CĐT', N'Nguồn: lưu | Ghi chú: 5% 334tr'),
(N'K6-409', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 5tỷ5'),
(N'K5-1609', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: dc hỗ trợ lãi suất 9/2026 - VCB 8599tr,'),
(N'K5-1909', N'Cơ bản', N'Nguồn: Nhập căn k5 1909 giá 9,4 tỷ  bao thuế phí cả bảo trì | Ghi chú: Thúy'),
(N'K6A-609', N'Cơ bản', N'Nguồn: Liên | Ghi chú: chủ đang vay 4 tỷ'),
(N'K1-1209', N'Cơ bản', N'Nguồn: 2% bảo trì 85tr
5% 220tr'),
(N'K5-1009', N'Cơ bản', N'Nguồn: c Lưu'),
(N'K1-1402', N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 5450'),
(N'K2-1710', N'Cơ bản', N'Nguồn: 19/11: chủ đã nhận nhà'),
(N'K1-502', N'Cơ bản', N'Nguồn: 19/11: chủ đã nhận nhà'),
(N'K2-2004', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: HĐ 7818 Chủ đang vay VCB'),
(N'K2-1705', N'Cơ bản', N''),
(N'K5-GTM05', N'Cơ bản', N'Nguồn: Thúy'),
(N'K5-GTM06', N'Cơ bản', N'Nguồn: Thúy'),
(N'K6A-1410', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 4773, chủ không vay 5% 238 K6a 1410: 121067#'),
(N'K1-501', N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: K1 501: 040711#'),
(N'K6-1702', N'Full nội thất xịn', N'Nguồn: k6 1702: 170268#'),
(N'K5-501', N'Full nội thất xịn', N'Nguồn: Thúy | Ghi chú: 4074, 5% 203tr, chủ k vay'),
(N'K3-903', N'Nguyên bản CĐT', N'Nguồn: Thúy | Ghi chú: 101187# 903 k3 8/5: đang xin dc chủ nét giá 8200'),
(N'K6-1608', N'Cơ bản', N'Nguồn: Liên | Ghi chú: 7360, chủ vay bidv. có thẻ từ'),
(N'K6A-1206', N'Cơ bản', N'Nguồn: loan | Ghi chú: Pass 171014'),
(N'K3-603', N'Full nội thất xịn', N'Nguồn: Dung | Ghi chú: 061530# k3 603'),
(N'K6-1707', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: 5800 đang vay VCB'),
(N'K2-902', N'Full nội thất xịn', N'Nguồn: loan'),
(N'K2-1510', N'Cơ bản', N'Nguồn: Dung'),
(N'K6-1503', N'Full nội thất xịn', N'Nguồn: loan'),
(N'K3-1106', N'Full nội thất xịn', N'Nguồn: Dung'),
(N'TOWN-7-20', N'Full nội thất xịn', N'Nguồn: Thúy'),
(N'K6-1904', N'Full nội thất xịn', N'Nguồn: Hàng CĐT/Thúy'),
(N'K5-GTM08', N'Cơ bản', N'Nguồn: loan');
GO

INSERT INTO dbo.NOI_THAT (MaCanHo, NoiThat, DoDien) VALUES
(N'K6-1404', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K3-GTM20', N'Cơ bản', N'Nguồn: Thúy'),
(N'K1-1504', N'Full nội thất xịn', N'Nguồn: loan'),
(N'K3-608', N'Full nội thất xịn', N'Nguồn: Lưu'),
(N'K5-509', N'Cơ bản', N'Nguồn: liên | Ghi chú: K5 509: pass 666888# 5 %~ 314tr bảo trì 124tr'),
(N'K6A-1407', N'Cơ bản', N'Nguồn: Thúy - ctv sale 1/4'),
(N'K1-1403', N'Cơ bản', N'Nguồn: loan'),
(N'K2-802', N'Full nội thất xịn', N'Nguồn: loan | Ghi chú: K2 802 120469#'),
(N'K6-1206', N'Full nội thất xịn', N'Nguồn: loan | Ghi chú: k6 1206: 010911#'),
(N'K1-GTM03', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: khách thuê đang ở'),
(N'K6-GTM20', N'Cơ bản', N'Nguồn: Lưu | Ghi chú: Đầu t11, khách ở'),
(N'K1-1903', N'Nội thất liền tường', N'Nguồn: THÚY'),
(N'K5-1505', N'Nguyên bản CĐT', N'Nguồn: Dung'),
(N'K6-1009', N'Cơ bản', N'Nguồn: Thúy - CTV  45tr | Ghi chú: 6ty559,  bảo trì 112tr 120612# K6 1009'),
(N'K5-GTM12', N'Nguyên bản CĐT', N'Nguồn: thuý | Ghi chú: K5 gtm12: 951951#'),
(N'K6A-1905', N'Full nội thất xịn', N'Nguồn: loan'),
(N'K1-702', N'Cơ bản', N'Nguồn: Liên | Ghi chú: Mk căn K1-702. 020603'),
(N'K6-GTM12', N'Nguyên bản CĐT', N'Nguồn: Thúy'),
(N'K6A-1808', N'Cơ bản', N'Nguồn: Thúy | Ghi chú: K6a 1808: 191178#'),
(N'ZB1807', N'Cơ bản', N'Nguồn: 1/5: làm full cho thuê'),
(N'F2212A', N'Cơ bản', N''),
(N'F2105', N'Cơ bản', N''),
(N'F2710', N'Cơ bản', N''),
(N'F0703', N'Cơ bản', N''),
(N'F2709', N'Cơ bản', N''),
(N'F1508', N'Cơ bản', N''),
(N'F0311', N'Cơ bản', N''),
(N'T0205', N'Cơ bản', N''),
(N'T1005', N'Cơ bản', N''),
(N'ZA2705', N'Cơ bản', N''),
(N'ZA0806', N'Cơ bản', N''),
(N'ZA2006', N'Cơ bản', N''),
(N'ZA0908', N'Cơ bản', N''),
(N'ZA2608', N'Cơ bản', N''),
(N'ZB2104', N'Cơ bản', N''),
(N'ZA2702', N'Cơ bản', N''),
(N'ZB0404', N'Cơ bản', N''),
(N'ZA2309', N'Cơ bản', N''),
(N'ZB0307', N'Cơ bản', N''),
(N'ZA0402', N'Cơ bản', N''),
(N'ZA2704', N'Cơ bản', N''),
(N'ZB0402', N'Cơ bản', N''),
(N'ZB0905', N'Cơ bản', N''),
(N'ZB2405', N'Cơ bản', N''),
(N'ZB2305', N'Cơ bản', N''),
(N'ZA1710', N'Cơ bản', N''),
(N'ZA310', N'Cơ bản', N''),
(N'ZA2710', N'Cơ bản', N''),
(N'ZA0610', N'Cơ bản', N''),
(N'ZB2302', N'Cơ bản', N'');
GO

INSERT INTO dbo.NOI_THAT (MaCanHo, NoiThat, DoDien) VALUES
(N'ZB2103', N'Cơ bản', N''),
(N'ZB1508', N'Cơ bản', N''),
(N'ZB0508', N'Cơ bản', N''),
(N'ZA1507', N'Cơ bản', N''),
(N'ZA1805', N'Cơ bản', N''),
(N'T0607', N'Cơ bản', N''),
(N'ZA0305', N'Cơ bản', N''),
(N'ZB0706', N'Cơ bản', N''),
(N'ZB0409', N'Cơ bản', N''),
(N'ZB2704', N'Cơ bản', N''),
(N'ZB1605', N'Cơ bản', N''),
(N'F210', N'Cơ bản', N''),
(N'F0310', N'Cơ bản', N''),
(N'F0207', N'Cơ bản', N''),
(N'F0212', N'Cơ bản', N''),
(N'F0514', N'Cơ bản', N''),
(N'F2112', N'Cơ bản', N''),
(N'F0510', N'Cơ bản', N''),
(N'F2005', N'Cơ bản', N''),
(N'F703', N'Cơ bản', N''),
(N'F2115', N'Cơ bản', N'');
GO

-- ==============================================================================
-- 6. NẠP NỘI DUNG BÀI ĐĂNG GỐC CỦA CĂN HỘ
-- ==============================================================================
PRINT N'Đang nạp nội dung bài đăng vào BAI_DANG...';

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'K6-407', N'Nhập căn bán K6 407 giá 5ty800 bao thuế phí
chị để lại đồ liền tường cho khách (tủ quần áo, giường, tủ bếp, nóng lạnh)', N'Đã lưu sẵn'),
(N'K5-707', N'căn K5 707 giá 6 tỷ bao thuế phí
nội thất có: điều hòa, rèm. nóng lạnh
đang có khách thuê', N'Đã lưu sẵn'),
(N'K6-804', N'Nhập căn K6 804 bán 5700 bao phí full nội thất,
chủ đang cho thuê - 10tr500
Chủ TTS', N'Đã lưu sẵn'),
(N'K5-1804', N'Nhập căn bán K5 1804 giá 6300 nhà nguyên bản CĐT (chủ sẽ mang hết nội thất đi)
khách lấy nội thất thì +200tr
chị đang vay VCB  4ty', N'Đã lưu sẵn'),
(N'K5-1804', N'căn K5 1804
Cho thuê full đồ giá 13 triệu 
Cọc 1 đóng 3 HĐ 1 năm (ưu tiên thuê 6 tháng), 15/9 mới vào ở dc
chủ đang muốn bán, k nên giới thiệu sâu', N'Đã lưu sẵn'),
(N'K3-1804', N'BS căn K3-1804: giá 6ty100 bao phí
Nhà nguyên bản CĐT , sẵn sổ giao dịch
 đi xem nhà dc thoải mái', N'Đã lưu sẵn'),
(N'K3-1804', N'Nhập căn K3-1804: giá 7ty100 bao 102%
Nhà nguyên bản CĐT 
 đi xem nhà dc thoải mái', N'Đã lưu sẵn'),
(N'K5-404', N'Nhập bán k5 404 giá 6ty590 bao thuế phí', N'Đã lưu sẵn'),
(N'K2-1904', N'bán K2 1904 giá 6900, có rèm, bàn ăn, 2 điều hòa
sẵn sổ đỏ công chứng', N'Đã lưu sẵn'),
(N'K6A-1404', N'K6a- 1404: 6.9 tỷ bao phí, để lại full đồ, đang cho KH thuê - 12tr/tháng
(khó đi xem)', N'Đã lưu sẵn'),
(N'K6A-1404', N'Thúy', N'Đã lưu sẵn'),
(N'K6-1007', N'K6-1007 bán 6ty9 bao phí. Có nội thất cơ bản.  Đang có khách thuê. chủ đang vay 1,4 tỷ VCB . có hỗ trợ vay phong tỏa.', N'Đã lưu sẵn'),
(N'K6-1007', N'bán 6ty780 bao phí 102%. chủ đang vay 1tỷ4', N'Đã lưu sẵn'),
(N'K6A-1004', N'Nhập căn bán K6a 1004 giá 7150 bao thuế phí 
để lại full đồ nội thất có trong căn hộ', N'Đã lưu sẵn'),
(N'K6A-1004', N'Nhập căn K6a 1004 giá 11tr cọc 1 đóng 3 HĐ 1 năm
đồ như trên căn hộ (thiếu tivi tủ lạnh máy giặt)', N'Đã lưu sẵn'),
(N'K1-1704', N'bán 7 tỷ bao hết thuế phí , đã có sổ, chủ ko vay, nhà nguyên bản CĐT
chủ nhà đang cho thuê', N'Đã lưu sẵn'),
(N'K1-1704', N'Duy Anh', N'Đã lưu sẵn'),
(N'K6-1207', N'Nhập căn K6 1207: giá 7 tỷ bao 102%, nhà nguyên bản, đang cho thuê', N'Đã lưu sẵn'),
(N'K1-1907', N'Nhập căn K1 1907:  7250 bao thuế phí chuyển nhượng
bàn giao full nội thất liền tường (K có đồ điện tử)', N'Đã lưu sẵn'),
(N'K1-1907', N'Thúy', N'Đã lưu sẵn'),
(N'K3-1607', N'Nhập k3 1607: 7400 bao phí
 full nội thất

Khách thuê đến t9/26 hết hạn', N'Đã lưu sẵn'),
(N'K5-1104', N'Nhập căn K5 1104 bán  7ty300 chủ bao thuế phí chuyển nhượng 102%
bàn giao full đồ liền tường (chưa có ảnh)', N'Đã lưu sẵn'),
(N'K1-1507', N'Nhập căn K1 1507: bán 7.460 tỷ bao phí chuyển nhượng, để lại full đồ.', N'Đã lưu sẵn'),
(N'K3-1207', N'Nhập bán K3 1207 giá 6500 bao phí, đã có sổ
Để lại full đồ liền tường', N'Đã lưu sẵn'),
(N'K3-1207', N'K3 1207', N'Đã lưu sẵn'),
(N'K6A-1804', N'Nhập căn bán K6a 1804 giá 7500 bao tất cả thuế phí
nhà nguyên bản CĐT, khách thuê đang ở
chủ đang vay VCB ~4154tr, dc hỗ trợ lãi xuất đến tháng 2/2027 (đang check xem có dc tiếp nối khoản vay k) @All', N'Đã lưu sẵn'),
(N'K6A-1804', N'Nhập căn thuê k6a 1804 giá 8tr
Cọc 1 đóng 3 HĐ 1 năm
Nhà nguyên bản CĐT', N'Đã lưu sẵn'),
(N'K6A-1604', N'nhập căn K6a 1604 giá 7400 có full đồ', N'Đã lưu sẵn'),
(N'K2-704', N'Nhập nguồn K2-704: bán 7700 bao phí', N'Đã lưu sẵn'),
(N'K2-704', N'K2 704: 2PN -77m K2 Đông Nam - View Công Viên Trái Tim ♥️ 
Gồm Nội Thất Giường Tủ Liền Tường , 2 Điều Hoà , Máy Giặt , Sofa giường , Bàn Ghế Ăn, máy giặt, tivi nhỏ, 
có tủ lạnh (nhưng khách nào giữ gìn thì chủ mới để lại 
Giá Thuê : 11 tr/ tháng Đóng 6 Cọc 1 . Bàn Giao Từ 25/10
(giá có thể gia lộc cho khách thiện chí vào ở luôn)', N'Đã lưu sẵn');
GO

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'K6-610', N'Nhập căn K6 610 bán 6ty chủ bao thuế phí
5% 220 
đang cho thuê có dòng tiền  9tr
có đồ liền tường: tủ bếp, điều hòa, giường tủ', N'Đã lưu sẵn'),
(N'K6-610', N'K6 610 :  Bán 6.9  tỷ  bao thuế phí cả bảo trì 
5% sổ đỏ: 225tr 
chủ đang vay 2925tr', N'Đã lưu sẵn'),
(N'K6A-701', N'Nhập căn bán K6a 701 : 6100 bao phí
nhà nguyên bản CĐT', N'Đã lưu sẵn'),
(N'K2-1610', N'Nhập căn K2 1610 bán 6,3 tỷ bao thuế phí, nhà có full đồ', N'Đã lưu sẵn'),
(N'K6-1601', N'Nhập căn
K6-1601: bán 6ty400 bao thuế phí', N'Đã lưu sẵn'),
(N'K6-1810', N'Nhập căn bán K6 1810 giá 6600 chủ bao thuế phí chuyển nhượng
chị đang vay 4ty100
nhà đang để trống, k cho thuê', N'Đã lưu sẵn'),
(N'K6-510', N'K6-510 bán 7ty100 bao phí cả bảo trì 102% 
chị nhận khách trả thẳng
full nội thất liền tường', N'Đã lưu sẵn'),
(N'K6-1410', N'Bs căn 
K6 12a10: Bán 7ty200 bao 102%
K6 1410: Bán 7ty200 bao 102%
Cùng 1 chủ, họ sẽ bán 1 trong 2 căn', N'Đã lưu sẵn'),
(N'K2-1810', N'Nhập căn K2 1810 giá 7250 bao thuế phí
bàn giao full nội thất
khách thuê đang ở, đã có sổ đỏ đang thế chấp ngân hàng', N'Đã lưu sẵn'),
(N'K3-1201', N'Nhập bán K3 1201 : 7ty700 chủ bao thuế phí, nhà full nội thất, đã có sổ
đang cho khách thuê', N'Đã lưu sẵn'),
(N'K1-810', N'Nhập căn K1 810 giá net 7ty700 bao thuê phí, 
bàn giao full nội thất như trong ả này nh
, đang vay 2ty400', N'Đã lưu sẵn'),
(N'K1-810', N'Ngập căn k1 810
Giá thuê 12 triệu nội thất full đồ thiếu tủ lạnh 
Cọc 1 đóng 3 HĐ 1 năm 
Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê', N'Đã lưu sẵn'),
(N'K2-601', N'Nhập căn K2 601 : 7ty770 bao tất cả thuế phí
chủ nhà đang cho thuê nguyên bản CĐT
(chủ đang lung lay)', N'Đã lưu sẵn'),
(N'K6-1710', N'nhập căn K6 1710 bán 8 tỷ bao phí, full đồ', N'Đã lưu sẵn'),
(N'K5-1410', N'BS K5-1410: bán 8ty250 bao 102%, có full nội thất', N'Đã lưu sẵn'),
(N'K1-1201', N'K1 1201 bán 8.685 tỷ bao phí, full nội thất liền tường, 
(đồ điện tử chủ mang đi)', N'Đã lưu sẵn'),
(N'K3-610', N'nhập căn K3 610 giá 8500  bao thuế phí bàn giao full đồ', N'Đã lưu sẵn'),
(N'K2-401', N'Nhập K2 401 bán 8700 bao thuế phí, bàn giao full nội thất', N'Đã lưu sẵn'),
(N'K1-710', N'K1-710 bán 7ty8  full hết đồ như hình. cần bán nhanh. tạm thời ko bán nữa đang cho thuê', N'Đã lưu sẵn'),
(N'K2-1501', N'"Nhập căn K2- 1501: 89m2 giá  6tỷ300 bao phí . chưa bảo trì', N'Đã lưu sẵn'),
(N'K1-610', N'K1.610.  bán 6ty500 bao phí (trong đó phí sale 1%), đã làm full nội thất', N'Đã lưu sẵn'),
(N'K6-403', N'"Nhập căn K6 403 giá 6ty400 chủ bao thuế phí 
full nội thất liền tường', N'Đã lưu sẵn'),
(N'K1-1608', N'K1-1608 bán 7ty7 bao phí, nhà nguyên bản CĐT', N'Đã lưu sẵn'),
(N'K1-1608', N'"Mã căn hộ: K1.1608
DT: 96m2 
số pn: 3n
bán  giá bán 7ty280 (100% căn hộ) bao thuế phí chuyển nhượng phí sale , đã có bảo trì.', N'Đã lưu sẵn'),
(N'K6-808', N'K6-808  : bán 7,5tỷ bao phí 102% . (có thương lượng nếu khách vào sớm)', N'Đã lưu sẵn'),
(N'K6-808', N'Giá bán 7,9tỷ bao phí chưa có BT 129tr. Chủ đang vay BIDV
(Đang khó gọi chủ nhà. Mọi người tạm thời đừng dồn vội căn này)', N'Đã lưu sẵn'),
(N'K6A-1008', N'Bán 8tỷ bao hết thuế phí 102%. (trừ 5%: 293triệu). Mua nhanh có thương lượng', N'Đã lưu sẵn'),
(N'K1-403', N'Nhập căn K1 403 giá 8ty200 chủ bao thuế phí, nhà nguyen bản CĐT, chủ đang cho thuê
đã có sổ, chủ không vay', N'Đã lưu sẵn'),
(N'K1-403', N'Mã căn K1-403 . Chủ ngáo giá
Nguyên bản. 
Giá thuê : 15tr
HĐ lâu dài có thương lượng thêm
. 
Đã nhận nhà', N'Đã lưu sẵn'),
(N'K6-703', N'K6-703 bán 8ty200 bao phí, chưa bảo trì 2%~ 105 triệu. chủ ko vay .', N'Đã lưu sẵn');
GO

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'K1-508', N'K1-508. Bán 8,3tỷ bao hết, full nội thất', N'Đã lưu sẵn'),
(N'K1-508', N'K1 508:  cho thuê full đồ thiếu điều hòa PK 15-16tr  , cọc 1 đóng 3 HĐ 1 năm', N'Đã lưu sẵn'),
(N'K6-1203', N'Nhập căn K6 1203 cần bán. Giá 8,3tỷ bao 102%', N'Đã lưu sẵn'),
(N'K6-1203', N'BS Căn k6 1203 cho thuê nguyên bản CĐT dc 8tr/tháng
Cọc 1 đóng 3 HĐ 1 năm', N'Đã lưu sẵn'),
(N'K1-1603', N'Nhập căn K1 1603 giá 8400 bao thuê phí 
nhà có tủ bếp, điều hòa, rèm
đã có sổ
khách thuê đang ở', N'Đã lưu sẵn'),
(N'K3-1108', N'Nhập căn bán K3 1108 bán 8400 bao thuế phí có thương lượng (chưa có lệ phí trước bạ ra sổ tên khách ~22tr)
nhà nguyên bản CĐT, đã có sổ', N'Đã lưu sẵn'),
(N'K6A-1508', N'căn K6A 1508 a bán 8600 bao phí cả bảo trì', N'Đã lưu sẵn'),
(N'K6A-1508', N'Bs căn thuê K6a 1508 giá 14,5tr cọc 1 đóng 3 HĐ 1 năm
full đồ

@All', N'Đã lưu sẵn'),
(N'K1-1708', N'Nhập căn: K1 - 1708 bán 8.7 tỷ bao phí, nhà có nội thất cơ bản: tủ bếp, điều hòa, nóng lạnh, sofa, rèm.', N'Đã lưu sẵn'),
(N'K6A-1408', N'Nhập căn K6a-1408. Bán 8,55tỷ bao hết thuế phí', N'Đã lưu sẵn'),
(N'K5-1003', N'Nhập căn bán k5 1003 giá 8600 tỷ
Chủ bao hết thuế phí
có đồ liền tường + đang cho khách 12tr', N'Đã lưu sẵn'),
(N'K5-1003', N'"Nhập căn k5 1003 
cho thuê giá 12tr có đồ cơ bản,rèm,điều hòa,nóng lạnh
cọc 1 đóng 3 HĐ 1 năm 
phí sale 1 tháng tiền nhà nhận đủ khi khách ký hđ thuê ạ"
đầu tháng 12 trống', N'Đã lưu sẵn'),
(N'K2-603', N'bán 8tỷ8 bao phí 102%', N'Đã lưu sẵn'),
(N'K5-808', N'Bán giá 8,8tỷ bao hết.', N'Đã lưu sẵn'),
(N'K5-808', N'Nhập căn K5 808 bán 8300 bao thuế phí, chưa bảo trì 107tr
chủ đang vay VCB
cọc trong tháng 11 chủ giảm 100tr', N'Đã lưu sẵn'),
(N'K3-1808', N'Nhập căn K3-1808. Bán 8,8 tỷ bao hết thuế phí chuyển nhượng.', N'Đã lưu sẵn'),
(N'K3-1808', N'Cho thuê nguyên bản CĐT giá 9triệu. Cọc 1 đóng 3 hđ 1 năm. Phí 1 tháng', N'Đã lưu sẵn'),
(N'K5-803', N'"Nhập căn K5 803: 8ty800  bao thuế phí cả bảo trì
Nhà nguyên bản CĐT, đi xem dc luôn
5% 293tr"
đã cho thuê', N'Đã lưu sẵn'),
(N'K5-803', N'Nhập căn K5 803: 8ty530  bao thuế phí cả bảo trì
Nhà nguyên bản CĐT, đi xem dc luôn
5% 293tr
bán trong tháng 3, công chứng trong tháng 3
10/4 chủ đi nc ngoài tháng 10 về bán sau', N'Đã lưu sẵn'),
(N'K3-1708', N'Bán 9tỷ thu về Full nội thất', N'Đã lưu sẵn'),
(N'K3-1708', N'nhập lại k3-1708 cho thuê 15,5 triệu Full nội thất. phí 1 tháng.', N'Đã lưu sẵn'),
(N'K2-1803', N'bán 9ty5  bao phí 102% . full nội thất cao cấp . tạm thời ko bán nữa', N'Đã lưu sẵn'),
(N'K5-1903', N'Bán 9ty7 bao phí 102% . chủ có vay. tạm thời đang cho thuê chưa bán', N'Đã lưu sẵn'),
(N'K5-1903', N'Thúy', N'Đã lưu sẵn'),
(N'K6A-1703', N'K6A - 1703 
Chủ bán: 9tỷ420 bao thuế phí 
có full nội thất như video
chủ đang cho thuê 16tr500/tháng', N'Đã lưu sẵn'),
(N'K6A-1703', N'Nhập căn K6A - 1703
Full nội thất
Giá thuê: 18 triệu cọc 1 đóng 3 HĐ 1 năm 
Sale 1 tháng', N'Đã lưu sẵn'),
(N'K6A-905', N'K6a-905 Giá bán 6,7tỷ bao thuế phí, nhà nguyên bản CĐt, ko vay NH, phí 1% (Ai có khách ib chị nhé, ko liên quan tới Văn phòng mình HNLand nhé.
* Giá 6,5tỷ là bán trong tháng 10, phí còn 30triệu. 
* Giá khách vay ko bán 6,5tỷ. Không ưu tiên khách vay phong tỏa.', N'Đã lưu sẵn'),
(N'K2-1006', N'BS căn K2 1006 bán 7ty300 bao phí
sẵn sổ giao dịch, nhà nguyên bản cđt
khách đi xem chủ đọc pass', N'Đã lưu sẵn'),
(N'K6A-1906', N'Nhập căn K6a 1906: giá 7500 chủ bao thuế phí
trừ lại 5%~ 380
nhà có nội thất liền tường (chưa có điều hòa)', N'Đã lưu sẵn'),
(N'K3-1805', N'Nhập căn K3 1805 giá 7,7tỷ chủ bao phí, nhà nguyên bản', N'Đã lưu sẵn');
GO

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'K3-1805', N'Nhập căn 
- K3 1805 cho thuê nguyên bản CĐT, giá nét 7tr/tháng không bao gồm điện, nước, phí dịch vụ, wifi...
- Cọc 1 đóng 3, ký Hợp đồng ít nhất 1 năm.
- Phí sale 1 tháng tiền nhà bên em nhận khi 2 bên ký HĐ thuê ạ
C dung', N'Đã lưu sẵn'),
(N'K6-706', N'K6 706 giá  7400 bao 102%
Nhà nguyên bản CĐT', N'Đã lưu sẵn'),
(N'K6-706', N'K6 706 giá 6ty600 bao phí chưa bảo trì 93tr
(chủ nhà đang phân vân 50/50)', N'Đã lưu sẵn'),
(N'K6-1005', N'Nhập căn K6 1005 giá 8ty bao phí
nhà nguyên bản, đang cho thuê 10tr/tháng', N'Đã lưu sẵn'),
(N'K6-1005', N'nhập căn  k6 1005 giá 7 tỷ bao thuế phí chưa bảo trì ~ 110tr
chủ đang vay thương mại, cần vốn khách 4500 rút HĐ , 5% 290
(chủ đang 50/50)', N'Đã lưu sẵn'),
(N'K2-505', N'K2-505 Bán 8tỷ bao thuế phí. Nhà NBCĐT, Có sổ sẵn.', N'Đã lưu sẵn'),
(N'K6-805', N'Nhập căn k6 805 giá nét 8ty050 bao 102%', N'Đã lưu sẵn'),
(N'K6-805', N'nhập căn k6 805
Cho thuê nội thất full đồ:có,điều hoà,nóng lạnh,giàn phơi,giường tủ,tủ lạnh,máy giặt,bếp.....
giá thuê 16 triệu
Cọc 1 đóng 3 HĐ 1 năm
Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê
23/10 cô đang làm Nt 1 tháng nữa xong', N'Đã lưu sẵn'),
(N'K6-1205', N'Nhập căn K6 1205 bán giá 8tỷ  bao tất cả thuế phí chuyển nhượng để lại full đồ', N'Đã lưu sẵn'),
(N'K2-906', N'K2-906 bán 7.5 ty bao phí, đã có sổ, nhà nguyên bản CĐT', N'Đã lưu sẵn'),
(N'K1-1505', N'Nhập bán K1 1505:  8200 bao thuế phí ,
 bàn giao có đồ cơ bản liền tường giống ảnh, khách thuê đang ở', N'Đã lưu sẵn'),
(N'K1-1505', N'Nhập bán K1 1505:  8300 bao thuế phí chưa có lệ phí trước bạ
 bàn giao có đồ cơ bản liền tường giống ảnh
có khách cọc chủ làm dịch vụ sổ đỏ, chủ tạm dừng k bán nữa', N'Đã lưu sẵn'),
(N'K5-1605', N'Bán 8ty200 bao phí , chủ đang vay 65% bên viecombank, gốc 6ty1. có hỗ trợ vay và chuyển đổi gói vay', N'Đã lưu sẵn'),
(N'K5-1605', N'Nhập căn k5 1605 
Cho thuê giá 17tr đồ cơ bản có điều hoà , nóng lạnh, tủ bếp,rèm giường tủ 2pn
Cọc 1 đóng 3 HĐ 1 năm 

chủ ưu tiên bán', N'Đã lưu sẵn'),
(N'K5-1905', N'bán. 8tỷ 2 bao phí , chủ vay 4 tỷ VCB, có hỗ trợ vay phong tỏa. cần bán sớm, có thương lượng', N'Đã lưu sẵn'),
(N'K5-1905', N'Nhập căn: 101m2 K5-1905 ( 3pn + 2wc ) ban công Đông Nam:
1) Cho thuê nguyên bản của CĐT bàn giao .
2) Hợp đồng cọc 1 đóng 3 ( lâu dài tầm 1 năm - 2 năm ) 
3) Giá thuê: 11 triệu/tháng', N'Đã lưu sẵn'),
(N'K6-1405', N'Nhập K6 1405, k rác: bán 8,3tỷ bao phí, có gần full nội thất, thiếu 1 điều hoà phòng khách. Có hỗ trợ Kh vay phong toả', N'Đã lưu sẵn'),
(N'K6-1405', N'K6 1405: giá thuê 12tr,(có thương lượng) thiếu điều hoà PK, cọc 1 đóng 3. Phí sale 1 tháng nhận khi ký HĐ. Ký HĐ 1 năm
C dung', N'Đã lưu sẵn'),
(N'K6-505', N'Nhập căn
K6 505 bán 8300 chủ bao thuê thuế phí 102%', N'Đã lưu sẵn'),
(N'K6-505', N'Thúy', N'Đã lưu sẵn'),
(N'K6A-1006', N'Bán 7tỷ6  bao phí , chủ đang vay 770 tr bên bidv, . ko hỗ trợ vay phong tỏa.', N'Đã lưu sẵn'),
(N'K6A-1006', N'k6a 1006: 7500 bao thuế phí chưa bảo trì 101tr 
(chủ có nhận cọc nhưng công chứng trong vòng 10 ngày, không hỗ trợ vay Phong tỏa)
11/9: đi lấy xác nhận thanh toán', N'Đã lưu sẵn'),
(N'K3-905', N'Nhập căn bán K3 905 giá 8500 chủ bao tất cả thuế phí, đã có sổ, không vay
nhà có đồ nội thất liền tường: tủ bếp, giưởng tủ 3 phòng, tủ giày, vách kích, điều hòa (chưa có ảnh)
chủ đang cho thuê', N'Đã lưu sẵn'),
(N'K6A-1005', N'Nhập căn K6a - 1005, k rác: 8.5 tỷ bao phí nhé, nhà nguyên bản CĐT', N'Đã lưu sẵn'),
(N'K6A-1005', N'Nhập căn k6a 1005 giá 7ty bao thuế phí chưa bảo trì (trong đó phí sale 1%)', N'Đã lưu sẵn'),
(N'K1-1705', N'nhập nguồn 
K1 -1705 bán 8.5 tỷ bao phí, để lại nội thất liền tường như ảnh, đã có sổ đỏ, (đồ điện tử mang đi)
chủ đang vay 3ty, có hỗ trợ khách vay', N'Đã lưu sẵn'),
(N'K5-1106', N'Bán 8ty580 bao phí 102%, chủ đang vay', N'Đã lưu sẵn'),
(N'K5-1106', N'K5-1106 bán giá 7050 tỷ bao 100%
bảo trì 124tr
(chủ đang 50/50)', N'Đã lưu sẵn'),
(N'K6A-1705', N'nhập căn K6a-1705 bán 8,1tỷ bao phí', N'Đã lưu sẵn'),
(N'K3-1906', N'Nhập căn K3 1906 bán 8ty400 bao tất cả thuế phí chuyển nhượng cả lệ phí sang tên sổ khách
để lại full đồ', N'Đã lưu sẵn');
GO

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'K3-505', N'nhập căn: K3 505 bán 8ty500 bao phí, có full đồ đang cho thuê, đã có sổ', N'Đã lưu sẵn'),
(N'K1-406', N'Nhập căn bán K1 406 bán 8150 bao thuế phí (chưa có lệ phí trước bạ ra sổ tên khách ~22tr)
bàn giao full đồ có trong căn hộ

chủ đang vay 2ty  (có thể cần khách tất toán)
đầu tháng 7 có sổ đỏ', N'Đã lưu sẵn'),
(N'K2-1505', N'Giá bán 9tỷ bao phí Full nội thất', N'Đã lưu sẵn'),
(N'K6-1606', N'Nhập bán k6 1606: 9ty bao phí', N'Đã lưu sẵn'),
(N'K6-1606', N'Nhập căn thuê k6 1606 giá 10tr
Cọc 1 đóng 3 HĐ 1 năm, nhà nguyên bản', N'Đã lưu sẵn'),
(N'K1-1406', N'Nhập căn K1 1406: bán 9ty để lại full nội thất, bao hết thuế phí
(không có ảnh, ace hẹn lịch trc 2 tiếng)', N'Đã lưu sẵn'),
(N'K2-1106', N'"Mã căn hộ: K2.1106
DT: 101m2
số pn: 3n
bán  giá bán 7ty bao phí chưa bảo trì
Chủ đang phân vân 50/50', N'Đã lưu sẵn'),
(N'K2-1106', N'K2 1106: nguyên bản CĐT giá nét  7tr
Cọc 1 đóng 3 hd 1 năm
(nhận khách văn phòng, gia đình ít ng k có trẻ nhỏ)', N'Đã lưu sẵn'),
(N'K1-705', N'Tham khảo
 bán K1 705: giá hiện tại bao thuế phí để lại full nội thất cho khách
khi nào ra sổ đỏ sẽ cân đối lại giá
chủ không vội bao giờ có sổ đỏ dc giá mới bán, nên ace nắm thông tin, k chào khách', N'Đã lưu sẵn'),
(N'K6-1605', N'K6-1505. Bán 8,6tỷ bao hết.', N'Đã lưu sẵn'),
(N'K2-806', N'Mã căn hộ: K2.806
DT: 101m2
số pn: 3n
bán  giá bán 7ty300 bao phí cả bảo trì', N'Đã lưu sẵn'),
(N'K6-602', N'Bs bán k6 602 giá 7ty450 chủ bao thuế phí
Nhà nguyên bản
Có vay bank', N'Đã lưu sẵn'),
(N'K6-602', N'"Nhập căn K6 602: 120m giá 7tỷ550 bao phí, chưa có bảo trì 120tr', N'Đã lưu sẵn'),
(N'K2-1002', N'Bs K2 1002 bán 8ty100 có nội thất, bao thuế phí
(K có đồ điện tử, sofa, điều hoà)', N'Đã lưu sẵn'),
(N'K3-502', N'Nhập căn K3 502 giá 8ty200 bao phí, full nội thất liền tường , đồ điện tử chủ mang đi', N'Đã lưu sẵn'),
(N'K3-502', N'K3-502: giá 8ty150 bao phí 102%, full đồ

khi giao dịch khách dc bớt lại 5%~ 260tr
 chủ đang vay 65%~ 3380tr cần vốn khách rút HĐ', N'Đã lưu sẵn'),
(N'K6A-709', N'Nhập căn K6a 709 bán 8.2 tỷ bao phí 102%
5% ~ 300tr

nguồn dung', N'Đã lưu sẵn'),
(N'K2-1202', N'Nhập căn K2 1202: bán 8ty050 bao thuế phí,sổ đỏ cầm tay 
-Nội thất : tủ bếp, đhoa, nóng lạnh, rèm giàn phơi 
- Hiện đang cho thuê giá 14tr/1th. 
Hợp đồng cho thuê đến 9/3.2027', N'Đã lưu sẵn'),
(N'K6-402', N'Nhập căn k6 402 giá 8ty500 bao thuế phí
Nhà nguyên bản
5% 262
chủ đang ở', N'Đã lưu sẵn'),
(N'K6-402', N'Nhập căn k6 402 và k6 902 
Cho thuê full đồ liền tường giá 14,5 triệu 
Cho thuê nội thất full đồ giá 16 triệu 
(Có thương lượng)
Cọc 1 đóng 3 HĐ 1 năm 
Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ Thuê
(Khoảng giữa tháng 12 chủ làm xong NT)', N'Đã lưu sẵn'),
(N'K6-1409', N'Chủ dừng bán. Tạm thời ai cần xem view vẫn lên xem', N'Đã lưu sẵn'),
(N'K6-802', N'K6-802 bán giá NET 8,5tỷ bao hết để lại Full nội thất liền tường.
(Căn này tạm thời dừng bán cho thuê). Anh em tập trung căn 509 k5 nhé', N'Đã lưu sẵn'),
(N'K6-802', N'Cho thuê k6-802 Nội thất liền tường Giá 13triệu. Thiếu đồ điện tử', N'Đã lưu sẵn'),
(N'K5-409', N'Nhập căn k5 409 giá 8ty bao phí
Chủ đang vay', N'Đã lưu sẵn'),
(N'K6A-702', N'Bán 8ty550  bao thuế phí, cả  bảo trì 117tr. 5% ~ 325 tr .chủ ko vay, có hỗ trợ vay cho khách mới', N'Đã lưu sẵn'),
(N'K6A-702', N'Nhập căn 
K6a 702 giá 15 triệu cho thuê nội thất full đồ: rèm, bếp, điều hòa, giường tủ,tủ lạnh máy giặt,tivi....
Cọc 1 đóng 3 HĐ 1 năm', N'Đã lưu sẵn'),
(N'K1-709', N'Nhập căn K1 709 bán 8ty650 bao thuế phí, có full đồ
khách đang thuê', N'Đã lưu sẵn'),
(N'K3-1209', N'BS K3-1209 	bán 8ty8 bao phí sang sổ, nhà có đồ cơ bản, 
nhà đang trống đi xem dc luôn', N'Đã lưu sẵn'),
(N'K3-609', N'Bán 9 tỷ bao phí sang tên sổ  full đồ, có cả máy rửa bát, đồ điện tử hiện đại', N'Đã lưu sẵn'),
(N'K3-909', N'căn bán K3 909 giá 9ty100  bao tất cả thuế phí
đã có sổ đỏ, sẵn sàng giao dịch, nhà  nguyên bản CĐT', N'Đã lưu sẵn');
GO

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'K3-1109', N'bán 9ty2 bao phí sang sổ full đồ nội thất  .có cả máy rửa bát đồ điện tử hàng hiệu', N'Đã lưu sẵn'),
(N'K3-1109', N'Nhập nguồn K3 1109
Bán 9.4 tỷ bao thuế phí, để lại full đồ', N'Đã lưu sẵn'),
(N'K3-809', N'bán 8ty500 bao phí sang sổ full đồ .chủ ko vay', N'Đã lưu sẵn'),
(N'K2-1109', N'Nhập căn k2 1109 giá 9ty200 bao tất cả thuế phí
Bàn giao full đồ, đã có sổ', N'Đã lưu sẵn'),
(N'K2-1109', N'Nhập căn k2 1109
Cho thuê nội thất full đồ 
Giá 17 triệu 
Cọc 1 đóng 3 HĐ 1 năm', N'Đã lưu sẵn'),
(N'K5-802', N'Nhập căn: K5-802 bán 9,2tỷ bao hết nguyên bản cđt.
9,7tỷ full nội thất. Hiện chủ đang làm full đồ cả 2 căn . Hai căn này chủ tạm thời dừng bán vì giờ giá chưa tốt', N'Đã lưu sẵn'),
(N'K6-1209', N'BS căn K6-1209 giá nét 8ty500 bao thuế phí , chưa bảo trì 125tr
5% 342tr
(k ưu tiên bán căn này vì mình k chính chủ)', N'Đã lưu sẵn'),
(N'K3-709', N'bán 9ty6 full đồ, bao phí sang sổ .', N'Đã lưu sẵn'),
(N'K6-609', N'K6-602. K6-609 dk giá thì bán 9ty6 bao phí 102%', N'Đã lưu sẵn'),
(N'K6-1109', N'bán 8,5tỷ thu về, nội thất đồ cơ bản (ĐH, NL, bếp, rèm, GP) . có đang vay BIDV 65% hdmb', N'Đã lưu sẵn'),
(N'K6-1109', N'Nhập căn 
k6 1109
cho thuê giá 12tr có đồ cơ bản tủ bếp,điều hòa,nóng lạnh
cọc 1 đóng 3 HĐ 1 năm', N'Đã lưu sẵn'),
(N'K6-1909', N'BS k6-1909 bán 9200 full đồ. bao phí
chủ đang cho thuê', N'Đã lưu sẵn'),
(N'K1-1609', N'Nhập căn k1 1609 giá 10ty260 bao thuế phí
Nhà nguyên bản CĐT', N'Đã lưu sẵn'),
(N'K3-1809', N'k3-1809 bán 9ty7 có thương lượng, đồ cơ bản, chuẩn bị có sổ . 
chủ đang cho thuê, k thiện chí bán', N'Đã lưu sẵn'),
(N'K6-1609', N'Giá bán 9,5tỷ bao hết, nguyên bản CĐT, chủ vay BIĐV 65%', N'Đã lưu sẵn'),
(N'K3-702', N'bán 10 tỷ full đồ , bao phí sang tên sổ. hiện tại đang cho thuê giá 16 tr. tháng 6 hét hạn hợp đồng', N'Đã lưu sẵn'),
(N'K5-1502', N'Nhập căn k5-1502 bán 10800  bao phí
chủ đang cho thuê', N'Đã lưu sẵn'),
(N'K3-1902', N'Bán 11 tỷ full đồ, nội thất làm cả 1 tỷ . đã có sổ', N'Đã lưu sẵn'),
(N'K5-1402', N'Nhập căn K5-1402. Giá bán 9,5tỷ thu về', N'Đã lưu sẵn'),
(N'K6A-2007', N'Nhập căn K6a 2007 giá 15ty chủ bao thuế phí 
BC Đông Nam, 3PN, 147m2', N'Đã lưu sẵn'),
(N'K5-2001', N'Nhập căn K5 2001: giá 16ty300 bao thuế phí 102%
167m2- 4PN: Bc Tây Bắc
chủ đã 95% với CĐT', N'Đã lưu sẵn'),
(N'K3-2003', N'Mã: K3-2003, DT 238.33m²,  4 phòng ngủ., BC Đông Nam
Gía 19 tỷ bao thuế phí, chủ đang làm sổ đỏ', N'Đã lưu sẵn'),
(N'K6-2003', N'Nhập căn K6 2003: bán 22ty7 giá bao phí , cả bảo trì, đông nam, 4PN, 181m

Giá gốc 20ty463', N'Đã lưu sẵn'),
(N'K5-2005', N'Nhập căn K5 2005, DT 271m2 bán 24ty500 bao hết thuế phí
Ban công Đông Nam', N'Đã lưu sẵn'),
(N'K1-GTM07', N'Nhập bán K1 GTM07 - Stu - 40m, Tầy Băc: bán giá  3150 bao phí
có đồ điều hoà, tủ lạnh, máy giat, bình nóng lạnh , rèm: đang cho khách thue', N'Đã lưu sẵn'),
(N'K1-GTM17', N'Nhập căn K1 GTM17 bán 3200 bao phí
có sổ, chủ đang vay bank 1240 tự tất toán dc
có đồ điều hòa và rèm', N'Đã lưu sẵn'),
(N'K3-GTM03', N'nhập căn K3 GTM03 - stu, 44m, BC Tây Bắc
bán  3500  chủ bao thuế phí (khách chịu lệ phí trước bạ) đã có sổ đỏ

Đang cho thuê', N'Đã lưu sẵn'),
(N'K3-GTM08', N'Nhập căn k3 gtm08 - stu, 44m, giá 3ty500 bao thuế phí
Nhà full đồ
Khách thuê đang ở - 8tr500', N'Đã lưu sẵn'),
(N'K3-GTM08', N'Căn k3 gtm08 full giá 9tr cọc 1 đóng 3 HĐ 1 năm 
1/11 trống', N'Đã lưu sẵn'),
(N'K3-GTM05', N'Nhập căn k3 gtm05 - 1N1K - 46m, BC Tây Bắc, giá 3ty450 bao thuế phí
Nhà nguyên bản + vách kích + 1 nóng lạnh (còn lại toàn đồ của khách thuê)', N'Đã lưu sẵn');
GO

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'K3-GTM06', N'Nhập căn k3 GTM06 1 ngủ 1 khách, diện tích 46m, bc Tây Bắc
Bán 3ty900 bao phí
Nhà full nội thất
Đang cho thuê
Tháng 8 có sổ', N'Đã lưu sẵn'),
(N'K3-GTM10', N'Nhập K3 GTM10 - 1N1K - 48m, TB: bán 3200 bao thuế phí
đang cho thuê, nhà có đồ 2 điều hòa, rèm', N'Đã lưu sẵn'),
(N'K3-GTM10', N'Nhập căn  thuê K3 GTM10: giá 7tr, cọc 1 đóng 3 HĐ 1 năm
nhà có điều hòa, rèm
1/12 trống nhà', N'Đã lưu sẵn'),
(N'K3-GTM12', N'Nhập căn bán K3 GTM12 giá 2600 bao phí
đã có sổ, chủ TTS
nhà có điều hòa, rèm, nóng lạnh
anh đang cho thuê', N'Đã lưu sẵn'),
(N'K3-GTM15', N'BC Đông Nam, 44m2 - Stu
bán 3ty100 bao hết thuế phí ,', N'Đã lưu sẵn'),
(N'K3-GTM15', N'Nhập căn 
K3-gtm 315 ( 44m2 hướng bc Đông Nam) 
Có 1 điều hòa cho thuê giá 6tr ( nếu lắp rèm + nóng lạnh giá 6,5tr ) 
Phí sale e nhận 1 tháng tiền nhà ngay sau khi kí hđ thuê C nhé. 
( ưu tiên khách hàng ở văn phòng)
Nguồn Tam Anh', N'Đã lưu sẵn'),
(N'K3-GTM17', N'Nhập căn K3 GTM17, 52m, 1N1K, BC ĐN: bán 4ty, full nội thất
chủ đang ở, chưa có ảnh
khách thiện chí chủ mới cho xem', N'Đã lưu sẵn'),
(N'K3-GTM22', N'Nhập bán K3 GTM22 -  1N1K - 50m:   giá 3ty300 bao thuế
chủ đang ở
có full đồ 
chủ đang vay 1ty2', N'Đã lưu sẵn'),
(N'K5-GTM04', N'Nhập căn:
1.  K5 GTM04 - 40m:  bán nết 3ty bao phí (102%) cả bảo trì 39tr, 5% 107tr', N'Đã lưu sẵn'),
(N'K5-GTM04', N'nhập căn k5 gtm04 giá 5tr500, stu
Nguyên bản CĐT
Cọc 1 đóng 3 HĐ 1 năm 
Phí sale 1 tháng tiền nhà  nhận đủ khi khách ký hđ thuê
Kh thuê tự đi làm điện', N'Đã lưu sẵn'),
(N'K5-GTM14', N'Bán 2ty7 bao thuế phí 102% . full đồ , thiếu tivi.', N'Đã lưu sẵn'),
(N'K5-GTM17', N'Nhập căn K5 GTM17 - 1N1K- 52m, bán: 3800 bao thuế phí chuyển nhượng', N'Đã lưu sẵn'),
(N'K5-GTM17', N'Nhập căn thuê K5 GTM17 giá 7tr cọc 1 đóng 3 HĐ 1 năm
nhà nguyên bản CĐT', N'Đã lưu sẵn'),
(N'K5-GTM19', N'Nhập căn K5 - GTM 19. ( Căn Studio - 44m) 3.550 tỷ bao hết thuế phí, chưa bảo trì 42tr', N'Đã lưu sẵn'),
(N'K5-GTM19', N'Nhập căn thuê K5 GTM19, stu - giá 5tr cọc 1 đóng 3 HĐ 1 năm
nhà nguyên bản CĐT', N'Đã lưu sẵn'),
(N'K6-GTM04', N'Nhập căn k6 gtm04 - 40m:  giá 2ty850 bao phí, chưa bảo trì 37tr,  5%- 100tr
BC Tây Bắc', N'Đã lưu sẵn'),
(N'K6-GTM04', N'nhập căn k6 gtm04 
cho thuê đồ cơ bản giá (net)6 triệu/tháng
cọc 1 đóng 3 HD 1 năm 
phí sale 1 tháng tiền nhà nhận đủ khi khách ký HD thuê', N'Đã lưu sẵn'),
(N'K6-GTM07', N'Nhập căn K6 GTM07: giá 2800 bao thuế phí, chưa bảo trì 37tr
chủ đang đóng 70%
khi công chứng chị bớt cho khách 30% ~ 616tr', N'Đã lưu sẵn'),
(N'K6-GTM03', N'bán 3ty2 bao hết thuế phí', N'Đã lưu sẵn'),
(N'K3-607', N'BS  k3 607
giá thuê 12,5 triệu nội thất full đồ
Cọc 1 thanh toán 12 tháng HĐ 1 năm ( phí sale 15 triệu)
Giá thuê 13 triệu nội thất full đồ 
Cọc 1 đóng 6 HĐ 1 năm (phí sale 1 tháng)', N'Đã lưu sẵn'),
(N'K1-1807', N'Nhập căn k1 1807 cho thuê nội thất full đồ 
hợp đồng 1 năm: đóng 3 cọc 1 giá 13tr/ tháng, 
đóng 6 cọc 1 giá 12.5tr/tháng, đóng 12 cọc 1 giá 12tr/tháng
Phí sale nửa tháng nhận đủ khi khách ký HĐ thuê.', N'Đã lưu sẵn'),
(N'K6-1907', N'CĐT cho thuê
4 căn hộ cho thuê (nguyên bản của CĐT)

K6-1907 - 77,51m 7tr
cọc 1 đóng 3/6 HĐ 2 năm', N'Đã lưu sẵn'),
(N'K6A-1607', N'BS căn thuê K6a 1607 giá 7tr/ tháng, cọc 1 đóng 3, HĐ 1 năm, nhà nguyên bản CĐT
chọn khách gia đình giữ nhà, có thể cho thuê ổn đỉnh lâu dài', N'Đã lưu sẵn'),
(N'K2-1001', N'Nhập căn cho thuê k2 1001 giá 11tr, cọc 1 đóng 3 HĐ 1 năm, 
Có đồ cơ bản + giường tủ 
1/11: nhà trống', N'Đã lưu sẵn'),
(N'K1-1801', N'Nhập căn K1 1801 giá 13-14tr , cọc 1 đóng 3 HĐ 1 năm', N'Đã lưu sẵn'),
(N'K1-1710', N'Nhập căn cho thuê k1 1710 giá 8tr cọc 1 đóng 3 HĐ 1 or 2 năm 
1/12 trống
Nhà nguyên bản', N'Đã lưu sẵn'),
(N'K5-901', N'Nhập căn K5 901 giá 8tr cọc 1 đóng 3 HĐ 1 năm
nhà nguyên bản CĐT
1/11 trống', N'Đã lưu sẵn'),
(N'K6A-1510', N'Nhâp căn cho thuê K6a 1510 giá 10tr/ tháng cọc 1 đóng 3 HĐ 1 năm
có đồ cơ bản: điều hòa tủ bếp rèm nóng lạnh
khoảng đầu tháng 11 ở dc', N'Đã lưu sẵn'),
(N'K1-1110', N'Nhập căn 
K1 1110 giá thuê 15,5tr
Cho thuê nội thất full đồ (thiếu máy giặt)
Cọc 1 đóng 3 HĐ 1 năm 
Phí sale 1 tháng tiền nhà (nhận đủ khi khách ký HĐ thuê)', N'Đã lưu sẵn'),
(N'K6-1901', N'Nhập căn K6 1901 giá 10tr, có điều hòa và rèm
cọc 1 đóng 3 HĐ 1 năm
chủ nhà đang muốn lắp thêm đồ, nên mn chưa sale', N'Đã lưu sẵn');
GO

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'K6-401', N'Nhập căn K6 401 giá 16tr cọc 1 đóng 3 HĐ 1 năm
full đồ
đang trống, Chủ kén khách: nhận gia đình nhỏ, hoặc các bạn nữ
k nhận nhóm bạn nam, đặc biệt k thích hút thuốc lá
(Hình ảnh đang cập nhật)', N'Đã lưu sẵn'),
(N'K6-1801', N'K6-1801 
1. Thuê nguyên bản: giá 8triệu/tháng
2. Hợp đồng cọc 1 đóng 3 tối thiểu 1 năm.', N'Đã lưu sẵn'),
(N'K6-810', N'nhập căn k6 810 
Nguyên bản CĐT giá 8tr (anh chủ đang chốt NT)
cọc 1 đóng 3 Hđ 1 năm', N'Đã lưu sẵn'),
(N'K5-1808', N'Nhập căn k5 1808 cho thuê full đồ liền tường như ảnh  
Giá 15tr
Cọc 1 đóng 3 HĐ 1-2 năm 
phí 1 tháng', N'Đã lưu sẵn'),
(N'K3-708', N'Nhập căn k3 708 giá thuê 12,5 triệu có :điều hoà, nóng lạnh, tủ bếp, bếp, giàn phơi, rèm, 2 giường, 1 bộ bàn ghế tiếp khách gỗ, 1 máy giặt
- về giá thuê 11 triệu nét những khách phải đóng 6
Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê', N'Đã lưu sẵn'),
(N'K6-1903', N'CĐT cho thuê
4 căn hộ cho thuê (nguyên bản của CĐT)
K6-1903 - 96,87m  8tr

cọc 1 đóng 3/6 HĐ 2 năm', N'Đã lưu sẵn'),
(N'K6A-908', N'Nhập nguồn K6a 908: giá 8tr, đóng 3 cọc 1 HĐ 1 năm
nhà nguyên bản CĐT', N'Đã lưu sẵn'),
(N'K2-1503', N'Nhập căn k2 1503 cho thuê nguyên bản CĐT giá 9tr 
Cọc 1 đóng 3 HĐ 1 năm 
(chủ khó làm việc)', N'Đã lưu sẵn'),
(N'K6-608', N'Nhận căn K6 608 giá chủ đang muốn 10tr( chị đang kéo xuống 9tr) cọc 1 đóng 3 HĐ 1 năm, nhà nguyên bản CĐT', N'Đã lưu sẵn'),
(N'K6A-406', N'Nhập căn: K6a-406 cho thuê nguyên bản cđt. Giá 8triệu/ tháng. Phí sale 1 tháng tiền nhà', N'Đã lưu sẵn'),
(N'K6-1106', N'Nhập căn thuê K6 1106 giá 12tr cọc 1 đóng 3 HĐ 1 năm
có đồ cơ bản: điều hòa tủ bếp rèm nóng lạnh
khách thuê đang ở hết tháng 9 trả nhà', N'Đã lưu sẵn'),
(N'K5-706', N'nhập căn k5 706
Giá 12 triệu nội thất cơ bản
Có rèm, điều hòa, nóng lạnh,giàn phơi, hệ thống bếp từ hút mùi đầy đủ 

Đầu tháng 8 chủ làm xong NT', N'Đã lưu sẵn'),
(N'K6A-1706', N'Nhập căn k6a 1706 
Cho thuê nguyên bản giá 12tr 
Đồ cơ bản 14-15tr
Cọc 1 đóng 3 HĐ 1 năm', N'Đã lưu sẵn'),
(N'K3-409', N'nhập căn:k3 409 
Giá 16tr full đồ 
Cọc 1 đóng 3 tháng HĐ 1 năm
12/11: trống
Phí sale 1 tháng tiền nhà ( nhận đủ khi khách ký HĐ thuê ạ)', N'Đã lưu sẵn'),
(N'K6-702', N'Nhập căn  thuê K6 702: giá 9tr500 , cọc 1 đóng 3 HĐ 1 năm (có ký dài nhưng giá đàm phán)
tìm khách gia đình chuẩn chỉ, giữ gìn nhà', N'Đã lưu sẵn'),
(N'K6-509', N'Cho thuê nguyên bản CĐT giá 8triệu. Cọc 1 đóng 3 hđ 1 năm. Phí 1 tháng', N'Đã lưu sẵn'),
(N'K6A-1509', N'Cho thuê nguyên bản CĐt 9triệu. Cọc 1 đóng 3, hđ 1 năm. Phí 1 tháng', N'Đã lưu sẵn'),
(N'K6-709', N'Nhập căn k6 709
Giá 10tr cho thuê nguyên bản CĐT 
Cọc 1 đóng 3 HĐ 1 năm', N'Đã lưu sẵn'),
(N'K6-1402', N'em note lại tt căn 
k6 1402 giá 16tr
k6 510 gia 13tr
k6 403 giá 15tr
cho thuê nội thất full đồ 
cọc 1 đóng 3 HD 1 năm', N'Đã lưu sẵn'),
(N'K1-402', N'"Mã căn hộ: K1.402 
DT: 120 m2- 3n
PA:  nguyên bản CĐT 13tr/ tháng 
chủ sẵn sàng nhận khách 2 năm', N'Đã lưu sẵn'),
(N'K1-GTM21', N'Nhập căn k1 gtm21 
Giá thuê 5-5tr500 
Nhà nguyên bản CĐT 
Cọc 1 đóng 3 HĐ 1 năm 
Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê
Đầu tháng 12 trống', N'Đã lưu sẵn'),
(N'K5-GTM11', N'Nhập căn K5 GTM11 giá 10tr cọc 1 đóng 3 HĐ 1 năm
có đồ: tủ bếp, điều hòa, rèm nóng lạnh', N'Đã lưu sẵn'),
(N'K6-GTM18', N'nhập căn, 52m 1ngu, ĐN
K6 gtm18
Giá 7tr nguyên bản CĐT
Cọc 1 đóng 3 HĐ 1 năm
Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê', N'Đã lưu sẵn'),
(N'K6-GTM23', N'Nhập căn k6 gtm23 
Cho thuê giá 8tr có thương lượng nội thất điều hòa, rèm, nóng lạnh, giường,tủ bếp,bàn ăn ( ko có đồ điện tử).        Cọc 1 đóng 3 HĐ 1 năm ,', N'Đã lưu sẵn'),
(N'TOWN-7-22', N'Town 7.22
1. Thuê Tầng 1 
2. Nội thất có: Điều hoà. 
3. Giá: 15 triệu
Cọc 1 tháng. Đóng 3 tháng/ lần. HĐ 1 năm
4. Phí sale: 1 tháng. Nhận đủ khi khách ký HĐ thuê + đóng đủ 3 tháng tiền nhà
Nguồn Doanh', N'Đã lưu sẵn'),
(N'TOWN-8-9', N'Town 8.9
1. Nội thất: Nhà thô
2. Giá 15 triệu. Cọc 1 đóng 3. HĐ lâu dài. 
(Giá 15 triệu trong năm đầu tiên, 
năm thứ 2 trở đi điều chỉnh theo thị trường, nhưng ko tăng QUÁ 15%/năm)
3. Phí sale: 1 tháng
nguồn doanh', N'Đã lưu sẵn'),
(N'TOWN-2-15', N'Nhập Căn Thuê - Tầng 3 - Town 2.15 
1. Khách thuê làm văn phòng ( ko nhận khách để ở)
2. Nội thất: Điều hoà, rèm, quạt trần, full vệ sinh.
2. Giá thuê 7 triệu
3. Cọc 1 tháng. Đóng 3 tháng/ lần. HĐ 1 năm.

Phí sale  là: 1 tháng. 
(Nhận đủ khi kí HĐ Thuê).', N'Đã lưu sẵn'),
(N'K6A-704', N'Nhập căn K6a 704 chị bán 7ty bao tất cả thuế phí, cả bảo trì
5% ~ 223tr, chủ TTS', N'Đã lưu sẵn'),
(N'K6-507', N'Nhập căn K6 507: bán 6150  bao phí, chưa bảo trì ~ 74tr
khách dc bớt lại 5% làm sổ 202tr
chủ có hỗ trợ vay phong tỏa', N'Đã lưu sẵn'),
(N'K5-1004', N'Nhập căn K5 1004: 7 tỷ bao 100%, bảo trì 83tr, chủ chưa thiện chí bán, để cho thuê', N'Đã lưu sẵn');
GO

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'K5-1904', N'Thúy', N'Đã lưu sẵn'),
(N'K1-510', N'Nhập căn K1 510 bán: 8 tỷ bao hết thuế phí, để lại full đồ (cả đồ điện), đã có sổ đỏ.
(không nhiệt tình bán)', N'Đã lưu sẵn'),
(N'K5-601', N'Nhập căn bán k5 601 giá 6ty950 bao hết thuế phí cả bảo trì
5% 222tr, chủ tts', N'Đã lưu sẵn'),
(N'K6A-601', N'Nhập căn K6a 601 giá  6ty700 bao thuế phí (102%) cả bảo trì 80tr
chủ đang vay bank 2ty900 VCB 
5% 222tr', N'Đã lưu sẵn'),
(N'K5-1910', N'K5 1910 : Giá bán 6.7 tỷ bao phí, chưa có 2% bảo trì 
Hiện trạng chưa gọi được, chưa muốn bán nên tạm  ko chào', N'Đã lưu sẵn'),
(N'K6-1504', N'nhập căn hộ: K6.1504 -  77,5m2
Giá : 6 tỷ300 bao thuế phí chưa bảo trì 
Chủ đang vay VCB 65%', N'Đã lưu sẵn'),
(N'K6A-901', N'Nhập căn K6A-901. Bán nét 6tỷ130 bao thuế phí 100%. chưa bảo trì ~ 75tr
5% 200tr, chủ thanh toán sớm
chủ đang phân vân 50/50', N'Đã lưu sẵn'),
(N'K6A-810', N'Nhập căn K6a 810 muốn bán giá 5tỷ950 bao phí, chưa bảo trì ~ 95tr', N'Đã lưu sẵn'),
(N'K5-1101', N'K5 1101 bán 6100 bao 100%, chưa bảo trì 85tr', N'Đã lưu sẵn'),
(N'K1-910', N'Thúy', N'Đã lưu sẵn'),
(N'K1-601', N'bán K1 601 giá  5ty850 bao 102%', N'Đã lưu sẵn'),
(N'K1-1101', N'Thúy', N'Đã lưu sẵn'),
(N'K5-610', N'K5 610: muốn dc giá bán', N'Đã lưu sẵn'),
(N'K2-501', N'Mã căn K2-501 . 89m2
(qua tết mới bán)  bao thuế phí, chưa bảo trì 74tr 

(chủ đang cân đối bán, mn có khách thiện chí ib riêng nhé)', N'Đã lưu sẵn'),
(N'K6A-1103', N'Nhập căn K6a 1103 giá 8300 bao thuế phí cả bảo trì
5% 308tr', N'Đã lưu sẵn'),
(N'K1-1108', N'Nhập căn K1 1108 bán 8600 chủ bao thuế phí chuyển nhượng tất cả', N'Đã lưu sẵn'),
(N'K6A-1503', N'Nhập căn K6a 1503 giá 8500 bao thuế phí chưa có bảo trì', N'Đã lưu sẵn'),
(N'K5-1803', N'Nhập căn k5-1803 : giá bán 8ty bao phí cả bảo trì 102%
chủ k thiện chí bán', N'Đã lưu sẵn'),
(N'K6A-503', N'"Nhập mã căn K6a- 503 : Giá bán 7 tỷ bao phí,  chưa có bảo trì  110tr
(chủ đang phân vân 50/50)', N'Đã lưu sẵn'),
(N'K6-1808', N'"Nhập mã căn K6- 1808 : Giá bán 8.330 tỷ bao phí,  chưa có bảo trì  145tr
chủ tts 95%
chủ 50/50, rất kiêu, khó làm việc', N'Đã lưu sẵn'),
(N'K6A-1003', N'Thúy', N'Đã lưu sẵn'),
(N'K6-905', N'Nhập căn K6 905: bán 7800 bao phí chưa bảo trì', N'Đã lưu sẵn'),
(N'K2-1606', N'Nhập căn K2 1606 bán 7tỷ450( có gia lộc )chủ bao thuế 2%, chưa có lệ phí trước bạ 0,65%~ 30tr
chủ đang rút hồ sơ về làm sổ đỏ', N'Đã lưu sẵn'),
(N'K6-1806', N'"Nhập căn K6-1806. Giá bán 7.5tỷ  bao thuế phí 100% , chưa bảo trì 124tr, chủ mới đóng 70%

chủ đổi ý chưa muốn bán', N'Đã lưu sẵn'),
(N'K5-905', N'Nhập căn K5-905  giá 7100 bao thuế phí 100%. bảo trì 93tr , chủ có hỗ trợ vay phong toả, Giá hđ 5.354tỷ.', N'Đã lưu sẵn'),
(N'K6A-1406', N'Nhập căn K6a-1406. Bán 7tỷ bao thuế phí có bảo trì. Đang Vay BIDV 65%.', N'Đã lưu sẵn'),
(N'K6-606', N'Nhập căn K6-606. Giá bán 6.5tỷ  bao thuế phí 100%, chưa bảo trì 100tr.  
 chủ TTS 95%', N'Đã lưu sẵn'),
(N'K6A-806', N'Nhập căn K6a 806 : 6550  chủ bao thuế phí , chưa có bảo trì
(chủ muốn bán đổi lên tầng cao, nhưng chỉ có 100tr để bù khoai)', N'Đã lưu sẵn'),
(N'K6A-605', N'Nhập căn K6a 605: giá 6650 bao thuế phí, chưa bảo trì 110tr', N'Đã lưu sẵn'),
(N'K6-806', N'Lưu', N'Đã lưu sẵn');
GO

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'K1-405', N'Thúy', N'Đã lưu sẵn'),
(N'K3-506', N'Thúy', N'Đã lưu sẵn'),
(N'K6A-1405', N'Bán 7ty530  bao thuế phí, chưa bảo trì. 5% là 300 triệu .  thiện chí bán. ko hỗ trợ vay phong tỏa 
Tạm dừng bán 
hỗ trợ vay bank +30tr', N'Đã lưu sẵn'),
(N'K1-1905', N'Mã căn K1-1905 : 101m2 
Giá bán : 5.75tỷ thu về (100%) chưa bảo trì 2%  
Chủ đã đóng 95%, ko vay Phí sale 1%"', N'Đã lưu sẵn'),
(N'K6A-902', N'Nhập căn: K6A - 902 Giá  9.2 tỷ (có thương lượng)bao thuế phí cả bảo trì 
Nguyên bản CĐT', N'Đã lưu sẵn'),
(N'K6-409', N'Bán 8ty2  bao phí 102%. chủ đang vay', N'Đã lưu sẵn'),
(N'K5-1609', N'Nhập căn K5 1609: bán 9ty300 chủ bao hết thuế phí cả bảo trì 156tr
chủ đang vay bank,', N'Đã lưu sẵn'),
(N'K5-1909', N'k5 1909', N'Đã lưu sẵn'),
(N'K6A-609', N'Bán 7ty4 bao thuế phí, chưa bảo trì. giá gốc 6ty028. chủ đang song song tìm nhà bên KĐT Việt Hưng, bán bên này mua bên khác . tạm dừng bán .', N'Đã lưu sẵn'),
(N'K1-1209', N'Thúy - sale 1%', N'Đã lưu sẵn'),
(N'K5-1009', N'Nhập bán K5-1009. Bán 8tỷ bao thuế phí 100%

nguồn:  c Lưu, chủ đang 50/50', N'Đã lưu sẵn'),
(N'K1-1402', N'Nhập căn k1 1402 giá 8tỷ550 có phí sale + công chứng, chưa có 2,65 thuế ~ 160tr,
 công chứng khi có sổ đỏ
không vay! đang làm sổ đỏ, giao dịch bằng sổ đỏ
nhà nguyên bản CĐT, đi xem hẹn trc', N'Đã lưu sẵn'),
(N'K2-1710', N'Thúy', N'Đã lưu sẵn'),
(N'K1-502', N'Thúy', N'Đã lưu sẵn'),
(N'K2-2004', N'Nhập Mã K2-2004, DT 146m, 3PN, BC Đông Nam
giá bán 12ty bao phí 102% (có thương lượng)
5% 391tr
chủ đang vay 65% ~ 5100tr, 
(ưu tiền đẩy trc)"', N'Đã lưu sẵn'),
(N'K2-1705', N'liên. đợi nhận sổ xong mới bán', N'Đã lưu sẵn'),
(N'K5-GTM05', N'2. K5 GTM05 - 46m : bán 3ty450 bao phí (102%) cả  bảo trì 44tr, 5% 125tr (Đang cho thuê)', N'Đã lưu sẵn'),
(N'K5-GTM06', N'3. K5 GTM06- 46m:  bán 3ty450 bao phí (102%) cả bảo trì 44tr, 5% 125tr (Đang cho thuê)', N'Đã lưu sẵn'),
(N'K6A-1410', N'Nhập căn K6a 1410 giá 6ty900 chủ bao thuế phí 102%', N'Đã lưu sẵn'),
(N'K1-501', N'Nhập căn: K1 501 bán 7ty100 bao thuê phí
đã có sổ chủ k vay, nhà nguyên bản CĐT (đi xem nhà dc luôn)', N'Đã lưu sẵn'),
(N'K6-1702', N'Nhập căn 
-K6 1702 cho thuê nội thất full đồ cả đồ điện tử giá 16tr
Cọc 1 đóng 3 HĐ 1-2 năm 
Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê', N'Đã lưu sẵn'),
(N'K5-501', N'Nhập căn
K5 501 bán 7550 chủ bao thuê thuế phí 102%, full đồ', N'Đã lưu sẵn'),
(N'K3-903', N'Nhập bán K3 903 giá 8ty300 chủ bao tất cả thuê phí
nhà nguyên bản CĐT
đã có sổ, không vay', N'Đã lưu sẵn'),
(N'K6-1608', N'Nhập bán k6 1608 bán 8350 bao thuế phí cả bảo trì 132tr có hỗ trợ vay phong toả . phải công chứng  ngày 11/7', N'Đã lưu sẵn'),
(N'K6A-1206', N'Nhập căn k6a 1206
Nội thất cơ bản rèm, nóng lạnh,tủ bếp,giàn phơi, điều hòa, nóng lạnh.giá 12tr.(nét
 Phí sale1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê cho thuê trong vòng 2 tuần 19/5', N'Đã lưu sẵn'),
(N'K3-603', N'Nhập căn K3 603: bán 8200 chủ bao tất cả thuế phí, bàn giao full nội thất', N'Đã lưu sẵn'),
(N'K6-1707', N'Nhập bán K6 1707 giá net  6900 chủ bao hết thuế phí 102%
5% 290tr', N'Đã lưu sẵn'),
(N'K2-902', N'Nhập căn k2 902
Cho thuê Giá 17 triệu nội thất full đồ 
Cọc 1 đóng 3 HĐ 1 năm 
Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê', N'Đã lưu sẵn'),
(N'K2-1510', N'K2 1510: cho thuê 11tr/tháng đồ cơ bản
Cọc 1 đóng 3, ký HĐ thuê 1 năm
Phí sale 1 tháng nhận khi khách ký HĐ thuê', N'Đã lưu sẵn'),
(N'K6-1503', N'nhập căn k6 1503
Giá thuê 15 triệu nội thất full đồ
Cọc 1 đóng 3 HĐ 1 -2 năm', N'Đã lưu sẵn');
GO

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'K3-1106', N'K3-1106  
1. Full đồ: giá 13 triệu/tháng
2. Hợp đồng cọc 1 đóng 3 tối thiểu 1 năm.', N'Đã lưu sẵn'),
(N'TOWN-7-20', N'Nhập căn thuê LK 7.20: 68m, nhà 4 tầng 1 tum, đã làm đồ cơ bản có điều hòa, thiết bị vệ sinh đầy đủ
giá 30 tr - k có thang máy, 
giá 38tr - có thang máy
Chỉ cho thuê văn phòng, trung tâm, lớp học (k cho thuê quán ăn)
cọc 1 đóng 3 HĐ từ 1 năm

phí sale 1 tháng tiền nhà', N'Đã lưu sẵn'),
(N'K6-1904', N'nhập căn k6 1904
Giá nét 13tr nội thất full đồ (thiếu máy giặt)
Cọc 1 đóng 3 HĐ 2 năm

Hàng CĐT cho thuê', N'Đã lưu sẵn'),
(N'K5-GTM08', N'nhập căn k5 gtm08 
Đồ như ảnh giá 7 triệu (net) có: rèm, điều hòa, nóng lạnh,tủ bếp,tủ lạnh, bếp từ, hút mùi, giường,máy giặt,sấy.
Cọc 1 đóng  6 tháng hoặc 1 năm HĐ 2 năm 
Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ', N'Đã lưu sẵn'),
(N'K6-1404', N'Nhập căn thuê K6 1404 giá 7tr/ tháng, cọc 1 đóng 3, HĐ 1 năm, nhà nguyên bản CĐT

Phí Sale 1 tháng tiền nhà (nhận đủ khi khách ký hợp đồng thuê)', N'Đã lưu sẵn'),
(N'K3-GTM20', N'Nhập căn K3 GTM20 bán 2950 chủ bao thuế phí 
đang có khách thuê', N'Đã lưu sẵn'),
(N'K1-1504', N'nhập  k1 1504 
Giá thuê 12 triệu nội thất full đồ 
Cọc 1 đóng 3 HĐ 1 năm 
Phí đang xin 1 tháng 
Chủ đang cân đối chia làm 2 lần', N'Đã lưu sẵn'),
(N'K3-608', N'CHo thuê Full nội thất. Giá 15triệu. Sau 10/8 trống. cọc 1 đóng 3 hđ 1 năm. Nhà đang trống', N'Đã lưu sẵn'),
(N'K5-509', N'Bán 7ty800 bao phí 102%  , chủ đang vay vietcombank 4 tỷ.', N'Đã lưu sẵn'),
(N'K6A-1407', N'Nhập căn K6a 1407: giá nét 10tr500 cọc 1 đóng 3 HĐ 1 năm
đang trống', N'Đã lưu sẵn'),
(N'K1-1403', N'BS Nhập căn k1 1403 giá thuê 13.5 triệu 
Giá 13 triệu chủ xem kh
Nội thất như ảnh 
Cọc 1 đóng 3 HĐ 1 năm 
Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thuê', N'Đã lưu sẵn'),
(N'K2-802', N'Nhập căn 
K2 802 giá thuê 17tr
Nội thất full đồ
Cọc 1 đóng 3 HĐ 1 năm
đang trống', N'Đã lưu sẵn'),
(N'K6-1206', N'Nhập căn k6-1206, 3 ngủ 2 wc; 101m2
Đầy đủ nội thất cơ bản như hình: bếp từ, bếp từ, hút mùi, THÊM MÁY RỬA BÁT BOSS, điều hòa, bình nóng lạnh rèm cửa, giàn phơi.
Giá Thuê 14 tr/ 1 tháng ( có thương lượng). Cọc 1 tháng, nộp tiền 3/6 tháng 1 lần, thời gian thuê 1 năm trở lên.
Nếu khách cần sẽ bổ sung sofa bàn trà,  bàn ăn 6 ghế, đệm ngủ.', N'Đã lưu sẵn'),
(N'K1-GTM03', N'Nhập căn bán K1 GTM03 giá 2ty700 bao phí
Có đồ cơ bản + giường tủ', N'Đã lưu sẵn'),
(N'K6-GTM20', N'Cho thuê đồ cb. Giá 5,5triệu. Cọc 1 đóng 3, hđ 1 năm', N'Đã lưu sẵn'),
(N'K1-1903', N'Nhập căn k1 1903: 12tr cọc 1 đóng 3 HĐ 1 năm 
Có đồ liền tường', N'Đã lưu sẵn'),
(N'K5-1505', N'Nhập căn
K5 1505, cho thuê net 7tr/tháng nhà nguyên bản cđt, cọc 1 đóng 3, ký HĐ 2 năm
Có pass đi xem luôn
nguồn c Dung', N'Đã lưu sẵn'),
(N'K6-1009', N'bán nét 7500  bao phí 102%. chủ đang vay, chủ có hỗ trợ khách vay phong tỏa', N'Đã lưu sẵn'),
(N'K5-GTM12', N'Nhập căn K5 gtm12
Cho thuê nguyên bản CĐT giá 4tr500 triệu 
Cọc 1 đóng 3 HĐ 1 năm 
Phí sale 1 tháng tiền nhà nhận đủ khi khách ký HĐ thue', N'Đã lưu sẵn'),
(N'K6A-1905', N'Nhập căn 
-K6a 1905 cho thuê nội thất full đồ cả đồ điện tử giá 15 (có thương lượng về 14tr chủ xem kh)
Cọc 1 đóng 3 HĐ 1 năm 
Đầu tháng 10 trống', N'Đã lưu sẵn'),
(N'K1-702', N'K1- 702 bán 7ty6 bao sổ. Chủ sẵn sàng nhận cọc', N'Đã lưu sẵn'),
(N'K6-GTM12', N'Nhập căn cho thuê K6 GTM12 : 40m - Stu, BC ĐN
nguyên bản CĐT: 5tr500
có đồ: điều hòa, rèm nóng lạnh: 6tr500
Cọc 1 đóng 3 HĐ 1 năm
(khách chốt thuê đồ cơ bản thì chủ mới lắp)', N'Đã lưu sẵn'),
(N'K6A-1808', N'Nhập căn thuê K6A 1808 giá 9tr có đồ như ảnh 
cọc 1 đóng 3 HĐ 1 năm
không có điều hòa', N'Đã lưu sẵn'),
(N'ZB1807', N'TRIỆU TƯỜNG ANH', N'Đã lưu sẵn'),
(N'F2212A', N'"Mã căn hộ: F2212A
DT: 77m2
số pn: 2n
bán  giá 4ty370 bao phí (đã có 2% KPBT)
có đồ nội thất cơ bản, đang cho khách thuê, chủ không vay', N'Đã lưu sẵn'),
(N'F2105', N'30/4: chủ thiện chí bán, đàm phán giá dc nữa', N'Đã lưu sẵn'),
(N'F2710', N'Mã căn hộ: F2710
 DT: 78m2
 giá bán 4ty500 thu về (đã có 2% bảo trì)
 full liền tường, đang cho thuê', N'Đã lưu sẵn'),
(N'F0703', N'thúy', N'Đã lưu sẵn'),
(N'F2709', N'thúy', N'Đã lưu sẵn'),
(N'F1508', N'Thúy', N'Đã lưu sẵn');
GO

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'F0311', N'chủ đang cho khách thuê 20tr/ tháng. có khách thiện chí mua chủ mới cho xem nhà', N'Đã lưu sẵn'),
(N'T0205', N'Mã căn hộ: T0205
 DT: 111m2
 giá bán 5ty400 bao phí (đã có 2% bảo trì, 1% phí sale, thuế phí chuyển nhượng) - Thúy
 có đồ cơ bản, đang cho thuê 13tr/tháng', N'Đã lưu sẵn'),
(N'T1005', N'T1005 - 112m , tòa Trop bán 6ty150 bao phí ( đã có 2% bảo trì), nguyên bản CDT  - Thúy', N'Đã lưu sẵn'),
(N'ZA2705', N'Mã căn hộ: ZA2705
DT: 45m2 , bán 2ty950 - 3ty bao phí (đã có 2% , 1% phí sale, thuế phí chuyển nhượng) - Thúy', N'Đã lưu sẵn'),
(N'ZA0806', N'Còn, được giá mới bán, nguồn Hiệp', N'Đã lưu sẵn'),
(N'ZA2006', N'không vay, đã đóng với CDT 70%', N'Đã lưu sẵn'),
(N'ZA0908', N'Có vay, đã đóng 70% ( ngân hàng giải ngân 1ty300, cần vốn kh rút hd)', N'Đã lưu sẵn'),
(N'ZA2608', N'còn,', N'Đã lưu sẵn'),
(N'ZB2104', N'còn hàng', N'Đã lưu sẵn'),
(N'ZA2702', N'chủ đóng 60% có vay, đã hết HTLS', N'Đã lưu sẵn'),
(N'ZB0404', N'"Mã căn hộ: ZB0404
DT: 77m2 , bán 4ty580 bao phí (đã có 2% bảo trì, thuế phí cn)
dc miễn phí 1 năm dịch vụ"', N'Đã lưu sẵn'),
(N'ZA2309', N'Mã căn hộ: Za2309
DT: 78m2
số pn: 2n
bán  giá 4ty720 bao phí (đã có 2% bảo trì)
chủ đã nhận nhà', N'Đã lưu sẵn'),
(N'ZB0307', N'thúy
chủ đã đóng 1ty700, có vay, ngân hàng đang giải ngân 400tr, vay BIDV, HTLS 12/24', N'Đã lưu sẵn'),
(N'ZA0402', N'"""Mã căn hộ: ZA0402
DT: 78m2
số pn: 2n
bán  giá 4ty800 bao phí (đã có 2% bảo trì, phí sale 1%, thuế phí CN)
có nội thất cơ bản: 1 giường 1 tủ, bếp 
"', N'Đã lưu sẵn'),
(N'ZA2704', N'21/4: vẫn bán giá 5ty300, đóng dc 40% với CDT', N'Đã lưu sẵn'),
(N'ZB0402', N'3/4: chủ thiện chí bán', N'Đã lưu sẵn'),
(N'ZB0905', N'nguồn không chắc, có khách ib riêng', N'Đã lưu sẵn'),
(N'ZB2405', N'chủ đã nhận nhà, đóng hết tiền rồi, không vay, đã nộp phí dv 6 tháng', N'Đã lưu sẵn'),
(N'ZB2305', N'Hiệp', N'Đã lưu sẵn'),
(N'ZA1710', N'Hiệp', N'Đã lưu sẵn'),
(N'ZA310', N'20/4: đợi hoàn thiện nội thất rùi mới bán', N'Đã lưu sẵn'),
(N'ZA2710', N'Thúy', N'Đã lưu sẵn'),
(N'ZA0610', N'chủ vay BIDV hà đông, mới giải ngân 492tr (chủ tự rút HĐ)
còn đợt 55% - 2ty707 ngân hàng chưa giải ngân, còn lại đóng hết rùi', N'Đã lưu sẵn'),
(N'ZB2302', N'kỳ vọng 4ty900', N'Đã lưu sẵn'),
(N'ZB2103', N'"ZB2103- 73m
muốn bán 4ty200"', N'Đã lưu sẵn'),
(N'ZB1508', N'"ZB1508 
bán 4ty100 bao phí cn( chưa có bảo trì)"- Thúy', N'Đã lưu sẵn'),
(N'ZB0508', N'chủ không thiện chí bán lắm', N'Đã lưu sẵn'),
(N'ZA1507', N'Mã ZA1507 - DT 90m
bán 4ty800 thu về chưa có 2% KPBT - Thúy', N'Đã lưu sẵn'),
(N'ZA1805', N'cần check lại - nguồn Hiệp', N'Đã lưu sẵn'),
(N'T0607', N'chủ không hợp tác, nên tạm dừng giao dịch', N'Đã lưu sẵn');
GO

INSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES
(N'ZA0305', N'8/3: thiết kế để ở, bao giờ bán báo sau', N'Đã lưu sẵn'),
(N'ZB0706', N'8/3: c k bán nữa về ở', N'Đã lưu sẵn'),
(N'ZB0409', N'13/3: chủ về ở, sau bán báo sau', N'Đã lưu sẵn'),
(N'ZB2704', N'15/3: chủ lại chưa quyết bán, kỳ vọng giá cao hơn', N'Đã lưu sẵn'),
(N'ZB1605', N'24/3 về ở 1 năm rùi bán sau', N'Đã lưu sẵn'),
(N'F210', N'22/3: hiện tại không đi xem nhà dc! tháng 9 mới hết hợp đồng, lúc ý mới đi xem dc, còn ai chấp nhận không đi xem nhà mua thì vẫn giao dịch dc', N'Đã lưu sẵn'),
(N'F0310', N'30/3: không bán nữa, để ở', N'Đã lưu sẵn'),
(N'F0207', N'3/4: chủ nghét, cả nhà dừng sale', N'Đã lưu sẵn'),
(N'F0212', N'Thuý', N'Đã lưu sẵn'),
(N'F0514', N'Thuý', N'Đã lưu sẵn'),
(N'F2112', N'Thuý', N'Đã lưu sẵn'),
(N'F0510', N'Thuý', N'Đã lưu sẵn'),
(N'F2005', N'DT: 77m
số pn: 2n
Nội thất: 3 điều hòa, tủ bếp, giường tủ, bàn ăn, sofa
Giá: 12tr , cọc 1 đóng 3 hợp đồng 1 năm, 
Hiện trạng: đang trống, dc miễn dv 7 tháng', N'Đã lưu sẵn'),
(N'F703', N'DT: 108m2
số pn: 3n
Nội thất: đồ cơ bản, cần có thêm sofa giường tủ, giá 13tr-14tr
cọc 1 đóng 3/6 HĐ 1 năm
Hiện trạng: 20/3 trống', N'Đã lưu sẵn'),
(N'F2115', N'DT: 77m2
số pn: 2n
Nội thất: đồ cơ bản, 12tr
cọc 1 đóng 3 HĐ 1 năm
Hiện trạng: đang trống', N'Đã lưu sẵn');
GO

-- ==============================================================================
-- 7. TẠO VIEW TỰ ĐỘNG LẤY DATA THẬT ĐỂ ĐĂNG BÀI FACEBOOK
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
    c.PhapLy,
    c.PhongThuy AS GhiChuNguon,
    nt.NoiThat,
    p.Contend AS NoiDungGoc,
    -- Mẫu bài đăng tự động chuẩn SEO BĐS:
    N'🔥 ' + CASE WHEN g.LoaiGiaoDich = N'Cho thuê' THEN N'CHO THUÊ' ELSE N'BÁN GẤP' END + 
    N' CĂN HỘ ' + UPPER(d.ten_du_an) + N' [' + c.MaCanHo + N'] 🔥' + CHAR(13) + CHAR(10) +
    N'📌 Diện tích: ' + CAST(c.DienTich AS NVARCHAR(10)) + N'm² (' + CAST(c.SoPhongNgu AS NVARCHAR(5)) + N' ngủ - ' + CAST(c.SoWC AS NVARCHAR(5)) + N' vệ sinh)' + CHAR(13) + CHAR(10) +
    CASE 
        WHEN g.GiaBan IS NOT NULL THEN N'💰 Giá bán: ' + CAST(g.GiaBan AS NVARCHAR(20)) + N' tỷ' + 
             CASE WHEN g.DonGia_m2 IS NOT NULL THEN N' (~' + CAST(g.DonGia_m2 AS NVARCHAR(20)) + N' tr/m²)' ELSE N'' END + CHAR(13) + CHAR(10)
        ELSE N'' 
    END +
    CASE 
        WHEN g.GiaThue IS NOT NULL THEN N'💵 Giá thuê: ' + g.GiaThue + CHAR(13) + CHAR(10)
        ELSE N'' 
    END +
    N'🛋️ Tình trạng: ' + ISNULL(c.TinhTrangBanGiao, N'Đầy đủ đồ') + CHAR(13) + CHAR(10) +
    N'📜 Pháp lý: ' + ISNULL(c.PhapLy, N'Chuẩn chỉ') + CHAR(13) + CHAR(10) +
    N'📞 Hotline tư vấn & xem nhà 24/7: 0969.898.497 / 033.8866.058' AS NoiDungDangBaiMau
FROM dbo.THONG_TIN_CAN_HO c
INNER JOIN dbo.DU_AN d ON c.ma_du_an = d.ma_du_an
LEFT JOIN dbo.BANG_GIA g ON c.MaCanHo = g.MaCanHo
LEFT JOIN dbo.NOI_THAT nt ON c.MaCanHo = nt.MaCanHo
OUTER APPLY (
    SELECT TOP 1 Contend 
    FROM dbo.BAI_DANG 
    WHERE MaCanHo = c.MaCanHo 
    ORDER BY MaBaiDang DESC
) p;
GO

DECLARE @cntCanHo INT = (SELECT COUNT(*) FROM dbo.THONG_TIN_CAN_HO);
DECLARE @cntGia INT = (SELECT COUNT(*) FROM dbo.BANG_GIA);
DECLARE @cntPost INT = (SELECT COUNT(*) FROM dbo.BAI_DANG);

PRINT N'==============================================================================';
PRINT N'  ĐÃ NẠP HOÀN TẤT DỮ LIỆU THẬT 100% VÀO DATABASE SQL SERVER BDS_Studio_DB!    ';
PRINT N'  - Tổng số căn hộ thật: ' + CAST(@cntCanHo AS NVARCHAR(10));
PRINT N'  - Tổng số bản ghi bảng giá: ' + CAST(@cntGia AS NVARCHAR(10));
PRINT N'  - Tổng số bài đăng: ' + CAST(@cntPost AS NVARCHAR(10));
PRINT N'==============================================================================';
GO
