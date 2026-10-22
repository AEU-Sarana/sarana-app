'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '../../contexts/language-context';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  subtitle?: string;
  allowContinuous?: boolean;
  defaultContinuous?: boolean;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title,
  subtitle,
  allowContinuous = true,
  defaultContinuous = false,
}: BarcodeScannerModalProps) {
  const { t } = useLanguage();
  const [isContinuous, setIsContinuous] = useState(defaultContinuous);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);

  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const lastCodeRef = useRef<string | null>(null);

  // Synthesize a crisp confirmation beep
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz (A5)
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio context restricted until user gesture, ignore safely
    }
  }, []);

  // Trigger haptic vibration on phone
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(120);
      } catch {
        // Ignored
      }
    }
  }, []);

  // Stop scanner safely
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        isScanningRef.current = false;
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
  }, []);

  // Initialize and start camera scanning
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setLastScanned(null);
      setScanCount(0);
      return;
    }

    let isMounted = true;
    setIsInitializing(true);
    setHasError(null);
    setIsTorchOn(false);

    const initScanner = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

        if (!isMounted) return;

        // Clean up any stale scanner instance
        if (scannerRef.current && isScanningRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {
            // Ignored
          }
        }

        const scannerId = 'barcode-scanner-viewport';
        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
          ],
          verbose: false,
        });

        scannerRef.current = scanner;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxWidth = Math.floor(minEdge * 0.85);
            const boxHeight = Math.floor(minEdge * 0.65);
            return { width: boxWidth, height: boxHeight };
          },
          aspectRatio: 1.333333,
        };

        const handleSuccess = (decodedText: string) => {
          const now = Date.now();
          // Debounce: prevent same code within 1.5s, or any code within 600ms
          if (
            decodedText === lastCodeRef.current &&
            now - lastScanTimeRef.current < 1500
          ) {
            return;
          }
          if (now - lastScanTimeRef.current < 600) {
            return;
          }

          lastScanTimeRef.current = now;
          lastCodeRef.current = decodedText;

          playBeep();
          triggerHaptic();
          setLastScanned(decodedText);
          setScanCount((prev) => prev + 1);

          onScan(decodedText);

          if (!isContinuous) {
            setTimeout(() => {
              onClose();
            }, 350);
          }
        };

        await scanner.start(
          { facingMode },
          config,
          handleSuccess,
          () => {
            // Frame scan failure (expected between frames), ignore
          }
        );

        if (isMounted) {
          isScanningRef.current = true;
          setIsInitializing(false);

          // Check if device supports torch
          try {
            const capabilities = scanner.getRunningTrackCapabilities();
            setHasTorch(Boolean(capabilities && (capabilities as any).torch));
          } catch {
            setHasTorch(false);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Camera scanner init failed:', err);
        setIsInitializing(false);
        const msg = String(err?.message || err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setHasError(t('scanner.permission_desc', 'Camera permission was denied. Please allow camera access in your browser.'));
        } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
          setHasError(t('scanner.no_camera_found', 'No camera detected on this device.'));
        } else {
          setHasError(msg);
        }
      }
    };

    // Small delay to ensure modal DOM is mounted
    const timer = setTimeout(() => {
      initScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, facingMode, isContinuous, onScan, onClose, playBeep, triggerHaptic, stopScanner, t]);

  // Toggle Torch / Flashlight
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle not supported on this track:', e);
    }
  };

  // Flip camera between environment (rear) and user (front)
  const handleFlipCamera = () => {
    stopScanner();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-card w-full max-w-lg rounded-3xl border border-border/50 shadow-2xl overflow-hidden flex flex-col relative animate-scale-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between bg-secondary/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h2v6H7zm4 0h2v6h-2zm4 0h2v6h-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                {title || t('scanner.title', 'Barcode Scanner')}
              </h3>
              <p className="text-xs text-foreground/50">
                {subtitle || t('scanner.subtitle', 'Point camera at medicine barcode or QR code')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center text-foreground/60 hover:text-foreground cursor-pointer transition-colors"
            title={t('scanner.close', 'Close Scanner')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-black min-h-[340px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
          {/* HTML5 QR Container */}
          <div id="barcode-scanner-viewport" className="w-full h-full" />

          {/* Laser Guide Overlay (only when scanning) */}
          {!isInitializing && !hasError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Target viewfinder box */}
              <div className="w-[85%] max-w-[320px] h-[65%] max-h-[220px] border-2 border-primary/70 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-primary rounded-br-lg" />

                {/* Animated horizontal laser bar */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.8)] absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {/* Loading / Starting Screen */}
          {isInitializing && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3.5" />
              <p className="text-sm font-bold text-foreground">
                {t('scanner.initializing', 'Starting camera scanner...')}
              </p>
              <p className="text-xs text-foreground/50 mt-1">
                {facingMode === 'environment'
                  ? t('scanner.facing_back', 'Rear Camera')
                  : t('scanner.facing_front', 'Front Camera')}
              </p>
            </div>
          )}

          {/* Error / Permission Blocked Screen */}
          {hasError && (
            <div className="absolute inset-0 bg-background flex flex-col items-center justify-center p-6 text-center z-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-sm font-extrabold text-foreground">
                {t('scanner.permission_title', 'Camera Access Required')}
              </h4>
              <p className="text-xs text-foreground/60 max-w-xs">
                {hasError}
              </p>
              <button
                onClick={() => {
                  setHasError(null);
                  setIsInitializing(true);
                  setFacingMode((prev) => prev);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {t('scanner.permission_btn', 'Grant Permission / Retry')}
              </button>
            </div>
          )}

          {/* Last Scanned Feedback Banner */}
          {lastScanned && (
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-500/90 text-white backdrop-blur-md shadow-lg animate-fade-in">
              <div className="flex items-center gap-2 truncate">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <div className="truncate">
                  <span className="text-[10px] uppercase font-bold opacity-80 block leading-tight">
                    {t('scanner.item_found', 'Scanned Barcode')}
                  </span>
                  <span className="font-mono text-xs font-black truncate block">
                    {lastScanned}
                  </span>
                </div>
              </div>

              {allowContinuous && (
                <span className="px-2 py-0.5 rounded-lg bg-black/20 text-[10px] font-black shrink-0">
                  #{scanCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer & Controls */}
        <div className="px-5 py-3.5 bg-secondary/15 border-t border-border/40 flex items-center justify-between gap-3">
          {/* Continuous Scan Toggle */}
          {allowContinuous ? (
            <button
              onClick={() => setIsContinuous(!isContinuous)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                isContinuous
                  ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                  : 'bg-secondary/40 text-foreground/60 border-border/40 hover:bg-secondary hover:text-foreground'
              }`}
              title={t('scanner.continuous_desc', 'Keep camera open to scan multiple items')}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isContinuous ? 'bg-primary animate-pulse' : 'bg-foreground/30'
                }`}
              />
              <span>
                {isContinuous
                  ? t('scanner.continuous_mode', 'Continuous Mode')
                  : t('scanner.single_mode', 'Single Scan')}
              </span>
            </button>
          ) : (
            <div />
          )}

          {/* Camera Controls (Torch & Flip) */}
          <div className="flex items-center gap-2">
            {/* Flashlight Button */}
            {hasTorch && (
              <button
                onClick={handleToggleTorch}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isTorchOn
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-sm shadow-amber-500/10'
                    : 'bg-secondary/40 text-foreground/70 border-border/40 hover:bg-secondary hover:text-foreground'
                }`}
                title={isTorchOn ? t('scanner.torch_off', 'Flashlight Off') : t('scanner.torch_on', 'Flashlight On')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            )}

            {/* Switch Camera Button */}
            <button
              onClick={handleFlipCamera}
              className="p-2 rounded-xl bg-secondary/40 hover:bg-secondary text-foreground/70 hover:text-foreground border border-border/40 text-xs font-bold transition-all cursor-pointer"
              title={t('scanner.switch_camera', 'Switch Camera')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
