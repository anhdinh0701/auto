// BDS Auto Poster - Content Script (Chạy trên facebook.com)

console.log('[BDS Extension] Content script đã nhúng vào Facebook!');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PERFORM_FACEBOOK_POST') {
    handleFacebookPost(request.job)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleFacebookPost(job) {
  console.log('[BDS Extension] Bắt đầu tự động đăng bài:', job);

  // 1. Tìm ô "Bạn viết gì đi"
  let trigger = document.querySelector('div[role="main"] div[role="button"]:has-text("Bạn viết gì đi")') ||
                Array.from(document.querySelectorAll('div[role="button"], span')).find(el => el.innerText && el.innerText.includes('Bạn viết gì đi'));

  if (!trigger) {
    throw new Error('Không tìm thấy khung tạo bài viết trên nhóm Facebook');
  }

  trigger.click();
  await sleep(3000);

  // 2. Điền nội dung bài viết
  const textBox = document.querySelector('div[role="dialog"] [contenteditable="true"][role="textbox"]');
  if (textBox) {
    textBox.focus();
    document.execCommand('insertText', false, job.content || job.spun_content || '');
    await sleep(2000);
  } else {
    throw new Error('Không tìm thấy ô nhập nội dung');
  }

  // 3. Đăng chéo nhóm nếu có yêu cầu
  if (job.cross_post_keyword) {
    const addGroupsBtn = Array.from(document.querySelectorAll('div[role="dialog"] div[role="button"], div[role="dialog"] span'))
      .find(el => el.innerText && el.innerText.includes('Thêm nhóm'));

    if (addGroupsBtn) {
      addGroupsBtn.click();
      await sleep(2500);

      const searchInput = document.querySelector('input[placeholder*="Tìm kiếm nhóm"]');
      if (searchInput) {
        searchInput.focus();
        document.execCommand('insertText', false, job.cross_post_keyword);
        await sleep(2000);

        const rows = Array.from(document.querySelectorAll('div[role="dialog"] div[role="button"]'))
          .filter(el => el.innerText && new RegExp(job.cross_post_keyword, 'i').test(el.innerText));

        const selectLimit = Math.min(rows.length, 9);
        for (let i = 0; i < selectLimit; i++) {
          rows[i].click();
          await sleep(400);
        }

        const doneBtn = Array.from(document.querySelectorAll('div[role="dialog"] div[role="button"], div[role="dialog"] div[aria-label="Xong"]'))
          .find(el => el.innerText && el.innerText.trim() === 'Xong');
        if (doneBtn) {
          doneBtn.click();
          await sleep(2500);
        }
      }
    }
  }

  // 4. Bấm nút Đăng
  const submitBtn = document.querySelector('div[role="dialog"] div[aria-label="Đăng"][role="button"]') ||
                    Array.from(document.querySelectorAll('div[role="dialog"] div[role="button"]')).find(el => el.innerText && el.innerText.trim() === 'Đăng');

  if (!submitBtn) {
    throw new Error('Không tìm thấy nút Đăng bài');
  }

  submitBtn.click();
  await sleep(5000);

  console.log('[BDS Extension] Đã bấm đăng bài thành công!');
  return { success: true, message: 'Đã tự động đăng bài thành công trên Facebook của bạn!' };
}
