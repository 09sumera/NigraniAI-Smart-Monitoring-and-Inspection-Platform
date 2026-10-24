import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Project } from '../types';
import {
  Building2,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MapPin,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // New Project Form State
  const [newProject, setNewProject] = useState({
    name: '',
    institution_name: '',
    institution_type: 'NGO',
    state: 'Maharashtra',
    district: 'Mumbai',
    registered_beneficiaries: 100,
    sanctioned_capacity: 120,
    project_manager: '',
    contact_phone: '',
    status: 'active'
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects', {
        params: {
          page: currentPage,
          search: search || undefined,
          risk_level: riskFilter || undefined,
          state: stateFilter || undefined,
          per_page: 10
        }
      });
      setProjects(res.data.projects);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentPage, riskFilter, stateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProjects();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      alert('Error saving project.');
    }
  };

  const openProjectDetails = async (id: number) => {
    try {
      const res = await api.get(`/projects/${id}`);
      setSelectedProject(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects & Institutions Registry</h1>
          <p className="text-sm text-slate-500">Master database of DoSJE funded centers, institutions, and NGOs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-xs shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Unit</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, Name or NGO..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Risk Tiers</option>
            <option value="low">Low Risk</option>
            <option value="moderate">Moderate Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All States</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-3">Project ID / Name</th>
                <th className="pb-3 px-3">Institution & Scheme</th>
                <th className="pb-3 px-3">State & District</th>
                <th className="pb-3 px-3">Beneficiaries</th>
                <th className="pb-3 px-3">Compliance</th>
                <th className="pb-3 px-3">Risk Level</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading registry...</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No projects match the criteria.</td>
                </tr>
              ) : (
                projects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>{proj.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{proj.project_id}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{proj.institution_name}</div>
                      <span className="text-[10px] text-blue-600 font-medium">{proj.scheme || 'DoSJE Scheme'}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{proj.state}</div>
                      <span className="text-[10px] text-slate-400">{proj.district}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {proj.registered_beneficiaries} / {proj.sanctioned_capacity}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{proj.compliance_score}%</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        proj.risk_level === 'critical' ? 'bg-rose-100 text-rose-800' :
                        proj.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                        proj.risk_level === 'moderate' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {proj.risk_level} ({proj.risk_score})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => openProjectDetails(proj.id)}
                        className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                      >
                        Inspect <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
          <span className="text-xs text-slate-500">
            Showing Page {currentPage} of {pages} ({total} Total Records)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage >= pages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Slide-Over/Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedProject.name}</h2>
                <p className="text-xs text-slate-500 font-mono">{selectedProject.project_id} • {selectedProject.institution_name}</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 uppercase text-[10px] font-bold">State & District</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedProject.state}, {selectedProject.district}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Manager & Contact</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedProject.project_manager || 'Not Assigned'} ({selectedProject.contact_phone || 'N/A'})</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Beneficiary Capacity</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedProject.registered_beneficiaries} Registered / {selectedProject.sanctioned_capacity} Sanctioned</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Risk Index</span>
                <p className="font-semibold text-rose-600 mt-0.5">{selectedProject.risk_score} / 100 ({selectedProject.risk_level})</p>
              </div>
            </div>

            {/* Cameras attached */}
            <div className="mt-6">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Connected CCTV Feeds</h3>
              <div className="grid grid-cols-2 gap-2">
                {(selectedProject.cameras || []).length === 0 ? (
                  <p className="text-xs text-slate-400">No surveillance cameras configured for this unit.</p>
                ) : (
                  selectedProject.cameras.map((c: any) => (
                    <div key={c.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                      <span>{c.name} ({c.location_desc})</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">{c.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Register New Assisted Unit</h2>
            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Institution / NGO Name</label>
                <input
                  type="text"
                  required
                  value={newProject.institution_name}
                  onChange={(e) => setNewProject({ ...newProject, institution_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newProject.state}
                    onChange={(e) => setNewProject({ ...newProject, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={newProject.district}
                    onChange={(e) => setNewProject({ ...newProject, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Save Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
