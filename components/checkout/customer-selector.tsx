'use client';

import React from 'react';

export interface Customer {
  customerId: number;
  fullName: string;
  phone: string | null;
}

interface CustomerSelectorProps {
  isNewCustomerMode: boolean;
  setIsNewCustomerMode: (mode: boolean) => void;
  newCustomerName: string;
  setNewCustomerName: (name: string) => void;
  newCustomerPhone: string;
  setNewCustomerPhone: (phone: string) => void;
  newCustomerErrors: { name?: string; phone?: string };
  setNewCustomerErrors: (errors: { name?: string; phone?: string }) => void;
  customerSearch: string;
  setCustomerSearch: (search: string) => void;
  isCustomerDropdownOpen: boolean;
  setIsCustomerDropdownOpen: (isOpen: boolean) => void;
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  customers: Customer[];
}

export default function CustomerSelector({
  isNewCustomerMode,
  setIsNewCustomerMode,
  newCustomerName,
  setNewCustomerName,
  newCustomerPhone,
  setNewCustomerPhone,
  newCustomerErrors,
  setNewCustomerErrors,
  customerSearch,
  setCustomerSearch,
  isCustomerDropdownOpen,
  setIsCustomerDropdownOpen,
  selectedCustomerId,
  setSelectedCustomerId,
  customers,
}: CustomerSelectorProps) {
  return (
    <div className="space-y-3 select-none border-b border-border/40 pb-4 shrink-0">
      <div className="flex justify-between items-center">
        <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/50">
          Customer Association
        </label>
        <button
          type="button"
          onClick={() => {
            setIsNewCustomerMode(!isNewCustomerMode);
            setNewCustomerErrors({});
          }}
          className="text-[10px] font-bold text-primary hover:underline cursor-pointer focus:outline-none"
        >
          {isNewCustomerMode ? 'Select Existing' : '+ Register New'}
        </button>
      </div>

      {isNewCustomerMode ? (
        <div className="space-y-2.5 animate-scale-up">
          <div>
            <input
              type="text"
              placeholder="Customer Full Name"
              value={newCustomerName}
              onChange={(e) => {
                setNewCustomerName(e.target.value);
                if (newCustomerErrors.name) setNewCustomerErrors({ ...newCustomerErrors, name: '' });
              }}
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-secondary/15 dark:bg-secondary/5 font-semibold focus:ring-2 focus:ring-primary/5 outline-none transition-all ${
                newCustomerErrors.name ? 'border-destructive focus:border-destructive' : 'border-border/60 focus:border-primary'
              }`}
            />
            {newCustomerErrors.name && (
              <p className="text-[10px] text-destructive font-bold mt-1 pl-1">{newCustomerErrors.name}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="Phone Number (e.g. 012345678)"
              value={newCustomerPhone}
              onChange={(e) => {
                setNewCustomerPhone(e.target.value);
                if (newCustomerErrors.phone) setNewCustomerErrors({ ...newCustomerErrors, phone: '' });
              }}
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-secondary/15 dark:bg-secondary/5 font-semibold focus:ring-2 focus:ring-primary/5 outline-none transition-all ${
                newCustomerErrors.phone ? 'border-destructive focus:border-destructive' : 'border-border/60 focus:border-primary'
              }`}
            />
            {newCustomerErrors.phone && (
              <p className="text-[10px] text-destructive font-bold mt-1 pl-1">{newCustomerErrors.phone}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={customerSearch}
              onFocus={() => setIsCustomerDropdownOpen(true)}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setIsCustomerDropdownOpen(true);
                if (selectedCustomerId !== 'walk-in') {
                  setSelectedCustomerId('walk-in');
                }
              }}
              className="w-full pl-3 pr-8 py-2.5 text-xs rounded-xl border border-border/60 bg-secondary/15 dark:bg-secondary/5 font-semibold focus:border-primary outline-none transition-all"
            />
            {(customerSearch || selectedCustomerId !== 'walk-in') ? (
              <button
                type="button"
                onClick={() => {
                  setCustomerSearch('');
                  setSelectedCustomerId('walk-in');
                  setIsCustomerDropdownOpen(false);
                }}
                className="absolute right-3 top-3 text-foreground/45 hover:text-foreground cursor-pointer focus:outline-none"
                title="Clear Selection"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <div className="absolute right-3.5 top-3.5 text-foreground/35 select-none pointer-events-none">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
          </div>

          {isCustomerDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsCustomerDropdownOpen(false)}
              />
              <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-border/80 bg-card shadow-lg z-20 custom-scrollbar animate-scale-up">
                <div className="p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId('walk-in');
                      setCustomerSearch('');
                      setIsCustomerDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                      selectedCustomerId === 'walk-in'
                        ? 'bg-primary/10 text-primary font-black'
                        : 'text-foreground/75 hover:bg-secondary/60 hover:text-foreground'
                    }`}
                  >
                    Walk-in Customer (Guest)
                  </button>

                  {customers
                    .filter((c) => {
                      const query = customerSearch.toLowerCase().trim();
                      if (!query) return true;
                      const nameMatch = c.fullName.toLowerCase().includes(query);
                      const phoneMatch = c.phone?.toLowerCase().includes(query) ?? false;
                      return nameMatch || phoneMatch;
                    })
                    .map((c) => {
                      const isSelected = selectedCustomerId === c.customerId.toString();
                      return (
                        <button
                          key={c.customerId}
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(c.customerId.toString());
                            setCustomerSearch(`${c.fullName} (${c.phone || 'No Phone'})`);
                            setIsCustomerDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                            isSelected
                              ? 'bg-primary/10 text-primary font-black'
                              : 'text-foreground/75 hover:bg-secondary/60 hover:text-foreground'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="truncate">{c.fullName}</span>
                            {c.phone && <span className="text-[10px] text-foreground/45 shrink-0 ml-2 font-mono">{c.phone}</span>}
                          </div>
                        </button>
                      );
                    })}

                  {customers.filter((c) => {
                    const query = customerSearch.toLowerCase().trim();
                    if (!query) return true;
                    return c.fullName.toLowerCase().includes(query) || (c.phone?.toLowerCase().includes(query) ?? false);
                  }).length === 0 && (
                    <div className="px-3 py-2 text-center text-[10px] font-bold text-foreground/40 select-none">
                      No customers found
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
