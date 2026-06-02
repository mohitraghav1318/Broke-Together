"use client";

import { useEffect } from "react";
import { AppButton } from "@/components/ui/app-button";
import {
  NotebookEntryForm,
  type NotebookEntryDraft,
} from "@/features/notebooks/components/notebook-entry-form";
import type { HisabaNotebook } from "@/features/notebooks/lib/hisaba-notebooks";

type NotebookEntryDialogProps = {
  categories: string[];
  formKey?: string;
  initialValues?: NotebookEntryDraft;
  isOpen: boolean;
  isSaving: boolean;
  notebook: HisabaNotebook;
  onClose: () => void;
  onSubmit: (draft: NotebookEntryDraft) => Promise<boolean>;
  submitLabel?: string;
  title: string;
};

export function NotebookEntryDialog({
  categories,
  formKey,
  initialValues,
  isOpen,
  isSaving,
  notebook,
  onClose,
  onSubmit,
  submitLabel,
  title,
}: NotebookEntryDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="notebook-entry-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 px-4 py-6"
      role="dialog"
    >
      <div className="max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2
            className="text-xl font-semibold text-zinc-950"
            id="notebook-entry-dialog-title"
          >
            {title}
          </h2>
          <AppButton
            aria-label="Close dialog"
            className="h-9 px-3"
            disabled={isSaving}
            onClick={onClose}
            type="button"
            variant="ghost"
          >
            Close
          </AppButton>
        </div>

        <NotebookEntryForm
          key={formKey || (initialValues ? "edit-entry" : "create-entry")}
          categories={categories}
          initialValues={initialValues}
          isSaving={isSaving}
          notebook={notebook}
          onCancel={onClose}
          onSubmit={onSubmit}
          submitLabel={submitLabel}
        />
      </div>
    </div>
  );
}
