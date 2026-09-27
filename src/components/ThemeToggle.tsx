import React from 'react';
import { AppTheme } from '../types/traffic';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  theme: AppTheme;
  onThemeChange: (newTheme: AppTheme) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onThemeChange }) => {
  const isDark = theme === 'dark';

  return (
    <div
      role="group"
      aria-label="Interface Theme Mode"
      className="flex items-center p-0.5 rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 text-xs"
    >
      <button
        type="button"
        onClick={() => onThemeChange('light')}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
          !isDark
            ? 'bg-white text-slate-900 shadow-xs font-semibold'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="Light / Day Mode"
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <span className="hidden sm:inline">Day</span>
      </button>

      <button
        type="button"
        onClick={() => onThemeChange('dark')}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
          isDark
            ? 'bg-slate-900 text-white shadow-xs font-semibold dark:bg-slate-700'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="Dark / Night Shift Mode"
      >
        <Moon className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden sm:inline">Night</span>
      </button>
    </div>
  );
};
