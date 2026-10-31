const db = require('./db');

/**
 * Normalizes text for accent-insensitive and case-insensitive matching
 */
function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates a listing's location data and checks for geographic contradictions
 * @param {Object} listing - The listing object to validate
 * @returns {Object} Validation outcome
 */
function validateListingLocation(listing) {
  const reasons = [];
  let status = 'VERIFIED';
  let matchedProject = null;

  const title = listing.title || '';
  const description = listing.description || '';
  const projectName = (listing.project_name || '').trim();
  const province = (listing.province || '').trim();
  const district = (listing.district || '').trim();
  const ward = (listing.ward || '').trim();
  const addressDetail = (listing.address_detail || '').trim();

  // Basic completeness checks
  if (!province) {
    reasons.push('Thiếu Tỉnh/Thành phố.');
    status = 'INVALID';
  }
  if (!district) {
    reasons.push('Thiếu Quận/Huyện.');
    if (status !== 'INVALID') status = 'WARNING';
  }

  // Fetch all reference projects from database
  const projects = db.prepare('SELECT * FROM location_reference_projects').all();
  const normTitle = normalizeText(title);
  const normDesc = normalizeText(description);
  const normProjectInput = normalizeText(projectName);
  const normProvince = normalizeText(province);
  const normDistrict = normalizeText(district);
  const normWard = normalizeText(ward);
  const normAddress = normalizeText(addressDetail);

  // Identify if any reference project is explicitly specified or referenced
  for (const proj of projects) {
    const projNormName = normalizeText(proj.project_name);
    let aliases = [];
    try {
      aliases = JSON.parse(proj.aliases || '[]');
    } catch (e) {
      aliases = [];
    }
    const normAliases = aliases.map(a => normalizeText(a));

    const isMatchInput = normProjectInput && (normProjectInput.includes(projNormName) || projNormName.includes(normProjectInput));
    const isMatchTitle = normTitle.includes(projNormName) || normAliases.some(a => normTitle.includes(a));
    const isMatchAddress = normAddress.includes(projNormName) || normAliases.some(a => normAddress.includes(a));

    if (isMatchInput || isMatchTitle || isMatchAddress) {
      matchedProject = proj;
      break;
    }
  }

  // If a known project was identified, run cross-check contradiction rules
  if (matchedProject) {
    const expectedNormProv = normalizeText(matchedProject.province);
    const expectedNormDist = normalizeText(matchedProject.district);

    // Contradiction Check 1: Province mismatch
    if (normProvince && !normProvince.includes(expectedNormProv) && !expectedNormProv.includes(normProvince)) {
      status = 'NEEDS_REVIEW';
      reasons.push(
        `Mâu thuẫn địa lý nghiêm trọng: Dự án "${matchedProject.project_name}" thuộc ${matchedProject.province}, nhưng địa chỉ khai báo lại ở tỉnh/thành "${province}".`
      );
    }

    // Contradiction Check 2: District mismatch
    if (status !== 'NEEDS_REVIEW' && normDistrict && !normDistrict.includes(expectedNormDist) && !expectedNormDist.includes(normDistrict)) {
      status = 'WARNING';
      reasons.push(
        `Cảnh báo quận/huyện: Dự án "${matchedProject.project_name}" thường thuộc ${matchedProject.district}, nhưng bạn đang chọn "${district}". Vui lòng kiểm tra lại.`
      );
    }
  }

  // Check 3: Missing address detail for verified status
  if (!addressDetail && status === 'VERIFIED') {
    status = 'WARNING';
    reasons.push('Chưa có số nhà / tên đường chi tiết. Khuyến khích bổ sung để tăng độ tin cậy.');
  }

  // If unverified without fatal issues
  if (reasons.length === 0) {
    status = 'VERIFIED';
    reasons.push('Địa chỉ hợp lệ và khớp với cấu trúc hành chính tiêu chuẩn.');
  }

  const isPublishable = status === 'VERIFIED' || status === 'WARNING';

  return {
    status,
    is_publishable: isPublishable,
    reasons,
    matched_project: matchedProject ? {
      id: matchedProject.id,
      project_name: matchedProject.project_name,
      province: matchedProject.province,
      district: matchedProject.district,
      ward: matchedProject.ward
    } : null,
    checked_at: new Date().toISOString()
  };
}

/**
 * Geographic pre-publishing gatekeeper: checks if a listing's location matches the channel's target location
 * @param {Object} listing
 * @param {Object} channel
 * @returns {Object} { matched: boolean, reason: string, severity: 'ok'|'warning'|'block' }
 */
function checkChannelLocationMatch(listing, channel) {
  // If channel is nationwide or has no location restriction
  if (!channel.province && !channel.district) {
    return {
      matched: true,
      severity: 'ok',
      reason: 'Kênh đăng tin toàn quốc, không giới hạn vị trí địa lý.'
    };
  }

  const normListingProv = normalizeText(listing.province || '');
  const normChannelProv = normalizeText(channel.province || '');
  const normListingDist = normalizeText(listing.district || '');
  const normChannelDist = normalizeText(channel.district || '');

  // Check province compatibility
  if (channel.province && normChannelProv) {
    if (!normListingProv.includes(normChannelProv) && !normChannelProv.includes(normListingProv)) {
      return {
        matched: false,
        severity: 'block',
        reason: `Mâu thuẫn khu vực: Kênh "${channel.name}" chỉ dành cho khu vực ${channel.province}, trong khi BĐS thuộc ${listing.province || 'chưa rõ'}. Tự động chặn đăng chéo tỉnh.`
      };
    }
  }

  // Check district compatibility if specified
  if (channel.district && normChannelDist) {
    if (!normListingDist.includes(normChannelDist) && !normChannelDist.includes(normListingDist)) {
      return {
        matched: false,
        severity: 'warning',
        reason: `Kênh "${channel.name}" tập trung tại ${channel.district}, nhưng BĐS thuộc ${listing.district}. Có thể giảm tương tác người xem.`
      };
    }
  }

  return {
    matched: true,
    severity: 'ok',
    reason: 'Khu vực BĐS hoàn toàn khớp với phạm vi mục tiêu của kênh.'
  };
}

module.exports = {
  validateListingLocation,
  checkChannelLocationMatch,
  normalizeText
};
