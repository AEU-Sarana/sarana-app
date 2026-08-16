'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { roleService, Role } from '../../../services/roleService';
import RoleModal from '../../../components/admin/role-modal';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await roleService.listRoles();
      setRoles(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to retrieve roles list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    setIsDeleting(true);
    try {
      await roleService.deleteRole(deletingRole.role_id);
      setDeletingRole(null);
      fetchRoles();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete role');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.key.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Roles & Permissions Management
          </h1>
          <p className="text-xs md:text-sm text-foreground/60 mt-1">
            Create custom roles (e.g., Receiver, Inventory Manager) and configure granular feature permissions.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-primary/20 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Create Custom Role
        </button>
      </div>

      {/* Search Filter Box */}
      <div className="bg-card border border-border/40 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search roles by name or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-foreground/35"
          />
          <svg
            className="w-4 h-4 absolute left-3.5 top-3.5 text-foreground/40 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="text-xs font-semibold text-foreground/60 self-end sm:self-center">
          Total Roles: <span className="text-foreground font-bold">{filteredRoles.length}</span>
        </div>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-2xl flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Roles Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-foreground/50 text-sm font-medium">Loading roles...</div>
      ) : filteredRoles.length === 0 ? (
        <div className="py-16 text-center bg-card border border-border/40 rounded-3xl text-foreground/50 text-sm">
          No roles found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => {
            const activePermCount = (role.permissions || []).length;

            return (
              <div
                key={role.role_id}
                className="bg-card border border-border/40 rounded-3xl p-6 flex flex-col justify-between hover:border-border/80 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-foreground">{role.name}</h2>
                      <span className="inline-block mt-1 text-[11px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                        {role.key}
                      </span>
                    </div>

                    {role.is_system ? (
                      <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-full">
                        System Role
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                        Custom Role
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-foreground/60 mb-6 line-clamp-2 min-h-[32px] leading-relaxed">
                    {role.description || 'No description provided.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6 p-3 bg-secondary/20 rounded-2xl border border-border/30 text-xs">
                    <div>
                      <span className="text-foreground/50 block text-[10px] font-bold uppercase tracking-wider">
                        Assigned Users
                      </span>
                      <span className="font-extrabold text-foreground text-sm mt-0.5 block">
                        {role.user_count || 0} user(s)
                      </span>
                    </div>

                    <div>
                      <span className="text-foreground/50 block text-[10px] font-bold uppercase tracking-wider">
                        Permissions
                      </span>
                      <span className="font-extrabold text-primary text-sm mt-0.5 block">
                        {role.key === 'ADMIN' ? 'Full System (*)' : `${activePermCount} feature(s)`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-border/30">
                  <button
                    onClick={() => handleOpenEditModal(role)}
                    className="flex-1 py-2 px-3 text-xs font-bold text-foreground/80 hover:text-foreground bg-secondary/40 hover:bg-secondary/70 border border-border/40 rounded-xl transition-all"
                  >
                    Edit Permissions
                  </button>

                  {!role.is_system && (
                    <button
                      onClick={() => setDeletingRole(role)}
                      className="px-3.5 py-2 text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive hover:text-white rounded-xl transition-all border border-destructive/20"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role Create/Edit Modal */}
      <RoleModal
        isOpen={isModalOpen}
        role={editingRole}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchRoles}
      />

      {/* Delete Confirmation Modal */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/60 rounded-3xl max-w-md w-full p-6 text-foreground space-y-4 shadow-2xl animate-scale-up">
            <h3 className="text-base font-bold text-destructive">Delete Role?</h3>
            <p className="text-xs md:text-sm text-foreground/80 leading-relaxed">
              Are you sure you want to delete custom role{' '}
              <strong className="text-foreground font-bold">{deletingRole.name}</strong> ({deletingRole.key})?
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
              <button
                onClick={() => setDeletingRole(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-foreground/60 hover:text-foreground border border-border rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRole}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-destructive hover:bg-destructive/90 rounded-xl transition-all shadow-sm shadow-destructive/20"
              >
                {isDeleting ? 'Deleting...' : 'Delete Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
