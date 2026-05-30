const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  pty: {
    spawn: (options) => ipcRenderer.invoke('pty:spawn', options),
    write: (id, data) => ipcRenderer.send('pty:write', { id, data }),
    resize: (id, cols, rows) => ipcRenderer.send('pty:resize', { id, cols, rows }),
    kill: (id) => ipcRenderer.send('pty:kill', id),
    onData: (id, callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on(`pty:data:${id}`, listener);
      return () => {
        ipcRenderer.removeListener(`pty:data:${id}`, listener);
      };
    },
    onExit: (id, callback) => {
      const listener = (event, exitCode) => callback(exitCode);
      ipcRenderer.once(`pty:exit:${id}`, listener);
      return () => {
        ipcRenderer.removeListener(`pty:exit:${id}`, listener);
      };
    }
  },
  config: {
    load: () => ipcRenderer.invoke('config:load'),
    save: (config) => ipcRenderer.invoke('config:save', config),
    export: (configData) => ipcRenderer.invoke('config:export', configData),
    import: () => ipcRenderer.invoke('config:import')
  },
  system: {
    getShells: () => ipcRenderer.invoke('system:shells'),
    getStartupDir: () => ipcRenderer.invoke('system:startupDir')
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    onResized: (callback) => {
      const listener = (event, dimensions) => callback(dimensions);
      ipcRenderer.on('window:resized', listener);
      return () => {
        ipcRenderer.removeListener('window:resized', listener);
      };
    }
  }
});
