"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import FindingDetailModal from "@/components/FindingDetailModal";
import { findingsApi, auditsApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { Finding, Audit } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface FindingWithDetails extends Finding {
  audit_reference?: string;
  vessel_name?: string;
  audit_type_name?: string;
}

interface AuditWithDetails extends Audit {
  audit_reference?: string;
  vessel_name?: string;
}

const CATEGORY_VARIANTS: Record<
  string,
  "default" | "success" | "warning" | "danger"
> = {
  Observation: "success",
  Minor: "warning",
  Major: "danger",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "warning" | "success" | "danger"
> = {
  Open: "warning",
  Closed: "success",
  Overdue: "danger",
};

export default function FindingsPage() {
  const [findings, setFindings] = useState<FindingWithDetails[]>([]);
  const [audits, setAudits] = useState<AuditWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [viewingFinding, setViewingFinding] =
    useState<FindingWithDetails | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = useAuth();

  // Pagination and filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    audit_id: "",
    category: "",
    status: "",
  });

  // Form data
  const [formData, setFormData] = useState({
    audit_id: "",
    description: "",
    category: "Minor",
    root_cause: "",
    corrective_action: "",
    responsible_person: "",
    target_date: "",
  });

  const [closeData, setCloseData] = useState({
    corrective_action_taken: "",
    closure_remarks: "",
  });

  const [reopenReason, setReopenReason] = useState("");

  useEffect(() => {
    fetchAudits();
  }, []);

  useEffect(() => {
    fetchFindings();
  }, [page, filters]);

  const fetchAudits = async () => {
    try {
      const data: any = await auditsApi.getAll({ limit: 1000 });
      setAudits(Array.isArray(data.data) ? data.data : []);
    } catch (error: any) {
      toast.error("Failed to load audits");
    }
  };

  const fetchFindings = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(filters.audit_id && { audit_id: filters.audit_id }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
      };
      const data: any = await findingsApi.getAll(params);
      setFindings(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.total || 0);
    } catch (error: any) {
      toast.error(error.message || "Failed to load findings");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (finding?: Finding) => {
    if (finding) {
      setEditingFinding(finding);
      setFormData({
        audit_id: finding.audit_id.toString(),
        description: finding.description,
        category: finding.category,
        root_cause: finding.root_cause || "",
        corrective_action: finding.corrective_action || "",
        responsible_person: finding.responsible_person || "",
        target_date:
          finding.target_date instanceof Date
            ? finding.target_date.toISOString().split("T")[0]
            : finding.target_date,
      });
    } else {
      setEditingFinding(null);
      setFormData({
        audit_id: "",
        description: "",
        category: "Minor",
        root_cause: "",
        corrective_action: "",
        responsible_person: "",
        target_date: "",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingFinding(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        audit_id: parseInt(formData.audit_id),
        root_cause: formData.root_cause || null,
        corrective_action: formData.corrective_action || null,
        responsible_person: formData.responsible_person || null,
      };

      if (editingFinding) {
        await findingsApi.update(editingFinding.id, payload);
        toast.success("Finding updated successfully");
      } else {
        await findingsApi.create(payload);
        toast.success("Finding created successfully");
      }
      handleCloseModal();
      fetchFindings();
    } catch (error: any) {
      toast.error(error.message || "Failed to save finding");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (finding: Finding) => {
    if (!confirm("Are you sure you want to delete this finding?")) return;

    try {
      await findingsApi.delete(finding.id);
      toast.success("Finding deleted successfully");
      fetchFindings();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete finding");
    }
  };

  const handleOpenCloseModal = (finding: Finding) => {
    setSelectedFinding(finding);
    setCloseData({ corrective_action_taken: "", closure_remarks: "" });
    setCloseModalOpen(true);
  };

  const handleCloseFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;

    setSubmitting(true);
    try {
      await findingsApi.close(selectedFinding.id, closeData);
      toast.success("Finding closed successfully");
      setCloseModalOpen(false);
      fetchFindings();
    } catch (error: any) {
      toast.error(error.message || "Failed to close finding");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReopenModal = (finding: Finding) => {
    setSelectedFinding(finding);
    setReopenReason("");
    setReopenModalOpen(true);
  };

  const handleReopenFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;

    setSubmitting(true);
    try {
      await findingsApi.reopen(selectedFinding.id, reopenReason);
      toast.success("Finding reopened successfully");
      setReopenModalOpen(false);
      fetchFindings();
    } catch (error: any) {
      toast.error(error.message || "Failed to reopen finding");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ audit_id: "", category: "", status: "" });
    setPage(1);
  };

  const handleOpenDetailModal = (finding: FindingWithDetails) => {
    setViewingFinding(finding);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setViewingFinding(null);
  };

  const canEdit = hasRole(["Admin", "Auditor"]);

  const columns = [
    {
      key: "audit_reference",
      title: "Audit Ref",
      className: "w-32",
      render: (value: string) => (
        <span className="font-medium text-blue-600">{value || "-"}</span>
      ),
    },
    {
      key: "vessel_name",
      title: "Vessel",
      className: "w-40",
      render: (value: string) => value || "-",
    },
    {
      key: "description",
      title: "Description",
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: "category",
      title: "Category",
      className: "w-32",
      render: (value: string) => (
        <Badge variant={CATEGORY_VARIANTS[value] || "default"}>{value}</Badge>
      ),
    },
    {
      key: "status",
      title: "Status",
      className: "w-28",
      render: (value: string) => (
        <Badge variant={STATUS_VARIANTS[value] || "default"}>{value}</Badge>
      ),
    },
    {
      key: "target_date",
      title: "Target Date",
      className: "w-32",
      render: (value: string) =>
        value ? format(new Date(value), "MMM dd, yyyy") : "-",
    },
    {
      key: "actions",
      title: "Actions",
      className: "w-44",
      render: (_: any, finding: FindingWithDetails) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenDetailModal(finding)}
            className="text-purple-600 hover:text-purple-800"
            title="View Details"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          {canEdit && (
            <>
              {finding.status === "Open" || finding.status === "Overdue" ? (
                <button
                  onClick={() => handleOpenCloseModal(finding)}
                  className="text-green-600 hover:text-green-800"
                  title="Close"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={() => handleOpenReopenModal(finding)}
                  className="text-orange-600 hover:text-orange-800"
                  title="Reopen"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => handleDelete(finding)}
                className="text-red-600 hover:text-red-800"
                title="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                All Findings
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                View and manage findings from all audits across different
                vessels
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <FunnelIcon className="h-5 w-5" />
                Filters
              </Button>
              {canEdit && (
                <Button onClick={() => handleOpenModal()}>
                  <PlusIcon className="h-5 w-5" />
                  Add Finding
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          {filterOpen && (
            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Audit"
                  value={filters.audit_id}
                  onChange={(e) =>
                    handleFilterChange("audit_id", e.target.value)
                  }
                  options={audits.map((a) => ({
                    value: a.id,
                    label: a.audit_reference
                      ? `${a.audit_reference} - ${a.vessel_name || "Unknown Vessel"}`
                      : `Audit #${a.id} - ${format(new Date(a.audit_start_date), "MMM dd, yyyy")}`,
                  }))}
                />
                <Select
                  label="Category"
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  options={[
                    { value: "Observation", label: "Observation" },
                    { value: "Minor", label: "Minor" },
                    { value: "Major", label: "Major" },
                  ]}
                />
                <Select
                  label="Status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  options={[
                    { value: "Open", label: "Open" },
                    { value: "Closed", label: "Closed" },
                    { value: "Overdue", label: "Overdue" },
                  ]}
                />
              </div>
              <div className="mt-4">
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </Card>
          )}

          {/* Table Card */}
          <Card>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <Table
                  columns={columns}
                  data={findings}
                  emptyMessage="No findings found. Click 'Add Finding' to create one."
                />
                {totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={10}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </Card>
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingFinding ? "Edit Finding" : "Add Finding"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Audit"
              value={formData.audit_id}
              onChange={(e) =>
                setFormData({ ...formData, audit_id: e.target.value })
              }
              options={audits.map((a) => ({
                value: a.id,
                label: a.audit_reference
                  ? `${a.audit_reference} - ${a.vessel_name || "Unknown Vessel"}`
                  : `Audit #${a.id} - ${format(new Date(a.audit_start_date), "MMM dd, yyyy")}`,
              }))}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">
                  (minimum 10 characters)
                </span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe the finding in detail (at least 10 characters)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                minLength={10}
                required
              />
              {formData.description.length > 0 &&
                formData.description.length < 10 && (
                  <p className="text-xs text-red-500 mt-1">
                    {10 - formData.description.length} more characters required
                  </p>
                )}
            </div>

            <Select
              label="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              options={[
                { value: "Observation", label: "Observation" },
                { value: "Minor", label: "Minor" },
                { value: "Major", label: "Major" },
              ]}
              required
            />

            {editingFinding && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Root Cause
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Enter root cause analysis (optional)"
                    value={formData.root_cause}
                    onChange={(e) =>
                      setFormData({ ...formData, root_cause: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corrective Action
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Enter required corrective action (optional)"
                    value={formData.corrective_action}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        corrective_action: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}

            <Input
              label="Responsible Person"
              placeholder="Enter responsible person (optional)"
              value={formData.responsible_person}
              onChange={(e) =>
                setFormData({ ...formData, responsible_person: e.target.value })
              }
            />

            <Input
              type="date"
              label="Target Date"
              value={formData.target_date}
              onChange={(e) =>
                setFormData({ ...formData, target_date: e.target.value })
              }
              required
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                {editingFinding ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Close Finding Modal */}
        <Modal
          isOpen={closeModalOpen}
          onClose={() => setCloseModalOpen(false)}
          title="Close Finding"
        >
          <form onSubmit={handleCloseFinding} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Corrective Action Taken <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe the corrective action taken"
                value={closeData.corrective_action_taken}
                onChange={(e) =>
                  setCloseData({
                    ...closeData,
                    corrective_action_taken: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Closure Remarks
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Enter closure remarks (optional)"
                value={closeData.closure_remarks}
                onChange={(e) =>
                  setCloseData({
                    ...closeData,
                    closure_remarks: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCloseModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="success" loading={submitting}>
                Close Finding
              </Button>
            </div>
          </form>
        </Modal>

        {/* Reopen Finding Modal */}
        <Modal
          isOpen={reopenModalOpen}
          onClose={() => setReopenModalOpen(false)}
          title="Reopen Finding"
        >
          <form onSubmit={handleReopenFinding} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Reopening <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Explain why this finding is being reopened"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReopenModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="warning" loading={submitting}>
                Reopen Finding
              </Button>
            </div>
          </form>
        </Modal>

        {/* Finding Detail Modal with Evidence */}
        {viewingFinding && (
          <FindingDetailModal
            isOpen={detailModalOpen}
            onClose={handleCloseDetailModal}
            finding={viewingFinding}
            onUpdate={fetchFindings}
            canEdit={canEdit}
          />
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
