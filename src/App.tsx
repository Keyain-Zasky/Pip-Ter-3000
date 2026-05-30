import { useState, useEffect, useRef } from 'react';
import { TerminalTab } from './components/TerminalTab';
import { SettingsPanel } from './components/SettingsPanel';
import { SavedSessionsPanel, SavedSession } from './components/SavedSessionsPanel';

interface Settings {
  theme: string;
  fontFamily: string;
  fontSize: number;
  crtCurvature: boolean;
  glowIntensity: number;
  flickerIntensity: number;
  scanlineIntensity: number;
  scanlineSpeed: number;
  chromaticAberration: number;
  glassOpacity: number;
  glassBlur: number;
  soundEnabled: boolean;
  keystrokeSound: string;
  customBackground: string;
  backgroundOpacity: number;
  terminalBgOpacity: number;
  tabFontSize: number;
  bezelEnabled: boolean;
  glassReflection: boolean;
  jitterAmount: number;
  staticNoiseIntensity: number;
  // Custom Color Palette Properties
  foreground: string;
  background: string;
  cursor: string;
  ansiRed: string;
  ansiGreen: string;
  ansiYellow: string;
  ansiCyan: string;
}

interface Tab {
  id: string;
  name: string;
  shell: string;
  args: string[];
  env?: Record<string, string>;
}

