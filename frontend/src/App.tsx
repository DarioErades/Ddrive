import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.js';
import { Dashboard } from './components/Dashboard.js';
import { StatusOverlay } from './components/StatusOverlay.js';
import { LoginPage } from './components/LoginPage.js';
import { X, Star, Download, FileText, ImageIcon, FileCode, Trash2, Check, Loader2, Archive, FileAudio, FileVideo } from 'lucide-react';
import { api } from './api.js';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [activeView, setActiveView] = useState<'home' | 'starred' | 'shared' | 'trash'>('home');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleViewChange = (view: any) => {
    setActiveView(view);
    setIsSidebarOpen(false); // Close sidebar on view change (mobile)
    if (view === 'home') {
      setRefreshKey(prev => prev + 1);
      setSelectedFile(null); // Deselect on home click to clear sidebar
    }
  };

  useEffect(() => {
    let active = true;
    if (selectedFile && selectedFile.type === 'file' && selectedFile.mime_type?.startsWith('image/')) {
      setPreviewLoading(true);
      setPreviewUrl(null);
      
      api.getFileBlob(selectedFile.id).then(blob => {
        if (!active) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewLoading(false);
      }).catch(err => {
        console.error('Preview failed', err);
        setPreviewLoading(false);
      });
    } else {
      setPreviewUrl(null);
      setPreviewLoading(false);
    }

    return () => {
      active = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile?.id]);

  useEffect(() => {
    if (token) {
      api.getMe().then(setUser).catch(() => {
        handleLogout();
      });
    }
  }, [token]);

  const handleLogin = (token: string, user: any) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const addTransfer = (name: string, type: 'upload' | 'download') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTransfer = { id, name, type, status: 'progress' as const, progress: 0 };
    setTransfers(prev => [newTransfer, ...prev]);
    
    let prog = 0;
    const interval = setInterval(() => {
      setTransfers(current => {
        const t = current.find(x => x.id === id);
        if (!t || t.status === 'completed' || t.status === 'error') {
          clearInterval(interval);
          return current;
        }

        prog += Math.random() * 30;
        if (prog >= 100) {
          prog = 100;
          clearInterval(interval);
          return current.map(x => x.id === id ? { ...x, status: 'completed', progress: 100 } : x);
        }
        return current.map(x => x.id === id ? { ...x, progress: prog } : x);
      });
    }, 400);

    return id;
  };

  const updateTransferStatus = (id: string, status: 'completed' | 'error') => {
    setTransfers(current => current.map(t => t.id === id ? { ...t, status, progress: status === 'completed' ? 100 : t.progress } : t));
  };

  const toggleStar = async () => {
    if (!selectedFile) return;
    try {
      await api.toggleStar(selectedFile.id, selectedFile.type);
      setSelectedFile({ ...selectedFile, is_starred: selectedFile.is_starred ? 0 : 1 });
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to toggle star', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    try {
      await api.toggleDelete(selectedFile.id, selectedFile.type);
      setSelectedFile(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleRename = async () => {
    if (!selectedFile || !editedName.trim()) return;
    try {
      await api.rename(selectedFile.id, selectedFile.type, editedName.trim());
      setSelectedFile({ ...selectedFile, name: editedName.trim() });
      setIsEditingName(false);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to rename', err);
    }
  };

  const getFileIcon = (mime: string, filename?: string) => {
    const name = filename?.toLowerCase() || '';
    if (mime?.startsWith('image/')) return <ImageIcon className="w-16 h-16 text-blurple" />;
    if (mime?.includes('javascript') || mime?.includes('typescript') || name.endsWith('.js') || name.endsWith('.ts')) 
        return <FileCode className="w-16 h-16 text-emerald-500" />;
    if (mime?.includes('zip') || mime?.includes('rar') || name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) 
        return <Archive className="w-16 h-16 text-amber-500" />;
    if (mime?.startsWith('audio/')) return <FileAudio className="w-16 h-16 text-pink-500" />;
    if (mime?.startsWith('video/')) return <FileVideo className="w-16 h-16 text-indigo-500" />;
    return <FileText className="w-16 h-16 text-text-muted" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-dark-900 text-text-primary font-sans relative overflow-hidden">
      {/* Sidebar - Drawer on mobile, fixed on desktop */}
      <div className={`
        fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300
        ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `} onClick={() => setIsSidebarOpen(false)} />
      
      <div className={`
        fixed inset-y-0 left-0 z-[120] w-64 bg-dark-800 md:relative md:translate-x-0 transition-transform duration-300 ease-out shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar activeView={activeView} onViewChange={handleViewChange} onLogout={handleLogout} storageUsed={storageUsed} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Dashboard 
          key={refreshKey}
          view={activeView} 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          user={user}
          onUpload={() => setRefreshKey(prev => prev + 1)}
          onTransferAdd={addTransfer}
          onTransferStatusUpdate={updateTransferStatus}
          onStorageUpdate={setStorageUsed}
          selectedFileId={selectedFile?.id} 
          onSelectFile={(file: any) => {
            setSelectedFile(file);
            setEditedName(file.name);
            setIsEditingName(false);
          }}
          onToggleSidebar={() => setIsSidebarOpen(true)}
        />
      </div>

      {/* Details Panel - Full-screen overlay on mobile, side panel on desktop */}
      <div className={`
        fixed inset-0 z-[130] bg-dark-900 md:relative md:inset-auto md:z-auto md:w-80 md:bg-dark-800 border-l border-dark-700 flex flex-col transition-all duration-300 transform
        ${selectedFile ? 'translate-y-0 opacity-100' : 'translate-y-full md:translate-y-0 opacity-0 md:opacity-100 hidden md:flex'}
      `}>
        <div className="h-16 border-b border-dark-700 flex items-center justify-between px-6 shrink-0 bg-dark-900/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedFile(null)} className="md:hidden text-text-muted hover:text-text-primary p-2 -ml-2">
               <X size={24} />
            </button>
            <span className="text-sm font-bold text-text-secondary uppercase tracking-widest">Detail View</span>
          </div>
          <button onClick={() => setSelectedFile(null)} className="hidden md:block text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          {selectedFile ? (
            <div className="flex flex-col items-center text-center gap-6 max-w-lg mx-auto md:max-w-none">
              <div className="w-full flex justify-between items-center md:justify-end">
                <span className="md:hidden text-xs text-text-muted font-bold tracking-widest uppercase">Overview</span>
                <button 
                  onClick={toggleStar}
                  className={`p-2 rounded-xl transition-all ${selectedFile.is_starred ? 'text-yellow-500 bg-yellow-500/10' : 'text-text-muted bg-white/5 hover:bg-white/10'}`}
                >
                  <Star size={20} fill={selectedFile.is_starred ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="w-full aspect-square bg-dark-700/50 rounded-3xl overflow-hidden flex items-center justify-center relative shadow-inner ring-1 ring-white/5 group">
                {previewLoading ? (
                  <Loader2 className="w-10 h-10 text-blurple animate-spin" />
                ) : previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="p-16">
                    {getFileIcon(selectedFile.mime_type, selectedFile.name)}
                  </div>
                )}
              </div>

              <div className="space-y-2 w-full px-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2 bg-dark-900 border border-blurple/50 rounded-xl p-1 shadow-inner">
                    <input 
                      autoFocus
                      className="bg-transparent rounded px-3 py-2 text-sm w-full outline-none text-text-primary"
                      value={editedName}
                      onChange={e => setEditedName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRename()}
                    />
                    <div className="flex gap-1 pr-1">
                      <button onClick={handleRename} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setIsEditingName(false)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 group/title">
                    <h3 className="text-xl md:text-lg font-black tracking-tight text-white leading-tight break-all">{selectedFile.name}</h3>
                    <button 
                      onClick={() => setIsEditingName(true)}
                      className="text-blurple text-xs font-bold hover:underline py-1"
                    >
                      Rename
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black opacity-60">
                  {selectedFile.type === 'folder' ? 'Folder Architecture' : (selectedFile.mime_type || 'Unknown Format')}
                </p>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 py-6 border-y border-white/5">
                <div className="flex flex-col items-center gap-1 bg-white/2 p-3 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">File Size</span>
                  <span className="text-sm font-black">{selectedFile.type === 'folder' ? '--' : formatSize(selectedFile.size)}</span>
                </div>
                <div className="flex flex-col items-center gap-1 bg-white/2 p-3 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Created</span>
                  <span className="text-sm font-black">{new Date(selectedFile.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex w-full gap-3 mt-4">
                <button 
                  onClick={() => {
                    api.downloadFile(selectedFile.id);
                    addTransfer(selectedFile.name, 'download');
                  }}
                  className="flex-1 bg-blurple hover:bg-blurple/90 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-blurple/20 active:scale-95 text-sm uppercase tracking-widest"
                >
                  <Download size={20} />
                  Download
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-4 rounded-2xl bg-dark-700 hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-all border border-white/5 shadow-lg active:scale-95"
                  title={activeView === 'trash' ? 'Restore' : 'Move to Trash'}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <StatusOverlay 
        transfers={transfers} 
        onDismiss={() => setTransfers([])} 
        onCancel={(id) => setTransfers(prev => prev.filter(t => t.id !== id))}
      />
    </div>
  );
}

export default App;
