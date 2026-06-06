'use client';

import React from 'react';

interface DeactivateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  username: string;
  fullName: string;
  isDeactivating: boolean;
}

export default function DeactivateUserModal({
  isOpen,
  onClose,
  onConfirm,
  username,
  fullName,
  isDeactivating,
}: DeactivateUserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border/40 shadow-2xl overflow-hidden animate-scale-up select-none">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-destructive/15 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-foreground">Deactivate User Account</h3>
          <p className="text-xs text-foreground/50 mt-2 leading-relaxed">
            Are you sure you want to deactivate <strong className="text-foreground">{fullName}</strong> (<strong>@{username}</strong>)?
          </p>
          <p className="text-[11px] text-destructive/80 mt-2.5 font-semibold bg-destructive/5 border border-destructive/10 px-3 py-2 rounded-xl">
            Warning: The user will no longer be able to log in, register POS devices, or process sales transactions.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-border/40 bg-secondary/10 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border bg-card text-xs font-bold text-foreground/75 hover:text-foreground hover:bg-secondary/40 rounded-xl transition-all duration-150 cursor-pointer"
            disabled={isDeactivating}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold rounded-xl shadow-sm shadow-destructive/5 transition-all duration-150 cursor-pointer flex items-center gap-1.5"
            disabled={isDeactivating}
          >
            {isDeactivating && (
              <svg className="animate-spin h-3.5 w-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            Deactivate User
          </button>
        </div>
      </div>
    </div>
  );
}
