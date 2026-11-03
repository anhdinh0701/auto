const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'raw_data.csv'), 'utf8');

// Projects map
const projects = [
  { id: 1, name: 'Khai Sơn City', cdt: 'Công ty Cổ phần Khai Sơn', vitri: 'Ngọc Thụy, Long Biên, Hà Nội' },
  { id: 2, name: 'Toà Fantasy (Khai Sơn)', cdt: 'Khai Sơn', vitri: 'Khai Sơn City, Long Biên, Hà Nội' },
  { id: 3, name: 'Toà Tropical (Khai Sơn)', cdt: 'Khai Sơn', vitri: 'Khai Sơn City, Long Biên, Hà Nội' },
  { id: 4, name: 'Toà Zen Tower (Khai Sơn)', cdt: 'Khai Sơn', vitri: 'Khai Sơn City, Long Biên, Hà Nội' },
  { id: 5, name: 'Trinity Tower', cdt: 'Hợp tác xã Thành Công', vitri: '145 Mễ Trì, Nam Từ Liêm, Hà Nội' },
  { id: 6, name: 'Times City', cdt: 'Tập đoàn Vingroup', vitri: '458 Minh Khai, Hai Bà Trưng, Hà Nội' }
];

// Helper to parse CSV properly handling quotes and newlines
function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField);
      if (currentRow.some(f => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
}

const rows = parseCsv(content);
console.log('Total parsed rows:', rows.length);

const apartments = [];
let currentArea = null;
let currentMode = 'Bán'; // 'Bán' or 'Cho thuê'
let currentProjId = 1;

for (let i = 0; i < rows.length; i++) {
  const r = rows[i].map(c => (c || '').trim());
  const rowStr = r.join(' ');

  // Detect mode switch
  if (rowStr.includes('quỹ căn cho thuê') || rowStr.includes('Cập nhật quỹ căn cho thuê')) {
    currentMode = 'Cho thuê';
    currentProjId = 1;
  } else if (rowStr.includes('quỹ căn chuyển nhượng') || rowStr.includes('Cập nhật quỹ căn chuyển nhượng')) {
    currentMode = 'Bán';
  }

  // Detect project headers
  if (rowStr.includes('Toà Fan') || rowStr.includes('Toà Fantasy')) {
    currentProjId = 2;
  } else if (rowStr.includes('Tòa Trop') || rowStr.includes('Toà Tropical')) {
    currentProjId = 3;
  } else if (rowStr.includes('Toà Zen')) {
    currentProjId = 4;
  } else if (rowStr.includes('Trinity')) {
    currentProjId = 5;
    currentMode = 'Cho thuê';
  } else if (rowStr.includes('Time T') || rowStr.includes('Times City') || rowStr.includes('Time ')) {
    currentProjId = 6;
    currentMode = 'Cho thuê';
  }

  // Area headers
  const areaMatch = r[0].match(/^([0-9]+(\.[0-9]+)?)\s*m/i) || rowStr.match(/^([0-9]+(\.[0-9]+)?)\s*m/i);
  if (areaMatch) {
    currentArea = parseFloat(areaMatch[1]);
  }
  if (r[0].toLowerCase() === 'pent' || rowStr.toLowerCase().includes('penthouse') || rowStr.toLowerCase().includes('pent,')) {
    currentArea = 180;
  }
  if (r[0].toLowerCase() === 'gtm' || rowStr.toLowerCase().includes('gtm,')) {
    currentArea = 45;
  }

  // Extract apartment candidate
  // Usually col 1 is MaCan, or col 0 if formatted differently
  let rawCode = r[1] || r[0];
  let info = r[2] || '';
  let source = r[3] || '';
  let note = r[4] || '';

  // Check if line 1 or 2 contains code like K6 407, K5 707, ZB0410, F1514...
  const codeRegex = /\b([Kk][1-6][aA]?[\s\-\.]?[0-9]{3,4}[a-zA-Z]?|[Ff][0-9]{3,4}[a-zA-Z]?|[Tt][0-9]{3,4}[a-zA-Z]?|[Zz][AaBb][0-9]{3,4}[a-zA-Z]?|[Kk][1-6][\s\-]?[Gg][Tt][Mm][0-9]{2,3}|[Tt]own[\s\-]?[0-9\.]+|[Ll][Kk][\s\-]?[0-9\.]+)\b/i;
  
  let matchCode = rawCode.match(codeRegex) || (r[0] && r[0].match(codeRegex)) || (info && info.match(codeRegex));
  
  if (!matchCode) continue;

  const rawMatchedCode = matchCode[0].trim();
  const cleanCode = rawMatchedCode.toUpperCase().replace(/\s+/g, '-').replace(/\.+/g, '-');

  // Extract Area
  let area = currentArea || 77;
  const areaInInfo = (info + ' ' + note).match(/([0-9]+(\.[0-9]+)?)\s*(m2|m²|m\b)/i);
  if (areaInInfo) {
    area = parseFloat(areaInInfo[1]);
  }

  // Extract Price
  let giaBan = null;
  let giaThue = null;
  const fullText = (info + ' ' + note + ' ' + (r[5] || '')).toLowerCase();

  // Price for Sell
  if (currentMode === 'Bán') {
    // Search for patterns like "5ty800", "5.8 tỷ", "5700", "6 tỷ", "6ty", "6.5tỷ", "6tỷ700"
    const tyMatch = fullText.match(/([0-9]+)\s*t[yỷ]\s*([0-9]{1,3})?/i) || fullText.match(/([0-9]+[\.,][0-9]+)\s*t[yỷ]/i);
    const trieuTyMatch = fullText.match(/\b([2-9][0-9]{3})\b/); // e.g. 5700, 6300, 6900 (million = billions)
    
    if (tyMatch) {
      const mainPart = parseFloat(tyMatch[1].replace(',', '.'));
      const subPart = tyMatch[2] ? parseFloat('0.' + tyMatch[2]) : 0;
      giaBan = mainPart + subPart;
    } else if (trieuTyMatch) {
      const val = parseInt(trieuTyMatch[1]);
      if (val >= 2000 && val <= 30000) {
        giaBan = parseFloat((val / 1000).toFixed(3));
      }
    }
  }

  // Price for Rent
  if (currentMode === 'Cho thuê' || fullText.includes('cho thuê') || fullText.includes('giá thuê')) {
    const rentMatch = fullText.match(/([0-9]+([\.,][0-9]+)?)\s*(tr|triệu)/i) || fullText.match(/giá\s*([0-9]+([\.,][0-9]+)?)\s*tr/i);
    if (rentMatch) {
      giaThue = rentMatch[1].replace(',', '.') + ' triệu/tháng';
    }
    if (!giaBan && giaThue) {
      // it is a rental
    }
  }

  // Number of Bedrooms
  let bedrooms = 2;
  const pnMatch = fullText.match(/([1-5])\s*(pn|phòng ngủ|n\b|ngủ)/i);
  if (pnMatch) {
    bedrooms = parseInt(pnMatch[1]);
  } else if (area <= 50) {
    bedrooms = 1;
  } else if (area >= 95) {
    bedrooms = 3;
  } else if (area >= 140) {
    bedrooms = 4;
  }

  // Partition / Phan Khu
  let phanKhu = 'Tòa chuẩn';
  const pkMatch = cleanCode.match(/^(K[1-6]A?|F|T|ZA|ZB|GTM|TOWN|LK)/i);
  if (pkMatch) {
    phanKhu = pkMatch[1].toUpperCase();
  }

  // Interior / Noi That
  let interior = 'Cơ bản';
  if (fullText.includes('full') || fullText.includes('đầy đủ')) {
    interior = 'Full nội thất xịn';
  } else if (fullText.includes('nguyên bản') || fullText.includes('nb cđt') || fullText.includes('thô')) {
    interior = 'Nguyên bản CĐT';
  } else if (fullText.includes('liền tường') || fullText.includes('đồ liền tường')) {
    interior = 'Nội thất liền tường';
  }

  // Legal
  let legal = 'HĐMB';
  if (fullText.includes('sổ đỏ') || fullText.includes('sổ hồng') || fullText.includes('sẵn sổ') || fullText.includes('đã có sổ')) {
    legal = 'Sổ đỏ lâu dài (sẵn sàng công chứng)';
  }

  // Notes
  const fullNote = [
    source ? `Nguồn: ${source}` : '',
    note ? `Ghi chú: ${note.replace(/\r?\n/g, ' ')}` : ''
  ].filter(Boolean).join(' | ');

  apartments.push({
    MaCanHo: cleanCode,
    ma_du_an: currentProjId,
    PhapLy: legal,
    PhanKhu: phanKhu,
    SoPhongNgu: bedrooms,
    SoWC: bedrooms >= 3 ? 2 : 1,
    DienTich: area,
    LoaiGiaoDich: currentMode,
    GiaBan: giaBan,
    GiaThue: giaThue,
    TinhTrangBanGiao: interior,
    MoTa: (info || r[1] || '').replace(/\r?\n/g, ' ').replace(/"/g, ''),
    GhiChuNguon: fullNote,
    Contend: info || r[1] || ''
  });
}

console.log('Total extracted apartments:', apartments.length);

// Deduplicate by MaCanHo + LoaiGiaoDich
const uniqueMap = new Map();
for (const a of apartments) {
  const key = `${a.MaCanHo}_${a.LoaiGiaoDich}`;
  if (!uniqueMap.has(key)) {
    uniqueMap.set(key, a);
  }
}

const uniqueList = Array.from(uniqueMap.values());
console.log('Total unique apartments:', uniqueList.length);

fs.writeFileSync(path.join(__dirname, 'parsed_apartments.json'), JSON.stringify(uniqueList, null, 2), 'utf8');
console.log('Saved to parsed_apartments.json!');
