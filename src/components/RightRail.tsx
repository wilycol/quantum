'use client';
import { useUILayout } from '../../lib/uiLayoutStore';
import CoachPanel from '../app/qcore/components/CoachPanel';
import LogsPanel from './LogsPanel';
import ExecutedTimeline from './ExecutedTimeline';
import QAPanel from './QAPanel';
import DatasetPanel from './DatasetPanel';

export default function RightRail() {
  const { activeRightTab, setRightTab } = useUILayout();
  
  const tabs = [
    { id: 'coach' as const, label: 'IA Coach' },
    { id: 'logs' as const, label: 'Logs' },
    { id: 'timeline' as const, label: 'Timeline' },
    { id: 'qa' as const, label: 'QA Tests' },
    { id: 'dataset' as const, label: 'Dataset' }
  ];

  const activeTab = tabs.find(tab => tab.id === activeRightTab);

  return (
    <div className="rounded-md border border-zinc-800 overflow-hidden">
      {/* Compact Header with Dropdown */}
      <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Right Panel</h3>
          <select 
            value={activeRightTab}
            onChange={(e) => setRightTab(e.target.value as any)}
            className="bg-zinc-800 text-white text-sm px-3 py-1 rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {tabs.map(tab => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
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
        {activeRightTab === 'qa' && (
          <div className="h-full">
            <QAPanel />
          </div>
        )}
        {activeRightTab === 'dataset' && (
          <div className="h-full">
            <DatasetPanel />
          </div>
        )}
      </div>
    </div>
  );
}
