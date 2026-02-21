"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import FindingDetailModal from "@/components/FindingDetailModal";
import {
  auditsApi,
  findingsApi,
  auditorsApi,
  auditResultsApi,
  settingsApi,
  api,
  getApiUrl,
} from "@/lib/api";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import {
  Audit,
  Finding,
  FindingCategory,
  FindingStatus,
  AuditStatus,
  AuditResultType,
  CompanySettings,
} from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface AuditWithDetails extends Audit {
  vessel_name?: string;
  registration_number?: string;
  audit_type_name?: string;
  audit_party_name?: string;
  audit_company_name?: string;
  result_name?: string;
  created_by_name?: string;
}

interface FindingWithDetails extends Finding {
  audit_reference?: string;
}

interface AuditAttachment {
  id: number;
  audit_id: number;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: number;
  uploaded_at: Date | string;
  uploader_name?: string;
}

const STATUS_VARIANTS: Record<
  string,
  "default" | "info" | "warning" | "success"
> = {
  Planned: "info",
  Ongoing: "warning",
  Completed: "success",
  Closed: "default",
};

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

export default function AuditDetailPage() {
  const router = useRouter();
  const params = useParams();
  const auditId = parseInt(params.id as string);
  const { hasRole } = useAuth();

  const [audit, setAudit] = useState<AuditWithDetails | null>(null);
  const [findings, setFindings] = useState<FindingWithDetails[]>([]);
  const [attachments, setAttachments] = useState<AuditAttachment[]>([]);
  const [auditAuditors, setAuditAuditors] = useState<any[]>([]);
  const [availableAuditors, setAvailableAuditors] = useState<any[]>([]);
  const [auditResults, setAuditResults] = useState<AuditResultType[]>([]);
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditingAudit, setIsEditingAudit] = useState(false);

  // Modals
  const [findingModalOpen, setFindingModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [auditorModalOpen, setAuditorModalOpen] = useState(false);
  const [findingDetailModalOpen, setFindingDetailModalOpen] = useState(false);
  const [editingFinding, setEditingFinding] =
    useState<FindingWithDetails | null>(null);
  const [viewingFinding, setViewingFinding] =
    useState<FindingWithDetails | null>(null);
  const [closingFinding, setClosingFinding] =
    useState<FindingWithDetails | null>(null);

  // Form data
  const [findingFormData, setFindingFormData] = useState({
    category: "Observation" as FindingCategory,
    description: "",
    root_cause: "",
    corrective_action: "",
    responsible_person: "",
    target_date: "",
    status: "Open" as FindingStatus,
  });

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [closureRemarks, setClosureRemarks] = useState("");
  const [auditorFormData, setAuditorFormData] = useState({
    auditor_id: "",
    role: "Auditor",
  });
  const [auditUpdateData, setAuditUpdateData] = useState({
    status: "" as AuditStatus,
    result_id: null as number | null,
  });

  useEffect(() => {
    if (auditId) {
      fetchAudit();
      fetchFindings();
      fetchAttachments();
      fetchAuditAuditors();
      fetchAvailableAuditors();
      fetchAuditResults();
      fetchCompanySettings();
    }
  }, [auditId]);

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const data: any = await auditsApi.getById(auditId);
      setAudit(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load audit");
    } finally {
      setLoading(false);
    }
  };

  const fetchFindings = async () => {
    try {
      const data: any = await findingsApi.getAll({ audit_id: auditId });
      setFindings(Array.isArray(data) ? data : data.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load findings");
    }
  };

  const fetchAttachments = async () => {
    try {
      const response = await fetch(
        getApiUrl(`/api/audits/${auditId}/attachments`),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const result = await response.json();
      if (result.success) {
        setAttachments(result.data || []);
      }
    } catch (error: any) {
      console.error("Failed to load attachments:", error);
    }
  };

  const fetchAuditAuditors = async () => {
    try {
      const data: any = await auditorsApi.getAuditAuditors(auditId);
      setAuditAuditors(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load auditors:", error);
    }
  };

  const fetchAvailableAuditors = async () => {
    try {
      const data: any = await auditorsApi.getAll({ active: true });
      setAvailableAuditors(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load available auditors:", error);
    }
  };

  const fetchAuditResults = async () => {
    try {
      const data: any = await auditResultsApi.getAll();
      setAuditResults(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load audit results:", error);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const data: any = await settingsApi.get();
      setCompanySettings(data);
    } catch (error: any) {
      console.error("Failed to load company settings:", error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEditAudit = () => {
    if (audit) {
      setAuditUpdateData({
        status: audit.status,
        result_id: audit.audit_result_id || null,
      });
      setIsEditingAudit(true);
    }
  };

  const handleCancelEditAudit = () => {
    setIsEditingAudit(false);
    setAuditUpdateData({
      status: "" as AuditStatus,
      result_id: null,
    });
  };

  const handleUpdateAudit = async () => {
    if (!audit) return;

    try {
      setSubmitting(true);
      await auditsApi.update(auditId, {
        status: auditUpdateData.status,
        audit_result_id: auditUpdateData.result_id,
      });
      toast.success("Audit updated successfully");
      setIsEditingAudit(false);
      fetchAudit();
    } catch (error: any) {
      toast.error(error.message || "Failed to update audit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenFindingModal = (finding?: FindingWithDetails) => {
    if (finding) {
      setEditingFinding(finding);
      setFindingFormData({
        category: finding.category,
        description: finding.description,
        root_cause: finding.root_cause || "",
        corrective_action: finding.corrective_action || "",
        responsible_person: finding.responsible_person || "",
        target_date:
          finding.target_date instanceof Date
            ? finding.target_date.toISOString().split("T")[0]
            : finding.target_date,
        status: finding.status,
      });
    } else {
      setEditingFinding(null);
      setFindingFormData({
        category: "Observation",
        description: "",
        root_cause: "",
        corrective_action: "",
        responsible_person: "",
        target_date: "",
        status: "Open",
      });
    }
    setFindingModalOpen(true);
  };

  const handleCloseFindingModal = () => {
    setFindingModalOpen(false);
    setEditingFinding(null);
  };

  const handleOpenFindingDetailModal = (finding: FindingWithDetails) => {
    setViewingFinding(finding);
    setFindingDetailModalOpen(true);
  };

  const handleCloseFindingDetailModal = () => {
    setFindingDetailModalOpen(false);
    setViewingFinding(null);
  };

  const handleSubmitFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...findingFormData,
        audit_id: auditId,
        root_cause: findingFormData.root_cause || null,
        corrective_action: findingFormData.corrective_action || null,
        responsible_person: findingFormData.responsible_person || null,
      };

      if (editingFinding) {
        await findingsApi.update(editingFinding.id, payload);
        toast.success("Finding updated successfully");
      } else {
        await findingsApi.create(payload);
        toast.success("Finding created successfully");
      }
      handleCloseFindingModal();
      fetchFindings();
    } catch (error: any) {
      toast.error(error.message || "Failed to save finding");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFinding = async (finding: FindingWithDetails) => {
    if (!confirm("Are you sure you want to delete this finding?")) return;

    try {
      await findingsApi.delete(finding.id);
      toast.success("Finding deleted successfully");
      fetchFindings();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete finding");
    }
  };

  const handleCloseFinding = async (finding: FindingWithDetails) => {
    setClosingFinding(finding);
    setClosureRemarks("");
  };

  const handleSubmitClose = async () => {
    if (!closingFinding) return;
    setSubmitting(true);
    try {
      await findingsApi.close(closingFinding.id, {
        closure_remarks: closureRemarks || null,
      });
      toast.success("Finding closed successfully");
      setClosingFinding(null);
      setClosureRemarks("");
      fetchFindings();
    } catch (error: any) {
      toast.error(error.message || "Failed to close finding");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopenFinding = async (finding: FindingWithDetails) => {
    const reason = prompt("Enter reason for reopening:");
    if (!reason) return;

    try {
      await findingsApi.reopen(finding.id, reason);
      toast.success("Finding reopened successfully");
      fetchFindings();
    } catch (error: any) {
      toast.error(error.message || "Failed to reopen finding");
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      uploadFiles.forEach((file) => {
        formData.append("files", file);
      });

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(
        getApiUrl(`/api/audits/${auditId}/attachments`),
        {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload files");
      }

      const result = await response.json();
      toast.success(result.message || "Files uploaded successfully");
      setUploadModalOpen(false);
      setUploadFiles([]);
      fetchAttachments();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload files");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(
        getApiUrl(`/api/audits/${auditId}/attachments/${attachmentId}`),
        {
          method: "DELETE",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete attachment");
      }

      toast.success("Attachment deleted successfully");
      fetchAttachments();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete attachment");
    }
  };

  const handleOpenAuditorModal = () => {
    setAuditorFormData({ auditor_id: "", role: "Auditor" });
    setAuditorModalOpen(true);
  };

  const handleCloseAuditorModal = () => {
    setAuditorModalOpen(false);
    setAuditorFormData({ auditor_id: "", role: "Auditor" });
  };

  const handleAssignAuditor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await auditorsApi.assignToAudit(auditId, {
        auditor_id: parseInt(auditorFormData.auditor_id),
        role: auditorFormData.role,
      });
      toast.success("Auditor assigned successfully");
      handleCloseAuditorModal();
      fetchAuditAuditors();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign auditor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAuditor = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to remove this auditor?")) return;

    try {
      await auditorsApi.removeFromAudit(auditId, assignmentId);
      toast.success("Auditor removed successfully");
      fetchAuditAuditors();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove auditor");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const canEdit = hasRole(["Admin", "Encoder"]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!audit) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Audit not found
            </h2>
            <Button onClick={() => router.push("/audits")} className="mt-4">
              Back to Audits
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const findingColumns = [
    {
      key: "category",
      title: "Category",
      render: (value: FindingCategory) => (
        <Badge
          variant={
            value === "Major"
              ? "default"
              : value === "Minor"
                ? "warning"
                : "info"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: "description",
      title: "Description",
      className: "max-w-md truncate",
    },
    {
      key: "responsible_person",
      title: "Responsible Person",
      render: (value: string | null) => value || "-",
    },
    {
      key: "target_date",
      title: "Target Date",
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "status",
      title: "Status",
      render: (value: FindingStatus) => (
        <Badge variant={FINDING_STATUS_VARIANTS[value]}>{value}</Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      className: "w-56",
      render: (_: any, finding: FindingWithDetails) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenFindingDetailModal(finding)}
            className="text-purple-600 hover:text-purple-800"
            title="View Details"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          {canEdit && finding.status !== "Closed" && (
            <>
              <button
                onClick={() => handleCloseFinding(finding)}
                className="text-green-600 hover:text-green-800"
                title="Close Finding"
              >
                <CheckCircleIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDeleteFinding(finding)}
                className="text-red-600 hover:text-red-800"
                title="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </>
          )}
          {canEdit && finding.status === "Closed" && (
            <button
              onClick={() => handleReopenFinding(finding)}
              className="text-orange-600 hover:text-orange-800"
              title="Reopen Finding"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          )}
          {!canEdit && <span className="text-gray-400">-</span>}
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <style jsx global>{`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            body {
              background: white;
            }
          }
          @media screen {
            .print-only {
              display: none;
            }
          }
        `}</style>

        <div className="space-y-6 no-print">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                onClick={() => router.push("/audits")}
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Back
              </Button>
              <Button variant="secondary" onClick={handlePrint}>
                <PrinterIcon className="h-5 w-5" />
                Print
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Audit Details
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {audit.audit_reference}
                </p>
              </div>
            </div>
            {
              // canEdit && (
              //   <Button onClick={() => setUploadModalOpen(true)}>
              //     <DocumentArrowUpIcon className="h-5 w-5" />
              //     Upload Result
              //   </Button>
              // )
            }
          </div>

          {/* Audit Information Card */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Audit Information</h2>
                {canEdit && !isEditingAudit && (
                  <Button onClick={handleEditAudit} size="sm">
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Update
                  </Button>
                )}
                {isEditingAudit && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateAudit}
                      disabled={submitting}
                      size="sm"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      {submitting ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={handleCancelEditAudit}
                      variant="secondary"
                      size="sm"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Reference #
                  </label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {audit.audit_reference}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Vessel
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {audit.vessel_name || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Registration Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {audit.registration_number || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Audit Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {audit.audit_type_name || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Audit Party
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {audit.audit_party_name || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  {isEditingAudit ? (
                    <select
                      value={auditUpdateData.status}
                      onChange={(e) =>
                        setAuditUpdateData({
                          ...auditUpdateData,
                          status: e.target.value as AuditStatus,
                        })
                      }
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Planned">Planned</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Closed">Closed</option>
                    </select>
                  ) : (
                    <div className="mt-1">
                      <Badge
                        variant={STATUS_VARIANTS[audit.status] || "default"}
                      >
                        {audit.status}
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Start Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(audit.audit_start_date), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    End Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {audit.audit_end_date
                      ? format(new Date(audit.audit_end_date), "MMM dd, yyyy")
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Next Due Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {audit.next_due_date
                      ? format(new Date(audit.next_due_date), "MMM dd, yyyy")
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Audit Company
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {audit.audit_company_name || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Result
                  </label>
                  {isEditingAudit ? (
                    <select
                      value={auditUpdateData.result_id || ""}
                      onChange={(e) =>
                        setAuditUpdateData({
                          ...auditUpdateData,
                          result_id: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Result</option>
                      {auditResults.map((result) => (
                        <option key={result.id} value={result.id}>
                          {result.result_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {audit.result_name || "-"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Created By
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {audit.created_by_name || "-"}
                  </p>
                </div>
                {audit.remarks && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="text-sm font-medium text-gray-500">
                      Remarks
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {audit.remarks}
                    </p>
                  </div>
                )}
                {audit.report_file_path && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="text-sm font-medium text-gray-500">
                      Result Attachment
                    </label>
                    <p className="mt-1">
                      <a
                        href={audit.report_file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        View Attachment
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Attachments Section */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Result Attachments</h2>
                {canEdit && (
                  <Button onClick={() => setUploadModalOpen(true)}>
                    <DocumentArrowUpIcon className="h-5 w-5" />
                    Upload Files
                  </Button>
                )}
              </div>
              {attachments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No attachments uploaded yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Upload Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attachments.map((attachment) => (
                        <tr key={attachment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <a
                              href={attachment.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {attachment.file_name}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatFileSize(attachment.file_size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {attachment.uploader_name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(
                              new Date(attachment.uploaded_at),
                              "MMM dd, yyyy HH:mm",
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {canEdit && (
                              <button
                                onClick={() =>
                                  handleDeleteAttachment(attachment.id)
                                }
                                className="text-red-600 hover:text-red-800"
                                title="Delete Attachment"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* Auditors Section */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Assigned Auditors</h2>
                {canEdit && (
                  <Button onClick={handleOpenAuditorModal}>
                    <PlusIcon className="h-5 w-5" />
                    Assign Auditor
                  </Button>
                )}
              </div>
              {auditAuditors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No auditors assigned yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Auditor Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certification
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Specialization
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditAuditors.map((aa) => (
                        <tr key={aa.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {aa.auditor_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {aa.company_name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Badge variant="info">{aa.role}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {aa.certification || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {aa.specialization || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {canEdit && (
                              <button
                                onClick={() => handleRemoveAuditor(aa.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Remove Auditor"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* Findings Section */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Findings</h2>
                {canEdit && (
                  <Button onClick={() => handleOpenFindingModal()}>
                    <PlusIcon className="h-5 w-5" />
                    Add Finding
                  </Button>
                )}
              </div>
              {findings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No findings recorded for this audit
                </div>
              ) : (
                <Table columns={findingColumns} data={findings} />
              )}
            </div>
          </Card>
        </div>

        {/* Finding Modal */}
        <Modal
          isOpen={findingModalOpen}
          onClose={handleCloseFindingModal}
          title={editingFinding ? "Edit Finding" : "Add Finding"}
        >
          <form onSubmit={handleSubmitFinding} className="space-y-4">
            <Select
              label="Category"
              value={findingFormData.category}
              onChange={(e) =>
                setFindingFormData({
                  ...findingFormData,
                  category: e.target.value as FindingCategory,
                })
              }
              options={[
                { value: "Major", label: "Major" },
                { value: "Minor", label: "Minor" },
                { value: "Observation", label: "Observation" },
              ]}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={findingFormData.description}
                onChange={(e) =>
                  setFindingFormData({
                    ...findingFormData,
                    description: e.target.value,
                  })
                }
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Root Cause and Corrective Action only shown when editing */}
            {editingFinding && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Root Cause
                  </label>
                  <textarea
                    value={findingFormData.root_cause}
                    onChange={(e) =>
                      setFindingFormData({
                        ...findingFormData,
                        root_cause: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corrective Action
                  </label>
                  <textarea
                    value={findingFormData.corrective_action}
                    onChange={(e) =>
                      setFindingFormData({
                        ...findingFormData,
                        corrective_action: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            <Input
              label="Responsible Person"
              type="text"
              value={findingFormData.responsible_person}
              onChange={(e) =>
                setFindingFormData({
                  ...findingFormData,
                  responsible_person: e.target.value,
                })
              }
            />

            <Input
              label="Target Date"
              type="date"
              value={findingFormData.target_date}
              onChange={(e) =>
                setFindingFormData({
                  ...findingFormData,
                  target_date: e.target.value,
                })
              }
              required
            />

            <Select
              label="Status"
              value={findingFormData.status}
              onChange={(e) =>
                setFindingFormData({
                  ...findingFormData,
                  status: e.target.value as FindingStatus,
                })
              }
              options={[
                { value: "Open", label: "Open" },
                { value: "In Progress", label: "In Progress" },
                { value: "Submitted", label: "Submitted" },
                { value: "Closed", label: "Closed" },
                { value: "Overdue", label: "Overdue" },
              ]}
              required
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting
                  ? "Saving..."
                  : editingFinding
                    ? "Update"
                    : "Create"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseFindingModal}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Upload Result Modal */}
        <Modal
          isOpen={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setUploadFiles([]);
          }}
          title="Upload Result Attachments"
        >
          <form onSubmit={handleUploadFile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Files *
              </label>
              <input
                type="file"
                multiple
                onChange={(e) =>
                  setUploadFiles(
                    e.target.files ? Array.from(e.target.files) : [],
                  )
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
              </p>
              <p className="mt-1 text-xs text-gray-500">
                You can select multiple files
              </p>
              {uploadFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">
                    Selected files ({uploadFiles.length}):
                  </p>
                  <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                    {uploadFiles.map((file, index) => (
                      <li key={index}>
                        {file.name} ({formatFileSize(file.size)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Uploading..." : "Upload"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setUploadModalOpen(false);
                  setUploadFiles([]);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Close Finding Modal */}
        <Modal
          isOpen={!!closingFinding}
          onClose={() => setClosingFinding(null)}
          title="Close Finding"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to close this finding?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Closure Remarks (Optional)
              </label>
              <textarea
                value={closureRemarks}
                onChange={(e) => setClosureRemarks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter any remarks about closing this finding..."
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSubmitClose}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "Closing..." : "Close Finding"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setClosingFinding(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Assign Auditor Modal */}
        <Modal
          isOpen={auditorModalOpen}
          onClose={handleCloseAuditorModal}
          title="Assign Auditor"
        >
          <form onSubmit={handleAssignAuditor} className="space-y-4">
            <Select
              label="Select Auditor"
              value={auditorFormData.auditor_id}
              onChange={(e) =>
                setAuditorFormData({
                  ...auditorFormData,
                  auditor_id: e.target.value,
                })
              }
              options={availableAuditors.map((a) => ({
                value: a.id,
                label: `${a.auditor_name} (${a.company_name || "No Company"})`,
              }))}
              required
            />

            <Select
              label="Role"
              value={auditorFormData.role}
              onChange={(e) =>
                setAuditorFormData({ ...auditorFormData, role: e.target.value })
              }
              options={[
                { value: "Lead Auditor", label: "Lead Auditor" },
                { value: "Auditor", label: "Auditor" },
                { value: "Observer", label: "Observer" },
                { value: "Technical Expert", label: "Technical Expert" },
              ]}
              required
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Assigning..." : "Assign Auditor"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseAuditorModal}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Finding Detail Modal with Evidence */}
        {viewingFinding && (
          <FindingDetailModal
            isOpen={findingDetailModalOpen}
            onClose={handleCloseFindingDetailModal}
            finding={viewingFinding}
            onUpdate={fetchFindings}
            canEdit={canEdit}
          />
        )}
      </AppLayout>

      {/* Print Layout - Hidden on screen, visible on print */}
      <div className="print-only">
        <div
          className="p-8 bg-white"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          {/* Company Header */}
          <div className="border-b-2 border-gray-800 pb-4 mb-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                {companySettings?.company_name || "Company Name"}
              </h1>
              {companySettings?.company_address && (
                <p className="text-sm text-gray-600 mt-1">
                  {companySettings?.company_address}
                </p>
              )}
              <div className="flex justify-center gap-4 text-sm text-gray-600 mt-1">
                {companySettings?.company_phone && (
                  <span>Tel: {companySettings?.company_phone}</span>
                )}
                {companySettings?.company_email && (
                  <span>Email: {companySettings?.company_email}</span>
                )}
              </div>
              {companySettings?.website && (
                <p className="text-sm text-gray-600">
                  {companySettings?.website}
                </p>
              )}
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">AUDIT REPORT</h2>
            <p className="text-sm text-gray-600 mt-1">
              Reference: {audit?.audit_reference}
            </p>
            <p className="text-xs text-gray-500">
              Generated on: {format(new Date(), "MMMM dd, yyyy HH:mm")}
            </p>
          </div>

          {/* Audit Information */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
              AUDIT INFORMATION
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Vessel:</span>{" "}
                {audit?.vessel_name}
              </div>
              <div>
                <span className="font-semibold">Registration:</span>{" "}
                {audit?.registration_number}
              </div>
              <div>
                <span className="font-semibold">Audit Type:</span>{" "}
                {audit?.audit_type_name}
              </div>
              <div>
                <span className="font-semibold">Audit Party:</span>{" "}
                {audit?.audit_party_name}
              </div>
              <div>
                <span className="font-semibold">Audit Company:</span>{" "}
                {audit?.audit_company_name || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Start Date:</span>{" "}
                {audit?.audit_start_date &&
                  format(new Date(audit.audit_start_date), "MMM dd, yyyy")}
              </div>
              <div>
                <span className="font-semibold">End Date:</span>{" "}
                {audit?.audit_end_date
                  ? format(new Date(audit.audit_end_date), "MMM dd, yyyy")
                  : "N/A"}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {audit?.status}
              </div>
              <div>
                <span className="font-semibold">Result:</span>{" "}
                {audit?.result_name || "N/A"}
              </div>
              {audit?.remarks && (
                <div className="col-span-2">
                  <span className="font-semibold">Remarks:</span>{" "}
                  {audit?.remarks}
                </div>
              )}
            </div>
          </div>

          {/* Assigned Auditors */}
          {auditAuditors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                ASSIGNED AUDITORS
              </h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Name
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Company
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Role
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Certification
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditAuditors.map((auditor) => (
                    <tr key={auditor.id}>
                      <td className="border border-gray-300 px-3 py-2">
                        {auditor.auditor_name}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {auditor.company_name || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {auditor.role}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {auditor.certification || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Findings */}
          {findings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                FINDINGS
              </h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Category
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Description
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Status
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Target Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map((finding) => (
                    <tr key={finding.id}>
                      <td className="border border-gray-300 px-3 py-2">
                        {finding.category}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {finding.description}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {finding.status}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {finding.target_date &&
                          format(new Date(finding.target_date), "MMM dd, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Result Attachments */}
          {attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                RESULT ATTACHMENTS
              </h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      File Name
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Uploaded By
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      Upload Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attachments.map((attachment) => (
                    <tr key={attachment.id}>
                      <td className="border border-gray-300 px-3 py-2">
                        {attachment.file_name}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {attachment.uploader_name || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {format(
                          new Date(attachment.uploaded_at),
                          "MMM dd, yyyy",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
            <p>
              This is a system-generated document from{" "}
              {companySettings?.company_name || "Audit Monitoring System"}
            </p>
            {companySettings?.registration_number && (
              <p>Registration No: {companySettings?.registration_number}</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
