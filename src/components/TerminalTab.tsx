import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

interface TerminalTabProps {
  id: string;
  active: boolean;
  sessionConfig: {
    shell: string;
    args: string[];
    env?: Record<string, string>;
    cwd?: string;
  };
  settings: {
    theme: string;
    fontFamily: string;
    fontSize: number;
    glowIntensity: number;
    foreground?: string;
    background?: string;
    cursor?: string;
    ansiRed?: string;
    ansiGreen?: string;
    ansiYellow?: string;
    ansiCyan?: string;
    hotkeys?: Record<string, string>;
  };
  onClose: () => void;
}

declare global {
  interface Window {
    api: {
      pty: {
        spawn: (options: { shell: string; args: string[]; cols: number; rows: number; env?: Record<string, string>; cwd?: string }) => Promise<string>;
        write: (id: string, data: string) => void;
        resize: (id: string, cols: number, rows: number) => void;
        kill: (id: string) => void;
        onData: (id: string, callback: (data: string) => void) => () => void;
        onExit: (id: string, callback: (exitCode: number) => void) => () => void;
      };
      config: {
        load: () => Promise<any>;
        save: (config: any) => Promise<boolean>;
      };
      window: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        onResized?: (callback: (dimensions: { width: number; height: number }) => void) => () => void;
      };
    };
  }
}

const DEFAULT_HOTKEYS = {
  newTab: 'Ctrl+Shift+T',
  closeTab: 'Ctrl+Shift+W',
  nextTab: 'Ctrl+Tab',
  prevTab: 'Ctrl+Shift+Tab',
  splitVertical: 'Ctrl+Shift+E',
  splitHorizontal: 'Ctrl+Shift+O'
};

const getEventKeyCombo = (e: KeyboardEvent) => {
  const parts = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  if (e.metaKey) parts.push('Meta');
  
  if (e.key === 'Control' || e.key === 'Shift' || e.key === 'Alt' || e.key === 'Meta') {
    // Modifier key alone
  } else {
    if (e.key === 'Tab') {
      parts.push('Tab');
    } else {
      parts.push(e.key.toUpperCase());
    }
  }
  return parts.join('+');
};

