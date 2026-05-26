'use client';

import React, { useEffect } from 'react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  // Handle Esc key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      />

      {/* Modal Dialog Content */}
      <div className="relative bg-card border border-border/50 rounded-2xl max-w-sm w-full shadow-2xl p-6 overflow-hidden animate-scale-up z-10 flex flex-col items-center text-center">
        
        {/* Warning Icon Container with Pulsing Light */}
        <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4 relative shrink-0">
          <div className="absolute inset-0 rounded-full bg-destructive/5 animate-ping duration-1000 opacity-75"></div>
          <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>

        {/* Modal Text content */}
        <h3 className="text-lg font-extrabold text-foreground leading-snug tracking-tight mb-2">
          Confirm Logout
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-6 max-w-[280px]">
          Are you sure you want to log out of your POS session? Unsaved transactions may be lost.
        </p>

        {/* Action Buttons */}
        <div className="flex w-full items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-sm font-bold rounded-xl border border-border/60 hover:bg-secondary text-foreground transition-all duration-200 cursor-pointer text-center select-none active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 text-sm font-bold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200 shadow-md shadow-destructive/15 cursor-pointer text-center select-none active:scale-[0.98]"
          >
            Yes, Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
