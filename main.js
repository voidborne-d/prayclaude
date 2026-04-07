const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');

let keybd_event, VkKeyScanA;
if (process.platform === 'win32') {
  try {
    const koffi = require('koffi');
    const user32 = koffi.load('user32.dll');
    keybd_event = user32.func('void __stdcall keybd_event(uint8_t bVk, uint8_t bScan, uint32_t dwFlags, uintptr_t dwExtraInfo)');
    VkKeyScanA = user32.func('int16_t __stdcall VkKeyScanA(int ch)');
  } catch (e) {
    console.warn('koffi not available, blessing macro disabled', e.message);
  }
}

let tray, overlay;
let overlayReady = false;
let spawnQueued = false;
let appConfig = null;

const VK_RETURN = 0x0D;
const VK_MENU = 0x12;
const VK_TAB = 0x09;
const KEYUP = 0x0002;

const defaultConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.default.json'), 'utf8'));

function deepMerge(base, override) {
  if (Array.isArray(base) || Array.isArray(override)) return override ?? base;
  if (!base || typeof base !== 'object') return override ?? base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      out[key] = deepMerge(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function getUserConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function loadConfig() {
  const userPath = getUserConfigPath();
  if (!fs.existsSync(userPath)) {
    fs.mkdirSync(path.dirname(userPath), { recursive: true });
    fs.writeFileSync(userPath, JSON.stringify(defaultConfig, null, 2));
    appConfig = defaultConfig;
    return appConfig;
  }
  try {
    const userConfig = JSON.parse(fs.readFileSync(userPath, 'utf8'));
    appConfig = deepMerge(defaultConfig, userConfig);
  } catch (err) {
    console.warn('Failed to parse user config, using defaults:', err.message);
    appConfig = defaultConfig;
  }
  return appConfig;
}

function resolveLanguage(preferred) {
  if (preferred && preferred !== 'auto') return preferred;
  const locale = app.getLocale().toLowerCase();
  return locale.startsWith('zh') ? 'zh' : 'en';
}

function blessingBank(lang) {
  return appConfig?.blessings?.[lang] || defaultConfig.blessings[lang] || defaultConfig.blessings.zh;
}

function refocusPreviousApp() {
  const delayMs = 80;
  const run = () => {
    if (process.platform === 'win32') {
      if (!keybd_event) return;
      keybd_event(VK_MENU, 0, 0, 0);
      keybd_event(VK_TAB, 0, 0, 0);
      keybd_event(VK_TAB, 0, KEYUP, 0);
      keybd_event(VK_MENU, 0, KEYUP, 0);
    } else if (process.platform === 'darwin') {
      const script = [
        'tell application "System Events"',
        '  key down command',
        '  key code 48',
        '  key up command',
        'end tell',
      ].join('\n');
      execFile('osascript', ['-e', script], err => {
        if (err) console.warn('refocus previous app failed:', err.message);
      });
    }
  };
  setTimeout(run, delayMs);
}

function createTrayIconFallback() {
  const p = path.join(__dirname, 'icon', 'Template.png');
  if (fs.existsSync(p)) {
    let img = nativeImage.createFromPath(p);
    if (!img.isEmpty()) {
      if (process.platform === 'darwin') {
        img = img.resize({ width: 20, height: 20, quality: 'best' });
        img.setTemplateImage(true);
      }
      return img;
    }
  }
  console.warn('prayclaude: icon/Template.png missing or invalid');
  return nativeImage.createEmpty();
}

async function getTrayIcon() {
  const iconDir = path.join(__dirname, 'icon');
  if (process.platform === 'win32') {
    const file = path.join(iconDir, 'icon.ico');
    if (fs.existsSync(file)) {
      const img = nativeImage.createFromPath(file);
      if (!img.isEmpty()) return img;
    }
    return createTrayIconFallback();
  }
  if (process.platform === 'darwin') {
    return createTrayIconFallback();
  }
  const png = path.join(iconDir, 'icon.png');
  if (fs.existsSync(png)) {
    let img = nativeImage.createFromPath(png);
    if (!img.isEmpty()) {
      img = img.resize({ width: 22, height: 22, quality: 'best' });
      return img;
    }
  }
  return createTrayIconFallback();
}

function createOverlay() {
  const { bounds } = screen.getPrimaryDisplay();
  overlay = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  overlay.setAlwaysOnTop(true, 'screen-saver');
  overlayReady = false;
  overlay.loadFile('overlay.html');
  overlay.webContents.on('did-finish-load', () => {
    overlayReady = true;
    overlay.webContents.send('config-updated', {
      language: resolveLanguage(appConfig.language),
      ritual: appConfig.ritual,
      playSound: appConfig.playSound,
      soundSet: appConfig.soundSet,
    });
    if (spawnQueued && overlay && overlay.isVisible()) {
      spawnQueued = false;
      overlay.webContents.send('spawn-incense');
      refocusPreviousApp();
    }
  });
  overlay.on('closed', () => {
    overlay = null;
    overlayReady = false;
    spawnQueued = false;
  });
}

function openConfigFile() {
  const configPath = getUserConfigPath();
  if (process.platform === 'darwin') {
    execFile('open', [configPath], () => {});
  } else if (process.platform === 'win32') {
    execFile('cmd', ['/c', 'start', '', configPath], () => {});
  }
}

function toggleOverlay() {
  if (overlay && overlay.isVisible()) {
    overlay.webContents.send('dismiss-incense');
    return;
  }
  if (!overlay) createOverlay();
  overlay.show();
  if (overlayReady) {
    overlay.webContents.send('config-updated', {
      language: resolveLanguage(appConfig.language),
      ritual: appConfig.ritual,
      playSound: appConfig.playSound,
      soundSet: appConfig.soundSet,
    });
    overlay.webContents.send('spawn-incense');
    refocusPreviousApp();
  } else {
    spawnQueued = true;
  }
}

ipcMain.on('offer-blessing', (_event, payload = {}) => {
  try {
    const lang = resolveLanguage(payload.lang || appConfig.language);
    refocusPreviousApp();
    setTimeout(() => {
      try {
        if (appConfig.sendOnBlessing) sendBlessing(lang, appConfig.pressEnter);
      } catch (err) {
        console.warn('delayed sendBlessing failed:', err?.message || err);
      }
    }, 90);
  } catch (err) {
    console.warn('sendBlessing failed:', err?.message || err);
  }
});

ipcMain.on('hide-overlay', () => {
  if (overlay) overlay.hide();
});

function pickBlessing(lang = 'zh') {
  const bank = blessingBank(lang);
  return bank[Math.floor(Math.random() * bank.length)];
}

function sendBlessing(lang, pressEnter = true) {
  const chosen = pickBlessing(lang);
  const finalText = chosen.startsWith('/btw') ? chosen : `/btw ${chosen}`;
  if (process.platform === 'win32') {
    sendBlessingWindows(finalText, pressEnter);
  } else if (process.platform === 'darwin') {
    sendBlessingMac(finalText, pressEnter);
  }
}

function sendBlessingWindows(text, pressEnter) {
  const safeText = /[^\x00-\x7F]/.test(text) ? pickBlessing('en') : text;
  if (!safeText) return;

  const escaped = safeText
    .replace(/`/g, '``')
    .replace(/"/g, '`"');

  const script = [
    'Add-Type -AssemblyName System.Windows.Forms',
    `[System.Windows.Forms.Clipboard]::SetText("${escaped}")`,
    '$wshell = New-Object -ComObject WScript.Shell',
    'Start-Sleep -Milliseconds 80',
    '$wshell.SendKeys("^v")',
    ...(pressEnter ? ['$wshell.SendKeys("{ENTER}")'] : []),
  ].join('; ');

  execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-STA', '-Command', script], err => {
    if (err) console.warn('windows blessing macro failed:', err.message);
  });
}

function sendBlessingMac(text, pressEnter) {
  const escapedShell = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\\$').replace(/`/g, '\\`');
  execFile('/bin/sh', ['-lc', `printf "%s" "${escapedShell}" | pbcopy`], shellErr => {
    if (shellErr) {
      console.warn('mac clipboard copy failed:', shellErr.message);
      return;
    }

    const script = [
      'tell application "System Events"',
      '  delay 0.08',
      '  keystroke "v" using {command down}',
      ...(pressEnter ? ['  delay 0.08', '  key code 36'] : []),
      'end tell'
    ].join('\n');

    execFile('osascript', ['-e', script], err => {
      if (err) console.warn('mac blessing macro failed:', err.message);
    });
  });
}

app.whenReady().then(async () => {
  loadConfig();
  tray = new Tray(await getTrayIcon());
  tray.setToolTip('PrayClaude, offer one calm blessing');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Offer Blessing', click: toggleOverlay },
      { label: 'Open Config', click: openConfigFile },
      { label: 'Reload Config', click: () => loadConfig() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  );
  tray.on('click', toggleOverlay);
});

app.on('window-all-closed', e => e.preventDefault());
