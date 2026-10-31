// BDS Auto Poster - Background Service Worker

chrome.alarms.create('checkDuePosts', { periodInMinutes: 0.5 }); // Kiểm tra mỗi 30 giây

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkDuePosts') {
    checkServerForJobs();
  }
});

async function checkServerForJobs() {
  chrome.storage.sync.get(['serverUrl', 'clientKey'], async (config) => {
    const serverUrl = config.serverUrl || 'http://localhost:3001';
    const clientKey = config.clientKey || 'demo-user-01';

    try {
      const res = await fetch(`${serverUrl}/api/extension/poll-jobs?clientKey=${clientKey}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.success && data.hasJob && data.job) {
        console.log('[Extension Background] Nhận lệnh đăng bài:', data.job);
        executePublishJob(data.job, serverUrl);
      }
    } catch (err) {
      // Server chưa bật hoặc offline
    }
  });
}

async function executePublishJob(job, serverUrl) {
  // 1. Mở hoặc tìm tab nhóm Facebook
  const groupTab = await chrome.tabs.create({
    url: job.group_url,
    active: true
  });

  // 2. Chờ trang tải xong (5 giây)
  setTimeout(() => {
    chrome.tabs.sendMessage(groupTab.id, {
      action: 'PERFORM_FACEBOOK_POST',
      job: job
    }, (response) => {
      console.log('[Extension Background] Kết quả đăng:', response);

      // Báo cáo hoàn tất về server
      fetch(`${serverUrl}/api/extension/complete-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          success: response ? response.success : false,
          error: response ? response.error : 'Không phản hồi từ trang Facebook'
        })
      });
    });
  }, 6000);
}
