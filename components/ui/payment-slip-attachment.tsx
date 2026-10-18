'use client';

import React, { useState, useRef, useEffect } from 'react';

interface PaymentSlipAttachmentProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  recommended?: boolean;
  className?: string;
}

export function PaymentSlipAttachment({
  value = '',
  onChange,
  label = 'Payment Slip / Bank Slip Attachment',
  recommended = false,
  className = '',
}: PaymentSlipAttachmentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compress & optimize image on canvas
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
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
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          onChange(compressed);
        } else {
          onChange(dataUrl);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        setIsProcessing(false);
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

  // Drag and drop handlers
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

  // Listen for Ctrl+V / Cmd+V paste on the page when modal is active
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (value) return; // Already has an image
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [value]);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-foreground/70 flex items-center gap-1.5">
          <span>{label}</span>
          {recommended && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Recommended for ABA / Wing
            </span>
          )}
        </label>
        {value && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Slip Attached
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        /* Image Preview Box */
        <div className="relative group rounded-2xl border border-border/60 bg-secondary/20 p-2.5 flex items-center gap-3">
          <div
            onClick={() => setPreviewModalOpen(true)}
            className="w-16 h-16 rounded-xl overflow-hidden border border-border/50 shrink-0 bg-background cursor-pointer hover:opacity-90 transition-opacity relative group/thumb"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Payment Slip Proof"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Transfer / Receipt Slip Attached</p>
            <p className="text-[11px] text-foreground/50 mt-0.5">Click thumbnail to inspect full slip image.</p>
            <button
              type="button"
              onClick={() => setPreviewModalOpen(true)}
              className="text-[11px] font-bold text-primary hover:underline mt-1 cursor-pointer"
            >
              View Full Image
            </button>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            title="Remove attachment"
            className="w-8 h-8 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        /* Empty Upload / Paste Dropzone */
        <div
          ref={containerRef}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-border/60 hover:border-primary/50 bg-secondary/10 hover:bg-secondary/20'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-primary">
              <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span>Optimizing slip image...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 py-1">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  <span className="text-primary hover:underline">Click to upload</span> or drag and drop slip
                </p>
                <p className="text-[10px] text-foreground/45 mt-0.5">
                  Tip: You can also press <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono border border-border/50 text-foreground font-semibold">Ctrl+V</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono border border-border/50 text-foreground font-semibold">⌘+V</kbd> to paste screenshot
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slip Fullscreen Preview Lightbox */}
      {previewModalOpen && value && (
        <SlipPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          imageUrl={value}
          title="Payment Slip / Transaction Proof"
        />
      )}
    </div>
  );
}

interface SlipPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  referenceNumber?: string;
  paymentMethod?: string;
  amount?: number | string;
}

export function SlipPreviewModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'Payment Slip Proof',
  referenceNumber,
  paymentMethod,
  amount,
}: SlipPreviewModalProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border/60 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/30 bg-secondary/20 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-foreground">{title}</h3>
            {(referenceNumber || paymentMethod || amount) && (
              <p className="text-[11px] text-foreground/50 mt-0.5 font-mono">
                {paymentMethod && <strong className="text-foreground">{paymentMethod} </strong>}
                {referenceNumber && `· Ref: ${referenceNumber} `}
                {amount && `· $${Number(amount).toFixed(2)}`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary/80 hover:bg-secondary text-foreground/60 hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image Content Container */}
        <div className="p-4 overflow-y-auto flex items-center justify-center bg-black/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Payment Slip Full View"
            className="max-h-[65vh] w-auto rounded-xl object-contain shadow-md border border-border/30"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 bg-secondary/15 flex items-center justify-between gap-3">
          <a
            href={imageUrl}
            download={`payment-slip-${Date.now()}.jpg`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/50 text-xs font-bold text-foreground/80 hover:bg-secondary transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Slip
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
