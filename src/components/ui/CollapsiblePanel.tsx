'use client';
import { useUILayout } from '@/lib/uiLayoutStore';

interface CollapsiblePanelProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

export default function CollapsiblePanel({
  id, 
  title, 
  children, 
  defaultCollapsed = false,
  className = ''
}: CollapsiblePanelProps) {
  const { collapsed, setCollapsed } = useUILayout();
  const isCollapsed = collapsed[id] ?? defaultCollapsed;

  return (
    <div className={`rounded-md border border-zinc-800 overflow-hidden ${className}`}>
      <button
        onClick={() => setCollapsed(id, !isCollapsed)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 text-sm hover:bg-zinc-800 transition-colors"
      >
        <span className="text-white font-medium">{title}</span>
        <span className="text-zinc-400 text-lg">
          {isCollapsed ? '▸' : '▾'}
        </span>
      </button>
      {!isCollapsed && (
        <div className="p-3 bg-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}
