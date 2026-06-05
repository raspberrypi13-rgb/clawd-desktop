const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isQuitting = false;

// 단일 인스턴스 잠금
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

function createWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  // 투명 배경의 창 생성 (데스크탑 펫 스타일)
  mainWindow = new BrowserWindow({
    width: sw,
    height: sh,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    focusable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Groq API CORS 허용
    },
    icon: path.join(__dirname, '..', 'icons', 'icon-192.png'),
    title: 'Clawd',
  });

  // 클릭 투과 설정 (클라드 본체 외 영역)
  mainWindow.setIgnoreMouseEvents(false);

  // 타스크바에 표시
  mainWindow.setSkipTaskbar(false);

  // HTML 파일 로드
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // 창 닫기 버튼 → 트레이로 최소화
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // DevTools (개발 중)
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'icons', 'icon-192.png');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('🦀 Clawd - 데스크탑 펫');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🦀 Clawd 보이기',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    { type: 'separator' },
    {
      label: '항상 위에 표시',
      type: 'checkbox',
      checked: true,
      click: (item) => {
        mainWindow.setAlwaysOnTop(item.checked);
      }
    },
    { type: 'separator' },
    {
      label: '🐙 GitHub',
      click: () => shell.openExternal('https://github.com/anthropics/anthropic-quickstarts')
    },
    { type: 'separator' },
    {
      label: '❌ 종료',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.focus();
    } else {
      mainWindow.show();
    }
  });
}

// IPC 핸들러: 렌더러 → 메인 통신
ipcMain.on('set-ignore-mouse', (_, ignore) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

ipcMain.on('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('open-external', (_, url) => {
  shell.openExternal(url);
});

// 앱 준비 완료
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
});
