const path = require('path');
const fs = require('fs');

const uploadsDir = path.resolve(__dirname, '../uploads');

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Get absolute path on disk (path.resolve) for an image/media file.
 * Handles:
 * - full URLs like http://localhost:3001/uploads/...
 * - relative paths like /uploads/filename.png or uploads/filename.png
 * - bare filenames like filename.png or original filenames (matching timestamped prefixes)
 * - MediaAsset objects with file_path or url or filename
 */
function getAbsoluteMediaPath(mediaInput) {
  if (!mediaInput) return null;

  let filename = typeof mediaInput === 'object'
    ? (mediaInput.file_path || mediaInput.filename || mediaInput.url || '')
    : String(mediaInput);

  if (!filename) return null;

  // 1. If it's already an existing absolute path on the disk
  if (path.isAbsolute(filename) && fs.existsSync(filename) && fs.statSync(filename).isFile()) {
    return path.resolve(filename);
  }

  // Strip host/protocol
  filename = filename.replace(/^https?:\/\/[^\/]+/, '');
  // Strip leading /uploads/ or uploads/
  filename = filename.replace(/^\/?uploads\//i, '');
  filename = decodeURIComponent(filename).trim();

  // 2. Direct match inside uploadsDir
  const candidate1 = path.resolve(uploadsDir, filename);
  if (fs.existsSync(candidate1) && fs.statSync(candidate1).isFile()) {
    return candidate1;
  }

  // 3. Search in uploadsDir for matching base name or suffix (resolving timestamp prefixes)
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const base = path.basename(filename);
    const lowerBase = base.toLowerCase();

    // Exact match ignoring case
    const exact = files.find(f => f.toLowerCase() === lowerBase);
    if (exact) return path.resolve(uploadsDir, exact);

    // Strip any timestamp prefix (e.g., 1793263734174-843872878-)
    const cleanSearch = lowerBase.replace(/^[0-9]+-[0-9]+-/, '');

    // Suffix or substring match
    const match = files.find(f => {
      const fLower = f.toLowerCase();
      const fClean = fLower.replace(/^[0-9]+-[0-9]+-/, '');
      return fClean === cleanSearch || fLower.endsWith(cleanSearch) || fLower.includes(cleanSearch);
    });

    if (match) return path.resolve(uploadsDir, match);
  }

  // Default fallback resolved against uploadsDir
  return path.resolve(uploadsDir, filename);
}

module.exports = {
  uploadsDir,
  getAbsoluteMediaPath
};
