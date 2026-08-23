'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { settingService } from '../../../services/settingService';
import { backupService, BackupListItem } from '../../../services/backupService';
import { AppSetting, BackupFrequency, UpdateSettingsRequest } from '../../../features/setting/types';
import { useLanguage } from '../../../contexts/language-context';

const TIMEZONES = [
  'Asia/Phnom_Penh',
  'Asia/Bangkok',
  'Asia/Ho_Chi_Minh',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Jakarta',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'UTC',
];

const BACKUP_FREQUENCIES: { value: BackupFrequency; label: string; desc: string }[] = [
  { value: 'daily',   label: 'Daily',   desc: 'Back up data every day at scheduled time' },
  { value: 'weekly',  label: 'Weekly',  desc: 'Back up data once per week' },
  { value: 'monthly', label: 'Monthly', desc: 'Back up data once per month' },
];

// ─── Reusable UI components ───────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  description,
  accentClass,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 px-7 py-6 border-b border-border/20 bg-secondary/10">
        <div className={`w-11 h-11 rounded-2xl ${accentClass} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-foreground tracking-tight">{title}</h2>
          <p className="text-[11px] text-foreground/50 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-7 space-y-5">{children}</div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start justify-between gap-6 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <div className="flex-1">
        {label && <span className="text-sm font-bold text-foreground block">{label}</span>}
        {description && <span className="text-xs text-foreground/50 mt-0.5 block leading-relaxed">{description}</span>}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 mt-0.5 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          checked ? 'bg-primary' : 'bg-secondary'
        }`}
        aria-checked={checked}
        role="switch"
        disabled={disabled}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-foreground/55 mb-2">
      {children}
      {optional && (
        <span className="text-[9px] font-semibold text-foreground/35 normal-case tracking-normal">(optional)</span>
      )}
    </label>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'backup' | 'invoice'>('backup');
  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [form, setForm] = useState<UpdateSettingsRequest>({
    auto_backup: true,
    backup_frequency: 'daily',
    stock_sync_policy: 'allow_with_cached',
    store_name: '',
    store_phone: '',
    store_address: '',
    store_tax_id: '',
    store_footer_note: '',
    is_logo_enabled: true,
    is_footer_enabled: true,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Backup states
  const [backups, setBackups] = useState<BackupListItem[]>([]);
  const [backupsPagination, setBackupsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isBackupsLoading, setIsBackupsLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState<number | null>(null);
  const [confirmRestoreBackup, setConfirmRestoreBackup] = useState<BackupListItem | null>(null);

  // Manual operations states
  const [manualBackupName, setManualBackupName] = useState('');
  const [includeData, setIncludeData] = useState(true);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'PDF'>('CSV');
  const [exportTable, setExportTable] = useState<'orders' | 'products'>('orders');
  const [isExporting, setIsExporting] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await settingService.getSettings();
      setSettings(data);
      setForm({
        auto_backup: data.auto_backup,
        backup_frequency: data.backup_frequency as BackupFrequency,
        stock_sync_policy: data.stock_sync_policy,
        store_name: data.store_name ?? '',
        store_phone: data.store_phone ?? '',
        store_address: data.store_address ?? '',
        store_tax_id: data.store_tax_id ?? '',
        store_footer_note: data.store_footer_note ?? '',
        is_logo_enabled: data.is_logo_enabled ?? true,
        is_footer_enabled: data.is_footer_enabled ?? true,
      });
      if (data.store_logo_path) setLogoPreview(data.store_logo_path);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBackups = useCallback(async (page = 1) => {
    try {
      setIsBackupsLoading(true);
      const data = await backupService.listBackups(page, 5);
      setBackups(data.backups);
      setBackupsPagination({
        page: data.pagination.page,
        totalPages: data.pagination.totalPages,
        total: data.pagination.total,
      });
    } catch (err) {
      console.error('Failed to load backup list', err);
    } finally {
      setIsBackupsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchBackups();
  }, [fetchSettings, fetchBackups]);

  // Single unified save — sends settings through PUT /settings
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Save app settings
      const updated = await settingService.updateSettings(form);
      setSettings(updated);

      setSuccessMessage('All settings saved successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateForm = <K extends keyof UpdateSettingsRequest>(key: K, value: UpdateSettingsRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccessMessage(null);
  };

  // Logo file picker
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Upload logo to dedicated receipt-settings/logo endpoint
  const handleLogoUpload = async () => {
    if (!logoFile) return;
    try {
      setIsUploadingLogo(true);
      setErrorMessage(null);
      const result = await settingService.uploadLogo(logoFile);
      setLogoPreview(result.logo_path);
      setLogoFile(null);
      setSuccessMessage('Logo uploaded successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Manual Backup & Restore
  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = manualBackupName.trim() || `backup_${Date.now()}`;
    try {
      setIsCreatingBackup(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      await backupService.createBackup({ backup_name: name, include_data: includeData });
      setSuccessMessage(`Backup "${name}" created successfully.`);
      setManualBackupName('');
      fetchBackups(1);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create backup.');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId: number, name: string) => {
    try {
      setIsRestoring(backupId);
      setConfirmRestoreBackup(null);
      setErrorMessage(null);
      setSuccessMessage(null);
      await backupService.restoreBackup(backupId);
      setSuccessMessage(`Database restored successfully from "${name}".`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to restore backup.');
    } finally {
      setIsRestoring(null);
    }
  };

  const handleExportData = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsExporting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await backupService.exportData(exportFormat, exportTable);
      if (res.file_url) {
        window.open(res.file_url, '_blank');
        setSuccessMessage(`Data exported successfully. Downloading...`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        throw new Error('Export URL not returned');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export table.');
    } finally {
      setIsExporting(false);
    }
  };



  const lastUpdated = settings?.updated_at
    ? new Date(settings.updated_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="space-y-6">
      {/* ── Top Action Bar ── */}
      <div className="flex justify-end items-center gap-2.5 select-none">
        {lastUpdated && (
          <span className="text-[10px] text-foreground/35 font-semibold hidden sm:block">
            Last saved: {lastUpdated}
          </span>
        )}
        <button
          id="save-settings-btn"
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="px-5 py-3 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-primary/20 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('user_modal.saving', 'Saving...')}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              {t('settings.save_all', 'Save All Settings')}
            </>
          )}
        </button>
      </div>

      {/* ── Feedback banners ── */}
      {errorMessage && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-2xl">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-success/10 border border-success/20 text-success text-xs font-semibold rounded-2xl">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 p-1.5 bg-card border border-border/40 rounded-2xl shadow-sm select-none overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-extrabold text-xs transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-foreground/70 hover:bg-secondary/40 hover:text-foreground'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          {t('settings.tab_backup', 'Backup & Maintenance')}
        </button>



        <button
          type="button"
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-extrabold text-xs transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === 'invoice'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-foreground/70 hover:bg-secondary/40 hover:text-foreground'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t('settings.tab_invoice', 'Invoice & Store Info')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="w-6 h-6 rounded-full bg-primary/10 absolute animate-ping" />
          </div>
          <span className="text-sm font-bold text-foreground/50 tracking-wide mt-2">{t('settings.loading', 'Loading settings...')}</span>
        </div>
      ) : (
        <div className="space-y-5">
          {/* ── TAB 1: Backup & Maintenance ── */}
          {activeTab === 'backup' && (
            <SectionCard
              accentClass="bg-primary/10 text-primary"
              title={t('settings.backup_title', 'Backup & Maintenance')}
              description={t('settings.backup_desc', 'Control automatic database backup scheduling and manage manual restore points.')}
              icon={
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              }
            >
              {/* Part 1: Automated Backups */}
              <ToggleSwitch
                checked={form.auto_backup}
                onChange={(v) => updateForm('auto_backup', v)}
                label={t('settings.auto_backup_label', 'Enable Automatic Backups')}
                description={t('settings.auto_backup_desc', 'Automatically back up the database on a scheduled basis to prevent data loss.')}
              />
              <div className="h-px bg-border/20" />
              <div className={form.auto_backup ? '' : 'opacity-40 pointer-events-none'}>
                <FieldLabel>{t('settings.frequency_label', 'Backup Frequency')}</FieldLabel>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { value: 'daily', label: t('settings.freq_daily', 'Daily'), desc: t('settings.freq_daily_desc', 'Back up data every day at scheduled time') },
                    { value: 'weekly', label: t('settings.freq_weekly', 'Weekly'), desc: t('settings.freq_weekly_desc', 'Back up data once per week') },
                    { value: 'monthly', label: t('settings.freq_monthly', 'Monthly'), desc: t('settings.freq_monthly_desc', 'Back up data once per month') },
                  ].map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateForm('backup_frequency', value as BackupFrequency)}
                      className={`flex flex-col gap-1 px-3.5 py-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                        form.backup_frequency === value
                          ? 'border-primary/60 bg-primary/8 shadow-sm shadow-primary/10'
                          : 'border-border/50 bg-secondary/10 hover:border-border hover:bg-secondary/25'
                      }`}
                    >
                      <span className={`text-xs font-extrabold ${form.backup_frequency === value ? 'text-primary' : 'text-foreground/75'}`}>
                        {label}
                      </span>
                      <span className="text-[9px] font-semibold text-foreground/40 leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border/20" />

              {/* Part 2: Manual Operations */}
              <div>
                <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider mb-3">{t('settings.manual_operations', 'Manual Operations')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Create Manual Backup Form */}
                  <form onSubmit={handleCreateBackup} className="space-y-3 p-4 rounded-2xl bg-secondary/10 border border-border/20">
                    <span className="text-[10px] font-extrabold uppercase text-foreground/60 block">{t('settings.create_backup_point', 'Create Backup Point')}</span>
                    <div>
                      <input
                        type="text"
                        placeholder={t('settings.backup_name_placeholder', 'Backup Name (e.g. manual_save)')}
                        value={manualBackupName}
                        onChange={(e) => setManualBackupName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-xs font-semibold focus:border-primary outline-none transition-all placeholder:text-foreground/30"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-foreground/60">{t('settings.include_data_tables', 'Include data tables')}</span>
                      <ToggleSwitch
                        checked={includeData}
                        onChange={setIncludeData}
                        label=""
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isCreatingBackup}
                      className="w-full py-2 bg-primary hover:bg-primary/90 text-white text-[10px] font-extrabold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {isCreatingBackup ? (
                        <>
                          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {t('settings.creating', 'Creating...')}
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                          </svg>
                          {t('settings.backup_now', 'Backup Now')}
                        </>
                      )}
                    </button>
                  </form>

                  {/* Export Table Data Form */}
                  <form onSubmit={handleExportData} className="space-y-3 p-4 rounded-2xl bg-secondary/10 border border-border/20">
                    <span className="text-[10px] font-extrabold uppercase text-foreground/60 block">{t('settings.export_raw_table', 'Export Raw Table Data')}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-foreground/45 block mb-1">{t('settings.target_table', 'Target Table')}</span>
                        <select
                          value={exportTable}
                          onChange={(e) => setExportTable(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-xs font-semibold outline-none cursor-pointer"
                        >
                          <option value="orders">{t('settings.orders', 'Orders')}</option>
                          <option value="products">{t('settings.products', 'Products')}</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[9px] text-foreground/45 block mb-1">{t('settings.format', 'Format')}</span>
                        <select
                          value={exportFormat}
                          onChange={(e) => setExportFormat(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-xs font-semibold outline-none cursor-pointer"
                        >
                          <option value="CSV">{t('settings.csv_file', 'CSV File')}</option>
                          <option value="PDF">{t('settings.pdf_report', 'PDF Report')}</option>
                        </select>
                      </div>
                    </div>
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isExporting}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-600/90 text-white text-[10px] font-extrabold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {isExporting ? (
                          <>
                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {t('settings.exporting', 'Exporting...')}
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {t('settings.export_download', 'Export & Download')}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="h-px bg-border/20" />

              {/* Part 3: Backup History Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">{t('settings.backup_history_title', 'Backup History & Recovery')}</h3>
                  <button
                    type="button"
                    onClick={() => fetchBackups(backupsPagination.page)}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                    </svg>
                    {t('settings.refresh_list', 'Refresh List')}
                  </button>
                </div>

                {isBackupsLoading ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : backups.length === 0 ? (
                  <p className="text-xs text-foreground/45 italic text-center py-4">{t('settings.no_backups', 'No successful backups recorded.')}</p>
                ) : (
                  <div className="space-y-2.5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-border/20 text-foreground/45 font-bold uppercase tracking-wider">
                            <th className="pb-1.5">{t('settings.col_name', 'Name')}</th>
                            <th className="pb-1.5 text-right">{t('settings.col_size', 'Size')}</th>
                            <th className="pb-1.5 text-center">{t('settings.col_date', 'Date')}</th>
                            <th className="pb-1.5 text-right">{t('settings.col_action', 'Action')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {backups.map((item) => {
                            const formattedSize =
                              item.file_size > 1024 * 1024
                                ? `${(item.file_size / (1024 * 1024)).toFixed(2)} MB`
                                : `${(item.file_size / 1024).toFixed(1)} KB`;
                            const date = new Date(item.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            });

                            return (
                              <tr key={item.backup_id} className="group hover:bg-secondary/5">
                                <td className="py-2 font-bold text-foreground max-w-[150px] truncate" title={item.backup_name}>
                                  {item.backup_name}
                                </td>
                                <td className="py-2 text-right font-medium text-foreground/60">{formattedSize}</td>
                                <td className="py-2 text-center text-foreground/50">{date}</td>
                                <td className="py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setConfirmRestoreBackup(item)}
                                    disabled={isRestoring !== null}
                                    className="px-2.5 py-1 text-[9px] font-extrabold bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded transition-colors disabled:opacity-50 cursor-pointer"
                                  >
                                    {isRestoring === item.backup_id ? t('settings.restoring', 'Restoring...') : t('settings.restore', 'Restore')}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {backupsPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t border-border/10">
                        <span className="text-[10px] text-foreground/45 font-medium">
                          {t('settings.showing_page', 'Page {{page}} of {{total}}').replace('{{page}}', String(backupsPagination.page)).replace('{{total}}', String(backupsPagination.totalPages))}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={backupsPagination.page <= 1}
                            onClick={() => fetchBackups(backupsPagination.page - 1)}
                            className="p-1 rounded bg-secondary/15 hover:bg-secondary/25 disabled:opacity-45 text-foreground cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            disabled={backupsPagination.page >= backupsPagination.totalPages}
                            onClick={() => fetchBackups(backupsPagination.page + 1)}
                            className="p-1 rounded bg-secondary/15 hover:bg-secondary/25 disabled:opacity-45 text-foreground cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>
          )}



          {/* ── TAB 3: Invoice & Receipt Information ── */}
          {activeTab === 'invoice' && (
            <div className="bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 px-7 py-6 border-b border-border/20 bg-secondary/10">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-foreground tracking-tight">{t('settings.invoice_title', 'Invoice & Receipt Information')}</h2>
                <p className="text-[11px] text-foreground/50 mt-0.5">
                  {t('settings.invoice_desc', 'Customize the store info printed on every customer receipt and invoice.')}
                </p>
              </div>
            </div>

            <div className="p-7">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

                {/* ── Logo upload ── */}
                <div className="flex flex-col gap-4">
                  <FieldLabel>{t('settings.store_logo', 'Store Logo')}</FieldLabel>

                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="relative group w-full aspect-square max-w-[180px] mx-auto lg:mx-0 rounded-2xl border-2 border-dashed border-border/50 hover:border-emerald-500/60 bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden"
                  >
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Store logo" className="w-full h-full object-contain p-3" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity duration-200">
                          <div className="flex flex-col items-center gap-1.5 text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[10px] font-bold">{t('settings.change_logo', 'Change Logo')}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-foreground/35 p-4 text-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] font-bold">{t('settings.click_to_upload', 'Click to upload')}</span>
                        <span className="text-[9px] font-semibold">PNG, JPG, SVG</span>
                      </div>
                    )}
                  </div>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleLogoSelect}
                  />

                  {logoFile && (
                    <button
                      type="button"
                      id="upload-logo-btn"
                      onClick={handleLogoUpload}
                      disabled={isUploadingLogo}
                      className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-500/90 text-white font-extrabold text-[11px] rounded-xl transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isUploadingLogo ? (
                        <>
                          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {t('settings.uploading', 'Uploading...')}
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          {t('settings.upload_logo', 'Upload Logo')}
                        </>
                      )}
                    </button>
                  )}

                  <div className="h-px bg-border/20" />
                  <ToggleSwitch
                    checked={form.is_logo_enabled ?? true}
                    onChange={(v) => updateForm('is_logo_enabled', v)}
                    label={t('settings.show_logo_receipt', 'Show Logo on Receipt')}
                    description={t('settings.show_logo_desc', 'Display the store logo at the top of printed receipts.')}
                  />
                </div>

                {/* ── Store info fields ── */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* Store Name */}
                  <div className="sm:col-span-2">
                    <FieldLabel>{t('settings.store_business_name', 'Store / Business Name')}</FieldLabel>
                    <input
                      id="store-name-input"
                      type="text"
                      value={form.store_name ?? ''}
                      onChange={(e) => updateForm('store_name', e.target.value)}
                      placeholder={t('settings.store_name_placeholder', 'e.g. Pich Chamroeun Shop')}
                      className="w-full px-4 py-3 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all duration-200 placeholder:text-foreground/30"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <FieldLabel optional>{t('settings.phone_number', 'Phone Number')}</FieldLabel>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3.5 flex items-center text-foreground/40">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </span>
                      <input
                        id="store-phone-input"
                        type="tel"
                        value={form.store_phone ?? ''}
                        onChange={(e) => updateForm('store_phone', e.target.value)}
                        placeholder={t('settings.phone_placeholder', '+855 12 345 678')}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all duration-200 placeholder:text-foreground/30"
                      />
                    </div>
                  </div>

                  {/* Tax ID */}
                  <div>
                    <FieldLabel optional>{t('settings.tax_vat_id', 'Tax / VAT ID')}</FieldLabel>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3.5 flex items-center text-foreground/40">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </span>
                      <input
                        id="store-tax-id-input"
                        type="text"
                        value={form.store_tax_id ?? ''}
                        onChange={(e) => updateForm('store_tax_id', e.target.value)}
                        placeholder={t('settings.tax_placeholder', 'e.g. K001-123456789')}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all duration-200 placeholder:text-foreground/30"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <FieldLabel optional>{t('settings.address', 'Address')}</FieldLabel>
                    <textarea
                      id="store-address-input"
                      value={form.store_address ?? ''}
                      onChange={(e) => updateForm('store_address', e.target.value)}
                      placeholder={t('settings.address_placeholder', 'e.g. No. 123, Street 271, Phnom Penh, Cambodia')}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all duration-200 resize-none placeholder:text-foreground/30"
                    />
                  </div>

                  {/* Footer Note */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel optional>{t('settings.footer_thankyou', 'Footer / Thank-you Note')}</FieldLabel>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-foreground/45">{t('settings.show_on_receipt', 'Show on receipt')}</span>
                        <ToggleSwitch
                          checked={form.is_footer_enabled ?? true}
                          onChange={(v) => updateForm('is_footer_enabled', v)}
                          label=""
                        />
                      </div>
                    </div>
                    <div className={form.is_footer_enabled ? '' : 'opacity-40 pointer-events-none'}>
                      <textarea
                        id="store-footer-input"
                        value={form.store_footer_note ?? ''}
                        onChange={(e) => updateForm('store_footer_note', e.target.value)}
                        placeholder={t('settings.footer_placeholder', 'e.g. Thank you for your purchase! Come back soon.')}
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 text-sm font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all duration-200 resize-none placeholder:text-foreground/30"
                      />
                      <p className="text-[9px] font-semibold text-foreground/35 mt-1.5">
                        {t('settings.footer_hint', 'Displayed at the bottom of every printed receipt')}
                      </p>
                    </div>
                  </div>

                  {/* Info hint */}
                  <div className="sm:col-span-2 flex items-start gap-3 px-4 py-3.5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
                    <svg className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[11px] text-foreground/55 font-semibold leading-relaxed">
                      {t('settings.receipt_info_hint', 'This information appears on receipts sent to customers via Telegram and on printed receipts at checkout. Click Save All Settings above to apply all changes at once.')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

        </div>
      )}

      {/* Info footer */}
      {!isLoading && (
        <div className="flex items-center gap-2.5 px-5 py-3.5 bg-secondary/20 border border-border/20 rounded-2xl select-none">
          <svg className="w-4 h-4 shrink-0 text-foreground/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[11px] text-foreground/45 font-semibold">
            {t('settings.footer_notice', 'All settings are saved together with the Save All Settings button. Backup schedules and logo uploads are processed server-side.')}
          </p>
        </div>
      )}

      {/* ── Backup Restore Confirmation Modal ── */}
      {confirmRestoreBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border/40 rounded-3xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-base font-extrabold tracking-tight">{t('settings.confirm_restore_title', 'Confirm Database Restore')}</h3>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">
              {t('settings.confirm_restore_desc', 'Are you sure you want to restore the database to the savepoint "{{name}}"?').replace('{{name}}', confirmRestoreBackup.backup_name)}
              <br />
              <span className="text-destructive font-bold mt-2 block">
                {t('settings.confirm_restore_warning', '⚠️ WARNING: All active records will be overwritten with the snapshot data. This operation cannot be undone.')}
              </span>
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRestoreBackup(null)}
                className="px-4 py-2.5 border border-border/60 hover:bg-secondary/10 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleRestoreBackup(confirmRestoreBackup.backup_id, confirmRestoreBackup.backup_name)}
                className="px-4 py-2.5 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {t('settings.confirm_restore', 'Confirm Restore')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
