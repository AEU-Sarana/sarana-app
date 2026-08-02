'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { userService } from '../../../services/userService';
import { User } from '../../../features/user/types';
import { UserListTable } from '../../../components/users/user-list-table';
import { UserModal } from '../../../components/users/user-modal';
import DeactivateUserModal from '../../../components/users/deactivate-user-modal';
import UserPermissionsModal from '../../../components/admin/user-permissions-modal';
import { UserDetailsModal } from '../../../components/users/user-details-modal';
import { useLanguage } from '../../../contexts/language-context';
import { useAuth } from '../../../hooks/useAuth';

const PAGE_LIMIT = 10;

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const currentUser = useSelector(selectCurrentUser);
  const currentUserId = currentUser?.userId;

  // List & pagination state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [permissionsTarget, setPermissionsTarget] = useState<User | null>(null);
  const [viewDetailUserId, setViewDetailUserId] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch user list
  const fetchUserList = useCallback(async (opts: {
    page?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page: opts.page ?? 1,
        limit: PAGE_LIMIT,
      };
      if (opts.search) params.search = opts.search;
      if (opts.role) params.role = opts.role;
      if (opts.status) params.status = opts.status;

      const res = await userService.listUsers(params);
      setUsers(res.users);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to retrieve user list.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load / fetch when filters change
  useEffect(() => {
    fetchUserList({ page, search, role: roleFilter, status: statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, statusFilter]);

  // Debounced search handler
  const handleSearch = (v: string) => {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchUserList({ page: 1, search: v, role: roleFilter, status: statusFilter });
    }, 350);
  };

  const handleFilterChange = (key: 'role' | 'status', value: string) => {
    setPage(1);
    if (key === 'role') setRoleFilter(value);
    if (key === 'status') setStatusFilter(value);
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
    fetchUserList({ page: 1, search: '', role: '', status: '' });
  };

  const handleRefresh = () => {
    fetchUserList({ page, search, role: roleFilter, status: statusFilter });
  };

  // Triggers for creation/edit modal
  const handleAddUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  // Deactivate/activate user status handler
  const handleDeactivateToggle = async (user: User) => {
    if (user.status === 'active') {
      setDeactivateTarget(user);
    } else {
      if (!window.confirm(`Are you sure you want to reactivate @${user.username}?`)) {
        return;
      }
      try {
        setIsLoading(true);
        await userService.updateUser(user.userId, { status: 'active' });
        handleRefresh();
      } catch (err: any) {
        alert(err?.response?.data?.message || err?.message || 'Failed to reactivate user.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsDeactivating(true);
    try {
      await userService.deactivateUser(deactivateTarget.userId);
      setDeactivateTarget(null);
      handleRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to deactivate user.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const { can } = useAuth();
  const canCreateUser = can('users.manage', 'create');

  return (
    <div className="space-y-6">
      {/* Action Bar (Top Right buttons) */}
      <div className="flex justify-end items-center select-none">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh Users"
            className="group flex-1 sm:flex-initial px-4.5 py-2.5 bg-secondary/50 hover:bg-secondary dark:bg-secondary/20 dark:hover:bg-secondary/35 border border-border/40 hover:border-border/80 rounded-xl text-foreground/60 hover:text-foreground font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 text-foreground/50 transition-transform duration-500 ease-out ${
                isLoading ? 'animate-spin' : 'group-hover:rotate-180'
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>{isLoading ? t('reports.loading', 'Refreshing...') : t('common.refresh', 'Refresh')}</span>
          </button>
          {canCreateUser && (
            <button
              onClick={handleAddUser}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-primary/20 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>{t('users.add_user', 'Add New User')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-3.5 select-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Search box */}
          <div className="lg:col-span-7 relative">
            <input
              type="text"
              placeholder={t('users.search_placeholder', 'Search users by name, username, email, phone...')}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200"
            />
            <svg className="absolute left-4 top-4.5 w-5 h-5 text-foreground/45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Role Filter */}
          <div className="lg:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary outline-none transition-all duration-200 cursor-pointer"
            >
              <option value="">{t('users.all_roles', 'All Roles')}</option>
              <option value="ADMIN">{t('common.administrator', 'Administrator')}</option>
              <option value="CASHIER">{t('common.cashier', 'Cashier')}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-primary outline-none transition-all duration-200 cursor-pointer"
            >
              <option value="">{t('products.all_statuses', 'All Statuses')}</option>
              <option value="active">{t('common.active', 'Active')}</option>
              <option value="inactive">{t('common.inactive', 'Inactive')}</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(search !== '' || roleFilter !== '' || statusFilter !== '') && (
          <div className="flex justify-end pt-1 animate-fade-in">
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer border border-primary/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t('products.clear_filters', 'Clear active filters')}
            </button>
          </div>
        )}
      </div>

      {/* Main Table view */}
      <UserListTable
        users={users}
        isLoading={isLoading}
        error={error}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onEdit={handleEditUser}
        onDeactivate={handleDeactivateToggle}
        onManagePermissions={(user) => setPermissionsTarget(user)}
        onViewDetails={(user) => setViewDetailUserId(user.userId)}
        currentUserId={currentUserId}
      />

      {/* Add/Edit Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={() => {
          setIsUserModalOpen(false);
          handleRefresh();
        }}
        user={editingUser}
      />

      {/* Deactivate/Terminate Confirmation Modal */}
      <DeactivateUserModal
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleConfirmDeactivate}
        username={deactivateTarget?.username || ''}
        fullName={deactivateTarget?.fullName || ''}
        isDeactivating={isDeactivating}
      />

      {/* Feature Access Permissions Modal */}
      <UserPermissionsModal
        isOpen={!!permissionsTarget}
        user={permissionsTarget}
        onClose={() => setPermissionsTarget(null)}
        onSaved={handleRefresh}
      />

      {/* User Information Details View Modal */}
      <UserDetailsModal
        isOpen={!!viewDetailUserId}
        userId={viewDetailUserId}
        onClose={() => setViewDetailUserId(null)}
      />
    </div>
  );
}
