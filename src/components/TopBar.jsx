import { Brain, UserCircle, Settings } from 'lucide-react';

export default function TopBar({ onOpenSettings, onOpenLabProfile, hasLabProfile }) {
  return (
    <header className="flex items-center justify-between h-14 px-4 bg-surface border-b border-border shrink-0">
      {/* 左侧: Logo */}
      <div className="flex items-center gap-2">
        <Brain className="w-6 h-6 text-primary-600" />
        <span className="text-lg font-bold text-text-primary tracking-tight">脑师好</span>
      </div>

      {/* 中间: 脑师画像按钮 */}
      <button
        onClick={onOpenLabProfile}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
      >
        <UserCircle className="w-4 h-4" />
        <span>脑师画像</span>
        {hasLabProfile && (
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-glow" />
        )}
      </button>

      {/* 右侧: 设置按钮 */}
      <button
        onClick={onOpenSettings}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
      >
        <Settings className="w-4 h-4" />
        <span>设置</span>
      </button>
    </header>
  );
}
