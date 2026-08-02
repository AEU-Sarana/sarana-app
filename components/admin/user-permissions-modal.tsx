'use client';

import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'all';

interface SystemFeature {
  key: string;
  name: string;
  category: string;
  description: string;
  defaultCashier: boolean;
  supportedActions?: PermissionAction[];
}

export interface UserPermissionItem {
  featureKey: string;
  actions: PermissionAction[];
}

interface UserPermissionsModalProps {
  isOpen: boolean;
  user: {
    userId: number;
    fullName: string;
    username: string;
    role: string;
  } | null;
  onClose: () => void;
  onSaved?: () => void;
}

const ACTION_LABELS: Record<PermissionAction, { label: string }> = {
  read: { label: 'Read / View' },
  create: { label: 'Create' },
  update: { label: 'Edit' },
  delete: { label: 'Delete' },
  all: { label: 'All' },
};

export default function UserPermissionsModal({
  isOpen,
  user,
  onClose,
  onSaved,
}: UserPermissionsModalProps) {
  const [features, setFeatures] = useState<SystemFeature[]>([]);
  const [permissionMap, setPermissionMap] = useState<Record<string, PermissionAction[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Load system features master list
      const featRes = await authService.getSystemFeatures();
      const allFeatures: SystemFeature[] = featRes?.data || [];
      setFeatures(allFeatures);

      // 2. Load target user's current permissions
      const permRes = await authService.getUserPermissions(user.userId);
      const rawPerms = permRes?.data?.permissions || [];

      // Normalize into map: { [featureKey]: ['read', 'create', ...] }
      const newMap: Record<string, PermissionAction[]> = {};
      
      if (Array.isArray(rawPerms)) {
        for (const item of rawPerms) {
          if (typeof item === 'string') {
            newMap[item] = ['all', 'read', 'create', 'update', 'delete'];
          } else if (item && typeof item === 'object' && item.featureKey) {
            newMap[item.featureKey] = Array.isArray(item.actions) ? item.actions : ['read'];
          }
        }
      }

      setPermissionMap(newMap);
    } catch (err: any) {
      setError(err?.message || 'Failed to load feature permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleActionToggle = (featureKey: string, action: PermissionAction) => {
    setPermissionMap((prev) => {
      const current = prev[featureKey] || [];
      let updated: PermissionAction[] = [];

      if (action === 'all') {
        // Toggle all vs none
        if (current.includes('all')) {
          updated = [];
        } else {
          updated = ['all', 'read', 'create', 'update', 'delete'];
        }
      } else {
        if (current.includes(action)) {
          // Remove action (and remove 'all' if present)
          updated = current.filter((a) => a !== action && a !== 'all');
        } else {
          // Add action
          updated = [...current.filter((a) => a !== 'all'), action];
          // Check if all actions are now selected
          const feat = features.find((f) => f.key === featureKey);
          const supported = feat?.supportedActions || ['read', 'create', 'update', 'delete'];
          const nonAllSupported = supported.filter((s) => s !== 'all');
          if (nonAllSupported.every((a) => updated.includes(a))) {
            updated.push('all');
          }
        }
      }

      const next = { ...prev };
      if (updated.length === 0) {
        delete next[featureKey];
      } else {
        next[featureKey] = updated;
      }
      return next;
    });
  };

  const handleSelectAllFull = () => {
    const fullMap: Record<string, PermissionAction[]> = {};
    for (const f of features) {
      fullMap[f.key] = ['all', 'read', 'create', 'update', 'delete'];
    }
    setPermissionMap(fullMap);
  };

  const handleSelectAllRead = () => {
    const readMap: Record<string, PermissionAction[]> = {};
    for (const f of features) {
      readMap[f.key] = ['read'];
    }
    setPermissionMap(readMap);
  };

  const handleClearAll = () => {
    setPermissionMap({});
  };

  const handleResetDefault = () => {
    const defaultMap: Record<string, PermissionAction[]> = {};
    for (const f of features) {
      if (f.defaultCashier) {
        defaultMap[f.key] = ['read', 'create', 'update'];
      }
    }
    setPermissionMap(defaultMap);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = Object.entries(permissionMap).map(([featureKey, actions]) => ({
        featureKey,
        actions,
      }));

      await authService.updateUserPermissions(user.userId, payload);
      setSuccess('Permissions updated successfully!');
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  const categories = Array.from(new Set(features.map((f) => f.category)));
  const totalAssignedCount = Object.keys(permissionMap).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border/80 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-secondary/30">
          <div>
            <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Feature Access Permissions
            </h2>
            <p className="text-xs text-foreground/60 mt-0.5">
              Assign or revoke specific granular feature actions for <strong className="text-foreground">{user.fullName}</strong> (@{user.username})
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-foreground/60 hover:text-foreground transition-all duration-150 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-card border-b border-border/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSelectAllFull}
              className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors"
            >
              Select All (Full)
            </button>
            <button
              onClick={handleSelectAllRead}
              className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors"
            >
              Select All (Read Only)
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors text-destructive"
            >
              Clear All
            </button>
            <button
              onClick={handleResetDefault}
              className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              Reset Default Cashier
            </button>
          </div>

          <span className="text-xs font-bold text-foreground/60">
            Active Features: <span className="text-primary font-extrabold">{totalAssignedCount}</span> / {features.length}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-bold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-success/10 text-success text-xs font-bold">
              {success}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-sm font-semibold text-foreground/50">
              Loading system feature matrix...
            </div>
          ) : (
            categories.map((cat) => {
              const catFeatures = features.filter((f) => f.category === cat);
              return (
                <div key={cat} className="space-y-3">
                  <h3 className="text-xs font-extrabold text-foreground/40 uppercase tracking-wider font-sans border-b border-border/30 pb-1">
                    {cat}
                  </h3>

                  <div className="space-y-2.5">
                    {catFeatures.map((feat) => {
                      const activeActions = permissionMap[feat.key] || [];
                      const supported = feat.supportedActions || ['read', 'create', 'update', 'delete', 'all'];

                      return (
                        <div
                          key={feat.key}
                          className={`p-3.5 rounded-xl border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            activeActions.length > 0
                              ? 'bg-primary/[0.02] border-primary/30 shadow-sm'
                              : 'bg-card border-border/40'
                          }`}
                        >
                          {/* Feature title & description */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-extrabold text-foreground leading-tight">
                                {feat.name}
                              </p>
                              {feat.defaultCashier && (
                                <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">
                                  Default Cashier
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-foreground/50 leading-tight mt-0.5">
                              {feat.description}
                            </p>
                          </div>

                          {/* Action Pill Selector */}
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            {supported.map((act) => {
                              const isSelected = activeActions.includes(act);
                              const info = ACTION_LABELS[act] || { label: act };

                              return (
                                <button
                                  key={act}
                                  type="button"
                                  onClick={() => handleActionToggle(feat.key, act)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer select-none border ${
                                    isSelected
                                      ? act === 'all'
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                                        : 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                                      : 'bg-secondary/50 text-foreground/60 border-border/40 hover:bg-secondary hover:text-foreground'
                                  }`}
                                >
                                  <span>{info.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 bg-secondary/20 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-extrabold shadow-md shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? 'Saving Changes...' : 'Save Feature Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
}
