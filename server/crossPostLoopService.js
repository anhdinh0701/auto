const path = require('path');
const fs = require('fs');
const Groq = require('groq-sdk');
const db = require('./db');
const { getBrowserSession } = require('./chromePublishService');

class CrossPostLoopService {
  constructor() {
    this.activeBatchId = null;
    this.isProcessing = false;
    this.remainingDelaySeconds = 0;
    this.logsDir = path.resolve(__dirname, '../logs/crosspost');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
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
   * Từ lượt thứ 2 trở đi, đảo nhẹ câu chào mở đầu và hoán đổi vài icon, nhưng bảo toàn 100% diện tích, giá, số điện thoại
   */
  async spinContentWithGroq(originalContent, batchIndex = 1) {
    if (!originalContent || !originalContent.trim() || batchIndex <= 1) {
      return originalContent;
    }

    const groq = this.getGroqClient();
    if (!groq) {
      console.log(`[CrossPostLoop] Chưa có GROQ_API_KEY, sử dụng nội dung gốc cho đợt #${batchIndex}.`);
      return originalContent;
    }

    const modelsToTry = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];

    for (const model of modelsToTry) {
      try {
        console.log(`[CrossPostLoop] Đang gọi Groq AI (${model}) biến tấu bài đăng cho đợt #${batchIndex}...`);
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
          console.log(`[CrossPostLoop] Biến tấu thành công bằng mô hình ${model} cho đợt #${batchIndex}!`);
          return spun;
        }
      } catch (err) {
        console.warn(`[CrossPostLoop] Model ${model} gặp sự cố (${err.message}), thử phương án dự phòng...`);
      }
    }