// Extends Window to host sound synthesizers
declare global {
  interface Window {
    playKeystrokeSound?: () => void;
  }
}

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const tabsRef = useRef(tabs);
  const activeTabIdRef = useRef(activeTabId);

  useEffect(() => {
    tabsRef.current = tabs;
    activeTabIdRef.current = activeTabId;
  }, [tabs, activeTabId]);

  // Global custom event listeners for tab shortcuts
  useEffect(() => {
    const onNewTab = () => {
      addTab('/bin/bash', [], 'Bash');
    };

    const onCloseTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      const targetId = customEvent.detail?.id || activeTabIdRef.current;
      if (targetId) {
        closeTab(targetId);
      }
    };

    const onNextTab = () => {
      const currentTabs = tabsRef.current;
      if (currentTabs.length <= 1) return;
      const idx = currentTabs.findIndex(t => t.id === activeTabIdRef.current);
      const nextIdx = (idx + 1) % currentTabs.length;
      setActiveTabId(currentTabs[nextIdx].id);
    };

    const onPrevTab = () => {
      const currentTabs = tabsRef.current;
      if (currentTabs.length <= 1) return;
      const idx = currentTabs.findIndex(t => t.id === activeTabIdRef.current);
      const prevIdx = (idx - 1 + currentTabs.length) % currentTabs.length;
      setActiveTabId(currentTabs[prevIdx].id);
    };

    window.addEventListener('app:new-tab', onNewTab);
    window.addEventListener('app:close-tab', onCloseTab);
    window.addEventListener('app:next-tab', onNextTab);
    window.addEventListener('app:prev-tab', onPrevTab);

    // Also handle keys globally if xterm isn't focused
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyT') {
        e.preventDefault();
        onNewTab();
      }
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyW') {
        e.preventDefault();
        onCloseTab(new CustomEvent('app:close-tab'));
      }
      if (e.ctrlKey && !e.shiftKey && e.code === 'Tab') {
        e.preventDefault();
        onNextTab();
      }
      if (e.ctrlKey && e.shiftKey && e.code === 'Tab') {
        e.preventDefault();
        onPrevTab();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('app:new-tab', onNewTab);
      window.removeEventListener('app:close-tab', onCloseTab);
      window.removeEventListener('app:next-tab', onNextTab);
      window.removeEventListener('app:prev-tab', onPrevTab);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [settings, setSettings] = useState<Settings>({
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
    backgroundOpacity: 0.2,
    terminalBgOpacity: 0.2,
    tabFontSize: 14,
    bezelEnabled: true,
    glassReflection: true,
    jitterAmount: 1,
    staticNoiseIntensity: 0.03,
    foreground: '#33ff33',
    background: '#0c0f0a',
    cursor: '#33ff33',
    ansiRed: '#ff3333',
    ansiGreen: '#33ff33',
    ansiYellow: '#ffff33',
    ansiCyan: '#33ffff'
  });

  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  // Load configuration from Electron Store/filesystem on launch
  useEffect(() => {
    (async () => {
      try {
        const config = await (window as any).api.config.load();
        if (config) {
          if (config.settings) setSettings(prev => ({ ...prev, ...config.settings }));
          if (config.savedSessions) setSavedSessions(config.savedSessions);
          
          // Open default tab if config loaded
          if (config.savedSessions && config.savedSessions.length > 0) {
            // Find default or use first session
            openSessionTab(config.savedSessions[0]);
          } else {
            // Backup tab
            addTab('/bin/bash', [], 'Bash');
          }
        }
      } catch (err) {
        console.error('Failed loading Electron configuration', err);
        // Failover
        addTab('/bin/bash', [], 'Bash');
      }
    })();
  }, []);

  // Save config changes back to Node fs on settings/sessions update
  const saveConfig = (newSettings?: Settings, newSessions?: SavedSession[]) => {
    const finalSettings = newSettings || settings;
    const finalSessions = newSessions || savedSessions;
    (window as any).api.config.save({
      settings: finalSettings,
      savedSessions: finalSessions
    });
  };

  // Dynamically set CSS custom variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--glow-intensity', String(settings.glowIntensity));
    root.style.setProperty('--flicker-intensity', String(settings.flickerIntensity));
    root.style.setProperty('--scanline-intensity', String(settings.scanlineIntensity));
    root.style.setProperty('--scanline-speed', `${settings.scanlineSpeed}s`);
    root.style.setProperty('--chromatic-aberration', `${settings.chromaticAberration}px`);
    root.style.setProperty('--glass-opacity', String(settings.glassOpacity));
    root.style.setProperty('--glass-blur', `${settings.glassBlur}px`);
    root.style.setProperty('--font-family', settings.fontFamily);
    root.style.setProperty('--terminal-bg-opacity', String(settings.terminalBgOpacity));
    root.style.setProperty('--jitter-amount', String(settings.jitterAmount));
    root.style.setProperty('--static-noise-intensity', String(settings.staticNoiseIntensity));

    const hexToRgb = (hex: string) => {
      const cleaned = hex.replace('#', '');
      const num = parseInt(cleaned, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `${isNaN(r) ? 0 : r}, ${isNaN(g) ? 0 : g}, ${isNaN(b) ? 0 : b}`;
    };

    // Apply color palettes
    const primary = settings.foreground || '#33ff33';
    const bg = settings.background || '#0c0f0a';
    const bgRgb = hexToRgb(bg);
    const border = primary;
    const glow = `rgba(${hexToRgb(primary)}, 0.6)`;

    root.style.setProperty('--fg-color', primary);
    root.style.setProperty('--border-color', border);
    root.style.setProperty('--glow-color', glow);
    root.style.setProperty('--bg-color', bg);
    root.style.setProperty('--bg-color-rgb', bgRgb);
    root.style.setProperty('--flicker-intensity-factor', String(settings.flickerIntensity));

    // Update SVG filter dx offsets directly in the DOM
    const redOffset = document.querySelector('#rgb-split feOffset[result="red-offset"]');
    const blueOffset = document.querySelector('#rgb-split feOffset[result="blue-offset"]');
    if (redOffset) redOffset.setAttribute('dx', String(settings.chromaticAberration));
    if (blueOffset) blueOffset.setAttribute('dx', String(-settings.chromaticAberration));
  }, [settings]);

  // Keystroke sound synthesizer (Web Audio API)
  useEffect(() => {
    let audioCtx: AudioContext | null = null;

    const playKeystroke = () => {
      if (!settings.soundEnabled) return;
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (settings.keystrokeSound === 'typewriter') {
          // Synthetic high pitch clack
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(450, now);
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

          filter.type = 'bandpass';
          filter.frequency.value = 1200;
          filter.Q.value = 4;

          gainNode.gain.setValueAtTime(0.04, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

          osc.start(now);
          osc.stop(now + 0.06);
        } else if (settings.keystrokeSound === 'mechanical') {
          // Synthesise low clunk + high tick
          osc.type = 'sine';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

          filter.type = 'lowpass';
          filter.frequency.value = 500;

          gainNode.gain.setValueAtTime(0.08, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

          osc.start(now);
          osc.stop(now + 0.08);
        } else {
          // Cyber beep click
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, now);
          gainNode.gain.setValueAtTime(0.02, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

          osc.start(now);
          osc.stop(now + 0.02);
        }
      } catch (err) {
        console.error('Audio synthesizer error', err);
      }
    };

    window.playKeystrokeSound = playKeystroke;

    const playBell = () => {
      if (!settings.soundEnabled) return;
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        // Vintage high-pitch bell beep (800Hz decaying sine wave)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);

        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
      } catch (err) {
        console.error('Audio synthesizer bell error', err);
      }
    };
    (window as any).playBellSound = playBell;

    return () => {
      window.playKeystrokeSound = undefined;
      (window as any).playBellSound = undefined;
    };
  }, [settings.soundEnabled, settings.keystrokeSound]);

  const addTab = (shell: string, args: string[], name: string, env?: Record<string, string>) => {
    const id = `tab-${Math.random().toString(36).substr(2, 9)}`;
    const newTab = { id, name, shell, args, env };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);
  };
  const closeTab = (id: string) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === id);
      const updated = prev.filter(t => t.id !== id);
      if (activeTabId === id) {
        if (updated.length > 0) {
          const nextActive = updated[idx] || updated[idx - 1];
          if (nextActive) {
            setActiveTabId(nextActive.id);
          } else {
            setActiveTabId('');
          }
        } else {
          setActiveTabId('');
        }
      }
      return updated;
    });
  };

  const openSessionTab = (session: SavedSession) => {
    if (session.type === 'ssh') {
      const sshArgs = [
        '-p', String(session.port || 22),
        ...(session.keyPath ? ['-i', session.keyPath] : []),
        `${session.user}@${session.host}`,
        ...(session.startupCmd ? ['-t', session.startupCmd] : [])
      ];
      addTab('ssh', sshArgs, `SSH: ${session.name}`);
    } else {
      addTab(session.shell || '/bin/bash', session.args || [], session.name);
    }
    setIsSessionsOpen(false);
  };

  const getThemeDefaultSettings = (themeName: string): Settings => {
    const base = {
      theme: themeName,
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
      backgroundOpacity: 0.2,
      terminalBgOpacity: 0.2,
      tabFontSize: 14,
      bezelEnabled: true,
      glassReflection: true,
      jitterAmount: 1,
      staticNoiseIntensity: 0.03,
      foreground: '#33ff33',
      background: '#0c0f0a',
      cursor: '#33ff33',
      ansiRed: '#ff3333',
      ansiGreen: '#33ff33',
      ansiYellow: '#ffff33',
      ansiCyan: '#33ffff'
    };

    switch (themeName) {
      case 'amber-fallout':
        return {
          ...base,
          foreground: '#ffb000', background: '#0e0802', cursor: '#ffb000',
          ansiRed: '#ff3333', ansiGreen: '#ffb000', ansiYellow: '#ffcc00', ansiCyan: '#33b0ff',
          glowIntensity: 1.5, flickerIntensity: 0.15, scanlineIntensity: 0.35, chromaticAberration: 1.5, crtCurvature: true, bezelEnabled: true
        };
      case 'cyan-matrix':
        return {
          ...base,
          fontFamily: 'Share Tech Mono',
          foreground: '#00ffff', background: '#030a0d', cursor: '#00ffff',
          ansiRed: '#ff3388', ansiGreen: '#33ff99', ansiYellow: '#ffff33', ansiCyan: '#00ffff',
          glowIntensity: 1.4, flickerIntensity: 0.1, scanlineIntensity: 0.3, chromaticAberration: 1.0, crtCurvature: true, bezelEnabled: false
        };
      case 'red-alert':
        return {
          ...base,
          foreground: '#ff3333', background: '#0f0202', cursor: '#ff3333',
          ansiRed: '#ff0000', ansiGreen: '#ff5555', ansiYellow: '#ffaa00', ansiCyan: '#ff33ff',
          glowIntensity: 1.8, flickerIntensity: 0.35, scanlineIntensity: 0.5, chromaticAberration: 3.5, crtCurvature: true, bezelEnabled: true, jitterAmount: 4
        };
      case 'dracula':
        return {
          ...base,
          fontFamily: 'Fira Code',
          foreground: '#f8f8f2', background: '#282a36', cursor: '#f8f8f2',
          ansiRed: '#ff5555', ansiGreen: '#50fa7b', ansiYellow: '#f1fa8c', ansiCyan: '#8be9fd',
          glowIntensity: 0.4, flickerIntensity: 0.0, scanlineIntensity: 0.0, chromaticAberration: 0.0, crtCurvature: false, bezelEnabled: false, glassReflection: false, staticNoiseIntensity: 0.0, jitterAmount: 0
        };
      case 'nord':
        return {
          ...base,
          fontFamily: 'Fira Code',
          foreground: '#d8dee9', background: '#2e3440', cursor: '#d8dee9',
          ansiRed: '#bf616a', ansiGreen: '#a3be8c', ansiYellow: '#ebcb8b', ansiCyan: '#88c0d0',
          glowIntensity: 0.2, flickerIntensity: 0.0, scanlineIntensity: 0.0, chromaticAberration: 0.0, crtCurvature: false, bezelEnabled: false, glassReflection: false, staticNoiseIntensity: 0.0, jitterAmount: 0
        };
      case 'synthwave':
        return {
          ...base,
          fontFamily: 'Share Tech Mono',
          foreground: '#fede5d', background: '#2b0f54', cursor: '#f92aad',
          ansiRed: '#ff5555', ansiGreen: '#3dd674', ansiYellow: '#fede5d', ansiCyan: '#2de2e6',
          glowIntensity: 1.8, flickerIntensity: 0.1, scanlineIntensity: 0.4, chromaticAberration: 3.0, crtCurvature: false, bezelEnabled: false, glassReflection: true
        };
      case 'tokyo-night':
        return {
          ...base,
          fontFamily: 'Fira Code',
          foreground: '#c0caf5', background: '#1a1b26', cursor: '#c0caf5',
          ansiRed: '#f7768e', ansiGreen: '#9ece6a', ansiYellow: '#e0af68', ansiCyan: '#7dcfff',
          glowIntensity: 0.5, flickerIntensity: 0.0, scanlineIntensity: 0.1, chromaticAberration: 0.5, crtCurvature: false, bezelEnabled: false
        };
      case 'virtual-boy':
        return {
          ...base,
          foreground: '#ff0000', background: '#050000', cursor: '#ff0000',
          ansiRed: '#ff0000', ansiGreen: '#ff3333', ansiYellow: '#ff6600', ansiCyan: '#ff33ff',
          glowIntensity: 2.8, flickerIntensity: 0.6, scanlineIntensity: 0.7, chromaticAberration: 6.0, crtCurvature: true, bezelEnabled: true, jitterAmount: 5, staticNoiseIntensity: 0.08
        };
      case 'rad-active':
        return {
          ...base,
          foreground: '#adff2f', background: '#020d00', cursor: '#adff2f',
          ansiRed: '#ff3333', ansiGreen: '#adff2f', ansiYellow: '#ffff00', ansiCyan: '#33ffcc',
          glowIntensity: 2.2, flickerIntensity: 0.3, scanlineIntensity: 0.6, chromaticAberration: 4.0, crtCurvature: true, bezelEnabled: true, jitterAmount: 3, staticNoiseIntensity: 0.06
        };
      case 'cyberpunk-overload':
        return {
          ...base,
          fontFamily: 'Share Tech Mono',
          foreground: '#ff00ff', background: '#0d0014', cursor: '#00ffff',
          ansiRed: '#ff0055', ansiGreen: '#00ffcc', ansiYellow: '#ffff00', ansiCyan: '#00ffff',
          glowIntensity: 2.2, flickerIntensity: 0.2, scanlineIntensity: 0.5, chromaticAberration: 5.0, crtCurvature: false, bezelEnabled: false
        };
      case 'gameboy-lcd':
        return {
          ...base,
          foreground: '#306230', background: '#9bbc0f', cursor: '#306230',
          ansiRed: '#aaaaaa', ansiGreen: '#306230', ansiYellow: '#8bac0f', ansiCyan: '#306230',
          glowIntensity: 0.0, flickerIntensity: 0.0, scanlineIntensity: 0.15, chromaticAberration: 0.0, crtCurvature: false, bezelEnabled: true, glassReflection: false, staticNoiseIntensity: 0.02, jitterAmount: 0
        };
      case 'default-green':
      default:
        return base;
    }
  };

  const handleUpdateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      let updated = { ...prev, ...newSettings };
      
      // Auto-load matching preset details on theme change
      if (newSettings.theme && newSettings.theme !== prev.theme) {
        updated = getThemeDefaultSettings(newSettings.theme);
      }
      
      saveConfig(updated, undefined);
      return updated;
    });
  };

  const handleExportSettings = async () => {
    try {
      const success = await (window as any).api.config.export({ settings, savedSessions });
      if (success) {
        alert('Settings exported successfully!');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export settings.');
    }
  };

  const handleImportSettings = async () => {
    try {
      const imported = await (window as any).api.config.import();
      if (imported) {
        if (imported.settings) {
          setSettings(imported.settings);
        }
        if (imported.savedSessions) {
          setSavedSessions(imported.savedSessions);
        }
        saveConfig(imported.settings, imported.savedSessions);
        alert('Settings imported successfully!');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to import settings.');
    }
  };

  const handleAddSession = (newSession: Omit<SavedSession, 'id'>) => {
    const sessionWithId: SavedSession = {
      ...newSession,
      id: `session-${Math.random().toString(36).substr(2, 9)}`
    };
    setSavedSessions(prev => {
      const updated = [...prev, sessionWithId];
      saveConfig(undefined, updated);
      return updated;
    });
  };

  const handleDeleteSession = (id: string) => {
    setSavedSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveConfig(undefined, updated);
      return updated;
    });
  };

  // Window Controls
  const handleMinimize = () => (window as any).api.window.minimize();
  const handleMaximize = () => (window as any).api.window.maximize();
  const handleClose = () => (window as any).api.window.close();

  // Determine media element properties
  const isVideoBackground = settings.customBackground && (
    settings.customBackground.endsWith('.mp4') || 
    settings.customBackground.endsWith('.webm')
  );

  return (
    <div className="app-container">
      {/* Titlebar window headers */}
      <div className="titlebar">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span className="window-title">⚡ Pip-Ter 3000</span>
        </div>

        {/* Tab Headers Row */}
        <div style={{ display: 'flex', flex: 1, marginLeft: '20px', gap: '4px', overflowX: 'auto', WebkitAppRegion: 'no-drag' } as any}>
          {tabs.map(t => (
            <div 
              key={t.id} 
              onClick={() => setActiveTabId(t.id)}
              onDoubleClick={() => {
                setEditingTabId(t.id);
                setEditingName(t.name);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                border: '1px solid var(--border-color)',
                borderBottom: 'none',
                background: activeTabId === t.id ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.3)',
                boxShadow: activeTabId === t.id ? '0 -2px 5px var(--glow-color)' : 'none',
                opacity: activeTabId === t.id ? 1 : 0.6,
                cursor: 'pointer',
                borderRadius: '4px 4px 0 0',
                fontSize: `${settings.tabFontSize}px`
              }}
            >
              {editingTabId === t.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => {
                    if (editingName.trim()) {
                      setTabs(prev => prev.map(tab => tab.id === t.id ? { ...tab, name: editingName.trim() } : tab));
                    }
                    setEditingTabId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editingName.trim()) {
                        setTabs(prev => prev.map(tab => tab.id === t.id ? { ...tab, name: editingName.trim() } : tab));
                      }
                      setEditingTabId(null);
                    } else if (e.key === 'Escape') {
                      setEditingTabId(null);
                    }
                  }}
                  autoFocus
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--fg-color)',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    padding: '2px 4px',
                    width: '100px',
                    borderRadius: '2px',
                    outline: 'none'
                  }}
                />
              ) : (
                <span>{t.name}</span>
              )}
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(t.id);
                }}
                style={{ cursor: 'pointer', opacity: 0.7, padding: '0 2px' }}
              >
                ✕
              </span>
            </div>
          ))}
          <button 
            onClick={() => addTab('/bin/bash', [], 'Bash')}
            style={{
              background: 'transparent',
              border: '1px dashed var(--border-color)',
              color: 'var(--fg-color)',
              borderRadius: '4px 4px 0 0',
              padding: '2px 8px',
              cursor: 'pointer'
            }}
          >
            +
          </button>
        </div>

        {/* Electron minimize, max, close button handlers */}
        <div className="window-controls">
          <button className="control-btn minimize" onClick={handleMinimize} title="Minimize" />
          <button className="control-btn maximize" onClick={handleMaximize} title="Maximize" />
          <button className="control-btn close" onClick={handleClose} title="Close" />
        </div>
      </div>

      {/* Main layout */}
      <div className="main-layout">
        {/* Left vertical menu dock */}
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50px',
            borderRight: '2px solid var(--border-color)',
            background: 'rgba(0, 0, 0, 0.4)',
            alignItems: 'center',
            paddingTop: '20px',
            paddingBottom: '20px',
            justifyContent: 'space-between',
            zIndex: 10,
            boxSizing: 'border-box',
            flexShrink: 0,
            height: '100%'
          }}
        >
          {/* Top Icons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <button 
              className="close-drawer-btn" 
              style={{ 
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                boxSizing: 'border-box'
              }}
              onClick={() => { 
                setIsSessionsOpen(!isSessionsOpen); 
                setIsSettingsOpen(false); 
              }}
              title="Connections"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          </div>

          {/* Bottom Icons (Settings) */}
          <button 
            className="close-drawer-btn" 
            style={{ 
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              boxSizing: 'border-box'
            }}
            onClick={() => { 
              setIsSettingsOpen(!isSettingsOpen); 
              setIsSessionsOpen(false); 
            }}
            title="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06-.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
        {/* Custom background Media handler */}
        {settings.customBackground && (
          <div className="bg-media-container">
            {isVideoBackground ? (
              <video 
                className="bg-media" 
                src={settings.customBackground} 
                autoPlay 
                loop 
                muted 
                style={{ opacity: settings.backgroundOpacity }}
              />
            ) : (
              <img 
                className="bg-media" 
                src={settings.customBackground} 
                style={{ opacity: settings.backgroundOpacity }}
                alt="Background"
              />
            )}
          </div>
        )}

        {/* Connection sidebars */}
        <SavedSessionsPanel
          sessions={savedSessions}
          isOpen={isSessionsOpen}
          onClose={() => setIsSessionsOpen(false)}
          onSelectSession={openSessionTab}
          onAddSession={handleAddSession}
          onDeleteSession={handleDeleteSession}
        />

        {/* Setting sidebars */}
        <SettingsPanel
          settings={settings}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateSettings={handleUpdateSettings}
          onExportSettings={handleExportSettings}
          onImportSettings={handleImportSettings}
        />

        {/* Dynamic CRT and screen warpers */}
        <div 
          className={`screen-wrapper ${settings.crtCurvature ? 'crt-warp' : ''} ${settings.flickerIntensity > 0 ? 'screen-flicker' : ''} ${Number(settings.chromaticAberration) > 0 ? 'aberration-active' : ''} crt-jitter`}
          style={{
            margin: settings.crtCurvature ? '10px 15px 15px 15px' : '0px',
            height: '100%'
          }}
        >
          {settings.glassReflection && <div className="glass-reflection-overlay" />}
          {/* Static scanner and scanlines */}
          {settings.scanlineIntensity > 0 && <div className="scanlines scanlines-moving" />}
          <div className="static-noise" />

          {/* Render terminals tabs */}
          {tabs.map(t => (
            <TerminalTab
              key={t.id}
              id={t.id}
              active={t.id === activeTabId}
              sessionConfig={{ shell: t.shell, args: t.args }}
              settings={{
                theme: settings.theme,
                fontFamily: settings.fontFamily,
                fontSize: settings.fontSize,
                glowIntensity: settings.glowIntensity,
                foreground: settings.foreground,
                background: settings.background,
                cursor: settings.cursor,
                ansiRed: settings.ansiRed,
                ansiGreen: settings.ansiGreen,
                ansiYellow: settings.ansiYellow,
                ansiCyan: settings.ansiCyan
              }}
              onClose={() => closeTab(t.id)}
            />
          ))}

          {tabs.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              gap: '12px',
              fontFamily: 'Outfit, sans-serif',
              opacity: 0.7
            }}>
              <span style={{ fontSize: '2rem', animation: 'pulse 2s infinite' }}>📺 PIP-TER 3000</span>
              <span>All sessions closed. Open a connection from the Manager.</span>
              <button 
                className="close-drawer-btn"
                style={{ padding: '8px 16px' }}
                onClick={() => setIsSessionsOpen(true)}
              >
                Open Connection Manager
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
