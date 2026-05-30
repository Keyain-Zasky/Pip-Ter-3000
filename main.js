const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const pty = require('node-pty');


// Enable transparency support with GPU hardware acceleration
// app.disableHardwareAcceleration(); // Disabled to allow GPU acceleration as requested

let mainWindow;
const ptyProcesses = new Map();

function getConfigFile() {
  const userPath = app.getPath('userData');
  return path.join(userPath, 'retropulse_config.json');
}

function loadConfig() {
  const file = getConfigFile();
  if (fs.existsSync(file)) {
    try {
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load config', e);
    }
  }
  // Default config
  return {
    themes: [],
    savedSessions: [
      {
        id: 'default-bash',
        name: 'Local Shell (Bash)',
        group: 'Local Connections',
        type: 'local',
        shell: '/bin/bash',
        args: []
      }
    ],
    settings: {
      theme: 'default-green',
      fontFamily: 'VT323',
      fontSize: 16,
      crtCurvature: true,
      glowIntensity: 1.2,
      flickerIntensity: 0.15,
      scanlineIntensity: 0.25,
      scanlineSpeed: 4,
      chromaticAberration: 0.15,
      glassOpacity: 0.85,
      glassBlur: 15,
      soundEnabled: true,
      keystrokeSound: 'typewriter',
      customBackground: '',
      backgroundOpacity: 0.2
    }
  };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(getConfigFile(), JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to save config', e);
    return false;
  }
}

function createWindow() {
  const config = loadConfig();
  
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    transparent: true,
    frame: false, // Frameless window for premium design
    show: false, // Don't show until rendering is stabilized
    hasShadow: false, // Prevent OS compositor shadows from breaking transparency/resizing on Linux
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load built files if in production or packaged; otherwise load Vite dev server
  if (process.env.NODE_ENV === 'production' || app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      const [width, height] = mainWindow.getSize();
      mainWindow.webContents.send('window:resized', { width, height });
    }
  });

  // Open external links in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('resize', () => {
    if (mainWindow) {
      mainWindow.webContents.invalidate();
      const [width, height] = mainWindow.getSize();
      mainWindow.webContents.send('window:resized', { width, height });
    }
  });

  mainWindow.on('closed', () => {
    // Kill all pty processes on close
    for (const [id, proc] of ptyProcesses.entries()) {
      try {
        proc.kill();
      } catch (e) {}
    }
    ptyProcesses.clear();
    mainWindow = null;
  });
}

// Append Chromium switches for optimal GPU performance and transparency on Linux compositors
app.commandLine.appendSwitch('ozone-platform', 'x11');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-oop-rasterization');
app.commandLine.appendSwitch('enable-transparent-visuals');

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC Communication for PTY ---

function getStartupDir() {
  for (let i = 2; i < process.argv.length; i++) {
    let arg = process.argv[i];
    if (arg.startsWith('file://')) {
      try {
        const { fileURLToPath } = require('url');
        arg = fileURLToPath(arg);
      } catch (e) {}
    }
    try {
      if (path.isAbsolute(arg) && fs.existsSync(arg) && fs.statSync(arg).isDirectory() && arg !== __dirname) {
        return arg;
      }
    } catch (e) {}
  }

  // Fallback to process.cwd() if it is a directory and not the application itself or root directory
  try {
    const currentCwd = process.cwd();
    if (currentCwd && currentCwd !== __dirname && currentCwd !== '/' && currentCwd !== path.dirname(__dirname)) {
      if (fs.existsSync(currentCwd) && fs.statSync(currentCwd).isDirectory()) {
        return currentCwd;
      }
    }
  } catch (e) {}

  return null;
}

ipcMain.handle('pty:spawn', (event, { shell, args, cols, rows, env = {}, cwd }) => {
  const id = `pty-${Math.random().toString(36).substr(2, 9)}`;
  const finalShell = shell || process.env.SHELL || '/bin/bash';
  const finalArgs = args || [];
  
  // Merge process environment
  const finalEnv = {
    ...process.env,
    ...env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor'
  };

  // Prevent npm-specific environment leakage into user terminal session (resolves NVM conflicts)
  delete finalEnv.npm_config_prefix;
  delete finalEnv.npm_package_name;
  delete finalEnv.npm_package_version;
  delete finalEnv.npm_lifecycle_event;

  const finalCwd = cwd || process.env.HOME;

  const ptyProcess = pty.spawn(finalShell, finalArgs, {
    name: 'xterm-color',
    cols: cols || 80,
    rows: rows || 24,
    cwd: finalCwd,
    env: finalEnv
  });

  ptyProcesses.set(id, ptyProcess);

  ptyProcess.onData((data) => {
    if (mainWindow) {
      mainWindow.webContents.send(`pty:data:${id}`, data);
    }
  });

  ptyProcess.onExit((exitCode) => {
    if (mainWindow) {
      mainWindow.webContents.send(`pty:exit:${id}`, exitCode);
    }
    ptyProcesses.delete(id);
  });

  return id;
});

ipcMain.on('pty:write', (event, { id, data }) => {
  const ptyProcess = ptyProcesses.get(id);
  if (ptyProcess) {
    ptyProcess.write(data);
  }
});

ipcMain.on('pty:resize', (event, { id, cols, rows }) => {
  const ptyProcess = ptyProcesses.get(id);
  if (ptyProcess && cols && rows) {
    try {
      ptyProcess.resize(cols, rows);
    } catch (e) {
      console.error('Error resizing pty', e);
    }
  }
});

ipcMain.on('pty:kill', (event, id) => {
  const ptyProcess = ptyProcesses.get(id);
  if (ptyProcess) {
    try {
      ptyProcess.kill();
    } catch (e) {}
    ptyProcesses.delete(id);
  }
});

// Window controls IPC
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

// System shells detection IPC
ipcMain.handle('system:shells', () => {
  try {
    const file = '/etc/shells';
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    }
  } catch (e) {
    console.error('Failed reading /etc/shells', e);
  }
  // Fallback common shells
  return ['/bin/bash', '/bin/sh'];
});

ipcMain.handle('system:startupDir', () => {
  return getStartupDir();
});

// Config IPC
ipcMain.handle('config:load', () => {
  return loadConfig();
});

ipcMain.handle('config:save', (event, config) => {
  return saveConfig(config);
});

// Settings file dialog handlers
ipcMain.handle('config:export', async (event, configData) => {
  const { dialog } = require('electron');
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export RetroPulse Settings',
    defaultPath: 'retropulse_settings.json',
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });
  if (filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(configData, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Failed to export settings file', e);
    }
  }
  return false;
});

ipcMain.handle('config:import', async (event) => {
  const { dialog } = require('electron');
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Import RetroPulse Settings',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (filePaths && filePaths.length > 0) {
    try {
      const content = fs.readFileSync(filePaths[0], 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to import settings file', e);
    }
  }
  return null;
});
