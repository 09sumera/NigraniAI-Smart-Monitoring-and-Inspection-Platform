import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Shield, UserCheck } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data.users || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          User Management & RBAC Permissions
        </h1>
        <p className="text-sm text-slate-500">Authorized personnel, role access limits, and credentials registry.</p>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="pb-3 px-3">Name / Email</th>
              <th className="pb-3 px-3">Role Tier</th>
              <th className="pb-3 px-3">Designation</th>
              <th className="pb-3 px-3">Jurisdiction</th>
              <th className="pb-3 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80">
                <td className="py-3 px-3 font-semibold text-slate-900">
                  {u.name}
                  <span className="block text-[10px] text-slate-400 font-normal">{u.email}</span>
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-600">{u.designation || 'Department Officer'}</td>
                <td className="py-3 px-3 text-slate-600">{u.state || 'National Headquarters'}</td>
                <td className="py-3 px-3">
                  <span className="text-[10px] font-bold uppercase text-emerald-600">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
