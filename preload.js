const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bridge', {
  offerBlessing: (payload) => ipcRenderer.send('offer-blessing', payload),
  hideOverlay: () => ipcRenderer.send('hide-overlay'),
  onSpawnIncense: (fn) => ipcRenderer.on('spawn-incense', () => fn()),
  onDismissIncense: (fn) => ipcRenderer.on('dismiss-incense', () => fn()),
  onConfigUpdated: (fn) => ipcRenderer.on('config-updated', (_event, payload) => fn(payload)),
});
