require('dotenv').config();
const db = require('./db');
const Groq = require('groq-sdk');
const { v4: uuidv4 } = require('uuid');

class SmartScheduler {
  getGroqClient() {
    let apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      try {
        const row = db.prepare("SELECT api_key FROM ai_settings WHERE id = 'default'").get();
        if (row && row.api_key) apiKey = row.api_key;
      } catch (_) {}
    }
    if (!apiKey) {
      throw new Error('Chưa cấu hình GROQ_API_KEY trong file .env hoặc bảng ai_settings');
    }
    return new Groq({ apiKey });
  }

  /**
   * Hard-check: Filter active groups matching property city & active_score >= 5.0
   * Strictly excludes any groups from another city!
   */
  filterValidGroupsForProperty(propertyId) {
    let prop = db.prepare('SELECT * FROM Properties WHERE id = ?').get(propertyId);
    if (!prop) {
      prop = db.prepare('SELECT * FROM listings WHERE id = ?').get(propertyId);
      if (prop) {
        prop.city = prop.province;
        prop.raw_content = prop.description;
      }
    }

    if (!prop) {
      throw new Error(`Không tìm thấy bất động sản với mã: ${propertyId}`);
    }

    const propCity = (prop.city || '').trim().toLowerCase();
    if (!propCity) {
      throw new Error(`Bất động sản "${prop.title}" chưa có thông tin Tỉnh/Thành phố.`);
    }

    // All active groups in DB
    const allGroups = db.prepare('SELECT * FROM TargetGroups').all();
    
    // Hard-check filter:
    // 1. is_active == 1 (or truthy)
    // 2. active_score >= 5.0
    // 3. target_city matches property.city (exact normalized match)
    const validGroups = [];
    const rejectedGroups = [];

    for (const g of allGroups) {
      const gCity = (g.target_city || '').trim().toLowerCase();
      const isActive = g.is_active === 1 || g.is_active === null || g.is_active === undefined;
      const score = parseFloat(g.active_score) || 0;

      // Normalize city names: e.g. "Hà Nội" == "Hà Nội", remove prefix "tp." or "thành phố"
      const cleanPropCity = propCity.replace(/^(tp\.?|thành phố|tỉnh)\s*/i, '').trim();
      const cleanGCity = gCity.replace(/^(tp\.?|thành phố|tỉnh)\s*/i, '').trim();

      const cityMatches = cleanGCity === cleanPropCity || 
                          cleanGCity.includes(cleanPropCity) || 
                          cleanPropCity.includes(cleanGCity);

      if (isActive && score >= 5.0 && cityMatches) {
        let timeSlots = [];
        try {
          timeSlots = typeof g.trained_time_slots === 'string' ? JSON.parse(g.trained_time_slots) : g.trained_time_slots;
        } catch (_) {
          timeSlots = ['08:30', '11:45', '19:30', '21:00'];
        }

        validGroups.push({
          ...g,
          trained_time_slots: timeSlots
        });
      } else {
        let reason = '';
        if (!isActive) reason = 'Nhóm bị vô hiệu hóa (is_active = 0)';
        else if (score < 5.0) reason = `Điểm hoạt động quá thấp (${score} < 5.0)`;
        else if (!cityMatches) reason = `Sai lệch địa lý: Nhóm tại "${g.target_city}", BĐS tại "${prop.city}"`;

        rejectedGroups.push({
          id: g.id,
          group_name: g.group_name,
          target_city: g.target_city,
          active_score: score,
          reason
        });
      }
    }

    return {
      property: prop,
      validGroups,
      rejectedGroups
    };
  }

  /**
   * Schedule posts with Groq AI, conflict jitter prevention, and micro-spinning
   */
  async generateSmartSchedulePlan(propertyId, options = {}) {
    const { property, validGroups, rejectedGroups } = this.filterValidGroupsForProperty(propertyId);

    if (validGroups.length === 0) {
      throw new Error(`Kiểm tra địa lý cứng (Hard-check): Không có nhóm nào phù hợp tại ${property.city} (Điểm hoạt động >= 5 và đang bật). Đã từ chối ${rejectedGroups.length} nhóm khác khu vực.`);
    }

    const groq = this.getGroqClient();
    const models = [
      'llama-3.3-70b-versatile',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b'
    ];

    const promptPayload = {
      property: {
        id: property.id,
        title: property.title,
        city: property.city,
        district: property.district,
        property_type: property.property_type,
        price: property.price,
        area: property.area
      },
      available_groups: validGroups.map(g => ({
        id: g.id,
        group_name: g.group_name,
        target_property_type: g.target_property_type,
        trained_time_slots: g.trained_time_slots,
        approval_latency_minutes: g.approval_latency_minutes,
        active_score: g.active_score
      }))
    };

    const systemPrompt = `Bạn là Chuyên gia AI Lập lịch Đăng tin BĐS (Smart Real Estate Scheduler).
Nhiệm vụ:
1. Đối chiếu thông tin BĐS với danh sách nhóm Facebook hợp lệ cùng thành phố ${property.city}.
2. Lựa chọn các nhóm khớp nhất với phân khúc BĐS.
3. Với mỗi nhóm được chọn:
   - Chọn đúng 1 khung giờ vàng tối ưu từ danh sách "trained_time_slots" của nhóm đó (ví dụ "19:30").
   - Viết 1 câu mở đầu biến tấu (Micro-spinning opening hook kèm emoji bắt mắt và lời chào tự nhiên phù hợp với cộng đồng nhóm đó, ví dụ: '🏡 [CĂN HỘ CHÍNH CHỦ VIEW HỒ] Chào cả nhà...', '🔥 [HÀNG HIẾM LONG BIÊN] Thân gửi các bác đang tìm căn 2PN...', '✨ [CƠ HỘI ĐẦU TƯ] Kính gửi anh chị em cư dân...').
   - Lưu ý: Chỉ biến tấu 1-2 câu mở đầu ngắn gọn, KHÔNG được thay đổi nội dung thông số kỹ thuật bên dưới.

BẮT BUỘC trả về đúng 1 JSON object format:
{
  "scheduled_plan": [
    {
      "group_id": "...",
      "selected_time_slot": "HH:mm",
      "opening_hook": "...",
      "reason": "..."
    }
  ]
}`;

    let aiPlan = null;
    let usedModel = null;
    let lastError = null;

    for (const model of models) {
      try {
        const res = await groq.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Hãy lập kế hoạch đăng tin tối ưu cho BĐS sau:\n\n${JSON.stringify(promptPayload, null, 2)}` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        });

        const content = res.choices[0]?.message?.content;
        if (content) {
          aiPlan = JSON.parse(content);
          usedModel = model;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[SmartScheduler] Model ${model} failed, fallback:`, err.message);
      }
    }

    if (!aiPlan || !Array.isArray(aiPlan.scheduled_plan)) {
      // Deterministic fallback if API fails
      aiPlan = {
        scheduled_plan: validGroups.map((g, idx) => ({
          group_id: g.id,
          selected_time_slot: g.trained_time_slots[idx % g.trained_time_slots.length] || '19:30',
          opening_hook: `🏡 [TIN BĐS CHÍNH CHỦ ${property.district?.toUpperCase() || ''}] Chào anh chị em cộng đồng ${g.group_name}!`,
          reason: `Khớp phân khúc ${property.property_type} tại ${property.city}`
        }))
      };
      usedModel = 'deterministic_scheduler';
    }

    // ---------------- ANTI-SPAM JITTER & CONFLICT RESOLUTION ALGORITHM ----------------
    // Sort proposed schedule by selected time slot
    const planItems = aiPlan.scheduled_plan.map(item => {
      const grp = validGroups.find(g => g.id === item.group_id);
      return {
        ...item,
        group: grp
      };
    }).filter(item => item.group !== undefined);

    // Compute base trigger times: scheduled_time = trained_time_slot - approval_latency_minutes
    // Date base: tomorrow (or today if time is at least 30 mins in future)
    const now = new Date();
    const scheduledSchedules = [];

    // Track scheduled minutes across items to enforce 6-12 min anti-conflict jitter
    let lastScheduledTimestamp = 0;

    for (let i = 0; i < planItems.length; i++) {
      const item = planItems[i];
      const slotStr = item.selected_time_slot || '19:30';
      const [slotH, slotM] = slotStr.split(':').map(n => parseInt(n, 10));
      const latency = parseInt(item.group.approval_latency_minutes, 10) || 15;

      // Calculate target time: tomorrow at slotH:slotM
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1); // Schedule for tomorrow
      targetDate.setHours(slotH, slotM, 0, 0);

      // Trigger time = targetDate - latency minutes
      const triggerTime = new Date(targetDate.getTime() - latency * 60 * 1000);

      // Conflict Jitter Check:
      // If triggerTime is within 8 minutes of lastScheduledTimestamp (or same time slot),
      // add random jitter between 6 and 12 minutes!
      let jitter = 0;
      if (lastScheduledTimestamp > 0) {
        const diffMinutes = Math.abs((triggerTime.getTime() - lastScheduledTimestamp) / (60 * 1000));
        if (diffMinutes < 8) {
          jitter = Math.floor(Math.random() * 7) + 6; // 6 to 12 minutes
          triggerTime.setTime(lastScheduledTimestamp + jitter * 60 * 1000);
        }
      }

      lastScheduledTimestamp = triggerTime.getTime();

      // Micro-spun content: Opening Hook + 100% original content preserved below
      const baseContent = property.raw_content || property.description || property.title;
      const spunContent = `${item.opening_hook}\n\n${baseContent}`;

      // Media assets
      let mediaIds = [];
      try {
        const approvedPhotos = typeof property.approved_photo_ids === 'string' 
          ? JSON.parse(property.approved_photo_ids) 
          : (property.approved_photo_ids || []);
        mediaIds = approvedPhotos;
      } catch (_) {}

      // Schedule row
      const scheduleId = `sched-${Date.now()}-${i + 1}`;
      const nowIso = new Date().toISOString();
      const scheduledIso = triggerTime.toISOString();

      // Persist into PostingSchedules
      db.prepare(`
        INSERT INTO PostingSchedules (
          id, property_id, group_id, selected_media_ids, scheduled_time,
          target_time_slot, jitter_offset_minutes, opening_hook, spun_content,
          status, published_url, error_log, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', null, null, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          scheduled_time = excluded.scheduled_time,
          target_time_slot = excluded.target_time_slot,
          jitter_offset_minutes = excluded.jitter_offset_minutes,
          opening_hook = excluded.opening_hook,
          spun_content = excluded.spun_content,
          status = 'Pending',
          updated_at = excluded.updated_at
      `).run(
        scheduleId,
        property.id,
        item.group.id,
        JSON.stringify(mediaIds),
        scheduledIso,
        slotStr,
        jitter,
        item.opening_hook,
        spunContent,
        nowIso,
        nowIso
      );

      // Also create publishing_task for worker
      const taskId = `task-${scheduleId}`;
      db.prepare(`
        INSERT OR REPLACE INTO publishing_tasks (
          id, listing_id, channel_id, status, title, content,
          scheduled_at, attempt_count, max_attempts, worker_state,
          created_at, updated_at
        ) VALUES (?, ?, ?, 'scheduled', ?, ?, ?, 0, 3, 'SCHEDULED', ?, ?)
      `).run(
        taskId,
        property.id,
        item.group.id,
        property.title,
        spunContent,
        scheduledIso,
        nowIso,
        nowIso
      );

      scheduledSchedules.push({
        id: scheduleId,
        task_id: taskId,
        group_id: item.group.id,
        group_name: item.group.group_name,
        group_url: item.group.group_url,
        target_city: item.group.target_city,
        trained_time_slot: slotStr,
        approval_latency_minutes: latency,
        jitter_offset_minutes: jitter,
        scheduled_time: scheduledIso,
        display_scheduled_time: triggerTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        opening_hook: item.opening_hook,
        spun_content: spunContent,
        status: 'Pending',
        reason: item.reason
      });
    }

    return {
      success: true,
      model_used: usedModel,
      property: {
        id: property.id,
        title: property.title,
        city: property.city,
        district: property.district
      },
      hardcheck_summary: {
        total_groups_in_db: validGroups.length + rejectedGroups.length,
        matched_valid_groups: validGroups.length,
        rejected_groups_count: rejectedGroups.length,
        rejected_details: rejectedGroups
      },
      schedules_created_count: scheduledSchedules.length,
      schedules: scheduledSchedules
    };
  }
}

module.exports = new SmartScheduler();