export const TerminalTab: React.FC<TerminalTabProps> = ({
  id,
  active,
  sessionConfig,
  settings,
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const ptyIdRef = useRef<string | null>(null);

  // Setup terminal theme colors based on theme settings
  const getThemeColors = () => {
    let baseColors: any = {
      background: '#0c0f0a',
      foreground: '#33ff33',
      cursor: '#33ff33',
      black: '#000000',
      red: '#ff3333',
      green: '#33ff33',
      yellow: '#ffff33',
      blue: '#3333ff',
      magenta: '#ff33ff',
      cyan: '#33ffff',
      white: '#ffffff'
    };

    switch (settings.theme) {
      case 'amber-fallout':
        baseColors = { background: '#0e0802', foreground: '#ffb000', cursor: '#ffb000', red: '#ff3333', green: '#ffb000', yellow: '#ffcc00', cyan: '#33b0ff' };
        break;
      case 'cyan-matrix':
        baseColors = { background: '#030a0d', foreground: '#00ffff', cursor: '#00ffff', red: '#ff3388', green: '#33ff99', yellow: '#ffff33', cyan: '#00ffff' };
        break;
      case 'red-alert':
        baseColors = { background: '#0f0202', foreground: '#ff3333', cursor: '#ff3333', red: '#ff0000', green: '#ff5555', yellow: '#ffaa00', cyan: '#ff33ff' };
        break;
      case 'dracula':
        baseColors = { background: '#282a36', foreground: '#f8f8f2', cursor: '#f8f8f2', black: '#21222c', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c', blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2' };
        break;
      case 'nord':
        baseColors = { background: '#2e3440', foreground: '#d8dee9', cursor: '#d8dee9', black: '#3b4252', red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b', blue: '#81a1c1', magenta: '#b48ead', cyan: '#88c0d0', white: '#e5e9f0' };
        break;
      case 'synthwave':
        baseColors = { background: '#2b0f54', foreground: '#fede5d', cursor: '#f92aad', black: '#1a0933', red: '#f92aad', green: '#3dd674', yellow: '#fede5d', blue: '#2de2e6', magenta: '#f97e72', cyan: '#2de2e6', white: '#ffffff' };
        break;
      case 'tokyo-night':
        baseColors = { background: '#1a1b26', foreground: '#c0caf5', cursor: '#c0caf5', black: '#15161e', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68', blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#a9b1d6' };
        break;
      case 'virtual-boy':
        baseColors = { background: '#050000', foreground: '#ff0000', cursor: '#ff0000', red: '#ff0000', green: '#ff3333', yellow: '#ff6600', cyan: '#ff33ff' };
        break;
      case 'rad-active':
        baseColors = { background: '#020d00', foreground: '#adff2f', cursor: '#adff2f', red: '#ff3333', green: '#adff2f', yellow: '#ffff00', cyan: '#33ffcc' };
        break;
      case 'cyberpunk-overload':
        baseColors = { background: '#0d0014', foreground: '#ff00ff', cursor: '#00ffff', red: '#ff0055', green: '#00ffcc', yellow: '#ffff00', cyan: '#00ffff' };
        break;
      case 'gameboy-lcd':
        baseColors = { background: '#9bbc0f', foreground: '#306230', cursor: '#306230', red: '#aaaaaa', green: '#306230', yellow: '#8bac0f', cyan: '#306230' };
        break;
      case 'default-green':
      default:
        baseColors = { background: '#0c0f0a', foreground: '#33ff33', cursor: '#33ff33', red: '#ff3333', green: '#33ff33', yellow: '#ffff33', cyan: '#33ffff' };
        break;
    }

    return {
      ...baseColors,
      foreground: settings.foreground || baseColors.foreground,
      background: settings.background || baseColors.background,
      cursor: settings.cursor || baseColors.cursor,
      red: settings.ansiRed || baseColors.red,
      green: settings.ansiGreen || baseColors.green,
      yellow: settings.ansiYellow || baseColors.yellow,
      cyan: settings.ansiCyan || baseColors.cyan
    };
  };

  // Safe wrapper for fit addon execution
  const safeFit = () => {
    if (!activeRef.current || !containerRef.current || !fitAddonRef.current || !terminalRef.current) return null;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Don't invoke fit if the container is hidden or unstyled
    if (width <= 0 || height <= 0) return null;

    try {
      fitAddonRef.current.fit();
      return fitAddonRef.current.proposeDimensions();
    } catch (e) {
      console.warn("Bypassed xterm fit layout calculation error", e);
      return null;
    }
  };

  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    let activeCleanup: (() => void) | null = null;
    let isCleanedUp = false;

    const initTerminal = () => {
      if (isCleanedUp) return;
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      if (width <= 0 || height <= 0 || !activeRef.current) {
        // Retry shortly when the DOM has finished painting this element and the tab becomes active
        setTimeout(initTerminal, 50);
        return;
      }

      // Create Terminal instance safely
      const colors = getThemeColors();
      const term = new Terminal({
        cursorBlink: true,
        fontFamily: `${settings.fontFamily}, monospace`,
        fontSize: settings.fontSize,
        theme: {
          selectionBackground: 'rgba(255, 255, 255, 0.15)',
          ...colors,
          background: 'transparent',
          cursorAccent: colors.background
        },
        allowProposedApi: true,
        drawBoldTextInBrightColors: true,
        convertEol: true
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      // Defer DOM attachment and layout fitting slightly to let rendering stabilize
      setTimeout(() => {
        if (isCleanedUp || !containerRef.current) return;
        
        try {
          term.open(containerRef.current);
          terminalRef.current = term;
          fitAddonRef.current = fitAddon;

          // Get proposed dimensions
          let initialCols = 80;
          let initialRows = 24;
          try {
            fitAddon.fit();
            const dims = fitAddon.proposeDimensions();
            if (dims) {
              initialCols = dims.cols;
              initialRows = dims.rows;
            }
          } catch (e) {}

          // Spawn Backend PTY
          window.api.pty.spawn({
            shell: sessionConfig.shell,
            args: sessionConfig.args,
            cols: initialCols,
            rows: initialRows,
            env: sessionConfig.env,
            cwd: sessionConfig.cwd
          }).then((ptyId: string) => {
            if (isCleanedUp) {
              window.api.pty.kill(ptyId);
              return;
            }
            ptyIdRef.current = ptyId;

            // Handle Terminal Inputs -> PTY Write
            const onDataDisposable = term.onData((data: string) => {
              window.api.pty.write(ptyId, data);
              if (window.playKeystrokeSound) {
                window.playKeystrokeSound();
              }
            });

            // Handle Clipboard Copy/Paste and Tab shortcuts
            term.attachCustomKeyEventHandler((arg) => {
              // Ctrl+Shift+C (Copy Selection)
              if (arg.ctrlKey && arg.shiftKey && arg.code === 'KeyC' && arg.type === 'keydown') {
                arg.preventDefault();
                const selection = term.getSelection();
                if (selection) {
                  navigator.clipboard.writeText(selection);
                }
                return false; // Prevent sending to PTY
              }
              // Ctrl+Shift+V (Paste Clipboard text)
              if (arg.ctrlKey && arg.shiftKey && arg.code === 'KeyV' && arg.type === 'keydown') {
                arg.preventDefault();
                navigator.clipboard.readText().then((text) => {
                  window.api.pty.write(ptyId, text);
                });
                return false;
              }
              // Check if the key combination matches any active global hotkey.
              // If it does, prevent xterm.js from consuming it, allowing it to bubble.
              if (arg.type === 'keydown') {
                const currentHotkeys = settings.hotkeys || DEFAULT_HOTKEYS;
                const combo = getEventKeyCombo(arg);
                const isGlobalHotkey = Object.values(currentHotkeys).includes(combo);
                if (isGlobalHotkey) {
                  return false;
                }
              }
              return true;
            });

            // Handle PTY Bell Beep
            term.onBell(() => {
              if ((window as any).playBellSound) {
                (window as any).playBellSound();
              }
            });

            // Handle PTY Outputs -> Terminal Write
            const cleanupPtyData = window.api.pty.onData(ptyId, (data: string) => {
              let processed = data;
              // Match and color errors in standard text stream
              processed = processed.replace(/\b(Error|Exception|failed|Permission denied|command not found|FATAL|stderr)\b/g, '\x1b[31m$1\x1b[39m');
              // Match and color warnings
              processed = processed.replace(/\b(Warning|WARN|warning)\b/g, '\x1b[33m$1\x1b[39m');
              // Match and color common commands/executables in green
              processed = processed.replace(/\b(git|npm|node|yarn|pacman|systemctl|docker|sudo|ls|cd|cat|grep|mkdir|rm|cp|mv|chmod|chown)\b/g, '\x1b[32m$1\x1b[39m');
              
              term.write(processed);
            });

            const cleanupPtyExit = window.api.pty.onExit(ptyId, () => {
              onClose();
            });

            activeCleanup = () => {
              onDataDisposable.dispose();
              cleanupPtyData();
              cleanupPtyExit();
              window.api.pty.kill(ptyId);
            };
          });
        } catch (err) {
          console.error("Safely caught xterm layout failure during initialization:", err);
        }
      }, 100);
    };

    initTerminal();

    // ResizeObserver
    let resizeTimeout: any = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) {
        cancelAnimationFrame(resizeTimeout);
      }
      resizeTimeout = requestAnimationFrame(() => {
        if (activeRef.current && ptyIdRef.current) {
          const dims = safeFit();
          if (dims && dims.cols && dims.rows) {
            window.api.pty.resize(ptyIdRef.current, dims.cols, dims.rows);
          }
        }
      });
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      isCleanedUp = true;
      resizeObserver.disconnect();
      if (activeCleanup) {
        activeCleanup();
      }
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }
      if (ptyIdRef.current) {
        window.api.pty.kill(ptyIdRef.current);
        ptyIdRef.current = null;
      }
    };
  }, [id]);

  // Adjust theme dynamically when theme settings change
  useEffect(() => {
    if (terminalRef.current) {
      const colors = getThemeColors();
      terminalRef.current.options.fontSize = settings.fontSize;
      terminalRef.current.options.fontFamily = `${settings.fontFamily}, monospace`;
      terminalRef.current.options.theme = {
        ...colors,
        background: 'transparent',
        cursorAccent: colors.background
      };
      
      // Re-fit terminal
      setTimeout(() => {
        if (ptyIdRef.current) {
          const dims = safeFit();
          if (dims) {
            window.api.pty.resize(ptyIdRef.current, dims.cols, dims.rows);
          }
        }
      }, 50);
    }
  }, [
    settings.theme,
    settings.fontSize,
    settings.fontFamily,
    settings.foreground,
    settings.background,
    settings.cursor,
    settings.ansiRed,
    settings.ansiGreen,
    settings.ansiYellow,
    settings.ansiCyan
  ]);

  // Re-fit on active state toggle
  useEffect(() => {
    if (active && terminalRef.current && ptyIdRef.current) {
      setTimeout(() => {
        const dims = safeFit();
        if (dims && ptyIdRef.current) {
          window.api.pty.resize(ptyIdRef.current, dims.cols, dims.rows);
        }
      }, 50);
    }
  }, [active]);

  return (
    <div 
      className="terminal-instance-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        visibility: active ? 'visible' : 'hidden',
        pointerEvents: active ? 'auto' : 'none',
        opacity: active ? 1 : 0
      }}
    >
      <div 
        ref={containerRef} 
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};
