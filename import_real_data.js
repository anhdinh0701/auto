const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const uniqueList = require('./parsed_apartments.json');

// Group by unique MaCanHo
const canHoMap = new Map();

for (const item of uniqueList) {
  let canHo = canHoMap.get(item.MaCanHo);
  if (!canHo) {
    canHo = {
      MaCanHo: item.MaCanHo,
      ma_du_an: item.ma_du_an,
      PhapLy: item.PhapLy,
      PhanKhu: item.PhanKhu,
      SoPhongNgu: item.SoPhongNgu,
      SoWC: item.SoWC,
      DienTich: item.DienTich,
      TrangThaiCanHo: 'Sẵn sàng giao dịch',
      SoLanDaDang: 0,
      TinhTrangBanGiao: item.TinhTrangBanGiao,
      PhongThuy: item.GhiChuNguon ? item.GhiChuNguon.substring(0, 195) : '',
      prices: [],
      posts: []
    };
    canHoMap.set(item.MaCanHo, canHo);
  }

  // Add price
  canHo.prices.push({
    LoaiGiaoDich: item.LoaiGiaoDich,
    GiaBan: item.GiaBan,
    GiaThue: item.GiaThue,
    GhiChu: item.MoTa ? item.MoTa.substring(0, 250) : ''
  });

  // Add post content
  if (item.Contend && item.Contend.trim()) {
    canHo.posts.push({
      Contend: item.Contend.trim(),
      Nguon: item.GhiChuNguon
    });
  }
}

console.log('Unique Apartments count:', canHoMap.size);

// Escape SQL strings
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "N'" + String(str).replace(/'/g, "''") + "'";
}

let sql = `-- ==============================================================================
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
-- 3. NẠP TOÀN BỘ ${canHoMap.size} CĂN HỘ THẬT TỪ QUỸ CĂN
-- ==============================================================================
PRINT N'Đang nạp dữ liệu ${canHoMap.size} căn hộ thật vào THONG_TIN_CAN_HO...';
`;

// Insert batches into THONG_TIN_CAN_HO
const canHoList = Array.from(canHoMap.values());
const canHoBatchSize = 50;

for (let i = 0; i < canHoList.length; i += canHoBatchSize) {
  const batch = canHoList.slice(i, i + canHoBatchSize);
  sql += '\nINSERT INTO dbo.THONG_TIN_CAN_HO (MaCanHo, ma_du_an, PhapLy, PhanKhu, SoPhongNgu, SoWC, DienTich, TrangThaiCanHo, SoLanDaDang, TinhTrangBanGiao, PhongThuy) VALUES\n';
  sql += batch.map(c => {
    return `(${escapeSql(c.MaCanHo)}, ${c.ma_du_an}, ${escapeSql(c.PhapLy)}, ${escapeSql(c.PhanKhu)}, ${c.SoPhongNgu}, ${c.SoWC}, ${c.DienTich}, ${escapeSql(c.TrangThaiCanHo)}, 0, ${escapeSql(c.TinhTrangBanGiao)}, ${escapeSql(c.PhongThuy)})`;
  }).join(',\n') + ';\nGO\n';
}

// Insert into BANG_GIA
sql += `\n-- ==============================================================================
-- 4. NẠP BẢNG GIÁ THẬT (BÁN & CHO THUÊ)
-- ==============================================================================
PRINT N'Đang nạp bảng giá thật vào BANG_GIA...';
`;

const allPrices = [];
for (const c of canHoList) {
  for (const p of c.prices) {
    allPrices.push({
      MaCanHo: c.MaCanHo,
      LoaiGiaoDich: p.LoaiGiaoDich,
      GiaBan: p.GiaBan,
      GiaThue: p.GiaThue,
      DienTich_Ref: c.DienTich,
      GhiChu: p.GhiChu
    });
  }
}

for (let i = 0; i < allPrices.length; i += 50) {
  const batch = allPrices.slice(i, i + 50);
  sql += '\nINSERT INTO dbo.BANG_GIA (MaCanHo, LoaiGiaoDich, GiaBan, GiaThue, DienTich_Ref, GhiChu) VALUES\n';
  sql += batch.map(p => {
    const giaBanVal = p.GiaBan ? p.GiaBan : 'NULL';
    return `(${escapeSql(p.MaCanHo)}, ${escapeSql(p.LoaiGiaoDich)}, ${giaBanVal}, ${escapeSql(p.GiaThue)}, ${p.DienTich_Ref}, ${escapeSql(p.GhiChu)})`;
  }).join(',\n') + ';\nGO\n';
}

// Insert into NOI_THAT
sql += `\n-- ==============================================================================
-- 5. NẠP NỘI THẤT VÀ ĐỒ ĐIỆN CỦA CĂN HỘ
-- ==============================================================================
PRINT N'Đang nạp thông tin nội thất vào NOI_THAT...';
`;

const allNoiThat = [];
for (const c of canHoList) {
  allNoiThat.push({
    MaCanHo: c.MaCanHo,
    NoiThat: c.TinhTrangBanGiao,
    DoDien: c.PhongThuy ? c.PhongThuy.substring(0, 200) : ''
  });
}

for (let i = 0; i < allNoiThat.length; i += 50) {
  const batch = allNoiThat.slice(i, i + 50);
  sql += '\nINSERT INTO dbo.NOI_THAT (MaCanHo, NoiThat, DoDien) VALUES\n';
  sql += batch.map(nt => {
    return `(${escapeSql(nt.MaCanHo)}, ${escapeSql(nt.NoiThat)}, ${escapeSql(nt.DoDien)})`;
  }).join(',\n') + ';\nGO\n';
}

// Insert into BAI_DANG
sql += `\n-- ==============================================================================
-- 6. NẠP NỘI DUNG BÀI ĐĂNG GỐC CỦA CĂN HỘ
-- ==============================================================================
PRINT N'Đang nạp nội dung bài đăng vào BAI_DANG...';
`;

const allPosts = [];
for (const c of canHoList) {
  for (const post of c.posts) {
    allPosts.push({
      MaCanHo: c.MaCanHo,
      Contend: post.Contend
    });
  }
}

for (let i = 0; i < allPosts.length; i += 30) {
  const batch = allPosts.slice(i, i + 30);
  sql += '\nINSERT INTO dbo.BAI_DANG (MaCanHo, Contend, TrangThaiDang) VALUES\n';
  sql += batch.map(pt => {
    return `(${escapeSql(pt.MaCanHo)}, ${escapeSql(pt.Contend)}, N'Đã lưu sẵn')`;
  }).join(',\n') + ';\nGO\n';
}

// VIEW v_ThongTinDangBaiChiTiet
sql += `\n-- ==============================================================================
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
`;

const outputPath = path.join(__dirname, 'BDS_Studio_Database.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log('Successfully written BDS_Studio_Database.sql with full real data! File size:', (fs.statSync(outputPath).size / 1024).toFixed(1), 'KB');
