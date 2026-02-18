"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  auditsApi,
  vesselsApi,
  auditTypesApi,
  auditPartiesApi,
} from "@/lib/api";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { Audit, Vessel, AuditType, AuditParty, AuditResultType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

// Extended Audit type with joined fields from API
interface AuditWithDetails extends Audit {
  vessel_name?: string;
  registration_number?: string;
  audit_type_name?: string;
  audit_party_name?: string;
  result_name?: string;
  created_by_name?: string;
  findings_count?: number;
}

const STATUS_VARIANTS: Record<
  string,
  "default" | "info" | "warning" | "success"
> = {
  Scheduled: "info",
  "In Progress": "warning",
  Completed: "success",
  Cancelled: "default",
};

export default function AuditsPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<AuditWithDetails[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [auditTypes, setAuditTypes] = useState<AuditType[]>([]);
  const [auditParties, setAuditParties] = useState<AuditParty[]>([]);
  const [auditResults, setAuditResults] = useState<AuditResultType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<AuditWithDetails | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = useAuth();

  // Search and filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAudits, setFilteredAudits] = useState<AuditWithDetails[]>([]);

  // Pagination and filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    vessel_id: "",
    audit_type_id: "",
    status: "",
  });

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form data
  const [formData, setFormData] = useState({
    vessel_id: "",
    audit_type_id: "",
    audit_party_id: "",
    audit_reference: "",
    audit_start_date: "",
    audit_end_date: "",
    next_due_date: "",
    status: "Planned",
    audit_result_id: "",
    remarks: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAudits();
  }, [page, filters]);

  // Filter audits based on search query
  useEffect(() => {
    filterAudits();
  }, [audits, searchQuery]);

  const filterAudits = () => {
    let filtered = [...audits];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (audit) =>
          audit.audit_reference?.toLowerCase().includes(query) ||
          audit.vessel_name?.toLowerCase().includes(query) ||
          audit.audit_type_name?.toLowerCase().includes(query) ||
          audit.status?.toLowerCase().includes(query),
      );
    }

    setFilteredAudits(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const fetchInitialData = async () => {
    try {
      const [vesselsData, typesData, partiesData, resultsData]: any[] =
        await Promise.all([
          vesselsApi.getAll(),
          auditTypesApi.getAll(),
          auditPartiesApi.getAll(),
          fetch("/api/audit-results?active=true").then((res) => res.json()),
        ]);
      setVessels(Array.isArray(vesselsData) ? vesselsData : []);
      setAuditTypes(Array.isArray(typesData) ? typesData : []);
      setAuditParties(Array.isArray(partiesData) ? partiesData : []);
      setAuditResults(Array.isArray(resultsData) ? resultsData : []);
    } catch (error: any) {
      toast.error("Failed to load initial data");
    }
  };

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(filters.vessel_id && { vessel_id: filters.vessel_id }),
        ...(filters.audit_type_id && { audit_type_id: filters.audit_type_id }),
        ...(filters.status && { status: filters.status }),
      };
      const data: any = await auditsApi.getAll(params);
      setAudits(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.total || 0);
    } catch (error: any) {
      toast.error(error.message || "Failed to load audits");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (audit?: AuditWithDetails) => {
    if (audit) {
      setEditingAudit(audit);
      setFormData({
        vessel_id: audit.vessel_id.toString(),
        audit_type_id: audit.audit_type_id.toString(),
        audit_party_id: audit.audit_party_id.toString(),
        audit_reference: audit.audit_reference,
        audit_start_date:
          audit.audit_start_date instanceof Date
            ? audit.audit_start_date.toISOString().split("T")[0]
            : audit.audit_start_date,
        audit_end_date: audit.audit_end_date
          ? audit.audit_end_date instanceof Date
            ? audit.audit_end_date.toISOString().split("T")[0]
            : audit.audit_end_date
          : "",
        next_due_date: audit.next_due_date
          ? audit.next_due_date instanceof Date
            ? audit.next_due_date.toISOString().split("T")[0]
            : audit.next_due_date
          : "",
        status: audit.status,
        audit_result_id: audit.audit_result_id
          ? audit.audit_result_id.toString()
          : "",
        remarks: audit.remarks || "",
      });
    } else {
      setEditingAudit(null);
      setFormData({
        vessel_id: "",
        audit_type_id: "",
        audit_party_id: "",
        audit_reference: "",
        audit_start_date: "",
        audit_end_date: "",
        next_due_date: "",
        status: "Planned",
        audit_result_id: "",
        remarks: "",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAudit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        vessel_id: parseInt(formData.vessel_id),
        audit_type_id: parseInt(formData.audit_type_id),
        audit_party_id: parseInt(formData.audit_party_id),
        audit_end_date: formData.audit_end_date || null,
        next_due_date: formData.next_due_date || null,
        audit_result_id: formData.audit_result_id
          ? parseInt(formData.audit_result_id)
          : null,
        remarks: formData.remarks || null,
      };

      // Remove audit_reference from payload when creating (it's auto-generated)
      if (!editingAudit) {
        delete (payload as any).audit_reference;
      }

      if (editingAudit) {
        await auditsApi.update(editingAudit.id, payload);
        toast.success("Audit updated successfully");
      } else {
        await auditsApi.create(payload);
        toast.success("Audit created successfully");
      }
      handleCloseModal();
      fetchAudits();
    } catch (error: any) {
      toast.error(error.message || "Failed to save audit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (audit: AuditWithDetails) => {
    if (!confirm("Are you sure you want to delete this audit?")) return;

    try {
      await auditsApi.delete(audit.id);
      toast.success("Audit deleted successfully");
      fetchAudits();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete audit");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({ vessel_id: "", audit_type_id: "", status: "" });
    setPage(1);
  };

  const handleExport = () => {
    try {
      // Prepare CSV data
      const headers = [
        "Reference #",
        "Vessel",
        "Audit Type",
        "Audit Party",
        "Start Date",
        "End Date",
        "Next Audit Date",
        "Status",
        "Result",
        "Location",
        "Remarks",
      ];

      const rows = filteredAudits.map((audit) => [
        audit.audit_reference || "",
        audit.vessel_name || "",
        audit.audit_type_name || "",
        audit.audit_party_name || "",
        audit.audit_start_date
          ? format(new Date(audit.audit_start_date), "yyyy-MM-dd")
          : "",
        audit.audit_end_date
          ? format(new Date(audit.audit_end_date), "yyyy-MM-dd")
          : "",
        audit.next_due_date
          ? format(new Date(audit.next_due_date), "yyyy-MM-dd")
          : "",
        audit.status || "",
        audit.result_name || "",
        audit.location || "",
        audit.remarks || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => `"${cell.toString().replace(/"/g, '""')}"`)
            .join(","),
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `audits_export_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${filteredAudits.length} audits to CSV`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const canEdit = hasRole(["Admin", "Auditor"]);

  const columns = [
    {
      key: "audit_reference",
      title: "Reference #",
      className: "font-medium text-blue-600",
    },
    {
      key: "vessel_name",
      title: "Vessel",
    },
    {
      key: "audit_type_name",
      title: "Type",
    },
    {
      key: "audit_start_date",
      title: "Start Date",
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "audit_end_date",
      title: "End Date",
      render: (value: string | null) =>
        value ? format(new Date(value), "MMM dd, yyyy") : "-",
    },
    {
      key: "next_due_date",
      title: "Next Audit Date",
      render: (value: string | null) =>
        value ? format(new Date(value), "MMM dd, yyyy") : "-",
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => (
        <Badge variant={STATUS_VARIANTS[value] || "default"}>{value}</Badge>
      ),
    },
    {
      key: "result_name",
      title: "Result",
      render: (value: string | null) => value || "-",
    },
    {
      key: "actions",
      title: "Actions",
      className: "w-40",
      render: (_: any, audit: AuditWithDetails) => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/audits/${audit.id}`)}
            className="text-green-600 hover:text-green-800"
            title="View Details"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          {canEdit && (
            <>
              <button
                onClick={() => handleOpenModal(audit)}
                className="text-blue-600 hover:text-blue-800"
                title="Edit"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDelete(audit)}
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

  // Pagination calculations
  const totalFilteredPages = Math.ceil(filteredAudits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAudits = filteredAudits.slice(startIndex, endIndex);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Audits
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage vessel audits and inspections
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
                  Add Audit
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          {filterOpen && (
            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Vessel"
                  value={filters.vessel_id}
                  onChange={(e) =>
                    handleFilterChange("vessel_id", e.target.value)
                  }
                  options={vessels.map((v) => ({
                    value: v.id,
                    label: v.vessel_name,
                  }))}
                />
                <Select
                  label="Audit Type"
                  value={filters.audit_type_id}
                  onChange={(e) =>
                    handleFilterChange("audit_type_id", e.target.value)
                  }
                  options={auditTypes.map((t) => ({
                    value: t.id,
                    label: t.type_name,
                  }))}
                />
                <Select
                  label="Status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  options={[
                    { value: "Planned", label: "Planned" },
                    { value: "Ongoing", label: "Ongoing" },
                    { value: "Completed", label: "Completed" },
                    { value: "Closed", label: "Closed" },
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

          {/* Search and Export Bar */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              {/* Search Input */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by reference #, vessel, type, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Export Button */}
              <Button
                variant="secondary"
                onClick={handleExport}
                disabled={filteredAudits.length === 0}
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </Card>

          {/* Table Card */}
          <Card>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <Table
                  columns={columns}
                  data={paginatedAudits}
                  emptyMessage="No audits found. Click 'Add Audit' to create one."
                />
                {totalFilteredPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalFilteredPages}
                    totalItems={filteredAudits.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
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
          title={editingAudit ? "Edit Audit" : "Add Audit"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Vessel"
                value={formData.vessel_id}
                onChange={(e) =>
                  setFormData({ ...formData, vessel_id: e.target.value })
                }
                options={vessels.map((v) => ({
                  value: v.id,
                  label: v.vessel_name,
                }))}
                required
              />

              <Select
                label="Audit Type"
                value={formData.audit_type_id}
                onChange={(e) =>
                  setFormData({ ...formData, audit_type_id: e.target.value })
                }
                options={auditTypes.map((t) => ({
                  value: t.id,
                  label: t.type_name,
                }))}
                required
              />

              <Select
                label="Audit Party"
                value={formData.audit_party_id}
                onChange={(e) =>
                  setFormData({ ...formData, audit_party_id: e.target.value })
                }
                options={auditParties.map((p) => ({
                  value: p.id,
                  label: p.party_name,
                }))}
                required
              />

              {editingAudit && (
                <Input
                  label="Audit Reference"
                  value={formData.audit_reference}
                  disabled
                  className="bg-gray-50"
                  helperText="Auto-generated reference number"
                />
              )}

              <Select
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                options={[
                  { value: "Planned", label: "Planned" },
                  { value: "Ongoing", label: "Ongoing" },
                  { value: "Completed", label: "Completed" },
                  { value: "Closed", label: "Closed" },
                ]}
                required
              />

              <Select
                label="Result"
                value={formData.audit_result_id}
                onChange={(e) =>
                  setFormData({ ...formData, audit_result_id: e.target.value })
                }
                options={auditResults.map((r) => ({
                  value: r.id,
                  label: r.result_name,
                }))}
              />

              <Input
                type="date"
                label="Start Date"
                value={formData.audit_start_date}
                onChange={(e) =>
                  setFormData({ ...formData, audit_start_date: e.target.value })
                }
                required
              />

              <Input
                type="date"
                label="End Date"
                value={formData.audit_end_date}
                onChange={(e) =>
                  setFormData({ ...formData, audit_end_date: e.target.value })
                }
              />

              <Input
                type="date"
                label="Next Audit Date"
                value={formData.next_due_date}
                onChange={(e) =>
                  setFormData({ ...formData, next_due_date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter remarks (optional)"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
              />
            </div>

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
                {editingAudit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}
