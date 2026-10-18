'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface SearchableSelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowClear?: boolean;
  allowCustomValue?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  id?: string;
  name?: string;
  emptyMessage?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  required = false,
  allowClear = false,
  allowCustomValue = false,
  className = '',
  triggerClassName = '',
  dropdownClassName = '',
  id,
  name,
  emptyMessage = 'No options found',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Selected option if matched in predefined options
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  // Display label: matched option label OR custom value string OR empty
  const displayLabel = selectedOption
    ? selectedOption.label
    : value !== '' && value !== undefined && value !== null
    ? String(value)
    : '';

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSublabel = opt.sublabel?.toLowerCase().includes(q);
      const matchBadge = opt.badge?.toLowerCase().includes(q);
      return matchLabel || matchSublabel || matchBadge;
    });
  }, [options, searchQuery]);

  // Check if search query exactly matches an existing option
  const hasExactMatch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return options.some(
      (opt) =>
        opt.label.toLowerCase() === q || String(opt.value).toLowerCase() === q
    );
  }, [options, searchQuery]);

  // Reset highlight when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (optValue: string | number) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalCount = filteredOptions.length + (allowCustomValue && !hasExactMatch ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % Math.max(1, totalCount));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev <= 0 ? Math.max(0, totalCount - 1) : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex < filteredOptions.length) {
          const opt = filteredOptions[highlightedIndex];
          if (opt && !opt.disabled) {
            handleSelect(opt.value);
          }
        } else if (allowCustomValue && searchQuery.trim()) {
          handleSelect(searchQuery.trim());
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for form integrations */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      {/* Main Trigger Button */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer select-none text-sm font-semibold outline-none ${
          triggerClassName ? triggerClassName : 'px-4 py-3 rounded-xl'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-secondary/20 border-border/40 text-foreground/40'
            : isOpen
            ? 'border-primary ring-2 ring-primary/20 bg-background text-foreground shadow-sm'
            : 'border-border/60 hover:border-border bg-background text-foreground hover:bg-secondary/10'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {displayLabel ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{displayLabel}</span>
              {selectedOption?.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {selectedOption.badge}
                </span>
              )}
              {selectedOption?.sublabel && (
                <span className="text-xs text-foreground/45 truncate">
                  ({selectedOption.sublabel})
                </span>
              )}
            </div>
          ) : (
            <span className="text-foreground/40 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-foreground/40">
          {allowClear && displayLabel && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear selection"
              className="p-1 hover:text-foreground hover:bg-secondary/60 rounded-md transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Floating Search & Options Dropdown Card */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${dropdownClassName}`}
        >
          {/* Search Input Field */}
          <div className="p-2.5 border-b border-border/40 bg-secondary/15">
            <div className="relative flex items-center">
              <svg
                className="absolute left-3 w-4 h-4 text-foreground/40 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 bg-card text-foreground text-xs font-semibold rounded-xl border border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-foreground/35"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-foreground/40 hover:text-foreground p-0.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 select-none custom-scrollbar"
          >
            {filteredOptions.length === 0 && (!allowCustomValue || !searchQuery.trim()) ? (
              <li className="px-4 py-6 text-center text-xs font-semibold text-foreground/40">
                {emptyMessage} {searchQuery ? `for "${searchQuery}"` : ''}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-foreground/40'
                        : isSelected
                        ? 'bg-primary/15 text-primary font-bold'
                        : isHighlighted
                        ? 'bg-secondary/70 text-foreground'
                        : 'text-foreground/80 hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-secondary/80 text-foreground/60 border border-border/30 shrink-0">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.sublabel && (
                        <span className="text-[10px] text-foreground/40 font-normal truncate mt-0.5">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-primary shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </li>
                );
              })
            )}

            {/* Custom Value Option (allow user to input any value they typed) */}
            {allowCustomValue && searchQuery.trim() && !hasExactMatch && (
              <li
                role="option"
                onClick={() => handleSelect(searchQuery.trim())}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors border border-primary/25 ${
                  highlightedIndex === filteredOptions.length
                    ? 'bg-primary/20 text-primary'
                    : 'bg-primary/10 text-primary hover:bg-primary/15'
                }`}
              >
                <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span className="truncate">
                  Use &quot;<span className="underline">{searchQuery.trim()}</span>&quot;
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
