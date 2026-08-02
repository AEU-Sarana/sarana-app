'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Category, CategoryCount } from '../../../features/category/types';
import { categoryService } from '../../../services/categoryService';
import CategoryModal from '../../../components/category/category-modal';
import CategoryList from '../../../components/category/category-list';
import DeleteCategoryModal from '../../../components/category/delete-category-modal';
import { useLanguage } from '../../../contexts/language-context';
import { useAuth } from '../../../hooks/useAuth';

export default function AdminCategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal and action states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [list, counts] = await Promise.all([
        categoryService.listCategories(true),
        categoryService.listCategoryCounts(),
      ]);

      setCategories(list);
      setCategoryCounts(counts);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to retrieve categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Add category button trigger
  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  // Edit category button trigger
  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  // Delete category button trigger
  const handleDeleteTrigger = (cat: Category) => {
    setDeleteTarget(cat);
  };

  // Confirm deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await categoryService.deleteCategory(deleteTarget.categoryId);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get product count helper
  const getProductCount = (categoryName: string) => {
    const found = categoryCounts.find(
      (c) => c.category.toLowerCase() === categoryName.toLowerCase()
    );
    return found ? found.count : 0;
  };

  const { can } = useAuth();
  const canCreate = can('catalog.categories', 'create');

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">{t('header.categories_title', 'Product Categories')}</h1>
          <p className="text-xs text-foreground/50 mt-1">
            {t('header.categories_subtitle', 'Group, classify, and organize your pharmacy medicine catalog for easier searching and POS checkouts.')}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={handleAddCategory}
            className="w-full sm:w-auto px-5 py-3 bg-primary hover:bg-primary/90 text-white font-extrabold text-sm rounded-xl shadow-sm shadow-primary/20 transition-all duration-150 hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            {t('categories.add_category', 'Add Category')}
          </button>
        )}
      </div>

      {/* Main Categories Panel */}
      <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm">
        <CategoryList
          categories={categories}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onEdit={handleEditCategory}
          onDelete={handleDeleteTrigger}
          getProductCount={getProductCount}
          onRetry={fetchCategories}
        />
      </div>

      {/* CRUD Form Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          setIsModalOpen(false);
          fetchCategories();
        }}
        category={editingCategory}
      />

      {/* Delete Confirmation Modal */}
      <DeleteCategoryModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        categoryName={deleteTarget?.name || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
}
