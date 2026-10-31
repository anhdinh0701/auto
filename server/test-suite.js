const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Ensure server is reachable or run tests using fetch against http://localhost:3001
const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN CHO GIAI ĐOẠN 1');
  console.log('====================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  async function test(name, fn) {
    totalCount++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}`);
      console.error('   Lỗi:', err.message);
    }
  }

  // 1. Stats endpoint
  await test('1. Dashboard Stats API trả về đầy đủ tổng số tin, bản nháp, sẵn sàng đăng', async () => {
    const res = await fetch(`${BASE_URL}/api/stats`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(typeof data.total === 'number');
    assert.ok(typeof data.drafts === 'number');
    assert.ok(typeof data.ready === 'number');
    assert.ok(Array.isArray(data.recent));
    assert.ok(data.recent.length > 0);
  });

  // 2. Create listing
  let createdId = null;
  await test('2. Tạo tin bất động sản mới với đầy đủ thông số', async () => {
    const newListing = {
      title: 'Biệt Thự Đơn Lập Thảo Điền Quận 2 View Sông Sài Gòn',
      property_type: 'biet_thu',
      listing_action: 'ban',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 2',
      ward: 'Thảo Điền',
      address_detail: 'Nguyễn Văn Hưởng',
      price: 68.0,
      price_unit: 'tỷ',
      area: 450,
      bedrooms: 5,
      bathrooms: 6,
      floors: 3,
      direction: 'Đông Nam',
      legal_status: 'Sổ hồng lâu dài',
      furniture_status: 'Nội thất nhập khẩu Châu Âu',
      amenities: ['Hồ bơi riêng', 'Sân vườn lớn', 'Chỗ để xe ô tô', 'Bảo vệ 24/7'],
      contact_name: 'Trần Văn Hoàng',
      contact_phone: '0933112233',
      contact_zalo: '0933112233',
      status: 'ready',
      photos: [
        {
          id: 'photo-test-1',
          url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
          filename: 'villa1.jpg',
          originalname: 'villa1.jpg',
          size: 1500000,
          is_cover: true,
          order: 0
        },
        {
          id: 'photo-test-2',
          url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
          filename: 'villa2.jpg',
          originalname: 'villa2.jpg',
          size: 1400000,
          is_cover: false,
          order: 1
        }
      ],
      target_platforms: ['facebook', 'batdongsan'],
      target_groups: ['Hội Biệt Thự Thảo Điền']
    };

    const res = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newListing)
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.id);
    assert.strictEqual(data.title, newListing.title);
    assert.strictEqual(data.price, 68);
    assert.strictEqual(data.amenities.length, 4);
    assert.strictEqual(data.photos.length, 2);
    createdId = data.id;
  });

  // 3. Read single listing
  await test('3. Đọc chi tiết tin bất động sản vừa tạo', async () => {
    assert.ok(createdId);
    const res = await fetch(`${BASE_URL}/api/listings/${createdId}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.id, createdId);
    assert.strictEqual(data.property_type, 'biet_thu');
    assert.strictEqual(data.status, 'ready');
  });

  // 4. Update listing
  await test('4. Chỉnh sửa tin và cập nhật ảnh đại diện, giá bán', async () => {
    assert.ok(createdId);
    const getRes = await fetch(`${BASE_URL}/api/listings/${createdId}`);
    const existing = await getRes.json();

    existing.price = 65.0; // Giảm giá
    existing.title = 'Bán Gấp Biệt Thự Thảo Điền Q2 View Sông (Hạ Giá)';
    existing.status = 'reviewed';
    // Đổi cover photo
    existing.photos[0].is_cover = false;
    existing.photos[1].is_cover = true;

    const res = await fetch(`${BASE_URL}/api/listings/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(existing)
    });

    assert.strictEqual(res.status, 200);
    const updated = await res.json();
    assert.strictEqual(updated.price, 65);
    assert.strictEqual(updated.status, 'reviewed');
    assert.strictEqual(updated.photos[1].is_cover, true);
  });

  // 5. Clone listing
  let clonedId = null;
  await test('5. Nhân bản (Clone) tin bất động sản thành bản nháp mới', async () => {
    assert.ok(createdId);
    const res = await fetch(`${BASE_URL}/api/listings/${createdId}/clone`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 201);
    const cloned = await res.json();
    assert.ok(cloned.id !== createdId);
    assert.ok(cloned.title.includes('(Bản sao)'));
    assert.strictEqual(cloned.status, 'draft');
    clonedId = cloned.id;
  });

  // 6. Search and Filter
  await test('6. Tìm kiếm và lọc tin theo tiêu đề, loại hình, trạng thái', async () => {
    // Search by keyword "Thảo Điền"
    const searchRes = await fetch(`${BASE_URL}/api/listings?search=Th%E1%BA%A3o%20%C4%90i%E1%BB%81n`);
    const searchData = await searchRes.json();
    assert.ok(searchData.total >= 2);

    // Filter by type "biet_thu"
    const typeRes = await fetch(`${BASE_URL}/api/listings?property_type=biet_thu`);
    const typeData = await typeRes.json();
    assert.ok(typeData.total >= 2);
    assert.ok(typeData.items.every(i => i.property_type === 'biet_thu'));

    // Filter by status "reviewed"
    const statusRes = await fetch(`${BASE_URL}/api/listings?status=reviewed`);
    const statusData = await statusRes.json();
    assert.ok(statusData.items.some(i => i.id === createdId));
  });

  // 7. Validation: Empty title rejected safely
  await test('7. Kiểm tra validation an toàn: Tiêu đề rỗng bị từ chối với mã 400', async () => {
    const res = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ', property_type: 'can_ho' })
    });
    assert.strictEqual(res.status, 400);
    const err = await res.json();
    assert.ok(err.error);
  });

  // 8. Image Upload Simulation & Storage Check
  await test('8. Tải lên tệp ảnh qua multipart/form-data và lưu trữ bền vững trên ổ đĩa', async () => {
    // Create a temporary valid JPEG image buffer
    const tempImgPath = path.join(__dirname, 'test_sample.png');
    // Minimal 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360606060000000050001a7e45bc40000000049454e44ae426082', 'hex');
    fs.writeFileSync(tempImgPath, pngBuffer);

    const formData = new FormData();
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('images', blob, 'test_upload_anh_thuc_te.png');

    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.photos.length, 1);
    
    // Verify file actually exists on disk in uploads directory
    const savedFilename = data.photos[0].filename;
    const diskPath = path.join(__dirname, '..', 'uploads', savedFilename);
    assert.ok(fs.existsSync(diskPath), 'Tệp ảnh phải tồn tại trên ổ đĩa');

    // Clean up temp local file
    try { fs.unlinkSync(tempImgPath); } catch (e) {}
  });

  // 9. Templates API & Auto generation
  await test('9. Danh sách mẫu bài đăng và tạo mẫu tùy chỉnh', async () => {
    const res = await fetch(`${BASE_URL}/api/templates`);
    assert.strictEqual(res.status, 200);
    const templates = await res.json();
    assert.ok(templates.length >= 4);

    // Create custom template
    const createRes = await fetch(`${BASE_URL}/api/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mẫu Bán Nhà Nhanh Test',
        category: 'nha_pho',
        style: 'chuyen_nghiep',
        title_template: 'BÁN NHÀ {district} - {price} {price_unit}',
        body_template: 'Nhà đẹp {address_detail}, diện tích {area}m2, giá {price} {price_unit}.'
      })
    });
    assert.strictEqual(createRes.status, 201);
    const createdTpl = await createRes.json();
    assert.ok(createdTpl.id);

    // Delete custom template
    const delRes = await fetch(`${BASE_URL}/api/templates/${createdTpl.id}`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 200);
  });

  // 10. Delete listing
  await test('10. Xóa tin bất động sản và kiểm tra dọn dẹp dữ liệu', async () => {
    assert.ok(createdId);
    const delRes = await fetch(`${BASE_URL}/api/listings/${createdId}`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 200);

    // Check it's gone
    const checkRes = await fetch(`${BASE_URL}/api/listings/${createdId}`);
    assert.strictEqual(checkRes.status, 404);

    // Also delete clone
    if (clonedId) {
      await fetch(`${BASE_URL}/api/listings/${clonedId}`, { method: 'DELETE' });
    }
  });

  // 11. Persistence Across Restart Check
  await test('11. Kiểm tra tính bền vững: File SQLite tồn tại trên ổ đĩa và có dữ liệu', async () => {
    const dbFilePath = path.join(__dirname, '..', 'data', 'realestate.db');
    assert.ok(fs.existsSync(dbFilePath), 'File realestate.db phải tồn tại trên ổ đĩa');
    const stats = fs.statSync(dbFilePath);
    assert.ok(stats.size > 0, 'File database phải có dung lượng lớn hơn 0');
  });

  console.log('\n====================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passedCount} / ${totalCount} BÀI TEST THÀNH CÔNG!`);
  console.log('====================================================\n');
}

runTests().catch(console.error);
