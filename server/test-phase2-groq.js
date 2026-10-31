const http = require('http');
const db = require('./db');

function postJson(urlPath, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (_) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testPhase2() {
  console.log('=== TEST 1: MODULE 1 - NLP Feature Extractor (Groq JSON Mode) ===');
  const sampleContent = `Bán gấp căn hộ 2 phòng ngủ 2WC tại dự án Khai Sơn City, Phường Thượng Thanh, Quận Long Biên, Hà Nội.
Diện tích 69m2 view trọn hồ điều hòa 22ha cực thoáng mát.
Căn hộ đã hoàn thiện full nội thất cao cấp: sàn gỗ, điều hòa âm trần, tủ bếp An Cường.
Pháp lý sổ hồng chính chủ sẵn sàng công chứng ngay.
Giá bán: 2.85 tỷ (thương lượng nhẹ cho khách thiện chí).`;

  const nlpRes = await postJson('/api/ai/extract-features', {
    raw_content: sampleContent,
    listing_id: 'sample-listing-1'
  });

  console.log('NLP API Status:', nlpRes.status);
  console.log('NLP Response:', JSON.stringify(nlpRes.data, null, 2));

  // Check Properties table in SQLite
  const prop = db.prepare('SELECT id, title, city, district, property_type, price, area, extracted_tags FROM Properties WHERE id = ?').get('sample-listing-1');
  console.log('\nVerified in Properties table:', prop);

  console.log('\n=== TEST 2: MODULE 2 - Groq Vision Matching & Smart Photo Selection ===');
  const visionRes = await postJson('/api/ai/select-photos', {
    listing_id: 'sample-listing-1',
    channel_type: 'facebook_feed',
    target_limit: 4
  });

  console.log('Vision API Status:', visionRes.status);
  console.log('Vision Response Summary:', {
    success: visionRes.data?.success,
    total_analyzed: visionRes.data?.total_analyzed,
    selected_count: visionRes.data?.selected_count,
    cover_photo_id: visionRes.data?.cover_photo_id,
    cover_photo_category: visionRes.data?.cover_photo_category,
    approved_photo_ids: visionRes.data?.approved_photo_ids
  });

  console.log('\nRecommended Photos:');
  console.log(visionRes.data?.recommended_photos?.map(p => ({
    id: p.id,
    role: p.role,
    detected_category: p.detected_category,
    aesthetic_score: p.aesthetic_score,
    relevance_score: p.relevance_score,
    sort_order: p.sort_order,
    is_selected: p.is_selected
  })));

  // Check MediaAssets table in SQLite
  const mediaRows = db.prepare('SELECT id, property_id, detected_category, aesthetic_score, relevance_score, is_selected, sort_order FROM MediaAssets WHERE property_id = ? ORDER BY sort_order ASC').all('sample-listing-1');
  console.log('\nVerified in MediaAssets table:');
  console.log(mediaRows);

  if (nlpRes.status === 200 && visionRes.status === 200 && visionRes.data?.selected_count >= 2) {
    console.log('\n>>> GIAI ĐOẠN 2 TESTS PASSED 100%! <<<');
    process.exit(0);
  } else {
    console.error('\n>>> TESTS FAILED! <<<');
    process.exit(1);
  }
}

testPhase2().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
