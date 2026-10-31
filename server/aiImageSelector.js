const path = require('path');
const fs = require('fs');

/**
 * AI-assisted photo quality evaluation, ranking, and channel-tailored selection
 */

// Heuristic categorization based on filename or metadata
function categorizePhoto(filename = '', originalname = '') {
  const name = (filename + ' ' + originalname).toLowerCase();

  if (name.includes('mat-tien') || name.includes('ngoai-that') || name.includes('facade') || name.includes('exterior') || name.includes('tong-the') || name.includes('phoi-canh')) {
    return { tag: 'facade', label: 'Mặt tiền / Phối cảnh', priority: 10 };
  }
  if (name.includes('phong-khach') || name.includes('living') || name.includes('khach')) {
    return { tag: 'living_room', label: 'Phòng khách', priority: 9 };
  }
  if (name.includes('phong-ngu') || name.includes('bedroom') || name.includes('ngu')) {
    return { tag: 'bedroom', label: 'Phòng ngủ', priority: 8 };
  }
  if (name.includes('bep') || name.includes('kitchen') || name.includes('an')) {
    return { tag: 'kitchen', label: 'Phòng bếp / Bàn ăn', priority: 7 };
  }
  if (name.includes('phong-tam') || name.includes('wc') || name.includes('bathroom') || name.includes('ve-sinh')) {
    return { tag: 'bathroom', label: 'Phòng tắm / Vệ sinh', priority: 6 };
  }
  if (name.includes('ban-do') || name.includes('mat-bang') || name.includes('floorplan') || name.includes('so-do') || name.includes('layout')) {
    return { tag: 'floor_plan', label: 'Mặt bằng / Sơ đồ', priority: 7 };
  }
  if (name.includes('tien-ich') || name.includes('ho-boi') || name.includes('pool') || name.includes('park') || name.includes('amenity') || name.includes('view') || name.includes('ban-cong')) {
    return { tag: 'amenities', label: 'Tiện ích / Tầm view', priority: 8 };
  }

  // Default fallback
  return { tag: 'general', label: 'Không gian chung', priority: 5 };
}

/**
 * Calculates a quality score for an image based on size, format, and dimension sanity
 */
function evaluatePhotoQuality(photo) {
  let score = 70; // baseline
  const warnings = [];

  const size = photo.size || 0;
  // Size criteria
  if (size < 40 * 1024) { // < 40KB
    score -= 30;
    warnings.push('Dung lượng quá nhỏ, ảnh có thể bị vỡ nét hoặc mờ.');
  } else if (size > 10 * 1024 * 1024) { // > 10MB
    score -= 15;
    warnings.push('Dung lượng trên 10MB, có thể tải chậm trên mạng xã hội.');
  } else if (size >= 150 * 1024 && size <= 4 * 1024 * 1024) {
    score += 15; // Optimal size range for web
  }

  // File extension check
  const ext = (photo.originalname || photo.filename || '').split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'webp'].includes(ext)) {
    score += 10;
  } else if (['png'].includes(ext)) {
    score += 8;
  } else if (['gif', 'bmp'].includes(ext)) {
    score -= 20;
    warnings.push('Định dạng ảnh không tối ưu cho tin đăng BĐS.');
  }

  // Cap score 0 - 100
  score = Math.max(10, Math.min(99, score));

  return {
    score,
    warnings,
    is_high_quality: score >= 75
  };
}

/**
 * Core AI Image Selector: analyzes a list of listing photos and recommends the optimal subset
 * tailored to a specific channel target format
 */
function analyzeAndSelectPhotos(photos = [], options = {}) {
  const { channel_type = 'facebook_feed', target_limit = 6 } = options;

  if (!photos || photos.length === 0) {
    return {
      total_input: 0,
      recommended_photos: [],
      rejected_photos: [],
      bundle_reason: 'Chưa có ảnh nào được tải lên cho tin đăng này.'
    };
  }

  // 1. Analyze each photo
  const analyzed = photos.map((photo, index) => {
    const category = categorizePhoto(photo.filename, photo.originalname);
    const quality = evaluatePhotoQuality(photo);

    // Composite rank score = quality score * 0.6 + category priority * 4
    const compositeRank = Math.round(quality.score * 0.6 + category.priority * 4);

    return {
      id: photo.id,
      url: photo.url,
      filename: photo.filename,
      originalname: photo.originalname,
      size: photo.size,
      category_tag: category.tag,
      category_label: category.label,
      quality_score: quality.score,
      composite_rank: compositeRank,
      is_high_quality: quality.is_high_quality,
      warnings: quality.warnings,
      original_index: index
    };
  });

  // 2. Sort by composite rank descending
  const sorted = [...analyzed].sort((a, b) => b.compositeRank - a.compositeRank);

  // 3. Selection strategy based on channel constraints
  let maxPhotos = target_limit;
  if (channel_type === 'facebook_feed' || channel_type === 'facebook_group') {
    maxPhotos = Math.min(6, Math.max(4, target_limit)); // 4 to 6 photos best for FB carousel/mosaic
  } else if (channel_type === 'portal') {
    maxPhotos = Math.min(15, Math.max(8, target_limit)); // Batdongsan / Chotot allow 8-15
  } else if (channel_type === 'banner' || channel_type === 'zalo') {
    maxPhotos = Math.min(3, target_limit);
  }

  // Ensure diversity: Prioritize facade first, then living room, bedroom, floorplan/amenities
  const selected = [];
  const selectedTags = new Set();

  // First pass: Pick highest ranked photo of each unique tag
  for (const item of sorted) {
    if (selected.length >= maxPhotos) break;
    if (!selectedTags.has(item.category_tag)) {
      selected.push(item);
      selectedTags.add(item.category_tag);
    }
  }

  // Second pass: Fill remaining slots with next best photos
  for (const item of sorted) {
    if (selected.length >= maxPhotos) break;
    if (!selected.some(s => s.id === item.id)) {
      selected.push(item);
    }
  }

  // Reorder selected: Always put 'facade' or highest quality hero photo as #1 cover photo
  selected.sort((a, b) => {
    if (a.category_tag === 'facade' && b.category_tag !== 'facade') return -1;
    if (b.category_tag === 'facade' && a.category_tag !== 'facade') return 1;
    return b.compositeRank - a.compositeRank;
  });

  const selectedIds = new Set(selected.map(s => s.id));
  const rejected = analyzed.filter(p => !selectedIds.has(p.id));

  return {
    total_input: photos.length,
    selected_count: selected.length,
    channel_type,
    recommended_photos: selected.map((p, idx) => ({
      ...p,
      suggested_order: idx + 1,
      role: idx === 0 ? 'Ảnh bìa / Hero Photo' : `Ảnh chi tiết ${idx + 1}`
    })),
    rejected_photos: rejected,
    bundle_reason: `Đã chọn lọc ${selected.length}/${photos.length} ảnh tối ưu theo định dạng ${channel_type} (Ưu tiên ảnh bìa mặt tiền, góc chụp phòng chính và sơ đồ thực tế).`
  };
}

module.exports = {
  categorizePhoto,
  evaluatePhotoQuality,
  analyzeAndSelectPhotos
};
