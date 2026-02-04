import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { X, Plus, Edit, Trash2, Download, Upload, Check, Share2 } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { DataEntryTemplate } from "../types";
import { Button } from "./ui/Button";
import { TemplateEditor } from "./TemplateEditor";
import { ConfirmDialog } from "./ConfirmDialog";

interface TemplateManagerFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "send" | "receive";
  onShareTemplate?: (template: DataEntryTemplate) => void;
}

export function TemplateManagerFlyout({
  isOpen,
  onClose,
  mode,
  onShareTemplate,
}: TemplateManagerFlyoutProps) {
  const {
    templates,
    activeTemplateId,
    setActiveTemplateId,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useAppStore(
    useShallow((state) => ({
      templates: state.templates,
      activeTemplateId: state.activeTemplateId,
      setActiveTemplateId: state.setActiveTemplateId,
      addTemplate: state.addTemplate,
      updateTemplate: state.updateTemplate,
      deleteTemplate: state.deleteTemplate,
    })),
  );

  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DataEntryTemplate | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSelectTemplate = (id: string | null) => {
    setActiveTemplateId(id);
  };

  const handleCreateNew = () => {
    setEditingTemplate(undefined);
    setShowEditor(true);
  };

  const handleEdit = (template: DataEntryTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleSave = (template: DataEntryTemplate) => {
    if (editingTemplate) {
      void updateTemplate(template.id, template);
    } else {
      void addTemplate(template);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    setDeleteConfirmId(null);
  };

  const handleExport = (template: DataEntryTemplate) => {
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `template-${template.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string) as DataEntryTemplate;

          // Check for duplicate name
          const existing = templates.find((t) => t.name === imported.name);
          if (existing) {
            const overwrite = confirm(
              `A template named "${imported.name}" already exists. Do you want to overwrite it?`,
            );
            if (overwrite) {
              await updateTemplate(existing.id, {
                ...imported,
                id: existing.id,
                createdAt: existing.createdAt,
                updatedAt: Date.now(),
              });
            }
          } else {
            const newTemplate: DataEntryTemplate = {
              ...imported,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            await addTemplate(newTemplate);
          }
        } catch {
          alert("Failed to import template. Please check the file format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 transition-opacity" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex flex-col bg-white sm:left-auto sm:w-96 sm:shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === "send" ? "Data Entry Templates" : "Manage Templates"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {mode === "send" && (
              <button
                onClick={() => handleSelectTemplate(null)}
                className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                  activeTemplateId === null
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {activeTemplateId === null && <Check className="h-5 w-5 text-blue-600" />}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">No Template</p>
                  <p className="text-sm text-gray-500">Scan without additional data</p>
                </div>
              </button>
            )}

            {templates.map((template) => (
              <div
                key={template.id}
                className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                  mode === "send" && activeTemplateId === template.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {mode === "send" ? (
                  <button
                    onClick={() => handleSelectTemplate(template.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    {activeTemplateId === template.id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                    <div className="flex-1 w-full">
                      <p className="font-medium text-gray-900 truncate">{template.name}</p>
                      <p className="text-sm text-gray-500">{template.fields.length} fields</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex-1 w-full">
                      <p className="font-medium text-gray-900 truncate">{template.name}</p>
                      <p className="text-sm text-gray-500">{template.fields.length} fields</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-1">
                  {onShareTemplate && (
                    <button
                      onClick={() => onShareTemplate(template)}
                      className="rounded p-1.5 text-gray-500 hover:bg-blue-100 hover:text-blue-700"
                      title="Share with room"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(template)}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleExport(template)}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    title="Export as JSON"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(template.id)}
                    className="rounded p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <Button onClick={handleCreateNew} className="flex-1">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
            <Button variant="secondary" onClick={handleImport}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        </div>
      </div>

      <TemplateEditor
        open={showEditor}
        onOpenChange={setShowEditor}
        template={editingTemplate}
        existingNames={templates.filter((t) => t.id !== editingTemplate?.id).map((t) => t.name)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteConfirmId && void handleDelete(deleteConfirmId)}
      />
    </>
  );
}
