"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { Finding, FindingStatus, FindingCategory } from "@/types";
import { findingsApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  DocumentArrowUpIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

interface FindingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  finding: Finding;
  onUpdate: () => void;
  canEdit: boolean;
}

interface Evidence {
  id: number;
  file_path: string;
  uploaded_by: number;
  uploaded_at: string | Date;
  uploader_name?: string;
}

const FINDING_STATUS_VARIANTS: Record<
  FindingStatus,
  "default" | "info" | "warning" | "success"
> = {
  Open: "warning",
  "In Progress": "info",
  Submitted: "info",
  Closed: "success",
  Overdue: "default",
};

const CATEGORY_VARIANTS: Record<
  FindingCategory,
  "default" | "info" | "warning" | "success"
> = {
  Observation: "info",
  Minor: "warning",
  Major: "default",
};

export default function FindingDetailModal({
  isOpen,
  onClose,
  finding,
  onUpdate,
  canEdit,
}: FindingDetailModalProps) {
  const [correctiveAction, setCorrectiveAction] = useState(
    finding.corrective_action || "",
  );
  const [rootCause, setRootCause] = useState(finding.root_cause || "");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [status, setStatus] = useState<FindingStatus>(finding.status);

  useEffect(() => {
    if (isOpen && finding.id) {
      fetchEvidence();
    }
  }, [isOpen, finding.id]);

  useEffect(() => {
    setCorrectiveAction(finding.corrective_action || "");
    setRootCause(finding.root_cause || "");
    setStatus(finding.status);
  }, [finding]);

  const fetchEvidence = async () => {
    try {
      setLoadingEvidence(true);
      const data: any = await findingsApi.getEvidence(finding.id);
      setEvidence(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load evidence:", error);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const handleUploadEvidence = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      Array.from(selectedFiles).forEach((file) => {
        formData.append("files", file);
      });

      await findingsApi.uploadEvidence(finding.id, formData);
      toast.success("Evidence uploaded successfully");
      setSelectedFiles(null);
      // Reset file input
      const fileInput = document.getElementById(
        "evidence-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      fetchEvidence();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload evidence");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: number) => {
    if (!confirm("Are you sure you want to delete this evidence?")) return;

    try {
      await findingsApi.deleteEvidence(finding.id, evidenceId);
      toast.success("Evidence deleted successfully");
      fetchEvidence();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete evidence");
    }
  };

  const handleSaveCorrectiveAction = async () => {
    try {
      setSaving(true);
      await findingsApi.update(finding.id, {
        corrective_action: correctiveAction || null,
      });
      toast.success("Corrective action updated successfully");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to save corrective action");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRootCause = async () => {
    try {
      setSaving(true);
      await findingsApi.update(finding.id, {
        root_cause: rootCause || null,
      });
      toast.success("Root cause updated successfully");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to save root cause");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: FindingStatus) => {
    try {
      setSaving(true);
      await findingsApi.update(finding.id, { status: newStatus });
      setStatus(newStatus);
      toast.success("Status updated successfully");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const getFileNameFromPath = (path: string) => {
    const parts = path.split("/");
    return parts[parts.length - 1];
  };

  const availableStatuses: FindingStatus[] = [
    "Open",
    "In Progress",
    "Submitted",
    "Closed",
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finding Details" size="xl">
      <div className="space-y-6">
        {/* Finding Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Badge variant={CATEGORY_VARIANTS[finding.category]}>
              {finding.category}
            </Badge>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex items-center gap-2">
              <Badge variant={FINDING_STATUS_VARIANTS[status]}>{status}</Badge>
              {canEdit && status !== "Closed" && (
                <select
                  value={status}
                  onChange={(e) =>
                    handleUpdateStatus(e.target.value as FindingStatus)
                  }
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                  disabled={saving}
                >
                  {availableStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 rounded p-3">
            {finding.description}
          </p>
        </div>

        {/* Root Cause */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Root Cause
          </label>
          {canEdit && status !== "Closed" ? (
            <div className="space-y-2">
              <textarea
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter root cause analysis..."
              />
              <Button onClick={handleSaveRootCause} disabled={saving} size="sm">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Save Root Cause
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-900 bg-gray-50 rounded p-3">
              {rootCause || "No root cause specified"}
            </p>
          )}
        </div>

        {/* Corrective Action */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Corrective Action
          </label>
          {canEdit && status !== "Closed" ? (
            <div className="space-y-2">
              <textarea
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter corrective action details..."
              />
              <Button
                onClick={handleSaveCorrectiveAction}
                disabled={saving}
                size="sm"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Save Corrective Action
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-900 bg-gray-50 rounded p-3">
              {correctiveAction || "No corrective action specified"}
            </p>
          )}
        </div>

        {/* Responsible Person and Target Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {finding.responsible_person && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsible Person
              </label>
              <p className="text-sm text-gray-900">
                {finding.responsible_person}
              </p>
            </div>
          )}
          {finding.target_date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Date
              </label>
              <p className="text-sm text-gray-900">
                {format(new Date(finding.target_date), "MMM dd, yyyy")}
              </p>
            </div>
          )}
        </div>

        {/* Evidence Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evidence</h3>

          {/* Upload Evidence */}
          {canEdit && status !== "Closed" && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Evidence Files
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="evidence-upload"
                  type="file"
                  multiple
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <Button
                  onClick={handleUploadEvidence}
                  disabled={uploading || !selectedFiles}
                  size="sm"
                >
                  <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
              {selectedFiles && selectedFiles.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  {selectedFiles.length} file(s) selected
                </p>
              )}
            </div>
          )}

          {/* Evidence List */}
          <div className="space-y-2">
            {loadingEvidence ? (
              <p className="text-sm text-gray-500">Loading evidence...</p>
            ) : evidence.length === 0 ? (
              <p className="text-sm text-gray-500">No evidence uploaded yet</p>
            ) : (
              evidence.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
                    >
                      {getFileNameFromPath(item.file_path)}
                    </a>
                    <p className="text-xs text-gray-500">
                      Uploaded by {item.uploader_name || "Unknown"} on{" "}
                      {format(new Date(item.uploaded_at), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <a
                      href={item.file_path}
                      download
                      className="text-blue-600 hover:text-blue-800"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </a>
                    {canEdit && status !== "Closed" && (
                      <button
                        onClick={() => handleDeleteEvidence(item.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Closure Date if finding is closed */}
        {status === "Closed" && finding.closure_date && (
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Closure Date
            </label>
            <p className="text-sm text-gray-900 bg-green-50 border border-green-200 rounded p-3">
              {format(new Date(finding.closure_date), "MMM dd, yyyy HH:mm")}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onClose} variant="secondary">
          Close
        </Button>
      </div>
    </Modal>
  );
}
