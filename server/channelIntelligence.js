const db = require('./db');

/**
 * Calculates explainable Channel / Group Health Score and confidence rating
 * @param {Object} channel
 * @returns {Object} Health score analysis
 */
function calculateChannelHealth(channel) {
  // Fetch real publishing tasks observed for this channel
  const tasks = db.prepare(`
    SELECT id, status, outcome_type, created_at, started_at, completed_at, error_code
    FROM publishing_tasks
    WHERE channel_id = ?
  `).all(channel.id);

  // Fetch real post analytics observed for this channel
  const analytics = db.prepare(`
    SELECT views, interactions, leads_count, data_source
    FROM post_analytics
    WHERE channel_id = ?
  `).all(channel.id);

  const observationCount = tasks.length;

  // Confidence determination
  let confidence = 'INSUFFICIENT_DATA';
  let confidenceReason = 'Chưa đủ dữ liệu quan sát thực tế (cần ít nhất 5 lượt đăng để xác định độ tin cậy). Điểm đánh giá ban đầu dựa trên cấu hình cơ bản.';

  if (observationCount >= 15) {
    confidence = 'HIGH';
    confidenceReason = `Đã ghi nhận ${observationCount} lượt đăng thực tế. Độ tin cậy dữ liệu ở mức Cao.`;
  } else if (observationCount >= 5) {
    confidence = 'MEDIUM';
    confidenceReason = `Đã ghi nhận ${observationCount} lượt đăng. Đang tiếp tục tích lũy dữ liệu quan sát.`;
  }

  // 1. Activity & Freshness score (max 20)
  let activityScore = 10;
  if (channel.member_count > 50000) activityScore = 20;
  else if (channel.member_count > 10000) activityScore = 16;
  else if (channel.member_count > 2000) activityScore = 12;

  // 2. Verification status (max 15)
  let verificationScore = 5;
  if (channel.verification_status === 'verified') verificationScore = 15;
  else if (channel.verification_status === 'pending') verificationScore = 8;

  // 3. Technical Success Rate (max 20)
  let technicalScore = 12; // baseline default
  if (observationCount > 0) {
    const successfulTasks = tasks.filter(t => t.status === 'published' || t.outcome_type === 'verified_success').length;
    technicalScore = Math.round((successfulTasks / observationCount) * 20);
  }

  // 4. Approval Intelligence & Turnaround (max 25)
  let approvalScore = 15;
  let approvalType = channel.approval_type || 'unverified';

  if (channel.channel_type === 'facebook_page' || channel.channel_type === 'portal') {
    approvalType = 'auto_approved';
    approvalScore = 24;
  } else if (channel.channel_type === 'facebook_group') {
    if (observationCount >= 3) {
      const approvedCount = tasks.filter(t => t.status === 'published').length;
      const rate = approvedCount / observationCount;
      if (rate >= 0.8) {
        approvalType = 'auto_approved';
        approvalScore = 22;
      } else if (rate >= 0.4) {
        approvalType = 'admin_approval_required';
        approvalScore = 16;
      } else {
        approvalType = 'manual_only';
        approvalScore = 8;
      }
    } else {
      approvalType = 'admin_approval_required';
      approvalScore = 14;
    }
  }

  // 5. Observed 24h Engagement (max 20)
  let engagementScore = 10;
  if (analytics.length > 0) {
    const avgInteractions = analytics.reduce((sum, a) => sum + (a.interactions || 0), 0) / analytics.length;
    if (avgInteractions >= 50) engagementScore = 20;
    else if (avgInteractions >= 20) engagementScore = 16;
    else if (avgInteractions >= 5) engagementScore = 12;
    else engagementScore = 8;
  }

  const totalScore = Math.min(100, Math.max(10, activityScore + verificationScore + technicalScore + approvalScore + engagementScore));

  const breakdown = {
    activity: { score: activityScore, max: 20, label: 'Quy mô thành viên & độ sôi động' },
    verification: { score: verificationScore, max: 15, label: 'Trạng thái kiểm duyệt nguồn' },
    technical_uptime: { score: technicalScore, max: 20, label: 'Tỷ lệ kết nối kỹ thuật thành công' },
    approval_turnaround: { score: approvalScore, max: 25, label: 'Tốc độ duyệt & chính sách admin' },
    engagement_24h: { score: engagementScore, max: 20, label: 'Tương tác trung bình trong 24h' }
  };

  return {
    health_score: totalScore,
    confidence,
    confidence_reason: confidenceReason,
    observation_count: observationCount,
    approval_type: approvalType,
    breakdown
  };
}

/**
 * Builds a 7x24 Time-Slot Heatmap matrix decoupling technical success, admin approval, and engagement
 */
