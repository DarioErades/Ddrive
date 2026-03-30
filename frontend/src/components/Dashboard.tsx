import { useState, useEffect, useCallback } from 'react';
import { FileCard } from './FileCard.js';
import { ChevronRight, Loader2, RotateCw, UploadCloud } from 'lucide-react';
import { api } from '../api.js';
import { Header } from './Header.js';

interface DashboardProps {
  view: 'home' | 'starred' | 'shared' | 'trash';
  selectedFileId?: string;
  onSelectFile: (file: any) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  user: any;
  onUpload: () => void;
  onTransferAdd: (name: string, type: 'upload' | 'download') => string;
  onTransferStatusUpdate?: (id: string, status: 'completed' | 'error') => void;
  onStorageUpdate: (used: number) => void;
  onToggleSidebar?: () => void;
}

export const Dashboard = ({ view, selectedFileId, onSelectFile, searchQuery, onSearchChange, user, onUpload, onTransferAdd, onTransferStatusUpdate, onStorageUpdate, onToggleSidebar }: DashboardProps) => {
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [health, setHealth] = useState<{ isLimited: boolean, retryAfter: number } | null>(null);
  const [showHealthAlert, setShowHealthAlert] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      const data = await api.getFiles(currentFolderId || undefined, view);
      setFiles(data.files || []);
      setFolders(data.folders || []);
      if (onStorageUpdate) onStorageUpdate(data.totalStorageUsed || 0);
    } catch (err) {
      console.error('Failed to load files', err);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, view, onStorageUpdate]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUploadFiles = useCallback(async (droppedFiles: FileList) => {
    for (const file of Array.from(droppedFiles)) {
      const transferId = onTransferAdd(file.name, 'upload');
      try {
        await api.uploadFile(file, currentFolderId);
        if (onTransferStatusUpdate) onTransferStatusUpdate(transferId, 'completed');
        onUpload(); // Parent refresh key
        loadFiles(); // Local refresh
      } catch (err) {
        console.error('Upload failed', err);
        if (onTransferStatusUpdate) onTransferStatusUpdate(transferId, 'error');
      }
    }
  }, [currentFolderId, onTransferAdd, onTransferStatusUpdate, onUpload, loadFiles]);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.relatedTarget === null) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleUploadFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleUploadFiles]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await api.getSystemHealth();
        setHealth(data);
        setShowHealthAlert(data.isLimited);
      } catch (e) {}
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalStorage = files.reduce((acc, file) => acc + (Number(file.size) || 0), 0);

  const handleMove = async (fileId: string, folderId: string | null) => {
    try {
      await api.moveFile(fileId, folderId);
      loadFiles();
    } catch (err) {
      console.error('Move failed', err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpdate = async (id: string, type: 'file' | 'folder', updates: any) => {
    try {
      if (type === 'folder') {
        if (updates.name || updates.color) await api.updateFolder(id, updates);
      } else {
        if (updates.name) await api.rename(id, type, updates.name);
      }
      
      if (updates.is_starred !== undefined) {
        await api.toggleStar(id, type);
      }
      
      loadFiles();
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleDelete = async (id: string, type: 'file' | 'folder') => {
    try {
      if (type === 'folder') {
        await api.deleteFolder(id);
      } else {
        await api.toggleDelete(id, type);
      }
      loadFiles();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-dark-900">
      <Loader2 className="animate-spin text-blurple w-12 h-12" />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-dark-900 overflow-y-auto relative">
      <Header 
        currentFolderId={currentFolderId} 
        onUpload={onUpload} 
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        user={user}
        onTransferAdd={onTransferAdd}
        onToggleSidebar={onToggleSidebar}
      />

      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-blurple/20 backdrop-blur-md flex items-center justify-center p-12 animate-in fade-in duration-300 pointer-events-none">
          <div className="w-full h-full border-4 border-dashed border-blurple/50 rounded-3xl flex flex-col items-center justify-center gap-6 bg-dark-900/60 shadow-2xl">
            <div className="w-24 h-24 bg-blurple rounded-full flex items-center justify-center shadow-lg shadow-blurple/30 animate-bounce">
              <UploadCloud size={48} className="text-white" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight">Drop to Upload</h2>
              <p className="text-text-muted font-medium">Release files to start encrypted upload to {currentFolderId ? 'this folder' : 'Home'}</p>
            </div>
          </div>
        </div>
      )}

      {showHealthAlert && (
          <div className="mx-6 mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-amber-500">Discord Throttling Active</span>
                <span className="text-xs text-amber-500/70">The system is waiting for Discord rate limits to reset. Tasks will resume automatically.</span>
              </div>
            </div>
            <div className="px-3 py-1 bg-amber-500/20 rounded-lg text-[10px] font-bold text-amber-500 uppercase tracking-widest">
              Wait {Math.round((health?.retryAfter || 0) / 1000)}s
            </div>
          </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between text-sm text-text-muted mb-6 select-none">
          <div className="flex items-center gap-2">
            <span 
              className="hover:text-text-primary cursor-pointer"
              onClick={() => setCurrentFolderId(null)}
            >
              Home
            </span>
            <ChevronRight size={14} />
            <span className="text-text-primary font-medium">Files</span>
          </div>
          
          <button 
            onClick={loadFiles}
            className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg text-xs font-bold transition-all text-text-primary active:scale-95 group"
          >
            <RotateCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            Refresh
          </button>
        </div>

        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6 mb-8 flex gap-24 select-none">
           <Stat label="Total Storage" value={formatSize(totalStorage)} />
        </div>

        {searchQuery && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Search Results for "{searchQuery}"</h2>
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4">{searchQuery ? 'Matching Files' : 'Recently Uploaded'}</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {(searchQuery ? filteredFiles : files.slice(0, 5)).map(file => (
              <FileCard 
                key={file.id} 
                id={file.id}
                name={file.name} 
                type="file" 
                size={file.size} 
                mimeType={file.mime_type} 
                isStarred={file.is_starred === 1}
                onMove={handleMove}
                isSelected={selectedFileId === file.id}
                onSelect={() => onSelectFile({ ...file, type: 'file' })}
                onUpdate={(id, updates) => handleUpdate(id, 'file', updates)}
                onDelete={(id) => handleDelete(id, 'file')}
              />
            ))}
            {files.length === 0 && !searchQuery && <p className="text-text-muted text-sm italic">No files yet.</p>}
            {searchQuery && filteredFiles.length === 0 && <p className="text-text-muted text-sm italic">No matching files.</p>}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">All Items</h2>
            {currentFolderId && (
              <button 
                onClick={() => setCurrentFolderId(null)}
                className="text-blurple text-sm font-medium hover:underline"
              >
                ← Back to Home
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {filteredFolders.map(folder => (
              <FileCard 
                key={folder.id} 
                id={folder.id}
                name={folder.name} 
                type="folder" 
                isStarred={folder.is_starred === 1}
                color={folder.color}
                onOpen={() => setCurrentFolderId(folder.id)}
                onMove={handleMove}
                isSelected={selectedFileId === folder.id}
                onSelect={() => onSelectFile({ ...folder, type: 'folder' })}
                onUpdate={(id, updates) => handleUpdate(id, 'folder', updates)}
                onDelete={(id) => handleDelete(id, 'folder')}
              />
            ))}
            {filteredFiles.map(file => (
              <FileCard 
                key={file.id} 
                id={file.id}
                name={file.name} 
                type="file" 
                size={file.size} 
                mimeType={file.mime_type} 
                isStarred={file.is_starred === 1}
                onMove={handleMove}
                isSelected={selectedFileId === file.id}
                onSelect={() => onSelectFile({ ...file, type: 'file' })}
                onUpdate={(id, updates) => handleUpdate(id, 'file', updates)}
                onDelete={(id) => handleDelete(id, 'file')}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{label}</span>
    <span className="text-2xl font-bold">{value}</span>
  </div>
);
