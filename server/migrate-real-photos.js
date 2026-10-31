const db = require('./db');

const realPhotos = [
  {
    id: 'photo-1eb5450a-efe',
    url: '/uploads/1793263734174-843872878-Screenshot_2026-10-18_201112.png',
    filename: '1793263734174-843872878-Screenshot_2026-10-18_201112.png',
    originalname: 'Screenshot_2026-10-18_201112.png',
    mimetype: 'image/png',
    size: 677975,
    is_cover: true,
    order: 0
  },
  {
    id: 'photo-588efa2d-5a0',
    url: '/uploads/1793263780404-84769433-Screenshot__86_.png',
    filename: '1793263780404-84769433-Screenshot__86_.png',
    originalname: 'Screenshot__86_.png',
    mimetype: 'image/png',
    size: 665759,
    is_cover: false,
    order: 1
  }
];

// 1. Update sample-listing-1
db.prepare(`
  UPDATE listings SET
    title = 'Căn hộ Khai Sơn City 2PN view hồ điều hòa',
    project_name = 'Khai Sơn City',
    province = 'Hà Nội',
    district = 'Quận Long Biên',
    ward = 'Thượng Thanh',
    address_detail = 'Khu đô thị Khai Sơn City, Phường Thượng Thanh, Quận Long Biên, Hà Nội',
    photos = ?,
    approved_photo_ids = ?,
    location_verification_status = 'VERIFIED',
    updated_at = ?
  WHERE id = 'sample-listing-1'
`).run(
  JSON.stringify(realPhotos),
  JSON.stringify(['photo-1eb5450a-efe', 'photo-588efa2d-5a0']),
  new Date().toISOString()
);

// 2. Also ensure any other test listing with Khai Sơn City uses these real files instead of non-existent exterior-facade.jpg
const otherKhaiSon = db.prepare("SELECT id FROM listings WHERE project_name = 'Khai Sơn City' AND id != 'sample-listing-1'").all();
for (const item of otherKhaiSon) {
  db.prepare(`
    UPDATE listings SET
      photos = ?,
      approved_photo_ids = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    JSON.stringify(realPhotos),
    JSON.stringify(['photo-1eb5450a-efe', 'photo-588efa2d-5a0']),
    new Date().toISOString(),
    item.id
  );
}

// 3. Make sure photos table references are consistent
db.prepare("UPDATE photos SET listing_id = 'sample-listing-1' WHERE id IN ('photo-1eb5450a-efe', 'photo-588efa2d-5a0')").run();

console.log('Successfully mapped real images to Khai Son City listings!');
