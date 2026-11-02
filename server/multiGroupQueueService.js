const Groq = require('groq-sdk');
const db = require('./db');
const chromePublishService = require('./chromePublishService');

class MultiGroupQueueService {
  constructor() {
    this.activeBatchId = null;
    this.isProcessing = false;
    this.countdownTimer = null;
    this.remainingDelaySeconds = 0;
  }

  /**
   * Khởi tạo Groq Client an toàn từ ENV hoặc db
   */
  getGroqClient() {
    const apiKey = process.env.GROQ_API_KEY || db.prepare("SELECT api_key FROM ai_settings WHERE id = 'default'").get()?.api_key;
    if (!apiKey) return null;
    try {
      return new Groq({ apiKey });
    } catch (_) {
      return null;
    }
  }

  /**
   * Tự động biến tấu nhẹ nhàng nội dung bài viết bằng Groq AI (Auto Micro-Spin)
   * Đảo câu chào mở đầu và hoán đổi vài icon, nhưng bảo toàn 100% diện tích, giá, số điện thoại
   */
  async spinContentWithGroq(originalContent, groupIndex = 1) {
    if (!originalContent || !originalContent.trim()) return originalContent;

    const groq = this.getGroqClient();
    if (!groq) {
      console.log('[GroqSpin] Chưa có GROQ_API_KEY, sử dụng nội dung gốc.');
      return originalContent;
    }

    const modelsToTry = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];

