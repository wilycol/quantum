'use client';
import { useUILayout } from '@/lib/uiLayoutStore';
import CoachPanel from '@/app/qcore/components/CoachPanel';
import LogsPanel from '@/components/LogsPanel';
import ExecutedTimeline from '@/components/ExecutedTimeline';

export default function RightRail() {
  const { activeRightTab, setRightTab } = useUILayout();
  
  const tabs = [
    { id: 'coach' as const, label: 'IA Coach' },
    { id: 'logs' as const, label: 'Logs' },
    { id: 'timeline' as const, label: 'Timeline' }
  ];

  return (
    <div className="rounded-md border border-zinc-800 overflow-hidden">
      {/* Tab Headers */}
      <div className="flex text-sm bg-zinc-900">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setRightTab(tab.id)}
            className={`flex-1 px-3 py-2 font-medium transition-colors ${
              activeRightTab === tab.id 
                ? 'bg-zinc-800 text-white border-b-2 border-blue-500' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="h-[420px] overflow-auto">
        {activeRightTab === 'coach' && (
          <div className="p-4">
            <CoachPanel />
          </div>
        )}
        {activeRightTab === 'logs' && (
          <div className="h-full">
            <LogsPanel />
          </div>
        )}
        {activeRightTab === 'timeline' && (
          <div className="p-4">
            <ExecutedTimeline />
          </div>
        )}
      </div>
    </div>
  );
}
