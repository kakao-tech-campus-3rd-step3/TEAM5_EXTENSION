// 팝업 UI의 동작을 관리하는 스크립트

document.addEventListener('DOMContentLoaded', async () => {
  const enabledCheckbox = document.getElementById('enabled');
  const redirectUrlInput = document.getElementById('redirectUrl');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const status = document.getElementById('status');

  // 저장된 설정 불러오기
  const data = await chrome.storage.sync.get(['redirectUrl', 'enabled', 'lastRedirectDate']);
  
  enabledCheckbox.checked = data.enabled !== false; // 기본값 true
  redirectUrlInput.value = data.redirectUrl || 'https://www.dailyq.my';

  // 상태 메시지 표시 함수
  function showStatus(message, isError = false) {
    status.textContent = message;
    status.className = `status ${isError ? 'error' : 'success'}`;
    status.style.display = 'block';
    
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }

  // URL 유효성 검증 및 자동 보정 함수
  function normalizeUrl(string) {
    if (!string) return null;
    
    let url = string.trim();
    
    // 프로토콜이 없으면 https:// 추가
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    try {
      new URL(url);
      return url;
    } catch (_) {
      return null;
    }
  }
  
  // URL 유효성 검증 함수
  function isValidUrl(string) {
    return normalizeUrl(string) !== null;
  }

  // 저장 버튼 클릭 이벤트
  saveBtn.addEventListener('click', async () => {
    const inputUrl = redirectUrlInput.value.trim();
    const enabled = enabledCheckbox.checked;

    if (!inputUrl) {
      showStatus('URL을 입력해주세요.', true);
      return;
    }

    const normalizedUrl = normalizeUrl(inputUrl);
    if (!normalizedUrl) {
      showStatus('올바른 URL 형식이 아닙니다.', true);
      return;
    }

    try {
      await chrome.storage.sync.set({
        redirectUrl: normalizedUrl,
        enabled: enabled
      });
      
      // 입력창에 정규화된 URL 표시
      redirectUrlInput.value = normalizedUrl;
      
      showStatus('설정이 저장되었습니다!');
    } catch (error) {
      showStatus('설정 저장 중 오류가 발생했습니다.', true);
      console.error('Error saving settings:', error);
    }
  });

  // 테스트 버튼 클릭 이벤트
  testBtn.addEventListener('click', async () => {
    const inputUrl = redirectUrlInput.value.trim();

    if (!inputUrl) {
      showStatus('먼저 URL을 입력해주세요.', true);
      return;
    }

    const normalizedUrl = normalizeUrl(inputUrl);
    if (!normalizedUrl) {
      showStatus('올바른 URL 형식이 아닙니다.', true);
      return;
    }

    try {
      // 오늘 날짜를 초기화하여 강제로 리다이렉트가 작동하도록 함
      await chrome.storage.sync.set({ lastRedirectDate: '' });
      
      // 새 탭에서 테스트 URL로 이동
      chrome.tabs.create({ url: normalizedUrl });
      
      showStatus('테스트 완료! 새 탭에서 확인하세요.');
    } catch (error) {
      showStatus('테스트 중 오류가 발생했습니다.', true);
      console.error('Error during test:', error);
    }
  });

  // Enter 키로 저장
  redirectUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveBtn.click();
    }
  });

  // 체크박스 변경 시 즉시 저장
  enabledCheckbox.addEventListener('change', async () => {
    try {
      const data = await chrome.storage.sync.get(['redirectUrl']);
      await chrome.storage.sync.set({
        enabled: enabledCheckbox.checked,
        redirectUrl: data.redirectUrl || 'https://www.dailyq.my'
      });
      
      showStatus(`기능이 ${enabledCheckbox.checked ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      showStatus('설정 변경 중 오류가 발생했습니다.', true);
      console.error('Error changing enabled state:', error);
    }
  });
});