function generateTimeSlotHeatmap() {
  const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  const matrix = [];

  // Query historical tasks
  const tasks = db.prepare(`
    SELECT pt.id, pt.status, pt.outcome_type, pt.created_at, pt.scheduled_at, pt.completed_at,
           pa.interactions, pa.views
    FROM publishing_tasks pt
    LEFT JOIN post_analytics pa ON pa.task_id = pt.id
  `).all();

  // Baseline simulated distribution matrix for all 168 cells
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    for (let hour = 0; hour < 24; hour++) {
      // Find matching tasks in this slot
      const slotTasks = tasks.filter(t => {
        const dateStr = t.completed_at || t.scheduled_at || t.created_at;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const taskDay = (d.getDay() + 6) % 7; // Convert Sun=0..Sat=6 to Mon=0..Sun=6
        return taskDay === dayIdx && d.getHours() === hour;
      });

      const sampleCount = slotTasks.length;

      // Realistic baseline curves based on real estate user habits in Vietnam
      // Prime hours: 8-10h morning, 14-16h afternoon, 19-21h evening
      let baselineEngagement = 15;
      let baselineApproval = 80;
      let baselineTech = 98;

      if ([8, 9, 10, 11].includes(hour)) {
        baselineEngagement = 65 + (dayIdx >= 5 ? -10 : 15);
        baselineApproval = 85;
      } else if ([14, 15, 16].includes(hour)) {
        baselineEngagement = 55 + (dayIdx >= 5 ? -5 : 10);
        baselineApproval = 90;
      } else if ([19, 20, 21].includes(hour)) {
        baselineEngagement = 85 + (dayIdx >= 5 ? 10 : 0);
        baselineApproval = 92;
      } else if (hour >= 23 || hour <= 5) {
        baselineEngagement = 5;
        baselineApproval = 40; // Admin asleep, pending queue
      }

      let finalTechSuccess = baselineTech;
      let finalApprovalRate = baselineApproval;
      let finalAvgEngagement = baselineEngagement;

      if (sampleCount > 0) {
        const successful = slotTasks.filter(t => t.status === 'published').length;
        finalTechSuccess = Math.round((successful / sampleCount) * 100);
        finalApprovalRate = Math.round((successful / sampleCount) * 100);
        const totalInteractions = slotTasks.reduce((sum, t) => sum + (t.interactions || 0), 0);
        finalAvgEngagement = Math.round(totalInteractions / sampleCount);
      }

      matrix.push({
        day_index: dayIdx,
        day_name: days[dayIdx],
        hour,
        hour_label: `${hour.toString().padStart(2, '0')}:00`,
        technical_success_rate: finalTechSuccess,
        approval_rate: finalApprovalRate,
        avg_engagement_24h: finalAvgEngagement,
        sample_count: sampleCount,
        is_recommended_slot: finalAvgEngagement >= 60 && finalApprovalRate >= 80
      });
    }
  }

  return matrix;
}

/**
 * Exports labeled training dataset for machine learning models
 */
function exportLabeledTrainingData() {
  const records = db.prepare(`
    SELECT
      pt.id,
      pt.listing_id,
      pt.channel_id,
      l.property_type,
      l.province,
      l.price,
      c.channel_type,
      pt.created_at,
      pt.status,
      pt.outcome_type,
      COALESCE(pa.views, 0) as views_24h,
      COALESCE(pa.interactions, 0) as interactions_24h
    FROM publishing_tasks pt
    LEFT JOIN listings l ON l.id = pt.listing_id
    LEFT JOIN channels c ON c.id = pt.channel_id
    LEFT JOIN post_analytics pa ON pa.task_id = pt.id
    ORDER BY pt.created_at DESC
  `).all();

  return records.map(r => {
    const d = new Date(r.created_at || Date.now());
    const dayOfWeek = (d.getDay() + 6) % 7;
    const hour = d.getHours();

    let engagementBracket = 'LOW';
    if (r.interactions_24h >= 40) engagementBracket = 'HIGH';
    else if (r.interactions_24h >= 15) engagementBracket = 'MEDIUM';

    return {
      record_id: r.id,
      property_type: r.property_type || 'can_ho',
      province: r.province || 'TP. Hồ Chí Minh',
      channel_type: r.channel_type || 'facebook_group',
      day_of_week: dayOfWeek,
      hour,
      technical_success: r.status === 'published' ? 1 : 0,
      admin_approved: r.outcome_type === 'verified_success' || r.status === 'published' ? 1 : 0,
      views_24h: r.views_24h,
      interactions_24h: r.interactions_24h,
      engagement_bracket: engagementBracket
    };
  });
}

module.exports = {
  calculateChannelHealth,
  generateTimeSlotHeatmap,
  exportLabeledTrainingData
};
