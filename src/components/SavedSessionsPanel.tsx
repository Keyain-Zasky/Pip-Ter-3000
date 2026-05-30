import React, { useState, useEffect } from 'react';

export interface SavedSession {
  id: string;
  name: string;
  group: string;
  type: 'local' | 'ssh';
  // Local Config
  shell?: string;
  args?: string[];
  // SSH Config
  host?: string;
  port?: number;
  user?: string;
  keyPath?: string;
  startupCmd?: string;
}

interface SavedSessionsPanelProps {
  sessions: SavedSession[];
  onSelectSession: (session: SavedSession) => void;
  onAddSession: (session: Omit<SavedSession, 'id'>) => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SavedSessionsPanel: React.FC<SavedSessionsPanelProps> = ({
  sessions,
  onSelectSession,
  onAddSession,
  onDeleteSession,
  isOpen,
  onClose
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
  // Form State
  const [name, setName] = useState('');
  const [group, setGroup] = useState('Default Group');
  const [type, setType] = useState<'local' | 'ssh'>('local');
  const [shell, setShell] = useState('/bin/bash');
  const [argsStr, setArgsStr] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(22);
  const [user, setUser] = useState('');
  const [keyPath, setKeyPath] = useState('');
  const [startupCmd, setStartupCmd] = useState('');

  const [availableShells, setAvailableShells] = useState<string[]>(['/bin/bash', '/bin/sh']);

  useEffect(() => {
    if ((window as any).api && (window as any).api.system && (window as any).api.system.getShells) {
      (window as any).api.system.getShells().then((shells: string[]) => {
        if (shells && shells.length > 0) {
          setAvailableShells(shells);
          setShell(shells[0]);
        }
      });
    }
  }, []);

  if (!isOpen) return null;

  // Group the sessions
  const groups = sessions.reduce<Record<string, SavedSession[]>>((acc, s) => {
    const g = s.group || 'General';
    if (!acc[g]) acc[g] = [];
    acc[g].push(s);
    return acc;
  }, {});

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (type === 'local') {
      onAddSession({
        name,
        group: group.trim() || 'General',
        type,
        shell,
        args: argsStr.trim() ? argsStr.split(' ') : []
      });
    } else {
      onAddSession({
        name,
        group: group.trim() || 'General',
        type,
        host,
        port,
        user,
        keyPath,
        startupCmd
      });
    }

    // Reset Form
    setName('');
    setArgsStr('');
    setHost('');
    setPort(22);
    setUser('');
    setKeyPath('');
    setStartupCmd('');
    setIsAdding(false);
  };

  return (
    <div className="sessions-drawer-overlay" style={{
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
        .session-group {
          margin-bottom: 12px;
        }
        .group-header {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px;
          border-bottom: 1px dashed var(--border-color);
          color: var(--fg-color);
        }
        .session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 12px;
          margin: 4px 0;
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
          font-size: 0.9rem;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .session-item:hover {
          border-color: var(--border-color);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 5px var(--glow-color);
        }
        .session-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }
        .session-type {
          font-size: 0.7rem;
          opacity: 0.6;
          text-transform: uppercase;
        }
        .delete-btn {
          background: transparent;
          border: none;
          color: #ff5f56;
          cursor: pointer;
          padding: 2px 6px;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .delete-btn:hover {
          opacity: 1;
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
        <h3 style={{ margin: 0, fontSize: '1.2rem', textShadow: '0 0 5px var(--glow-color)' }}>Connection Manager</h3>
        <button className="close-drawer-btn" onClick={onClose}>Close</button>
      </div>

      {!isAdding ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <button 
            className="close-drawer-btn" 
            style={{ width: '100%', padding: '8px', marginBottom: '16px' }}
            onClick={() => setIsAdding(true)}
          >
            + Add New Session
          </button>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {Object.keys(groups).length === 0 ? (
              <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '20px' }}>No saved sessions yet.</div>
            ) : (
              Object.entries(groups).map(([groupName, items]) => (
                <div key={groupName} className="session-group">
                  <div className="group-header" onClick={() => toggleGroup(groupName)}>
                    <span style={{ fontSize: '0.7rem', marginRight: '4px' }}>{collapsedGroups[groupName] ? '►' : '▼'}</span>
                    <span style={{ fontWeight: 'bold' }}>{groupName}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.6 }}>({items.length})</span>
                  </div>

                  {!collapsedGroups[groupName] && (
                    <div style={{ paddingLeft: '8px', marginTop: '4px' }}>
                      {items.map((item) => (
                        <div key={item.id} className="session-item" onClick={() => onSelectSession(item)}>
                          <div className="session-info">
                            <span style={{ fontWeight: 500 }}>{item.name}</span>
                            <span className="session-type">
                              {item.type === 'ssh' ? `ssh • ${item.user}@${item.host}` : `local • ${item.shell}`}
                            </span>
                          </div>
                          <button 
                            className="delete-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(item.id);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="setting-row">
            <label className="setting-label">Session Name</label>
            <input 
              type="text" 
              required
              className="setting-input" 
              placeholder="e.g. Production server"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="setting-row">
            <label className="setting-label">Folder / Group</label>
            <input 
              type="text" 
              className="setting-input" 
              placeholder="e.g. Work, Home, Local"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            />
          </div>

          <div className="setting-row">
            <label className="setting-label">Connection Type</label>
            <select 
              className="setting-input" 
              value={type}
              onChange={(e) => setType(e.target.value as 'local' | 'ssh')}
            >
              <option value="local" style={{ background: '#111' }}>Local Shell</option>
              <option value="ssh" style={{ background: '#111' }}>SSH Connection</option>
            </select>
          </div>

          {type === 'local' ? (
            <>
              <div className="setting-row">
                <label className="setting-label">Shell Binary Path</label>
                <input 
                  type="text" 
                  required
                  list="detected-shells"
                  className="setting-input" 
                  value={shell}
                  onChange={(e) => setShell(e.target.value)}
                />
                <datalist id="detected-shells">
                  {availableShells.map(s => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div className="setting-row">
                <label className="setting-label">Arguments (space separated)</label>
                <input 
                  type="text" 
                  className="setting-input" 
                  placeholder="e.g. -l"
                  value={argsStr}
                  onChange={(e) => setArgsStr(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="setting-row">
                <label className="setting-label">Host IP / Domain</label>
                <input 
                  type="text" 
                  required
                  className="setting-input" 
                  placeholder="192.168.1.100"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                />
              </div>
              <div className="setting-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="setting-label">Username</label>
                  <input 
                    type="text" 
                    required
                    className="setting-input" 
                    placeholder="root"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                  />
                </div>
                <div>
                  <label className="setting-label">Port</label>
                  <input 
                    type="number" 
                    required
                    className="setting-input" 
                    value={port}
                    onChange={(e) => setPort(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="setting-row">
                <label className="setting-label">Private Key Path (Optional)</label>
                <input 
                  type="text" 
                  className="setting-input" 
                  placeholder="~/.ssh/id_rsa"
                  value={keyPath}
                  onChange={(e) => setKeyPath(e.target.value)}
                />
              </div>
              <div className="setting-row">
                <label className="setting-label">Startup Command (Optional)</label>
                <input 
                  type="text" 
                  className="setting-input" 
                  placeholder="e.g. tmux attach"
                  value={startupCmd}
                  onChange={(e) => setStartupCmd(e.target.value)}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="button" 
              className="close-drawer-btn" 
              style={{ flex: 1 }}
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="close-drawer-btn" 
              style={{ flex: 1 }}
            >
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
