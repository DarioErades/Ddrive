import { X, CheckCircle2 } from 'lucide-react';

interface Transfer {
  id: string;
  name: string;
  type: 'upload' | 'download';
  status: 'progress' | 'completed' | 'error';
  progress: number;
}

interface StatusOverlayProps {
  transfers: Transfer[];
  onDismiss: () => void;
  onCancel: (id: string) => void;
}

export const StatusOverlay = ({ transfers, onDismiss, onCancel }: StatusOverlayProps) => {
  if (transfers.length === 0) return null;

  const completedCount = transfers.filter(t => t.status === 'completed').length;

  return (
    <div className="fixed bottom-4 left-4 md:left-[272px] w-80 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden select-none z-[200]">
      <div className="p-3 bg-dark-700/50 flex items-center justify-between border-b border-dark-600">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          Transfers {completedCount > 0 && <span className="text-emerald-500 font-medium ml-1 lowercase">{completedCount} completed</span>}
        </span>
        <div className="flex gap-2 text-text-muted">
          <button onClick={onDismiss} className="hover:text-text-primary">
            <X size={14} />
          </button>
        </div>
      </div>
      
      <div className="max-h-60 overflow-y-auto scrollbar-thin">
        {transfers.map(transfer => (
          <div key={transfer.id} className="p-4 bg-dark-800 border-b border-dark-700 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col min-w-0 flex-1 mr-2">
                <span className="text-xs font-bold truncate">{transfer.name}</span>
                <span className={`text-[10px] capitalize ${transfer.status === 'error' ? 'text-red-400 font-bold' : 'text-text-muted'}`}>
                  {transfer.status === 'error' ? 'Upload Failed (Too Large?)' : (transfer.type === 'upload' ? 'Uploading' : 'Downloading') + '...'}
                </span>
              </div>
              <div className="flex gap-2 text-blurple items-center shrink-0">
                {transfer.status === 'completed' ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <button onClick={() => onCancel(transfer.id)} className="text-text-muted hover:text-text-primary transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="w-full bg-dark-600 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  transfer.status === 'completed' ? 'bg-emerald-500' : 
                  transfer.status === 'error' ? 'bg-red-500' : 'bg-blurple'
                }`} 
                style={{ width: `${transfer.status === 'error' ? 100 : transfer.progress}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
