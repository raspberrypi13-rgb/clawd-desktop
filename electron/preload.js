const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 마우스 이벤트 투과 설정
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  // 창 숨기기
  hideWindow: () => ipcRenderer.send('hide-window'),
  // 외부 링크 열기
  openExternal: (url) => ipcRenderer.send('open-external', url),
  // 플랫폼 정보
  platform: process.platform,
  isDesktop: true,
});