    return originalContent;
  }

  /**
   * Chuyển đổi tên ảnh sang đường dẫn tuyệt đối
   */
  resolveAbsoluteImagePaths(images) {
    if (!images) return [];
    const uploadsDir = path.resolve(__dirname, '../uploads');
    const list = Array.isArray(images) ? images : [images];
    const absolutePaths = [];

    for (const item of list) {
      if (!item) continue;
      let targetPath = null;
      if (typeof item === 'string') {
        if (path.isAbsolute(item)) {
          targetPath = item;
        } else {
          const cleanFilename = item.replace(/^\/?uploads[\/\\]/, '');
          targetPath = path.resolve(uploadsDir, cleanFilename);
        }
      } else if (item.path) {
        targetPath = item.path;
      } else if (item.filename) {
        targetPath = path.resolve(uploadsDir, item.filename);
      }

      if (targetPath && fs.existsSync(targetPath) && !absolutePaths.includes(targetPath)) {
        absolutePaths.push(targetPath);
      }
    }
    return absolutePaths;
  }

  /**
   * Bắt đầu vòng lặp vét cạn nhóm theo từ khóa bằng tính năng "+ Thêm nhóm"
   */
  createLoop({
    rootGroupUrl = 'https://www.facebook.com/groups/1857977624574831',
    keyword = 'Khai Sơn',
    content,
    images = [],
    delayMin = 90,
    delayMax = 180,
    autoSpin = true,
    maxPerBatch = 8
  }) {
    if (!content || !content.trim()) {
      throw new Error('Nội dung bài viết không được để trống.');
    }
    if (!rootGroupUrl || !rootGroupUrl.includes('facebook.com')) {
      throw new Error('Cần ít nhất 1 link nhóm Facebook gốc hợp lệ để mở khung tạo bài viết.');
    }

    const batchId = `crosspost-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();
    const minDelay = Math.max(15, parseInt(delayMin) || 90);
    const maxDelay = Math.max(minDelay, parseInt(delayMax) || 180);

    db.prepare(`
      INSERT INTO crosspost_batches (
        id, root_group_url, keyword, content, images, status,
        current_batch_index, total_posted_groups, posted_group_names, batch_history,
        delay_min, delay_max, auto_spin, current_step, retry_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', 0, 0, '[]', '[]', ?, ?, ?, 'Khởi tạo vòng lặp vét cạn...', 0, ?, ?)
    `).run(
      batchId,
      rootGroupUrl.trim(),
      keyword ? keyword.trim() : '',
      content.trim(),
      JSON.stringify(images || []),
      minDelay,
      maxDelay,
      autoSpin ? 1 : 0,
      nowIso,
      nowIso
    );

    console.log(`[CrossPostLoop] Đã tạo phiên vét cạn ${batchId} (Từ khóa: "${keyword || 'Tất cả'}", Gốc: ${rootGroupUrl})`);

    // Khởi động vòng lặp ngầm
    setTimeout(() => this.processLoop(batchId, maxPerBatch), 500);

    return {
      success: true,
      batchId,
      rootGroupUrl,
      keyword: keyword || 'Tất cả nhóm',
      delayMin: minDelay,
      delayMax: maxDelay,
      message: `Đã kích hoạt Chế độ A: Vòng lặp vét cạn nhóm theo từ khóa "${keyword || 'Tất cả'}"!`
    };
  }

  /**
   * Xử lý vòng lặp vét cạn tuần tự từng đợt 8-10 nhóm
   */
  async processLoop(batchId, maxPerBatch = 8) {
    if (this.isProcessing) {
      console.log(`[CrossPostLoop] Một tác vụ khác đang chạy, batch ${batchId} sẽ chờ lượt.`);
      return;
    }

    this.isProcessing = true;
    this.activeBatchId = batchId;

    const postedGroups = new Set();
    let hasMoreGroups = true;
    let batchIndex = 0;
    let consecutiveRetries = 0;

    try {
      const initialRecord = db.prepare('SELECT * FROM crosspost_batches WHERE id = ?').get(batchId);
      if (!initialRecord) return;

      db.prepare(`UPDATE crosspost_batches SET status = 'running', updated_at = ? WHERE id = ?`)
        .run(new Date().toISOString(), batchId);

      const rootUrl = initialRecord.root_group_url;
      const filterKeyword = (initialRecord.keyword || '').trim();
      const baseContent = initialRecord.content;
      let rawImages = [];
      try { rawImages = JSON.parse(initialRecord.images || '[]'); } catch (_) {}
      const imagePaths = this.resolveAbsoluteImagePaths(rawImages);

      console.log(`\n======================================================`);
      console.log(`[CrossPostLoop] >>> BẮT ĐẦU VÒNG LẶP VÉT CẠN: ${batchId} <<<`);
      console.log(`[CrossPostLoop] Nhóm gốc: ${rootUrl}`);
      console.log(`[CrossPostLoop] Từ khóa lọc nhóm: "${filterKeyword || 'TẤT CẢ'}"`);
      console.log(`[CrossPostLoop] Số ảnh đính kèm: ${imagePaths.length}`);
      console.log(`======================================================`);

      while (hasMoreGroups) {
        // Kiểm tra lệnh dừng từ người dùng
        const currentBatch = db.prepare('SELECT status FROM crosspost_batches WHERE id = ?').get(batchId);
        if (!currentBatch || currentBatch.status === 'stopped') {
          console.log(`[CrossPostLoop] Vòng lặp ${batchId} đã được dừng bởi người dùng.`);
          break;
        }

        batchIndex++;
        const currentStepDesc = `Đợt #${batchIndex}: Đang chuẩn bị bài viết và mở danh sách nhóm...`;
        db.prepare(`
          UPDATE crosspost_batches SET 
            current_batch_index = ?, 
            current_step = ?, 
            updated_at = ? 
          WHERE id = ?
        `).run(batchIndex, currentStepDesc, new Date().toISOString(), batchId);

        console.log(`\n------------------------------------------------------`);
        console.log(`[CrossPostLoop] >>> BẮT ĐẦU ĐỢT #${batchIndex} <<<`);
        console.log(`------------------------------------------------------`);

        let batchSuccess = false;
        let selectedInThisBatch = [];
        let batchScreenshotUrl = null;

        try {
          // BƯỚC 1: Kết nối Chrome và điều hướng vào nhóm gốc
          const { context } = await getBrowserSession();
          const page = await context.newPage();

          try {
            await page.bringToFront();

            // Đóng sạch các cửa sổ chat Messenger nổi
            await page.evaluate(() => {
              document.querySelectorAll(
                'div[aria-label="Đóng cuộc trò chuyện"], div[aria-label="Close chat"], div[aria-label="Đóng tab trò chuyện"], div[aria-label="Thu nhỏ tab cuộc trò chuyện"], div[aria-label="Thu nhỏ cuộc trò chuyện"]'
              ).forEach(b => b.click());
            }).catch(() => {});

            console.log(`[CrossPostLoop] Đợt #${batchIndex} - Bước 1: Điều hướng tới ${rootUrl}...`);
            await page.goto(rootUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(4000);

            // Đóng chat lần 2
            await page.evaluate(() => {
              document.querySelectorAll(
                'div[aria-label="Đóng cuộc trò chuyện"], div[aria-label="Close chat"], div[aria-label="Đóng tab trò chuyện"], div[aria-label="Thu nhỏ tab cuộc trò chuyện"], div[aria-label="Thu nhỏ cuộc trò chuyện"]'
              ).forEach(b => b.click());
            }).catch(() => {});

            // BƯỚC 2: Mở hộp thoại tạo bài viết
            console.log(`[CrossPostLoop] Đợt #${batchIndex} - Bước 2: Mở ô tạo bài viết...`);
            const trigger = page.locator([
              'div[role="main"] div[role="button"]:has-text("Bạn viết gì đi")',
              'div[role="main"] div[role="button"]:has-text("Write something")',
              'div[role="main"] div[role="button"]:has-text("Bạn muốn đăng gì hôm nay")',
              'div[role="main"] div[role="button"]:has-text("Tạo bài viết")',
              'div[role="main"] span:has-text("Bạn viết gì đi")',
              'div[role="feed"] div[role="button"]:has-text("Bạn viết gì đi")',
              'div[role="button"]:has-text("Bạn viết gì đi")'
            ].join(', ')).first();

            await trigger.waitFor({ state: 'visible', timeout: 15000 });
            await trigger.scrollIntoViewIfNeeded();
            await trigger.click({ force: true });
            await page.waitForTimeout(2000);

            // Xác định chính xác dialog tạo bài (có nút Đăng hoặc Post)
            const dialog = page.locator('div[role="dialog"]').filter({
              has: page.locator('div[aria-label="Đăng"], div[aria-label="Post"], div[role="button"]:has-text("Đăng"), div[role="button"]:has-text("Post")')
            }).first();
            await dialog.waitFor({ state: 'visible', timeout: 15000 });
            await page.waitForTimeout(1500);

            // BƯỚC 3: UP ẢNH TRƯỚC - CHỐNG TÁCH RỜI ẢNH & CHỮ
            if (imagePaths.length > 0) {
              console.log(`[CrossPostLoop] Đợt #${batchIndex} - Bước 3: Tải ${imagePaths.length} ảnh lên trước...`);
              let fileInput = dialog.locator('input[type="file"]').first();
              if (await fileInput.count() === 0) {
                const photoBtn = dialog.locator('div[aria-label*="Ảnh"], div[aria-label*="Photo"], div[role="button"]:has-text("Ảnh/video")').first();
                if (await photoBtn.count() > 0) {
                  await photoBtn.click({ force: true });
                  await page.waitForTimeout(1500);
                }
                fileInput = dialog.locator('input[type="file"]').first();
                if (await fileInput.count() === 0) {
                  fileInput = page.locator('input[type="file"]').first();
                }
              }

              if (await fileInput.count() > 0) {
                await fileInput.setInputFiles(imagePaths);
                console.log(`[CrossPostLoop] Đã nạp ảnh, chờ 8-10 giây cho Facebook tải xong...`);
                await page.waitForTimeout(8000);
              }
            }

            // BƯỚC 4: NHẬP CONTENT SAU (Gọi Groq micro-spin từ đợt 2)
            console.log(`[CrossPostLoop] Đợt #${batchIndex} - Bước 4: Nhập nội dung bài viết...`);
            let currentContent = baseContent;
            if (initialRecord.auto_spin && batchIndex > 1) {
              currentContent = await this.spinContentWithGroq(baseContent, batchIndex);
            }

            const textBox = dialog.locator([
              'div[role="textbox"][contenteditable="true"]',
              'div[contenteditable="true"][role="textbox"]',
              '[contenteditable="true"]'
            ].join(', ')).first();

            await textBox.waitFor({ state: 'visible', timeout: 10000 });
            await textBox.click({ force: true });
            await page.waitForTimeout(500);

            console.log(`[CrossPostLoop] Đang gõ văn bản...`);
            await page.keyboard.type(currentContent, { delay: 25 });
            await page.waitForTimeout(1000);

            const typedText = await textBox.innerText().catch(() => '');
            if (!typedText || typedText.trim().length === 0) {
              await textBox.click({ force: true });
              await page.keyboard.insertText(currentContent);
              await page.waitForTimeout(1000);
            }

            // BƯỚC 5: BẤM NÚT "+ THÊM NHÓM" / "ĐĂNG Ở NHIỀU NƠI"
            console.log(`[CrossPostLoop] Đợt #${batchIndex} - Bước 5: Bấm nút "+ Thêm nhóm"...`);
            const addGroupBtn = dialog.locator([
              'div[role="button"]:has-text("Thêm nhóm")',
              'div[aria-label*="Thêm nhóm"]',
              'div[role="button"]:has-text("Add groups")',
              'div[role="button"]:has-text("Đăng ở nhiều nơi")'
            ].join(', ')).first();

            let modalOpened = false;
            if (await addGroupBtn.count() > 0 && await addGroupBtn.isVisible()) {
              await addGroupBtn.evaluate(el => el.click());
              await page.waitForTimeout(2500);
              modalOpened = true;
            }

            // BƯỚC 6: CHỌN MAX NHÓM CHƯA ĐĂNG (KHÔNG TRÙNG LẶP VỚI POSTEDGROUPS)
            if (modalOpened) {
              console.log(`[CrossPostLoop] Đợt #${batchIndex} - Bước 6: Quét danh sách nhóm phù hợp với từ khóa "${filterKeyword || 'Tất cả'}"...`);

              // Cuộn nhẹ container danh sách nhóm để Facebook tải đủ danh sách
              const scrollable = dialog.locator('div[style*="overflow"], div[tabindex="0"]').first();
              if (await scrollable.count() > 0) {
                for (let s = 0; s < 3; s++) {
                  await scrollable.evaluate(el => el.scrollTop += 600).catch(() => {});
                  await page.waitForTimeout(400);
                }
              }

              // Tìm tất cả các dòng nhóm bên trong dialog
              const groupRows = dialog.locator('div[role="checkbox"], div[aria-checked]');
              const totalCheckboxCount = await groupRows.count();
              console.log(`[CrossPostLoop] Tìm thấy ${totalCheckboxCount} mục lựa chọn trong danh sách...`);

              let unpostedCandidates = [];

              if (totalCheckboxCount > 0) {
                for (let i = 0; i < totalCheckboxCount; i++) {
                  try {
                    const row = groupRows.nth(i);
                    const rowText = (await row.innerText().catch(() => '')).trim();
                    const groupTitle = rowText.split('\n')[0].trim();
                    if (!groupTitle) continue;

                    // Kiểm tra từ khóa
                    const matchesKeyword = !filterKeyword || 
                      groupTitle.toLowerCase().includes(filterKeyword.toLowerCase());

                    if (matchesKeyword) {
                      const normalizedName = groupTitle.toLowerCase();
                      const alreadyPosted = postedGroups.has(normalizedName);
                      unpostedCandidates.push({
                        locator: row,
                        title: groupTitle,
                        alreadyPosted
                      });
                    }
                  } catch (_) {}
                }
              } else {
                // Fallback nếu Facebook không dùng role="checkbox": Quét theo span văn bản
                const spans = dialog.locator('span').filter({
                  hasText: filterKeyword ? new RegExp(filterKeyword, 'i') : /.+/
                });
                const spanCount = await spans.count();
                for (let i = 0; i < spanCount; i++) {
                  try {
                    const sp = spans.nth(i);
                    const title = (await sp.innerText().catch(() => '')).trim();
                    if (title && title.length > 3) {
                      unpostedCandidates.push({
                        locator: sp,
                        title,
                        alreadyPosted: postedGroups.has(title.toLowerCase())
                      });
                    }
                  } catch (_) {}
                }
              }

              // Lọc những nhóm CHƯA đăng
              const pendingToPick = unpostedCandidates.filter(c => !c.alreadyPosted);
              console.log(`[CrossPostLoop] Có ${unpostedCandidates.length} nhóm khớp từ khóa, trong đó còn ${pendingToPick.length} nhóm CHƯA ĐĂNG.`);

              let pickedCount = 0;
              for (const item of pendingToPick) {
                if (pickedCount >= maxPerBatch) break;
                try {
                  await item.locator.scrollIntoViewIfNeeded().catch(() => {});
                  await item.locator.evaluate(el => el.click());
                  postedGroups.add(item.title.toLowerCase());
                  selectedInThisBatch.push(item.title);
                  pickedCount++;
                  await page.waitForTimeout(300);
                } catch (clickErr) {
                  console.log(`[CrossPostLoop] Không thể click nhóm "${item.title}":`, clickErr.message);
                }
              }

              console.log(`[CrossPostLoop] Đợt #${batchIndex}: Đã tích chọn thành công ${selectedInThisBatch.length} nhóm mới!`);

              // Đánh giá xem còn nhóm chưa đăng cho đợt tiếp theo hay không
              const remainingAfterThis = pendingToPick.length - pickedCount;
              hasMoreGroups = remainingAfterThis > 0;
              console.log(`[CrossPostLoop] Nhóm còn lại cho đợt sau: ${remainingAfterThis} (hasMoreGroups = ${hasMoreGroups})`);

              // Bấm nút "Xong"
              const doneBtn = dialog.locator('div[role="button"]:has-text("Xong"), div[aria-label="Xong"], div[role="button"]:has-text("Done")').first();
              if (await doneBtn.count() > 0) {
                await doneBtn.evaluate(el => el.click());
                await page.waitForTimeout(2000);
              }
            } else {
              console.log(`[CrossPostLoop] Không tìm thấy nút "+ Thêm nhóm", đăng trực tiếp vào nhóm gốc.`);
              hasMoreGroups = false;
            }

            // BƯỚC 7: ĐĂNG 1 CHẠM & LƯU LOGS
            console.log(`[CrossPostLoop] Đợt #${batchIndex} - Bước 7: Bấm nút Đăng...`);
            const submitBtn = dialog.locator([
              'div[aria-label="Đăng"][role="button"]',
              'div[aria-label="Post"][role="button"]',
              'div[role="button"]:has-text("Đăng"):not(:has-text("Đăng nhập"))',
              'div[aria-label="Đăng"]',
              'div[aria-label="Post"]'
            ].join(', ')).first();

            await submitBtn.waitFor({ state: 'visible', timeout: 15000 });

            for (let w = 0; w < 20; w++) {
              const disabled = await submitBtn.getAttribute('aria-disabled').catch(() => null);
              if (disabled !== 'true') break;
              await page.waitForTimeout(1000);
            }
            await page.waitForTimeout(1000);

            await submitBtn.evaluate(el => el.click());
            console.log(`[CrossPostLoop] Đã bấm Đăng! Chờ 15 giây cho bài viết lên sóng...`);
            await page.waitForTimeout(15000);

            // Chụp ảnh màn hình bằng chứng thành công
            const ssFileName = `crosspost-${batchId}-batch-${batchIndex}.png`;
            const ssPath = path.resolve(this.logsDir, ssFileName);
            await page.screenshot({ path: ssPath, fullPage: true }).catch(() => {});
            batchScreenshotUrl = `/logs/crosspost/${ssFileName}`;

            batchSuccess = true;
            consecutiveRetries = 0; // Reset số lần thử lại sau khi thành công

            console.log(`[CrossPostLoop] >>> ĐỢT #${batchIndex} XUẤT BẢN THÀNH CÔNG RỰC RỠ! <<<`);

          } finally {
            await page.close().catch(() => {});
          }

        } catch (batchErr) {
          console.error(`[CrossPostLoop] LỖI TẠI ĐỢT #${batchIndex}:`, batchErr.message);

          // CƠ CHẾ AUTO-RETRY TỐI ĐA 3 LẦN
          consecutiveRetries++;
          if (consecutiveRetries <= 3) {
            console.log(`[CrossPostLoop] Kích hoạt Auto-Retry: Thử lại đợt #${batchIndex} lần ${consecutiveRetries}/3 sau 15 giây...`);
            const retryMsg = `Gặp sự cố (${batchErr.message}). Tự động thử lại đợt #${batchIndex} (Lần ${consecutiveRetries}/3) sau 15 giây...`;
            db.prepare(`UPDATE crosspost_batches SET current_step = ?, retry_count = ?, updated_at = ? WHERE id = ?`)
              .run(retryMsg, consecutiveRetries, new Date().toISOString(), batchId);

            await new Promise(r => setTimeout(r, 15000));
            batchIndex--; // Giảm batchIndex để vòng lặp thử lại đúng đợt này
            continue;
          } else {
            console.error(`[CrossPostLoop] Đợt #${batchIndex} đã thử lại 3 lần thất bại liên tiếp. Dừng vòng lặp.`);
            hasMoreGroups = false;
          }
        }

        // Cập nhật kết quả đợt vào Database
        if (batchSuccess) {
          const batchInfo = {
            batchIndex,
            selectedGroups: selectedInThisBatch,
            groupCount: selectedInThisBatch.length + 1, // tính cả nhóm gốc
            screenshotUrl: batchScreenshotUrl,
            time: new Date().toLocaleTimeString('vi-VN'),
            timestamp: new Date().toISOString()
          };

          const currentDbRow = db.prepare('SELECT batch_history FROM crosspost_batches WHERE id = ?').get(batchId);
          let historyList = [];
          try { historyList = JSON.parse(currentDbRow.batch_history || '[]'); } catch (_) {}
          historyList.push(batchInfo);

          const stepReport = `Đợt #${batchIndex} thành công: Đã phủ sóng thêm ${selectedInThisBatch.length} nhóm! Tổng đã đăng: ${postedGroups.size} nhóm.`;

          db.prepare(`
            UPDATE crosspost_batches SET 
              current_batch_index = ?,
              total_posted_groups = ?,
              posted_group_names = ?,
              batch_history = ?,
              current_step = ?,
              last_screenshot_url = ?,
              updated_at = ?
            WHERE id = ?
          `).run(
            batchIndex,
            postedGroups.size,
            JSON.stringify(Array.from(postedGroups)),
            JSON.stringify(historyList),
            stepReport,
            batchScreenshotUrl,
            new Date().toISOString(),
            batchId
          );
        }

        // NẾU VẪN CÒN NHÓM ĐỂ ĐĂNG: NGHỈ GIÃN CÁCH THÔNG MINH 90s - 180s
        if (hasMoreGroups) {
          const delaySec = Math.floor(Math.random() * (initialRecord.delay_max - initialRecord.delay_min + 1)) + initialRecord.delay_min;
          console.log(`[CrossPostLoop] Nghỉ giãn cách ${delaySec} giây trước khi vét tiếp đợt #${batchIndex + 1}...`);

          for (let sec = delaySec; sec > 0; sec--) {
            this.remainingDelaySeconds = sec;
            const checkStatus = db.prepare('SELECT status FROM crosspost_batches WHERE id = ?').get(batchId);
            if (checkStatus?.status === 'stopped') {
              hasMoreGroups = false;
              break;
            }

            const countdownMsg = `Đã xong đợt #${batchIndex}. Nghỉ an toàn chống spam: còn ${sec} giây trước khi vét tiếp đợt #${batchIndex + 1}...`;
            db.prepare(`UPDATE crosspost_batches SET current_step = ?, updated_at = ? WHERE id = ?`)
              .run(countdownMsg, new Date().toISOString(), batchId);

            await new Promise(r => setTimeout(r, 1000));
          }
          this.remainingDelaySeconds = 0;
        }
      }

      // HOÀN TẤT TOÀN BỘ VÒNG LẶP
      const finalRecord = db.prepare('SELECT * FROM crosspost_batches WHERE id = ?').get(batchId);
      const isStopped = finalRecord.status === 'stopped';
      const finishStatus = isStopped ? 'stopped' : 'completed';
      const finishDesc = isStopped
        ? `Đã dừng vòng lặp bởi người dùng. Đã phủ sóng: ${postedGroups.size} nhóm qua ${batchIndex} đợt.`
        : `🎉 ĐÃ VÉT CẠN 100% NHÓM KHỚP TỪ KHÓA! Tổng cộng đã phủ sóng: ${postedGroups.size} nhóm qua ${batchIndex} đợt!`;

      db.prepare(`
        UPDATE crosspost_batches SET 
          status = ?, 
          current_step = ?, 
          updated_at = ? 
        WHERE id = ?
      `).run(finishStatus, finishDesc, new Date().toISOString(), batchId);

      console.log(`\n======================================================`);
      console.log(`[CrossPostLoop] HOÀN TẤT PHIÊN VÉT CẠN: ${batchId}`);
      console.log(`[CrossPostLoop] ${finishDesc}`);
      console.log(`======================================================\n`);

    } catch (fatalErr) {
      console.error('[CrossPostLoop Fatal Error]', fatalErr);
      db.prepare(`UPDATE crosspost_batches SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`)
        .run(fatalErr.message, new Date().toISOString(), batchId);
    } finally {
      this.isProcessing = false;
      this.activeBatchId = null;
    }
  }

  /**
   * Lấy trạng thái vòng lặp vét cạn đang chạy hoặc gần nhất
   */
  getActiveLoop() {
    const batch = db.prepare(`
      SELECT * FROM crosspost_batches 
      ORDER BY rowid DESC 
      LIMIT 1
    `).get();

    if (!batch) {
      return { hasActiveLoop: false, batch: null };
    }

    let history = [];
    try { history = JSON.parse(batch.batch_history || '[]'); } catch (_) {}
    let postedNames = [];
    try { postedNames = JSON.parse(batch.posted_group_names || '[]'); } catch (_) {}

    return {
      hasActiveLoop: batch.status === 'running' || batch.status === 'pending',
      batch: {
        ...batch,
        remainingDelaySeconds: this.remainingDelaySeconds,
        history,
        postedGroupNames: postedNames
      }
    };
  }

  /**
   * Dừng khẩn cấp vòng lặp
   */
  stopLoop(batchId) {
    db.prepare(`
      UPDATE crosspost_batches SET 
        status = 'stopped', 
        current_step = 'Đã dừng khẩn cấp bởi người dùng', 
        updated_at = ? 
      WHERE id = ?
    `).run(new Date().toISOString(), batchId);

    if (this.activeBatchId === batchId) {
      this.activeBatchId = null;
      this.isProcessing = false;
    }

    return { success: true, message: 'Đã gửi lệnh dừng vòng lặp vét cạn!' };
  }
}

module.exports = new CrossPostLoopService();
