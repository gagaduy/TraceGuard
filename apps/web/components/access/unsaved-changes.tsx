// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type UnsavedChangesState = {
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesState | undefined>(
  undefined,
);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  return (
    <UnsavedChangesContext.Provider value={{ dirty, setDirty }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const value = useContext(UnsavedChangesContext);
  if (!value) {
    throw new Error("useUnsavedChanges requires UnsavedChangesProvider");
  }
  return value;
}

export function UnsavedChangesDialog({
  destination,
  onCancel,
  onConfirm,
}: {
  destination: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    cancelButton.current?.focus();
    return () => previousFocus?.focus();
  }, []);

  return (
    <div
      aria-labelledby="unsaved-title"
      aria-describedby="unsaved-description"
      aria-modal="true"
      className="confirmation-backdrop"
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
        if (event.key === "Tab") {
          const buttons = dialog.current?.querySelectorAll("button");
          if (!buttons?.length) return;
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
      ref={dialog}
      role="alertdialog"
    >
      <section className="confirmation-dialog">
        <p className="eyebrow">Unsaved changes</p>
        <h2 id="unsaved-title">Leave without saving?</h2>
        <p id="unsaved-description">
          Continue to {destination}? The changes currently entered on this page
          will be discarded.
        </p>
        <div className="confirmation-actions">
          <button ref={cancelButton} onClick={onCancel} type="button">
            Keep editing
          </button>
          <button className="primary-action" onClick={onConfirm} type="button">
            Discard and switch
          </button>
        </div>
      </section>
    </div>
  );
}
