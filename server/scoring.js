/**
 * Channel Relevance Scoring Engine
 * 
 * Calculates an explainable score from 0 to 100 based on 6 core criteria.
 * Weights are configurable. Missing information is NOT treated as verified.
 */

function calculateRelevance(channel, criteria = {}, weights = {}) {
  // Configurable weights with standard defaults summing to 100
  const w = {
    location: Number(weights.weight_location !== undefined ? weights.weight_location : 25),
    propertyType: Number(weights.weight_property_type !== undefined ? weights.weight_property_type : 20),
    price: Number(weights.weight_price !== undefined ? weights.weight_price : 15),
    audience: Number(weights.weight_audience !== undefined ? weights.weight_audience : 15),
    freshness: Number(weights.weight_freshness !== undefined ? weights.weight_freshness : 15),
    capability: Number(weights.weight_capability !== undefined ? weights.weight_capability : 10),
  };

  const totalWeight = w.location + w.propertyType + w.price + w.audience + w.freshness + w.capability || 100;

  // Normalized criteria inputs
  const targetProvince = (criteria.province || '').trim().toLowerCase();
  const targetDistrict = (criteria.district || '').trim().toLowerCase();
  const targetPropertyType = (criteria.property_type || '').trim().toLowerCase();
  const targetPriceSegment = (criteria.price_segment || '').trim().toLowerCase();
  const targetAudience = (criteria.target_audience || '').trim().toLowerCase();

  // Channel data parsing
  const chProvince = (channel.province || '').trim().toLowerCase();
  const chDistrict = (channel.district || '').trim().toLowerCase();

  const chPropertyTypes = Array.isArray(channel.property_types)
    ? channel.property_types.map(s => String(s).toLowerCase())
    : (typeof channel.property_types === 'string' ? JSON.parse(channel.property_types || '[]').map(s => String(s).toLowerCase()) : []);

  const chPriceSegments = Array.isArray(channel.price_segments)
    ? channel.price_segments.map(s => String(s).toLowerCase())
    : (typeof channel.price_segments === 'string' ? JSON.parse(channel.price_segments || '[]').map(s => String(s).toLowerCase()) : []);

  const chAudiences = Array.isArray(channel.target_audiences)
    ? channel.target_audiences.map(s => String(s).toLowerCase())
    : (typeof channel.target_audiences === 'string' ? JSON.parse(channel.target_audiences || '[]').map(s => String(s).toLowerCase()) : []);

  // 1. LOCATION MATCH (0 - 100)
  let locScore = 20;
  let locReason = 'Chưa xác định vị trí';
  if (targetProvince || targetDistrict) {
    if (targetDistrict && chDistrict && (chDistrict.includes(targetDistrict) || targetDistrict.includes(chDistrict))) {
      locScore = 100;
      locReason = `Trùng khớp chính xác Quận/Huyện (${channel.district})`;
    } else if (targetProvince && chProvince && (chProvince.includes(targetProvince) || targetProvince.includes(chProvince))) {
      locScore = 75;
      locReason = `Trùng khớp Tỉnh/Thành phố (${channel.province})`;
    } else if (chProvince === 'toàn quốc' || chProvince === 'toan_quoc' || !chProvince) {
      locScore = 40;
      locReason = chProvince ? 'Kênh quy mô toàn quốc' : 'Kênh chưa ghi rõ địa bàn (thiếu thông tin)';
    } else {
      locScore = 10;
      locReason = `Khác khu vực mục tiêu (Kênh thuộc: ${channel.province || 'khác'})`;
    }
  } else {
    locScore = chProvince ? 70 : 40;
    locReason = chProvince ? `Khu vực: ${channel.province}` : 'Không áp bộ lọc khu vực';
  }

  // 2. PROPERTY TYPE MATCH (0 - 100)
  let typeScore = 30;
  let typeReason = 'Chưa phân loại BĐS';
  if (targetPropertyType) {
    if (chPropertyTypes.includes(targetPropertyType) || chPropertyTypes.includes('all') || chPropertyTypes.includes('tat_ca')) {
      typeScore = 100;
      typeReason = `Phù hợp loại hình mục tiêu (${targetPropertyType})`;
    } else if (chPropertyTypes.length > 0) {
      typeScore = 15;
      typeReason = `Kênh chuyên loại hình khác (${chPropertyTypes.join(', ')})`;
    } else {
      typeScore = 30;
      typeReason = 'Kênh chưa khai báo loại BĐS (thiếu thông tin)';
    }
  } else {
    typeScore = chPropertyTypes.length > 0 ? 80 : 50;
    typeReason = chPropertyTypes.length > 0 ? `Đa dạng loại hình (${chPropertyTypes.length})` : 'Chưa chọn loại hình lọc';
  }

  // 3. PRICE SEGMENT MATCH (0 - 100)
  let priceScore = 30;
  let priceReason = 'Chưa phân khúc giá';
  if (targetPriceSegment) {
    if (chPriceSegments.includes(targetPriceSegment) || chPriceSegments.includes('all')) {
      priceScore = 100;
      priceReason = `Trùng khớp phân khúc (${targetPriceSegment})`;
    } else if (chPriceSegments.length > 0) {
      priceScore = 20;
      priceReason = `Thuộc phân khúc khác (${chPriceSegments.join(', ')})`;
    } else {
      priceScore = 25;
      priceReason = 'Kênh không giới hạn phân khúc hoặc thiếu thông tin';
    }
  } else {
    priceScore = chPriceSegments.length > 0 ? 75 : 50;
    priceReason = chPriceSegments.length > 0 ? 'Có dữ liệu phân khúc' : 'Không lọc phân khúc';
  }

  // 4. TARGET AUDIENCE MATCH (0 - 100)
  let audScore = 30;
  let audReason = 'Chưa phân loại đối tượng';
  if (targetAudience) {
    if (chAudiences.includes(targetAudience) || chAudiences.includes('all')) {
      audScore = 100;
      audReason = `Đúng tệp khán giả (${targetAudience})`;
    } else if (chAudiences.length > 0) {
      audScore = 20;
      audReason = `Tệp khán giả khác (${chAudiences.join(', ')})`;
    } else {
      audScore = 30;
      audReason = 'Chưa xác định rõ tệp đối tượng (thiếu thông tin)';
    }
  } else {
    audScore = chAudiences.length > 0 ? 80 : 50;
    audReason = chAudiences.length > 0 ? 'Có tệp đối tượng rõ ràng' : 'Không lọc đối tượng';
  }

  // 5. FRESHNESS & VERIFICATION (0 - 100)
  let freshScore = 20;
  let freshReason = 'Chưa xác minh';
  const vStatus = channel.verification_status || 'unverified';
  const lastVerified = channel.last_verified_at ? new Date(channel.last_verified_at) : null;
  const now = new Date();

  if (vStatus === 'verified') {
    if (lastVerified) {
      const daysDiff = Math.max(0, (now.getTime() - lastVerified.getTime()) / (1000 * 3600 * 24));
      if (daysDiff <= 30) {
        freshScore = 100;
        freshReason = `Đã xác minh gần đây (${Math.round(daysDiff)} ngày trước)`;
      } else if (daysDiff <= 90) {
        freshScore = 80;
        freshReason = `Đã xác minh (${Math.round(daysDiff)} ngày trước)`;
      } else {
        freshScore = 65;
        freshReason = 'Xác minh trên 90 ngày (cần rà soát lại)';
      }
    } else {
      freshScore = 75;
      freshReason = 'Đã gắn nhãn xác minh';
    }
  } else if (vStatus === 'unverified') {
    freshScore = 35;
    freshReason = 'Chưa được quản trị viên kiểm minh';
  } else if (vStatus === 'inactive') {
    freshScore = 0;
    freshReason = 'Kênh đã ngưng hoạt động hoặc bị chặn';
  }

  // 6. PUBLISHING CAPABILITY (0 - 100)
  // Strictly defined:
  // - api_supported: API publishing supported and verified (100)
  // - manual_only: Manual publishing only (70)
  // - unknown: Unknown or not verified (35)
  // - unsupported: Unsupported (10)
  let capScore = 35;
  let capReason = 'Chưa xác minh khả năng đăng';
  const pubCap = channel.publishing_capability || 'unknown';

  if (pubCap === 'api_supported') {
    capScore = 100;
    capReason = 'Hỗ trợ đăng tự động qua API chính thức';
  } else if (pubCap === 'manual_only') {
    capScore = 70;
    capReason = 'Chỉ hỗ trợ đăng thủ công (Chuẩn cho Hội nhóm Facebook)';
  } else if (pubCap === 'unknown') {
    capScore = 35;
    capReason = 'Khả năng đăng bài chưa được kiểm chứng';
  } else if (pubCap === 'unsupported') {
    capScore = 10;
    capReason = 'Không hỗ trợ xuất bản nội dung';
  }

  // Calculate Weighted Total Score
  const weightedSum = (
    locScore * w.location +
    typeScore * w.propertyType +
    priceScore * w.price +
    audScore * w.audience +
    freshScore * w.freshness +
    capScore * w.capability
  );

  const totalScore = Math.min(100, Math.max(0, Math.round(weightedSum / totalWeight)));

  return {
    totalScore,
    weights: w,
    breakdown: {
      location: {
        score: locScore,
        weight: w.location,
        weightedContribution: Number(((locScore * w.location) / totalWeight).toFixed(1)),
        reason: locReason
      },
      propertyType: {
        score: typeScore,
        weight: w.propertyType,
        weightedContribution: Number(((typeScore * w.propertyType) / totalWeight).toFixed(1)),
        reason: typeReason
      },
      price: {
        score: priceScore,
        weight: w.price,
        weightedContribution: Number(((priceScore * w.price) / totalWeight).toFixed(1)),
        reason: priceReason
      },
      audience: {
        score: audScore,
        weight: w.audience,
        weightedContribution: Number(((audScore * w.audience) / totalWeight).toFixed(1)),
        reason: audReason
      },
      freshness: {
        score: freshScore,
        weight: w.freshness,
        weightedContribution: Number(((freshScore * w.freshness) / totalWeight).toFixed(1)),
        reason: freshReason
      },
      capability: {
        score: capScore,
        weight: w.capability,
        weightedContribution: Number(((capScore * w.capability) / totalWeight).toFixed(1)),
        reason: capReason
      }
    }
  };
}

module.exports = {
  calculateRelevance
};
