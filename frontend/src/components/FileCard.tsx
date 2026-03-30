import { FileText, Folder as FolderIcon, ImageIcon, FileCode, Star, MoreVertical, Pencil, Palette, Trash2, Loader2, Archive, FileAudio, FileVideo } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { api } from '../api.js';

interface FileCardProps {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number | string;
  updatedAt?: string;
  mimeType?: string;
  isStarred?: boolean;
  color?: string;
  onOpen?: () => void;
  onMove?: (fileId: string, folderId: string | null) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (id: string, updates: any) => void;
  onDelete?: (id: string) => void;
}

export const FileCard = ({ 
  id, name, type, size, mimeType, isStarred, color, 
  onOpen, onMove, isSelected, onSelect, onUpdate, onDelete 
}: FileCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isImage = mimeType?.startsWith('image/');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (type === 'file' && isImage && id) {
      setPreviewLoading(true);
      api.getFileBlob(id).then(blob => {
        if (!active) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewLoading(false);
      }).catch(() => {
        if (active) setPreviewLoading(false);
      });
    }
    return () => {
      active = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [id, type, isImage]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'folder' && onOpen) {
      onOpen();
    } else if (onSelect) {
      onSelect();
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAction = (action: string, value?: any) => {
    setIsMenuOpen(false);
    if (action === 'delete' && onDelete) onDelete(id);
    if (action === 'rename' && onUpdate) {
      const newName = prompt('Rename to:', name);
      if (newName) onUpdate(id, { name: newName });
    }
    if (action === 'color' && onUpdate) onUpdate(id, { color: value });
    if (action === 'star' && onUpdate) onUpdate(id, { is_starred: isStarred ? 0 : 1 });
  };

  const colors = ['#5865F2', '#EB459E', '#FEE75C', '#57F287', '#ED4245', '#AFE1AF'];

  const handleDragStart = (e: React.DragEvent) => {
    if (type === 'file' && id) {
      e.dataTransfer.setData('fileId', id);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (type === 'folder') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (type === 'folder' && id) {
      e.preventDefault();
      const fileId = e.dataTransfer.getData('fileId');
      if (fileId && onMove) {
        onMove(fileId, id);
      }
    }
  };

  const formatSize = (bytes: number | string) => {
    if (typeof bytes === 'string') return bytes;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Number(bytes)) / Math.log(k));
    return parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = () => {
    if (previewLoading) return <Loader2 className="w-8 h-8 text-blurple animate-spin" />;
    if (previewUrl) return <img src={previewUrl} alt={name} className="w-full h-full object-cover" />;
    
    if (type === 'folder') return (
      <FolderIcon 
        className="w-10 h-10 transition-transform group-hover:scale-110" 
        style={{ color: color || '#5865F2', fill: `${color || '#5865F2'}33` }} 
      />
    );
    const lowerName = name.toLowerCase();
    if (isImage) return <ImageIcon className="w-10 h-10 text-blurple" />;
    if (mimeType?.includes('javascript') || mimeType?.includes('typescript') || lowerName.endsWith('.js') || lowerName.endsWith('.ts')) 
        return <FileCode className="w-10 h-10 text-emerald-500" />;
    if (mimeType?.includes('zip') || mimeType?.includes('rar') || lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) 
        return <Archive className="w-10 h-10 text-amber-500" />;
    if (mimeType?.startsWith('audio/')) return <FileAudio className="w-10 h-10 text-pink-500" />;
    if (mimeType?.startsWith('video/')) return <FileVideo className="w-10 h-10 text-indigo-500" />;
    return <FileText className="w-10 h-10 text-text-muted" />;
  };

  return (
    <div 
      draggable={type === 'file'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative group flex flex-col items-center justify-center gap-3 w-44 h-44 shrink-0 rounded-2xl border transition-all cursor-pointer select-none overflow-hidden ${
        isSelected 
        ? 'bg-blurple/10 border-blurple ring-1 ring-blurple/50 shadow-lg shadow-blurple/10' 
        : 'bg-dark-800/50 border-dark-700 hover:bg-dark-700/80 hover:border-dark-600'
      }`}
    >
      {/* Overlay for Image Previews to ensure icons/text remain readable */}
      {previewUrl && <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-0" />}

      <div className="absolute top-3 w-full px-3 flex justify-between items-center z-20">
        <div className="text-yellow-500">
          {isStarred && <Star size={14} fill="currentColor" />}
        </div>
        <div className="relative" ref={menuRef}>
          <button 
            onClick={handleMenuClick}
            className="p-1 hover:bg-dark-600 rounded-md text-text-muted hover:text-text-primary transition-colors bg-dark-900/40 backdrop-blur-sm"
          >
            <MoreVertical size={16} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-dark-700 border border-dark-600 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in duration-100 origin-top-right z-30">
              <button 
                onClick={(e) => { e.stopPropagation(); handleAction('rename'); }} 
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-dark-600 transition-colors"
              >
                <Pencil size={12} /> Rename
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleAction('star'); }} 
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-dark-600 transition-colors"
              >
                <Star size={12} /> {isStarred ? 'Unstar' : 'Star'}
              </button>
              {type === 'folder' && (
                <div className="px-3 py-1.5 flex flex-col gap-1.5 border-t border-dark-600">
                  <div className="flex items-center gap-2 text-[10px] text-text-muted uppercase font-bold tracking-wider">
                    <Palette size={10} /> Color
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map(c => (
                      <div 
                        key={c}
                        onClick={(e) => { e.stopPropagation(); handleAction('color', c); }}
                        className="w-4 h-4 rounded-full cursor-pointer hover:ring-2 ring-white/50 transition-all border border-black/10"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); handleAction('delete'); }} 
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-red-500/10 text-red-400 border-t border-dark-600"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`z-10 transition-all flex items-center justify-center rounded-xl overflow-hidden ${previewUrl ? 'inset-0 absolute w-full h-full' : 'bg-dark-900/50 p-6 group-hover:bg-dark-900/80'}`}>
        {getIcon()}
      </div>
      
      <div className="z-10 flex flex-col items-center gap-0.5 px-3 w-full bg-gradient-to-t from-dark-900/90 via-dark-900/40 to-transparent pt-4 pb-2 mt-auto">
        <span className="text-sm font-bold text-text-primary truncate w-full text-center drop-shadow-md">
          {name}
        </span>
        {type === 'file' && (
          <span className="text-[10px] text-text-muted font-black uppercase tracking-wider drop-shadow-md">
            {formatSize(size || 0)}
          </span>
        )}
      </div>
    </div>
  );
};
