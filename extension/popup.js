document.addEventListener('DOMContentLoaded', async () => {
  const serverInput = document.getElementById('server-url');
  const keyInput = document.getElementById('client-key');
  const saveBtn = document.getElementById('save-btn');
  const statusText = document.getElementById('status-text');

  // Load saved settings
  chrome.storage.sync.get(['serverUrl', 'clientKey'], (data) => {
    if (data.serverUrl) serverInput.value = data.serverUrl;
    if (data.clientKey) keyInput.value = data.clientKey;
    statusText.innerText = 'Trạm Extension đang hoạt động';
  });

  saveBtn.addEventListener('click', () => {
    const serverUrl = serverInput.value.trim().replace(/\/$/, '');
    const clientKey = keyInput.value.trim();

    chrome.storage.sync.set({ serverUrl, clientKey }, () => {
      saveBtn.innerText = '✓ Đã Lưu Thành Công!';
      saveBtn.style.background = '#059669';
      setTimeout(() => {
        saveBtn.innerText = 'Lưu Cấu Hình';
        saveBtn.style.background = '#10b981';
      }, 2000);
    });
  });
});
