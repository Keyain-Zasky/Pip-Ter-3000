import React from 'react';

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
  foreground: string;
  background: string;
  cursor: string;
  ansiRed: string;
  ansiGreen: string;
  ansiYellow: string;
  ansiCyan: string;
}

interface SettingsPanelProps {
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  isOpen: boolean;
  onClose: () => void;
  onExportSettings: () => void;
  onImportSettings: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  isOpen,
  onClose,
  onExportSettings,
  onImportSettings
}) => {
  if (!isOpen) return null;

  const fontOptions = [
    { label: 'VT323 (Fallout Retro)', value: 'VT323' },
    { label: 'Share Tech Mono (Modern Retro)', value: 'Share Tech Mono' },
    { label: 'Courier Prime (Typewriter)', value: 'Courier Prime' },
    { label: 'Fira Code (Modern Dev)', value: 'Fira Code' },
    { label: 'System Monospace', value: 'monospace' }
  ];

  const themePresets = [
    { label: 'Pip-Boy Green (Fallout)', value: 'default-green' },
    { label: 'Amber Terminal (Retro)', value: 'amber-fallout' },
    { label: 'Cyan Matrix (Hacker)', value: 'cyan-matrix' },
    { label: 'Red Alert (Caution)', value: 'red-alert' },
    { label: 'Dracula (Dark Theme)', value: 'dracula' },
    { label: 'Nord (Frost Classic)', value: 'nord' },
    { label: 'Synthwave Glow (Neon)', value: 'synthwave' },
    { label: 'Tokyo Night (Sleek)', value: 'tokyo-night' },
    { label: 'Virtual Boy (Blood Red)', value: 'virtual-boy' },
    { label: 'Radioactive (Toxic Green)', value: 'rad-active' },
    { label: 'Cyberpunk (Pink/Cyan)', value: 'cyberpunk-overload' },
    { label: 'LCD Game Boy (Mono)', value: 'gameboy-lcd' }
  ];

  const soundOptions = [
    { label: 'Classic Typewriter', value: 'typewriter' },
    { label: 'Vintage Mechanical', value: 'mechanical' },
    { label: 'Cyber Click', value: 'click' }
  ];

  return (
    <div className="settings-drawer-overlay" style={{
      position: 'absolute',
      top: 0,
      left: '50px',
      width: '320px',
      height: '100%',
      backgroundColor: 'var(--bg-color)',
      borderRight: '2px solid var(--border-color)',
      color: 'var(--fg-color)',
      textShadow: '0 0 calc(4px * var(--glow-intensity)) var(--glow-color)',
      fontFamily: 'var(--font-family)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      boxShadow: '10px 0 30px rgba(0,0,0,0.8)',
      boxSizing: 'border-box',
      animation: 'slide-in-left 0.25s ease-out',
      overflowY: 'auto'
    }}>
      <style>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .setting-row {
          margin-bottom: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .setting-label {
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.8;
          color: var(--fg-color);
        }
        .setting-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--fg-color);
          padding: 6px;
          font-family: inherit;
          border-radius: 4px;
          outline: none;
        }
        .setting-input option {
          background-color: var(--bg-color) !important;
          color: var(--fg-color) !important;
        }
        .setting-slider {
          -webkit-appearance: none;
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          height: 4px;
          border-radius: 2px;
          outline: none;
        }
        .setting-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--fg-color);
          cursor: pointer;
          box-shadow: 0 0 5px var(--glow-color);
        }
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
          margin-bottom: 16px;
        }
      `}</style>

      <div className="settings-header">
        <h3 style={{ margin: 0, fontSize: '1.2rem', textShadow: '0 0 5px var(--glow-color)' }}>Terminal Settings</h3>
        <button className="close-drawer-btn" onClick={onClose}>Close</button>
      </div>

      <div className="setting-row">
        <label className="setting-label">Style / Preset Theme</label>
        <select 
          className="setting-input" 
          value={settings.theme}
          onChange={(e) => onUpdateSettings({ theme: e.target.value })}
        >
          {themePresets.map((t) => (
            <option key={t.value} value={t.value} style={{ background: '#111' }}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="setting-row">
        <label className="setting-label">Font Family</label>
        <select 
          className="setting-input" 
          value={settings.fontFamily}
          onChange={(e) => onUpdateSettings({ fontFamily: e.target.value })}
        >
          {fontOptions.map((f) => (
            <option key={f.value} value={f.value} style={{ background: '#111' }}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="setting-row">
        <label className="setting-label">Font Size ({settings.fontSize}px)</label>
        <input 
          type="range" 
          min="10" 
          max="28" 
          className="setting-slider" 
          value={settings.fontSize}
          onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value) })}
        />
      </div>

      <div className="setting-row" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="setting-label">CRT Curved Bending</span>
        <input 
          type="checkbox" 
          checked={settings.crtCurvature}
          onChange={(e) => onUpdateSettings({ crtCurvature: e.target.checked })}
          style={{ width: '18px', height: '18px', accentColor: 'var(--fg-color)' }}
        />
      </div>

      <div className="setting-row">
        <label className="setting-label">Phosphor Glow ({settings.glowIntensity})</label>
        <input 
          type="range" 
          min="0" 
          max="5" 
          step="0.05"
          className="setting-slider" 
          value={settings.glowIntensity}
          onChange={(e) => onUpdateSettings({ glowIntensity: parseFloat(e.target.value) })}
        />
      </div>

      <div className="setting-row">
        <label className="setting-label">Screen Flicker ({settings.flickerIntensity})</label>
        <input 
          type="range" 
          min="0" 
          max="1.0" 
          step="0.01"
          className="setting-slider" 
          value={settings.flickerIntensity}
          onChange={(e) => onUpdateSettings({ flickerIntensity: parseFloat(e.target.value) })}
        />
      </div>

      <div className="setting-row">
        <label className="setting-label">Scanline Strength ({settings.scanlineIntensity})</label>
        <input 
          type="range" 
          min="0" 
          max="1.0" 
          step="0.05"
          className="setting-slider" 
          value={settings.scanlineIntensity}
          onChange={(e) => onUpdateSettings({ scanlineIntensity: parseFloat(e.target.value) })}
        />
      </div>

      <div className="setting-row">
        <label className="setting-label">Scanline Roll Speed ({settings.scanlineSpeed}s)</label>
        <input 
          type="range" 
          min="0.2" 
          max="10" 
          step="0.05"
          className="setting-slider" 
          value={settings.scanlineSpeed}
          onChange={(e) => onUpdateSettings({ scanlineSpeed: parseFloat(e.target.value) })}
        />
      </div>

      <div className="setting-row">
        <label className="setting-label">RGB Chromatic Shift ({settings.chromaticAberration}px)</label>
        <input 
          type="range" 
          min="0" 
          max="15" 
          step="0.05"
          className="setting-slider" 
          value={settings.chromaticAberration}
          onChange={(e) => onUpdateSettings({ chromaticAberration: parseFloat(e.target.value) })}
        />
      </div>

      <div className="setting-row">
        <label className="setting-label">Glass Acrylic Blur ({settings.glassBlur}px)</label>
        <input 
          type="range" 
          min="0" 
          max="30" 
          className="setting-slider" 
          value={settings.glassBlur}
          onChange={(e) => onUpdateSettings({ glassBlur: parseInt(e.target.value) })}
        />
      </div>

      <div className="setting-row">
        <label className="setting-label">Glass Window Opacity ({Math.round(settings.glassOpacity * 100)}%)</label>
        <input 
          type="range" 
          min="0.1" 
          max="1" 
          step="0.05"
          className="setting-slider" 
          value={settings.glassOpacity}
          onChange={(e) => onUpdateSettings({ glassOpacity: parseFloat(e.target.value) })}
        />
      </div>

      <div className="setting-row">
        <label className="setting-label">Terminal BG Opacity ({Math.round(settings.terminalBgOpacity * 100)}%)</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05"
          className="setting-slider" 
          value={settings.terminalBgOpacity}
          onChange={(e) => onUpdateSettings({ terminalBgOpacity: parseFloat(e.target.value) })}
        />
      </div>

      <div className="setting-row">
        <label className="setting-label">Tab Font Size ({settings.tabFontSize}px)</label>
        <input 
          type="range" 
          min="10" 
          max="24" 
          step="1"
          className="setting-slider" 
          value={settings.tabFontSize}
          onChange={(e) => onUpdateSettings({ tabFontSize: parseInt(e.target.value) })}
        />
      </div>



      <div className="setting-row" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="setting-label">Glass Reflection Glare</span>
        <input 
          type="checkbox" 
          checked={settings.glassReflection}
          onChange={(e) => onUpdateSettings({ glassReflection: e.target.checked })}
          style={{ width: '18px', height: '18px', accentColor: 'var(--fg-color)' }}
        />
      </div>

      <div className="setting-row">
        <label className="setting-label">Static Grain Opacity ({Math.round(settings.staticNoiseIntensity * 100)}%)</label>
        <input 
          type="range" 
          min="0" 
          max="0.3" 
          step="0.01"
          className="setting-slider" 
          value={settings.staticNoiseIntensity}
          onChange={(e) => onUpdateSettings({ staticNoiseIntensity: parseFloat(e.target.value) })}
        />
      </div>

      <div className="setting-row">
        <label className="setting-label">Screen Jitter Shake ({settings.jitterAmount}px)</label>
        <input 
          type="range" 
          min="0" 
          max="10" 
          step="0.5"
          className="setting-slider" 
          value={settings.jitterAmount}
          onChange={(e) => onUpdateSettings({ jitterAmount: parseFloat(e.target.value) })}
        />
      </div>

      <div className="setting-row" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="setting-label">Key Sounds</span>
        <input 
          type="checkbox" 
          checked={settings.soundEnabled}
          onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
          style={{ width: '18px', height: '18px', accentColor: 'var(--fg-color)' }}
        />
      </div>

      {settings.soundEnabled && (
        <div className="setting-row">
          <label className="setting-label">Sound Profile</label>
          <select 
            className="setting-input" 
            value={settings.keystrokeSound}
            onChange={(e) => onUpdateSettings({ keystrokeSound: e.target.value })}
          >
            {soundOptions.map((s) => (
              <option key={s.value} value={s.value} style={{ background: '#111' }}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="setting-row">
        <label className="setting-label">Custom Background (Image/Video URL)</label>
        <input 
          type="text" 
          className="setting-input"
          placeholder="https://example.com/matrix.mp4"
          value={settings.customBackground}
          onChange={(e) => onUpdateSettings({ customBackground: e.target.value })}
        />
      </div>

      {settings.customBackground && (
        <div className="setting-row">
          <label className="setting-label">BG Media Opacity ({Math.round(settings.backgroundOpacity * 100)}%)</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            className="setting-slider" 
            value={settings.backgroundOpacity}
            onChange={(e) => onUpdateSettings({ backgroundOpacity: parseFloat(e.target.value) })}
          />
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border-color)', margin: '18px 0', padding: '10px 0' }} />

      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Custom Palette & Term Colors</h4>
      
      <div className="setting-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label className="setting-label">Foreground</label>
          <input 
            type="color" 
            className="setting-input" 
            style={{ width: '100%', height: '35px', padding: 0, cursor: 'pointer' }}
            value={settings.foreground}
            onChange={(e) => onUpdateSettings({ foreground: e.target.value })}
          />
        </div>
        <div>
          <label className="setting-label">Background</label>
          <input 
            type="color" 
            className="setting-input" 
            style={{ width: '100%', height: '35px', padding: 0, cursor: 'pointer' }}
            value={settings.background}
            onChange={(e) => onUpdateSettings({ background: e.target.value })}
          />
        </div>
      </div>

      <div className="setting-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label className="setting-label">Cursor</label>
          <input 
            type="color" 
            className="setting-input" 
            style={{ width: '100%', height: '35px', padding: 0, cursor: 'pointer' }}
            value={settings.cursor}
            onChange={(e) => onUpdateSettings({ cursor: e.target.value })}
          />
        </div>
        <div>
          <label className="setting-label">ANSI Red (Errors)</label>
          <input 
            type="color" 
            className="setting-input" 
            style={{ width: '100%', height: '35px', padding: 0, cursor: 'pointer' }}
            value={settings.ansiRed}
            onChange={(e) => onUpdateSettings({ ansiRed: e.target.value })}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', width: '100%', marginBottom: '14px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label className="setting-label" style={{ fontSize: '0.65rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Green (Cmd)</label>
          <input 
            type="color" 
            className="setting-input" 
            style={{ width: '100%', height: '30px', padding: 0, cursor: 'pointer' }}
            value={settings.ansiGreen}
            onChange={(e) => onUpdateSettings({ ansiGreen: e.target.value })}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label className="setting-label" style={{ fontSize: '0.65rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Yellow (Warn)</label>
          <input 
            type="color" 
            className="setting-input" 
            style={{ width: '100%', height: '30px', padding: 0, cursor: 'pointer' }}
            value={settings.ansiYellow}
            onChange={(e) => onUpdateSettings({ ansiYellow: e.target.value })}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label className="setting-label" style={{ fontSize: '0.65rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Cyan (Info)</label>
          <input 
            type="color" 
            className="setting-input" 
            style={{ width: '100%', height: '30px', padding: 0, cursor: 'pointer' }}
            value={settings.ansiCyan}
            onChange={(e) => onUpdateSettings({ ansiCyan: e.target.value })}
          />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', margin: '18px 0' }} />

      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Settings Backup</h4>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          className="close-drawer-btn" 
          style={{ flex: 1, padding: '8px 4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={onExportSettings}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Export Config
        </button>
        <button 
          className="close-drawer-btn" 
          style={{ flex: 1, padding: '8px 4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={onImportSettings}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Import Config
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', margin: '18px 0' }} />

      <a 
        href="https://buymeacoffee.com/keyain" 
        target="_blank" 
        rel="noopener noreferrer"
        className="close-drawer-btn" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '6px', 
          padding: '8px 12px', 
          fontSize: '0.85rem', 
          textDecoration: 'none',
          boxSizing: 'border-box'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
        Buy me a coffee
      </a>
    </div>
  );
};
