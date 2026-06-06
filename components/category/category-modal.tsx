'use client';

import React, { useState, useEffect } from 'react';
import { Category } from '../../features/category/types';
import { categoryService } from '../../services/categoryService';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  category: Category | null; // Null means Add, Category object means Edit
}

export default function CategoryModal({ isOpen, onClose, onSave, category }: CategoryModalProps) {
  const isEditMode = !!category;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state with selected category when modal opens
  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name);
        setDescription(category.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setErrorMessage(null);
    }
  }, [isOpen, category]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Category name is required');
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
      };

      if (isEditMode && category) {
        await categoryService.updateCategory(category.categoryId, payload);
      } else {
        await categoryService.createCategory(payload);
      }

      onSave();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to save category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border/40 shadow-2xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/40 flex justify-between items-center bg-secondary/10">
          <div>
            <h2 className="text-lg font-extrabold text-foreground leading-tight">
              {isEditMode ? 'Edit Category' : 'Create Category'}
            </h2>
            <p className="text-[11px] text-foreground/50 mt-1.5">
              {isEditMode ? 'Modify category details and description.' : 'Add a new category classification to organize products.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8.5 h-8.5 rounded-lg bg-secondary/40 hover:bg-secondary flex items-center justify-center text-foreground/60 hover:text-foreground cursor-pointer transition-colors duration-150"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-destructive/10 text-destructive text-xs font-semibold rounded-xl border border-destructive/20 flex gap-2.5 items-center">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {errorMessage}
            </div>
          )}

          {/* Category Name */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/60 mb-2">
              Category Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Antibiotics, Pain Relievers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border/80 bg-background text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150"
              required
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground/60 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe medicines classified in this category..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border/80 bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150 resize-none"
              disabled={isSaving}
            />
          </div>
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border/40 bg-secondary/10 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold text-foreground/75 hover:text-foreground hover:bg-secondary/40 transition-all duration-150 cursor-pointer"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-extrabold shadow-sm shadow-primary/20 transition-all duration-150 cursor-pointer flex items-center gap-1.5"
            disabled={isSaving}
          >
            {isSaving && (
              <svg className="animate-spin h-3.5 w-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