    for (const model of modelsToTry) {
      try {
        console.log(`[GroqSpin] Đang gọi Groq AI (${model}) để biến tấu bài đăng cho nhóm #${groupIndex}...`);
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: `Bạn là trợ lý AI chuyên gia Bất Động Sản. Nhiệm vụ của bạn là viết lại nhẹ nhàng (Micro-Spin) bài đăng sau đây để tạo ra một biến thể tự nhiên khác biệt khi đăng lên nhiều nhóm Facebook:
1. BIẾN TẤU LINH HOẠT:
- Thay đổi câu chào mở đầu theo phong cách thân thiện, tự nhiên (Ví dụ: "Chào quý cư dân", "Gửi anh/chị đang tìm nhà", "Cơ hội tốt cho gia đình mình", "Bác nào đang có nhu cầu xem căn đẹp", "Em gửi anh chị thông tin căn hộ vừa hoàn thiện"...).
- Hoán đổi hoặc thêm bớt một vài emoji BĐS tinh tế (🏢, 🏡, 🌿, ✨, 📞, 🔑, 🌟, 🛋️...).
- Giữ giọng văn chuyên nghiệp, ngắn gọn, cuốn hút.
2. BẢO TOÀN DỮ LIỆU CỐT LÕI (TUYỆT ĐỐI 100% KHÔNG THAY ĐỔI):
- Giữ nguyên 100% diện tích (m²), số phòng ngủ, số WC, khoảng giá / giá thuê / giá bán, tên dự án, số điện thoại liên hệ, Zalo.
- Giữ nguyên các hashtag cuối bài nếu có.
3. QUY TẮC ĐẦU RA:
- CHỈ TRẢ VỀ DUY NHẤT TOÀN VĂN BẢN ĐÃ VIẾT LẠI, KHÔNG THÊM LỜI DẪN, KHÔNG ĐẶT TRONG DẤU NGOẶC KÉP.`
            },
            {
              role: 'user',
              content: `Hãy biến tấu bài viết sau:\n\n${originalContent}`
            }
          ],
          temperature: 0.65,
          max_tokens: 1024
        });

        const spun = completion.choices[0]?.message?.content?.trim();
        if (spun && spun.length > 20) {
          console.log(`[GroqSpin] Biến tấu thành công bằng mô hình ${model} cho nhóm #${groupIndex}!`);
          return spun;
        }
      } catch (err) {
        console.warn(`[GroqSpin] Model ${model} không khả dụng (${err.message}), thử phương án tiếp theo...`);
      }
    }

    return originalContent;
  }

  /**
   * Tạo một hàng đợi đăng bài mới cho danh sách nhóm không giới hạn
   */
  createBatch({ groupUrls, content, images = [], delayMin = 90, delayMax = 180, autoSpin = true, scheduledTime = null }) {
    // 1. Phân tách danh sách URL nhóm từ mảng hoặc từ textarea (mỗi dòng 1 link)
    let rawList = [];
    if (Array.isArray(groupUrls)) {
      rawList = groupUrls;
    } else if (typeof groupUrls === 'string') {
      rawList = groupUrls.split(/[\r\n,;]+/);
    }

    const cleanUrls = Array.from(new Set(
      rawList
        .map(u => u.trim())
        .filter(u => u && u.includes('facebook.com'))
    ));

    if (cleanUrls.length === 0) {
      throw new Error('Vui lòng nhập ít nhất 1 đường dẫn Nhóm Facebook hợp lệ (chứa facebook.com).');
    }
    if (!content || !content.trim()) {
      throw new Error('Nội dung bài viết không được để trống.');
    }

    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const minDelay = Math.max(10, parseInt(delayMin) || 90);
    const maxDelay = Math.max(minDelay, parseInt(delayMax) || 180);
    const isAutoSpin = autoSpin ? 1 : 0;
    const initialStatus = scheduledTime && new Date(scheduledTime) > new Date() ? 'scheduled' : 'pending';

    // 2. Lưu vào bảng publishing_batches
    db.prepare(`
      INSERT INTO publishing_batches (
        id, total_groups, completed_groups, failed_groups, status,
        delay_min, delay_max, auto_spin, current_index, current_group_url,
        current_step, created_at, updated_at
      ) VALUES (?, ?, 0, 0, ?, ?, ?, ?, 0, '', 'Sẵn sàng khởi động...', ?, ?)
    `).run(batchId, cleanUrls.length, initialStatus, minDelay, maxDelay, isAutoSpin, nowIso, nowIso);

    // 3. Lưu từng nhóm vào publishing_batch_items
    const insertItem = db.prepare(`
      INSERT INTO publishing_batch_items (
        id, batch_id, group_url, group_name, content, images, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `);

    const imageJson = JSON.stringify(images || []);
    cleanUrls.forEach((url, index) => {
      const itemId = `item-${batchId}-${index + 1}`;
      // Trích xuất tên nhóm ngắn từ URL để tiện hiển thị
      const matchName = url.match(/groups\/([^/?]+)/);
      const shortName = matchName ? `Nhóm ${matchName[1]}` : `Nhóm #${index + 1}`;
      insertItem.run(itemId, batchId, url, shortName, content.trim(), imageJson, nowIso);
    });

    console.log(`[MultiGroupQueue] Đã tạo hàng đợi ${batchId} với ${cleanUrls.length} nhóm Facebook!`);

    // 4. Nếu không hẹn giờ trong tương lai, kích hoạt tiến trình đăng ngầm ngay lập tức
    if (initialStatus === 'pending') {
      setTimeout(() => this.processBatch(batchId), 500);
    }

    return {
      success: true,
      batchId,
      totalGroups: cleanUrls.length,
      initialStatus,
      delayMin: minDelay,
      delayMax: maxDelay,
      message: `Đã đưa ${cleanUrls.length} nhóm vào hàng đợi đăng bài tự động (Giãn cách an toàn ${minDelay}s - ${maxDelay}s)!`
    };
  }

  /**
   * Tiến trình xử lý hàng đợi tuần tự trong nền (Background Worker)
   */
  async processBatch(batchId) {
    if (this.isProcessing) {
      console.log(`[MultiGroupQueue] Một tác vụ khác đang chạy, batch ${batchId} sẽ chờ lượt.`);
      return;
    }

    this.isProcessing = true;
    this.activeBatchId = batchId;

    try {
      const batch = db.prepare('SELECT * FROM publishing_batches WHERE id = ?').get(batchId);
      if (!batch) return;

      db.prepare(`UPDATE publishing_batches SET status = 'running', updated_at = ? WHERE id = ?`)
        .run(new Date().toISOString(), batchId);

      const items = db.prepare(`SELECT * FROM publishing_batch_items WHERE batch_id = ? ORDER BY rowid ASC`).all(batchId);
      console.log(`[MultiGroupQueue] >>> BẮT ĐẦU CHẠY HÀNG ĐỢI: ${batchId} (${items.length} nhóm) <<<`);

      for (let i = 0; i < items.length; i++) {
        // Kiểm tra xem người dùng có yêu cầu dừng (stop) hoặc tạm dừng không
        const currentBatch = db.prepare('SELECT status FROM publishing_batches WHERE id = ?').get(batchId);
        if (!currentBatch || currentBatch.status === 'stopped') {
          console.log(`[MultiGroupQueue] Hàng đợi ${batchId} đã được dừng bởi người dùng.`);
          break;
        }

        const item = items[i];
        if (item.status === 'success') continue; // Đã đăng thành công trước đó

        const stepMsg = `Đang đăng bài vào nhóm ${i + 1}/${items.length}: ${item.group_url}`;
        console.log(`\n------------------------------------------------------`);
        console.log(`[MultiGroupQueue] Tiến độ: ${i + 1}/${items.length} | ${item.group_url}`);
        console.log(`------------------------------------------------------`);

        db.prepare(`
          UPDATE publishing_batches SET 
            current_index = ?, 
            current_group_url = ?, 
            current_step = ?,
            updated_at = ?
          WHERE id = ?
        `).run(i + 1, item.group_url, stepMsg, new Date().toISOString(), batchId);

        db.prepare(`UPDATE publishing_batch_items SET status = 'posting', started_at = ? WHERE id = ?`)
          .run(new Date().toISOString(), item.id);

        let finalContent = item.content;
        if (batch.auto_spin) {
          finalContent = await this.spinContentWithGroq(item.content, i + 1);
        }

        db.prepare(`UPDATE publishing_batch_items SET spun_content = ? WHERE id = ?`).run(finalContent, item.id);

        let postImages = [];
        try {
          postImages = JSON.parse(item.images || '[]');
        } catch (_) {}

        // ĐĂNG BÀI BẰNG QUY TRÌNH "ẢNH TRƯỚC - CHỮ SAU"
        let postSuccess = false;
        let postError = null;

        try {
          const result = await chromePublishService.publishToGroup({
            groupUrl: item.group_url,
            content: finalContent,
            images: postImages
          });

          postSuccess = true;
          db.prepare(`
            UPDATE publishing_batch_items SET 
              status = 'success', 
              published_url = ?, 
              error_message = NULL, 
              completed_at = ? 
            WHERE id = ?
          `).run(result.groupUrl || item.group_url, new Date().toISOString(), item.id);

          db.prepare(`
            UPDATE publishing_batches SET 
              completed_groups = completed_groups + 1,
              updated_at = ?
            WHERE id = ?
          `).run(new Date().toISOString(), batchId);

          console.log(`[MultiGroupQueue] Nhóm ${i + 1}/${items.length} ĐĂNG THÀNH CÔNG!`);
        } catch (err) {
          postError = err.message;
          console.error(`[MultiGroupQueue] Nhóm ${i + 1}/${items.length} ĐĂNG THẤT BẠI:`, err.message);

          db.prepare(`
            UPDATE publishing_batch_items SET 
              status = 'failed', 
              error_message = ?, 
              completed_at = ? 
            WHERE id = ?
          `).run(postError, new Date().toISOString(), item.id);

          db.prepare(`
            UPDATE publishing_batches SET 
              failed_groups = failed_groups + 1,
              updated_at = ?
            WHERE id = ?
          `).run(new Date().toISOString(), batchId);
        }

        // NẾU CHƯA PHẢI NHÓM CUỐI: THỰC HIỆN GIÃN CÁCH THÔNG MINH (SMART DELAY) CHỐNG KHÓA NICK
        const isLastGroup = i === items.length - 1;
        const checkStatus = db.prepare('SELECT status FROM publishing_batches WHERE id = ?').get(batchId);

        if (!isLastGroup && checkStatus?.status !== 'stopped') {
          const delaySec = Math.floor(Math.random() * (batch.delay_max - batch.delay_min + 1)) + batch.delay_min;
          db.prepare(`UPDATE publishing_batch_items SET delay_seconds = ? WHERE id = ?`).run(delaySec, item.id);

          console.log(`[MultiGroupQueue] Giãn cách thông minh: Nghỉ ngẫu nhiên ${delaySec} giây trước nhóm tiếp theo...`);

          // Đếm ngược từng giây để Frontend hiển thị thanh tiến trình trực tiếp
          for (let sec = delaySec; sec > 0; sec--) {
            this.remainingDelaySeconds = sec;
            const updatedBatch = db.prepare('SELECT status FROM publishing_batches WHERE id = ?').get(batchId);
            if (updatedBatch?.status === 'stopped') break;

            const delayText = `Đang nghỉ giãn cách an toàn chống khóa nick: còn ${sec} giây trước nhóm tiếp theo...`;
            db.prepare(`UPDATE publishing_batches SET current_step = ?, updated_at = ? WHERE id = ?`)
              .run(delayText, new Date().toISOString(), batchId);

            await new Promise(r => setTimeout(r, 1000));
          }
          this.remainingDelaySeconds = 0;
        }
      }

      // Hoàn tất toàn bộ hàng đợi
      const finalCheck = db.prepare('SELECT * FROM publishing_batches WHERE id = ?').get(batchId);
      const finalStatus = finalCheck.status === 'stopped' ? 'stopped' : 'completed';
      const finishMsg = finalStatus === 'stopped' 
        ? `Đã dừng hàng đợi. Đã đăng: ${finalCheck.completed_groups}/${finalCheck.total_groups} nhóm.`
        : `Đã hoàn tất đăng toàn bộ ${finalCheck.total_groups} nhóm (Thành công: ${finalCheck.completed_groups}, Lỗi: ${finalCheck.failed_groups})!`;

      db.prepare(`
        UPDATE publishing_batches SET 
          status = ?, 
          current_step = ?, 
          updated_at = ? 
        WHERE id = ?
      `).run(finalStatus, finishMsg, new Date().toISOString(), batchId);

      console.log(`\n======================================================`);
      console.log(`[MultiGroupQueue] HOÀN TẤT HÀNG ĐỢI: ${batchId}`);
      console.log(`[MultiGroupQueue] ${finishMsg}`);
      console.log(`======================================================\n`);

    } catch (batchErr) {
      console.error('[MultiGroupQueue Fatal Error]', batchErr);
      db.prepare(`UPDATE publishing_batches SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`)
        .run(batchErr.message, new Date().toISOString(), batchId);
    } finally {
      this.isProcessing = false;
      this.activeBatchId = null;
    }
  }

  /**
   * Lấy thông tin chi tiết tiến trình hàng đợi đang chạy hoặc gần nhất
   */
  getActiveQueue() {
    const batch = db.prepare(`
      SELECT * FROM publishing_batches 
      ORDER BY rowid DESC 
      LIMIT 1
    `).get();

    if (!batch) {
      return { hasActiveQueue: false, batch: null, items: [] };
    }

    const items = db.prepare(`
      SELECT * FROM publishing_batch_items 
      WHERE batch_id = ? 
      ORDER BY rowid ASC
    `).all(batch.id);

    return {
      hasActiveQueue: batch.status === 'running' || batch.status === 'pending',
      batch: {
        ...batch,
        remainingDelaySeconds: this.remainingDelaySeconds
      },
      items
    };
  }

  /**
   * Lấy chi tiết một Batch theo ID
   */
  getBatchDetails(batchId) {
    const batch = db.prepare('SELECT * FROM publishing_batches WHERE id = ?').get(batchId);
    if (!batch) return null;

    const items = db.prepare('SELECT * FROM publishing_batch_items WHERE batch_id = ? ORDER BY rowid ASC').all(batchId);
    return {
      batch: {
        ...batch,
        remainingDelaySeconds: this.activeBatchId === batchId ? this.remainingDelaySeconds : 0
      },
      items
    };
  }

  /**
   * Dừng khẩn cấp hàng đợi
   */
  stopBatch(batchId) {
    db.prepare(`
      UPDATE publishing_batches SET 
        status = 'stopped', 
        current_step = 'Đã dừng khẩn cấp bởi người dùng',
        updated_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), batchId);

    if (this.activeBatchId === batchId) {
      this.activeBatchId = null;
      this.isProcessing = false;
    }

    return { success: true, message: 'Đã gửi lệnh dừng hàng đợi!' };
  }
}

module.exports = new MultiGroupQueueService();
