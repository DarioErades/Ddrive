import { useState } from 'react';
import { api } from '../api.js';
import { Loader2, HardDrive, Lock, User } from 'lucide-react';

interface LoginPageProps {
  onLogin: (token: string, user: any) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(username, password);
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-dark-800 rounded-lg shadow-xl p-8 space-y-8 border border-dark-700">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-blurple p-4 rounded-2xl shadow-lg shadow-blurple/20 mb-2">
            <HardDrive className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back!</h1>
          <p className="text-text-muted text-sm">We're so excited to see you again!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block ml-1">
                Username
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-blurple transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700/50 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blurple/50 focus:border-blurple transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-blurple transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700/50 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blurple/50 focus:border-blurple transition-all text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-xs font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blurple hover:bg-blurple/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-all shadow-lg shadow-blurple/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
          </button>
        </form>

        <p className="text-center text-xs text-text-muted">
          Need an account? Contact an administrator.
        </p>
      </div>
    </div>
  );
};
