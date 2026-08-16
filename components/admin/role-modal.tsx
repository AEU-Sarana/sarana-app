'use client';

import React, { useState, useEffect } from 'react';
import { roleService, Role, RolePermissionInput } from '../../services/roleService';
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

interface RoleModalProps {
  isOpen: boolean;
  role: Role | null;
  onClose: () => void;
  onSaved: () => void;
}

const ACTION_LABELS: Record<PermissionAction, string> = {
  read: 'View / Read',
  create: 'Create',
  update: 'Edit',
  delete: 'Delete',
  all: 'All Actions',
};

export default function RoleModal({ isOpen, role, onClose, onSaved }: RoleModalProps) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<SystemFeature[]>([]);
  const [permissionMap, setPermissionMap] = useState<Record<string, PermissionAction[]>>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(role);

  useEffect(() => {
    if (isOpen) {
      loadFeaturesAndRoleData();
    }
  }, [isOpen, role]);

  const loadFeaturesAndRoleData = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Fetch system features master list
      const featRes = await authService.getSystemFeatures();
      const allFeatures: SystemFeature[] = featRes?.data || [];
      setFeatures(allFeatures);

      // 2. Set form fields if editing
      if (role) {
        setKey(role.key);
        setName(role.name);
        setDescription(role.description || '');

        const initialMap: Record<string, PermissionAction[]> = {};
        for (const p of role.permissions || []) {
          initialMap[p.feature_key] = (p.actions as PermissionAction[]) || ['read'];
        }
        setPermissionMap(initialMap);
      } else {
        setKey('');
        setName('');
        setDescription('');
        setPermissionMap({});
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load system features');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      // Auto-generate system key behind the scenes
      const generatedKey = val
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      setKey(generatedKey);
    }
  };

  const handleActionToggle = (featureKey: string, action: PermissionAction) => {
    setPermissionMap((prev) => {
      const currentActions = prev[featureKey] || [];
      let nextActions: PermissionAction[] = [];

      if (action === 'all') {
        if (currentActions.includes('all')) {
          nextActions = [];
        } else {
          nextActions = ['all', 'read', 'create', 'update', 'delete'];
        }
      } else {
        if (currentActions.includes(action)) {
          nextActions = currentActions.filter((a) => a !== action && a !== 'all');
        } else {
          nextActions = [...currentActions.filter((a) => a !== 'all'), action];
        }
      }

      return {
        ...prev,
        [featureKey]: nextActions,
      };
    });
  };

  const handleCategorySelectAll = (categoryFeatures: SystemFeature[]) => {
    setPermissionMap((prev) => {
      const updatedMap = { ...prev };
      const allSelected = categoryFeatures.every(
        (f) => (prev[f.key] || []).length > 0
      );

      for (const f of categoryFeatures) {
        if (allSelected) {
          delete updatedMap[f.key];
        } else {
          updatedMap[f.key] = ['all', 'read', 'create', 'update', 'delete'];
        }
      }
      return updatedMap;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    const autoKey = key.trim() || name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');

    setSaving(true);
    setError('');

    try {
      // Format permissions list
      const permissions: RolePermissionInput[] = Object.entries(permissionMap)
        .filter(([_, actions]) => actions.length > 0)
        .map(([feature_key, actions]) => ({
          feature_key,
          actions,
        }));

      if (isEditing && role) {
        await roleService.updateRole(role.role_id, {
          name: name.trim(),
          description: description.trim(),
          permissions,
        });
      } else {
        await roleService.createRole({
          key: autoKey,
          name: name.trim(),
          description: description.trim(),
          permissions,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Group features by category
  const categoriesMap: Record<string, SystemFeature[]> = {};
  for (const f of features) {
    if (!categoriesMap[f.category]) {
      categoriesMap[f.category] = [];
    }
    categoriesMap[f.category].push(f);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-card border border-border/60 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-foreground animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border/30 bg-secondary/15">
          <div>
            <h2 className="text-base md:text-lg font-bold text-foreground">
              {isEditing ? `Edit Role: ${role?.name}` : 'Create New Custom Role'}
            </h2>
            <p className="text-xs text-foreground/50 mt-0.5">
              Enter a role name and assign allowed feature permissions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border/50 text-foreground/50 hover:text-foreground hover:bg-secondary/40 transition-all flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-2xl">
              {error}
            </div>
          )}

          {/* Single Role Name Field & Description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 mb-1.5">
                Role Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Receiver, Inventory Manager, Store Supervisor"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-foreground/25"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 mb-1.5">
                Description
              </label>
              <input
                type="text"
                placeholder="Brief summary of role responsibilities..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-secondary/10 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-foreground/25"
              />
            </div>
          </div>

          {/* Permissions Matrix */}
          <div>
            <h3 className="text-xs font-extrabold text-foreground/70 uppercase tracking-wider mb-3">
              Feature Permission Matrix
            </h3>

            {loading ? (
              <div className="py-12 text-center text-foreground/40 text-sm font-medium">Loading system features...</div>
            ) : (
              <div className="space-y-6">
                {Object.entries(categoriesMap).map(([category, catFeatures]) => {
                  const categoryAllSelected = catFeatures.every(
                    (f) => (permissionMap[f.key] || []).length > 0
                  );

                  return (
                    <div
                      key={category}
                      className="border border-border/40 bg-secondary/5 rounded-2xl overflow-hidden"
                    >
                      {/* Category Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-secondary/20 border-b border-border/30">
                        <span className="font-bold text-xs text-foreground uppercase tracking-wider">
                          {category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCategorySelectAll(catFeatures)}
                          className="text-xs text-primary hover:underline font-bold transition"
                        >
                          {categoryAllSelected ? 'Deselect Category' : 'Select All in Category'}
                        </button>
                      </div>

                      {/* Feature rows */}
                      <div className="divide-y divide-border/20">
                        {catFeatures.map((feature) => {
                          const currentActions = permissionMap[feature.key] || [];
                          const availableActions: PermissionAction[] = feature.supportedActions || [
                            'read',
                            'create',
                            'update',
                            'delete',
                            'all',
                          ];

                          return (
                            <div
                              key={feature.key}
                              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-secondary/10 transition"
                            >
                              <div className="max-w-md">
                                <div className="font-bold text-sm text-foreground">
                                  {feature.name}
                                </div>
                                <div className="text-xs text-foreground/50 mt-0.5">
                                  {feature.description}
                                </div>
                              </div>

                              {/* Action checkboxes */}
                              <div className="flex flex-wrap items-center gap-2">
                                {availableActions.map((act) => {
                                  const isChecked = currentActions.includes(act);
                                  return (
                                    <button
                                      key={act}
                                      type="button"
                                      onClick={() => handleActionToggle(feature.key, act)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                                        isChecked
                                          ? 'bg-primary/10 border-primary/40 text-primary'
                                          : 'bg-card border-border/60 text-foreground/50 hover:text-foreground hover:bg-secondary/30'
                                      }`}
                                    >
                                      {isChecked ? '✓ ' : ''}
                                      {ACTION_LABELS[act] || act}
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
                })}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/30 bg-secondary/15">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 text-xs font-bold text-foreground/60 hover:text-foreground border border-border rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || loading}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl transition shadow-sm shadow-primary/20 cursor-pointer"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
