import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar as CalendarIcon, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [inspections, setInspections] = useState<any[]>([]);

  useEffect(() => {
    api.get('/inspections').then(res => setInspections(res.data.inspections || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Inspection Schedule & Compliance Calendar
        </h1>
        <p className="text-sm text-slate-500">Scheduled audits, statutory due dates, and surprise inspection timelines.</p>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Scheduled Audit Milestones</h2>
        <div className="space-y-3">
          {inspections.slice(0, 8).map((ins) => (
            <div key={ins.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">{ins.project_name}</p>
                <p className="text-slate-500">{ins.project_state} • {ins.inspection_type?.toUpperCase()} AUDIT</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-600 capitalize">{ins.status}</span>
                <p className="text-[10px] text-slate-400">Officer: {ins.assigned_officer || 'Assigned Officer'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
