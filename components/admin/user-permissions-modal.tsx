'use client';

import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

interface SystemFeature {
  key: string;
  name: string;
  category: string;
  description: string;
  defaultCashier: boolean;
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

export default function UserPermissionsModal({
  isOpen,
  user,
  onClose,
  onSaved,
}: UserPermissionsModalProps) {
  const [features, setFeatures] = useState<SystemFeature[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
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
      const userPerms: string[] = permRes?.data?.permissions || [];
      setSelectedKeys(userPerms);
    } catch (err: any) {
      setError(err?.message || 'Failed to load feature permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedKeys(features.map((f) => f.key));
  };

  const handleClearAll = () => {
    setSelectedKeys([]);
  };

  const handleResetDefault = () => {
    setSelectedKeys(features.filter((f) => f.defaultCashier).map((f) => f.key));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await authService.updateUserPermissions(user.userId, selectedKeys);
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

  // Group features by category
  const categories = Array.from(new Set(features.map((f) => f.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border/80 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
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
              Assign or revoke specific system features for <strong className="text-foreground">{user.fullName}</strong> (@{user.username})
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors"
            >
              Select All
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
            Selected: <span className="text-primary font-extrabold">{selectedKeys.length}</span> / {features.length} Features
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
              Loading system features...
            </div>
          ) : (
            categories.map((cat) => {
              const catFeatures = features.filter((f) => f.category === cat);
              return (
                <div key={cat} className="space-y-3">
                  <h3 className="text-xs font-extrabold text-foreground/40 uppercase tracking-wider font-sans border-b border-border/30 pb-1">
                    {cat}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {catFeatures.map((feat) => {
                      const isChecked = selectedKeys.includes(feat.key);
                      return (
                        <label
                          key={feat.key}
                          onClick={() => handleToggle(feat.key)}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                            isChecked
                              ? 'bg-primary/5 border-primary/40 shadow-sm'
                              : 'bg-card border-border/40 hover:bg-secondary/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground leading-tight">
                              {feat.name}
                            </p>
                            <p className="text-[11px] text-foreground/50 leading-tight mt-0.5">
                              {feat.description}
                            </p>
                          </div>
                        </label>
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
