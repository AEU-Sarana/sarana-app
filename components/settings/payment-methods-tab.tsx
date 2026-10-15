'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/language-context';
import {
  paymentMethodService,
  PaymentMethod,
  CreatePaymentMethodPayload,
  UpdatePaymentMethodPayload,
} from '../../services/paymentMethodService';

export default function PaymentMethodsTab() {
  const { t } = useLanguage();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [deleteConfirmMethod, setDeleteConfirmMethod] = useState<PaymentMethod | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    type: string;
    accountName: string;
    accountNumber: string;
    qrCodeUrl: string;
    note: string;
    displayOrder: number;
    isActive: boolean;
  }>({
    name: '',
    code: '',
    type: 'BANK_TRANSFER',
    accountName: '',
    accountNumber: '',
    qrCodeUrl: '',
    note: '',
    displayOrder: 1,
    isActive: true,
  });

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await paymentMethodService.getPaymentMethods(true);
      setMethods(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const handleOpenAdd = () => {
    setEditingMethod(null);
    setShowUrlInput(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormData({
      name: '',
      code: '',
      type: 'BANK_TRANSFER',
      accountName: '',
      accountNumber: '',
      qrCodeUrl: '',
      note: '',
      displayOrder: (methods.length || 0) + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setShowUrlInput(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormData({
      name: method.name || '',
      code: method.code || '',
      type: method.type || 'BANK_TRANSFER',
      accountName: method.accountName || '',
      accountNumber: method.accountNumber || '',
      qrCodeUrl: method.qrCodeUrl || '',
      note: method.note || '',
      displayOrder: method.displayOrder || 1,
      isActive: method.isActive,
    });
    setIsModalOpen(true);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (file.type === 'image/svg+xml') {
        setFormData((prev) => ({ ...prev, qrCodeUrl: dataUrl }));
        return;
      }
      // Compress/resize for crisp, lightweight storage
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimized = canvas.toDataURL('image/png', 0.9);
          setFormData((prev) => ({ ...prev, qrCodeUrl: optimized }));
        } else {
          setFormData((prev) => ({ ...prev, qrCodeUrl: dataUrl }));
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, qrCodeUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleStatus = async (method: PaymentMethod) => {
    try {
      setErrorMessage(null);
      await paymentMethodService.togglePaymentMethod(method.paymentMethodId);
      setSuccessMessage(
        `${method.name} ${method.isActive ? 'deactivated' : 'activated'} successfully!`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadPaymentMethods();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update payment method status');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Payment method name is required');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (editingMethod) {
        const payload: UpdatePaymentMethodPayload = {
          name: formData.name.trim(),
          type: formData.type,
          accountName: formData.accountName.trim(),
          accountNumber: formData.accountNumber.trim(),
          qrCodeUrl: formData.qrCodeUrl.trim(),
          note: formData.note.trim(),
          displayOrder: Number(formData.displayOrder) || 1,
          isActive: formData.isActive,
        };
        if (!editingMethod.isSystem && formData.code.trim()) {
          payload.code = formData.code.trim().toUpperCase();
        }

        await paymentMethodService.updatePaymentMethod(editingMethod.paymentMethodId, payload);
        setSuccessMessage(`Payment method "${formData.name}" updated successfully!`);
      } else {
        const payload: CreatePaymentMethodPayload = {
          name: formData.name.trim(),
          code: formData.code.trim() ? formData.code.trim().toUpperCase() : undefined,
          type: formData.type,
          accountName: formData.accountName.trim(),
          accountNumber: formData.accountNumber.trim(),
          qrCodeUrl: formData.qrCodeUrl.trim(),
          note: formData.note.trim(),
          displayOrder: Number(formData.displayOrder) || 1,
          isActive: formData.isActive,
        };

        await paymentMethodService.createPaymentMethod(payload);
        setSuccessMessage(`Payment method "${formData.name}" created successfully!`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadPaymentMethods();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save payment method');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmMethod) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await paymentMethodService.deletePaymentMethod(deleteConfirmMethod.paymentMethodId);
      setSuccessMessage(`Payment method "${deleteConfirmMethod.name}" deleted successfully!`);
      setDeleteConfirmMethod(null);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadPaymentMethods();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete payment method');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'CASH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            CASH
          </span>
        );
      case 'BANK_TRANSFER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/10 text-sky-600 border border-sky-500/20">
            BANK / KHQR
          </span>
        );
      case 'CARD':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
            CARD
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-secondary text-foreground/70 border border-border/40">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-destructive/60 hover:text-destructive">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600/60 hover:text-emerald-600">
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-7 py-6 border-b border-border/20 bg-secondary/10">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground tracking-tight">
                {t('settings.payment_methods_title', 'Payment Methods Management')}
              </h2>
              <p className="text-[11px] text-foreground/50 mt-0.5">
                {t('settings.payment_methods_desc', 'Configure payment channels (Cash, ABA, Wing, Cards) for cashier checkout and QR scanning.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-extrabold text-xs shadow-md shadow-primary/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            {t('settings.add_payment_method', 'Add Payment Method')}
          </button>
        </div>

        {/* Content */}
        <div className="p-7">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-xs font-bold text-foreground/50">Loading payment methods...</span>
            </div>
          ) : methods.length === 0 ? (
            <div className="py-16 text-center text-foreground/40 text-xs">
              No payment methods found. Click &quot;Add Payment Method&quot; to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {methods.map((method) => (
                <div
                  key={method.paymentMethodId}
                  className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 ${
                    method.isActive
                      ? 'bg-card border-border/60 hover:border-primary/40 shadow-sm'
                      : 'bg-secondary/20 border-border/30 opacity-75'
                  }`}
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                          method.type === 'CASH'
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : method.code === 'ABA'
                            ? 'bg-sky-600 text-white'
                            : method.code === 'WING'
                            ? 'bg-lime-500 text-slate-900'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {method.code.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black text-foreground">{method.name}</h3>
                            {method.isSystem && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-secondary text-foreground/60 border border-border/40">
                                System
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-foreground/40">{method.code}</span>
                        </div>
                      </div>

                      {getTypeBadge(method.type)}
                    </div>

                    {/* Account Details & QR */}
                    <div className="p-3 bg-secondary/30 rounded-xl space-y-1.5 text-[11px] mb-4">
                      {method.accountName && (
                        <div className="flex justify-between">
                          <span className="text-foreground/45 font-semibold">Account Name:</span>
                          <span className="font-extrabold text-foreground">{method.accountName}</span>
                        </div>
                      )}
                      {method.accountNumber && (
                        <div className="flex justify-between">
                          <span className="text-foreground/45 font-semibold">Account No:</span>
                          <span className="font-mono font-bold text-foreground">{method.accountNumber}</span>
                        </div>
                      )}
                      {method.note && (
                        <div className="text-[10px] text-foreground/50 italic pt-1 border-t border-border/20">
                          {method.note}
                        </div>
                      )}
                      {method.qrCodeUrl && (
                        <div className="pt-2 flex items-center justify-between border-t border-border/20">
                          <span className="text-[10px] font-bold text-foreground/50">Store KHQR:</span>
                          <button
                            type="button"
                            onClick={() => setQrPreviewUrl(method.qrCodeUrl || null)}
                            className="text-[10px] font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View QR Code
                          </button>
                        </div>
                      )}
                      {!method.accountName && !method.accountNumber && !method.qrCodeUrl && (
                        <div className="text-[10px] text-foreground/40 italic">
                          Standard direct payment channel
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status Toggle */}
                  <div className="pt-3 border-t border-border/20 flex items-center justify-between">
                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(method)}
                        disabled={method.isSystem && method.code === 'CASH'}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          method.isActive ? 'bg-primary' : 'bg-secondary'
                        } ${method.isSystem && method.code === 'CASH' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            method.isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-[10px] font-bold text-foreground/60">
                        {method.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(method)}
                        className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground/70 hover:text-foreground transition-all cursor-pointer"
                        title="Edit method"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {!method.isSystem && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmMethod(method)}
                          className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all cursor-pointer"
                          title="Delete method"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border/60 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-border/40 bg-secondary/30 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-foreground tracking-tight">
                  {editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
                </h2>
                <p className="text-[11px] text-foreground/50 mt-0.5">
                  Configure payment channel details for the POS checkout
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center text-foreground/60 text-xs font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {/* Method Name */}
              <div>
                <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
                  Method Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABA Bank (KHQR)"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoCode = !editingMethod && !formData.code
                      ? name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().slice(0, 15)
                      : formData.code;
                    setFormData({ ...formData, name, code: autoCode });
                  }}
                  className="w-full px-3.5 py-2.5 bg-secondary/30 border border-border/60 rounded-xl text-xs font-extrabold focus:outline-none focus:border-primary"
                />
              </div>

              {/* Code & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
                    Code / Key <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingMethod?.isSystem}
                    placeholder="e.g. ABA"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-secondary/30 border border-border/60 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2.5 bg-secondary/30 border border-border/60 rounded-xl text-xs font-bold focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer / KHQR</option>
                    <option value="CASH">Cash (សាច់ប្រាក់)</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="OTHER">Other Channel</option>
                  </select>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="p-4 bg-secondary/20 rounded-2xl border border-border/30 space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-foreground/50 tracking-wider block">
                  Bank / Account Details (Optional)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-foreground/60 mb-1 block">
                      Account Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PICH CHAMROEUN"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      className="w-full px-3 py-2 bg-card border border-border/50 rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-foreground/60 mb-1 block">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 001 234 567"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-card border border-border/50 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Store QR Code Image (Choose File Upload) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-foreground/70">
                      Store QR Code Image (KHQR)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      {showUrlInput ? 'Upload file instead' : 'Or paste URL'}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {showUrlInput ? (
                    <div>
                      <input
                        type="url"
                        placeholder="https://.../my-aba-khqr.png"
                        value={formData.qrCodeUrl}
                        onChange={(e) => setFormData({ ...formData, qrCodeUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-card border border-border/50 rounded-xl text-xs font-mono focus:outline-none focus:border-primary"
                      />
                      <span className="text-[9px] text-foreground/40 mt-1 block">
                        Paste the direct image link for your store KHQR to display on checkout.
                      </span>
                    </div>
                  ) : formData.qrCodeUrl ? (
                    /* Preview card when image is chosen */
                    <div className="p-3 bg-card border border-border/60 rounded-2xl flex items-center gap-3.5">
                      <div className="w-18 h-18 bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={formData.qrCodeUrl}
                          alt="QR Preview"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-emerald-600 mb-0.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[11px] font-extrabold">QR Code Image Selected</span>
                        </div>
                        <p className="text-[10px] text-foreground/50 mb-2 truncate">
                          Ready to display on cashier POS checkout screen
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Choose Another File
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Choose File Dropzone */
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`group border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center ${
                        isDragging
                          ? 'border-primary bg-primary/10'
                          : 'border-border/60 hover:border-primary/50 bg-card hover:bg-secondary/20'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-3 py-1 rounded-lg bg-primary text-white text-[11px] font-extrabold shadow-sm group-hover:bg-primary/90 transition-colors">
                          Choose File
                        </span>
                        <span className="text-[11px] font-bold text-foreground">or drag & drop</span>
                      </div>
                      <p className="text-[9px] text-foreground/45 mt-0.5">
                        Upload store KHQR image (PNG, JPG, SVG, WebP up to 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Display Order & Note */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-secondary/30 border border-border/60 rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-foreground/70 mb-1 block">
                    Cashier Note / Instruction
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Scan with any Bakong app"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary/30 border border-border/60 rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3.5 bg-secondary/20 rounded-2xl">
                <div>
                  <span className="text-xs font-extrabold text-foreground block">Active Status</span>
                  <span className="text-[10px] text-foreground/50">Allow cashiers to select this method during checkout</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    formData.isActive ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formData.isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-border/20 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-extrabold text-xs shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingMethod ? 'Update Method' : 'Create Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteConfirmMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border/60 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <h3 className="text-sm font-black text-foreground">Delete Payment Method?</h3>
              <p className="text-xs text-foreground/50 mt-1">
                Are you sure you want to delete <span className="font-extrabold text-foreground">{deleteConfirmMethod.name}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMethod(null)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-extrabold text-xs shadow-md shadow-destructive/20 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR CODE PREVIEW MODAL ── */}
      {qrPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border/60 rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center space-y-4">
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Store KHQR Code</h3>
            <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-200">
              <img src={qrPreviewUrl} alt="KHQR" className="w-full aspect-square object-contain rounded-xl" />
            </div>
            <button
              type="button"
              onClick={() => setQrPreviewUrl(null)}
              className="w-full py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
