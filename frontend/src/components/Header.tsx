import { Search, Plus, Upload, User, Loader2, Menu } from 'lucide-react';
import { useRef, useState } from 'react';
import { api } from '../api.js';

interface HeaderProps {
  currentFolderId?: string | null;
  onUpload?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  user: any;
  onTransferAdd: (name: string, type: 'upload' | 'download') => void;
  onToggleSidebar?: () => void;
}

export const Header = ({ currentFolderId, onUpload, searchQuery, onSearchChange, user, onTransferAdd, onToggleSidebar }: HeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onTransferAdd(file.name, 'upload');
    setUploading(true);
    try {
      await api.uploadFile(file, currentFolderId);
      if (onUpload) onUpload();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Folder Name:');
    if (!name) return;

    try {
      await api.createFolder(name, currentFolderId || undefined);
      if (onUpload) onUpload();
    } catch (err) {
      console.error('Failed to create folder', err);
    }
  };

  return (
    <div className="h-16 border-b border-dark-700 flex items-center justify-between px-4 md:px-6 bg-dark-900/50 backdrop-blur-md select-none shrink-0">
      <div className="flex items-center gap-3 w-full md:w-1/3">
        <button 
          onClick={onToggleSidebar}
          className="p-2 -ml-2 hover:bg-white/5 rounded-lg md:hidden text-text-muted hover:text-text-primary transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-dark-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-blurple placeholder:text-text-muted text-text-primary outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button 
          onClick={handleCreateFolder}
          className="flex items-center gap-2 bg-dark-600 hover:bg-dark-500 text-sm font-medium px-3 md:px-4 py-2 rounded-lg transition-colors border border-dark-400"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">New Folder</span>
        </button>
        <button 
          onClick={handleUploadClick}
          disabled={uploading}
          className="flex items-center gap-2 bg-blurple hover:bg-blurple/90 text-sm font-medium px-3 md:px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-blurple/10"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload'}</span>
        </button>
        
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-dark-700 ml-1">
          <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center border border-dark-600">
            <User size={16} className="text-text-secondary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-none">{user?.username || 'User'}</span>
            <span className="text-[10px] text-text-muted">Online</span>
          </div>
        </div>
      </div>

      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
    </div>
  );
};
