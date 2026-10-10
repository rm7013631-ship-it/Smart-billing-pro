import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { api } from '../services/api.ts';
import { BusinessMember } from '../types/index.ts';
import {
  UserCheck,
  Plus,
  Shield,
  Trash2,
  X,
  Mail,
  User,
} from 'lucide-react';

export const StaffScreen: React.FC = () => {
  const { currentBusiness } = useBusiness();
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Manager' | 'Cashier' | 'Staff'>('Cashier');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentBusiness) {
      loadMembers();
    }
  }, [currentBusiness]);

  const loadMembers = async () => {
    if (!currentBusiness) return;
    try {
      setLoading(true);
      const data = await api.getMembers(currentBusiness.id);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !email.trim()) return;

    try {
      setSaving(true);
      await api.createMember(currentBusiness.id, {
        email: email.trim(),
        name: name.trim() || undefined,
        role,
      });
      setModalOpen(false);
      setEmail('');
      setName('');
      await loadMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to add staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!currentBusiness || !confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await api.deleteMember(currentBusiness.id, id);
      await loadMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff member');
    }
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Staff & Permissions (RBAC)
          </h1>
          <p className="text-xs text-slate-500">
            Control employee roles: Cashier (billing only), Manager (inventory & accounts), or Admin.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Staff Member
        </button>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Staff Name</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.length > 0 ? (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
                        {m.userName ? m.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span>{m.userName || 'Staff User'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {m.userEmail || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          m.role === 'Owner'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : m.role === 'Admin'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : m.role === 'Manager'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {m.role !== 'Owner' && (
                        <button
                          onClick={() => handleDeleteMember(m.id)}
                          className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Remove Staff"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    <UserCheck className="mx-auto mb-2 h-8 w-8 stroke-1 text-slate-300" />
                    No staff members registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Add Staff Member</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Staff Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amit Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="staff@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Cashier">Cashier (Billing POS Only)</option>
                  <option value="Manager">Manager (Inventory & Invoices)</option>
                  <option value="Admin">Admin (Full Store Management)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border px-3.5 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
