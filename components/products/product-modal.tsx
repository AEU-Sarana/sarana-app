'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, CreateProductRequest } from '../../features/product/types';
import { Category } from '../../features/category/types';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  product: Product | null; // Null means Add mode, object means Edit mode
}

export default function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const isEditMode = !!product;

  // Form Fields State
  const [productName, setProductName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [stockQty, setStockQty] = useState<number | ''>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | ''>(5);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiredAt, setExpiredAt] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Categories list
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

  // File/Image upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch categories on mount when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchCats = async () => {
        try {
          setIsCategoriesLoading(true);
          const list = await categoryService.listCategories();
          setCategories(list);
        } catch (err: any) {
          console.error('Failed to load categories', err);
        } finally {
          setIsCategoriesLoading(false);
        }
      };
      fetchCats();
    }
  }, [isOpen]);

  // Load values if edit mode
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setProductName(product.product_name);
        setBarcode(product.barcode);
        setPrice(product.price);
        setCategoryId(product.category_id || '');
        setDescription(product.description || '');
        setStockQty(product.stock_quantity || 0);
        setLowStockThreshold(product.low_stock_threshold !== null ? product.low_stock_threshold : 5);
        setHasExpiry(!!product.has_expiry);
        setExpiredAt(product.expired_at ? product.expired_at.substring(0, 10) : '');
        setStatus(product.status);
        setImagePreview(product.image_path);
        setImageFile(null);
      } else {
        // Reset form for Add Mode
        setProductName('');
        setBarcode('');
        setPrice('');
        setCategoryId('');
        setDescription('');
        setStockQty(0);
        setLowStockThreshold(5);
        setHasExpiry(false);
        setExpiredAt('');
        setStatus('active');
        setImagePreview(null);
        setImageFile(null);
      }
      setErrorMessage(null);
    }
  }, [isOpen, product]);

  // Handle Image Drag-and-Drop / Select
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate Barcode Helper
  const generateBarcode = () => {
    let code = '885'; // Southeast Asia standard regional starting prefix
    for (let i = 0; i < 9; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    setBarcode(code);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate inputs
    if (!productName.trim()) {
      setErrorMessage('Product name is required');
      return;
    }
    if (!barcode.trim()) {
      setErrorMessage('Barcode / SKU is required');
      return;
    }
    if (price === '' || Number(price) < 0) {
      setErrorMessage('Price must be a valid number >= 0');
      return;
    }
    if (lowStockThreshold !== '' && Number(lowStockThreshold) < 0) {
      setErrorMessage('Low stock threshold must be >= 0');
      return;
    }
    if (hasExpiry && !expiredAt) {
      setErrorMessage('Please select an expiry date or disable expiry tracking');
      return;
    }

    try {
      setIsSaving(true);

      // We use FormData for multipart/form-data support
      const formData = new FormData();
      formData.append('product_name', productName.trim());
      formData.append('barcode', barcode.trim());
      formData.append('price', Number(price).toString());
      formData.append('status', status);

      if (categoryId) {
        formData.append('category_id', categoryId.toString());
      }
      if (description) {
        formData.append('description', description.trim());
      }
      if (lowStockThreshold !== '') {
        formData.append('low_stock_threshold', Number(lowStockThreshold).toString());
      }
      
      formData.append('has_expiry', String(hasExpiry));
      if (hasExpiry && expiredAt) {
        formData.append('expired_at', new Date(expiredAt).toISOString());
      }

      // Initial Stock Qty is only sent for new products
      if (!isEditMode && stockQty !== '') {
        formData.append('stock_qty', Number(stockQty).toString());
      }

      if (imageFile) {
        formData.append('image', imageFile); // 'image' field matches backend upload middleware
      }

      if (isEditMode && product) {
        await productService.updateProduct(product.product_id, formData);
      } else {
        await productService.createProduct(formData);
      }

      onSave();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to save product details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-3xl rounded-3xl border border-border/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/40 flex justify-between items-center bg-secondary/10">
          <div>
            <h2 className="text-xl font-extrabold text-foreground leading-tight">
              {isEditMode ? 'Edit Product Details' : 'Add New Product'}
            </h2>
            <p className="text-xs text-foreground/50 mt-1">
              {isEditMode ? 'Modify specific details and updates for this product catalog entry.' : 'Provide details below to catalog a new pharmacy product.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-secondary/40 hover:bg-secondary flex items-center justify-center text-foreground/60 hover:text-foreground cursor-pointer transition-colors duration-150"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm font-semibold rounded-2xl border border-destructive/20 flex gap-3 items-center">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Core Fields */}
            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
                  Product Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border/80 bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150"
                  required
                />
              </div>

              {/* Barcode / SKU */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
                  Barcode / SKU <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Scan or enter barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-border/80 bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="px-3 rounded-xl bg-secondary/80 hover:bg-secondary text-xs font-bold text-foreground transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Gen Barcode
                  </button>
                </div>
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
                    Unit Price ($) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-border/80 bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-border/80 bg-background text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150 cursor-pointer"
                    disabled={isCategoriesLoading}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe indications, dosage, ingredients, usage..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border/80 bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150 resize-none"
                />
              </div>
            </div>

            {/* Right Column: Stock/Expiry, Images, and Status */}
            <div className="space-y-4">
              {/* Stock Quantity (Only visible/editable when creating a new product) */}
              {!isEditMode && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-border/80 bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150"
                  />
                </div>
              )}

              {/* Low Stock Alert Threshold */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="5"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-border/80 bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150"
                />
              </div>

              {/* Expiry Tracking */}
              <div className="p-4 bg-secondary/15 rounded-2xl border border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-foreground tracking-tight">Expiry Tracking</span>
                    <span className="text-[10px] text-foreground/50">Does this product carry an expiration date?</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasExpiry}
                      onChange={(e) => setHasExpiry(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-secondary/80 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>

                {hasExpiry && (
                  <div className="mt-4 animate-fade-in">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground/60 mb-1.5">
                      Expiration Date <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      value={expiredAt}
                      onChange={(e) => setExpiredAt(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border/80 bg-background text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150 cursor-pointer"
                      required={hasExpiry}
                    />
                  </div>
                )}
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-4 bg-secondary/15 rounded-2xl border border-border/40">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-foreground tracking-tight">Product Status</span>
                  <span className="text-[10px] text-foreground/50">Make this product searchable and buyable at POS.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={status === 'active'}
                    onChange={(e) => setStatus(e.target.checked ? 'active' : 'inactive')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-secondary/80 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success" />
                </label>
              </div>
            </div>
          </div>

          {/* Product Image section */}
          <div className="border-t border-border/40 pt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-3">
              Product Image
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              
              {/* Image Preview Area */}
              <div className="w-full h-36 bg-secondary/20 rounded-2xl border border-border/40 overflow-hidden flex items-center justify-center relative shrink-0">
                {imagePreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full text-white flex items-center justify-center hover:bg-black transition-colors"
                      title="Remove Image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-10 h-10 text-foreground/20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] text-foreground/40 font-semibold mt-1.5 block">No Product Image</span>
                  </div>
                )}
              </div>

              {/* Upload Input Area */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-border border-dashed rounded-2xl cursor-pointer bg-card hover:bg-secondary/15 transition-all duration-150">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                      <svg className="w-8 h-8 text-foreground/45 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs text-foreground font-bold leading-normal">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-[10px] text-foreground/40 mt-1">
                        PNG, JPG, JPEG or WEBP (Max 5MB)
                      </p>
                    </div>
                    <input
                      id="product-image-upload"
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border/40 bg-secondary/10 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground/75 hover:text-foreground hover:bg-secondary/40 transition-all duration-150 cursor-pointer"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-extrabold shadow-sm shadow-primary/20 transition-all duration-150 cursor-pointer flex items-center gap-2"
            disabled={isSaving}
          >
            {isSaving && (
              <svg className="animate-spin h-4 w-4 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isSaving ? 'Saving...' : isEditMode ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
