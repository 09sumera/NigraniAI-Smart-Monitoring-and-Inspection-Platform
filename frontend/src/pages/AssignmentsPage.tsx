import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ClipboardList, Plus, UserCheck, Building } from 'lucide-react';

export const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    api.get('/assignments').then(res => setAssignments(res.data.assignments || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Inspection Officer Assignments
          </h1>
          <p className="text-sm text-slate-500">Live roster of active, completed, and pending field assignments.</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="pb-3 px-3">Project / State</th>
              <th className="pb-3 px-3">Officer</th>
              <th className="pb-3 px-3">Protocol</th>
              <th className="pb-3 px-3">Trigger Reason</th>
              <th className="pb-3 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/80">
                <td className="py-3 px-3 font-semibold text-slate-900">
                  {a.project_name}
                  <span className="block text-[10px] text-slate-400 font-normal">{a.project_state}</span>
                </td>
                <td className="py-3 px-3 text-slate-700">{a.officer_name || 'Designated Inspector'}</td>
                <td className="py-3 px-3 uppercase text-[10px] font-bold text-blue-600">{a.inspection_type}</td>
                <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{a.assignment_reason}</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
