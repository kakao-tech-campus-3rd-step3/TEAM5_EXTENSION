// 매일 첫 접속을 감지하고 관리하는 백그라운드 스크립트

// 익스텐션 설치 시 기본값 설정
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    redirectUrl: 'dailyq.my',
    enabled: true,
    lastRedirectDate: ''
  });
});

// 브라우저 시작 시 기존 탭들 체크
chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url) {
        checkAndRedirect(tab.id, tab.url);
      }
    });
  });
});

// 탭이 업데이트될 때 체크
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    checkAndRedirect(tabId, tab.url);
  }
});

// 새 탭이 생성될 때 체크
chrome.tabs.onCreated.addListener((tab) => {
  // 새 탭이나 빈 페이지일 때도 체크
  if (tab.url || tab.pendingUrl || !tab.url) {
    setTimeout(() => {
      chrome.tabs.get(tab.id, (updatedTab) => {
        if (chrome.runtime.lastError) return;
        checkAndRedirect(tab.id, updatedTab.url || 'chrome://newtab/');
      });
    }, 100);
  }
});

// 메인 로직: 오늘 첫 접속인지 확인하고 리다이렉트
async function checkAndRedirect(tabId, url) {
  try {
    // 확장 프로그램 페이지는 제외하지만 새 탭 페이지는 허용
    if (url && (url.startsWith('chrome-extension://') || url.startsWith('moz-extension://'))) {
      return;
    }
    
    // 새 탭 페이지나 빈 페이지, 일반 웹페이지 접속 시 체크
    const isNewTabOrWebPage = !url || 
                             url === 'chrome://newtab/' || 
                             url.startsWith('http://') || 
                             url.startsWith('https://') ||
                             url === 'about:blank';
    
    if (!isNewTabOrWebPage) {
      return;
    }

    const data = await chrome.storage.sync.get(['redirectUrl', 'enabled', 'lastRedirectDate']);
    
    if (!data.enabled) {
      return;
    }

    const today = new Date().toDateString();
    const lastRedirectDate = data.lastRedirectDate;

    // 오늘 아직 리다이렉트하지 않았다면
    if (lastRedirectDate !== today) {
      const redirectUrl = data.redirectUrl || 'https://team5-fe-ivory.vercel.app/';
      
      // 이미 리다이렉트 URL이라면 무한 루프 방지
      if (url === redirectUrl || url.startsWith(redirectUrl)) {
        // 오늘 날짜로 업데이트하여 더 이상 리다이렉트하지 않도록 함
        await chrome.storage.sync.set({ lastRedirectDate: today });
        return;
      }

      // 리다이렉트 실행
      chrome.tabs.update(tabId, { url: redirectUrl });
      
      // 오늘 날짜 저장
      await chrome.storage.sync.set({ lastRedirectDate: today });
      
      console.log(`Daily first visit detected. Redirecting to: ${redirectUrl}`);
    }
  } catch (error) {
    console.error('Error in checkAndRedirect:', error);
  }
}

// 컨텐트 스크립트에서 메시지를 받을 때
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkFirstVisit') {
    checkAndRedirect(sender.tab.id, sender.tab.url);
  }
});
