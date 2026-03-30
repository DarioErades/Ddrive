import { Home, Star, Trash2, LogOut, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../api.js';

interface SidebarProps {
  activeView: 'home' | 'starred' | 'shared' | 'trash';
  onViewChange: (view: 'home' | 'starred' | 'shared' | 'trash') => void;
  onLogout: () => void;
  storageUsed: number;
  onClose?: () => void;
}

export const Sidebar = ({ activeView, onViewChange, onLogout, storageUsed, onClose }: SidebarProps) => {
  const LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB
  const [health, setHealth] = useState<{ isLimited: boolean, retryAfter: number } | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await api.getSystemHealth();
        setHealth(data);
      } catch (e) {
        setHealth({ isLimited: false, retryAfter: 0 }); // Fallback
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const percentage = Math.min(100, (storageUsed / LIMIT) * 100);

  return (
    <div className="w-full h-full bg-dark-800 border-r border-dark-700 flex flex-col select-none">
      <div className="p-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blurple rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-blurple/20">D</div>
          <span className="font-bold text-sm tracking-tight text-text-primary uppercase tracking-[0.1em]">Drivecord Pro</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div 
            className="group relative cursor-help"
            title={health?.isLimited ? `Throttled: Wait ${Math.round(health.retryAfter/1000)}s` : "API Connected"}
          >
            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 shadow-sm ${
              health?.isLimited ? 'bg-amber-500 shadow-amber-500/50 animate-pulse' : 'bg-emerald-500 shadow-emerald-500/50'
            }`} />
          </div>

          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg md:hidden text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <nav className="flex-1 px-2 space-y-0.5">
        <NavItem 
          icon={<Home size={20} />} 
          label="Home" 
          active={activeView === 'home'} 
          onClick={() => onViewChange('home')}
        />
        <NavItem 
          icon={<Star size={20} />} 
          label="Starred" 
          active={activeView === 'starred'} 
          onClick={() => onViewChange('starred')}
        />
        <NavItem 
          icon={<Trash2 size={20} />} 
          label="Trash" 
          active={activeView === 'trash'} 
          onClick={() => onViewChange('trash')}
        />
      </nav>

      <div className="p-2 border-t border-dark-700">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={20} />
          Log Out
        </button>
      </div>

      <div className="bg-dark-700 rounded-lg p-4 m-2 flex flex-col gap-3">
        <div className="flex justify-between text-xs text-text-secondary font-medium">
          <span>Storage Used</span>
          <span>{formatSize(storageUsed)} / {formatSize(LIMIT)}</span>
        </div>
        <div className="w-full bg-dark-600 rounded-full h-1.5 overflow-hidden">
          <div className="bg-blurple h-full transition-all duration-500" style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-dark-600 text-text-primary' : 'text-text-secondary hover:bg-dark-700 hover:text-text-primary'
    }`}
  >
    <span className={active ? 'text-blurple' : 'text-text-muted'}>{icon}</span>
    {label}
  </button>
);
