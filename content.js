// 컨텐트 스크립트 - 페이지 로드 시 백그라운드에 첫 방문 체크 요청

// 페이지가 로드되기 시작할 때 백그라운드 스크립트에 메시지 전송
(function() {
  // 이미 처리된 페이지는 다시 처리하지 않음
  if (window.dailyRedirectChecked) {
    return;
  }
  
  window.dailyRedirectChecked = true;
  
  // 백그라운드 스크립트에 첫 방문 체크 요청
  chrome.runtime.sendMessage({ action: 'checkFirstVisit' });
})();
