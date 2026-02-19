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
import { auditorsApi, auditCompaniesApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { Auditor, AuditCompany } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface AuditorWithCompany extends Auditor {
  company_name?: string;
}

export default function AuditorsPage() {
  const [auditors, setAuditors] = useState<AuditorWithCompany[]>([]);
  const [companies, setCompanies] = useState<AuditCompany[]>([]);
  const [filteredAuditors, setFilteredAuditors] = useState<
    AuditorWithCompany[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuditor, setEditingAuditor] =
    useState<AuditorWithCompany | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    audit_company_id: "",
    auditor_name: "",
    certification: "",
    email: "",
    phone: "",
    specialization: "",
    is_active: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterAuditors();
  }, [auditors, searchQuery]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [auditorsData, companiesData]: any = await Promise.all([
        auditorsApi.getAll(),
        auditCompaniesApi.getAll({ active: true }),
      ]);
      setAuditors(Array.isArray(auditorsData) ? auditorsData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filterAuditors = () => {
    let filtered = [...auditors];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (auditor) =>
          auditor.auditor_name.toLowerCase().includes(query) ||
          auditor.company_name?.toLowerCase().includes(query) ||
          auditor.certification?.toLowerCase().includes(query) ||
          auditor.email?.toLowerCase().includes(query),
      );
    }

    setFilteredAuditors(filtered);
  };

  const handleOpenModal = (auditor?: AuditorWithCompany) => {
    if (auditor) {
      setEditingAuditor(auditor);
      setFormData({
        audit_company_id: auditor.audit_company_id.toString(),
        auditor_name: auditor.auditor_name,
        certification: auditor.certification || "",
        email: auditor.email || "",
        phone: auditor.phone || "",
        specialization: auditor.specialization || "",
        is_active: auditor.is_active,
      });
    } else {
      setEditingAuditor(null);
      setFormData({
        audit_company_id: "",
        auditor_name: "",
        certification: "",
        email: "",
        phone: "",
        specialization: "",
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAuditor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        audit_company_id: parseInt(formData.audit_company_id),
        auditor_name: formData.auditor_name,
        certification: formData.certification || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        specialization: formData.specialization || undefined,
        is_active: formData.is_active,
      };

      if (editingAuditor) {
        await auditorsApi.update(editingAuditor.id, payload);
        toast.success("Auditor updated successfully");
      } else {
        await auditorsApi.create(payload);
        toast.success("Auditor created successfully");
      }
      handleCloseModal();
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save auditor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (auditor: AuditorWithCompany) => {
    if (!confirm(`Are you sure you want to delete "${auditor.auditor_name}"?`))
      return;

    try {
      await auditorsApi.delete(auditor.id);
      toast.success("Auditor deleted successfully");
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete auditor");
    }
  };

  const handleExport = () => {
    try {
      const headers = [
        "ID",
        "Auditor Name",
        "Company",
        "Certification",
        "Email",
        "Phone",
        "Specialization",
        "Status",
        "Created At",
      ];
      const csvContent = [
        headers.join(","),
        ...filteredAuditors.map((auditor) =>
          [
            auditor.id,
            `"${auditor.auditor_name}"`,
            `"${auditor.company_name || ""}"`,
            `"${auditor.certification || ""}"`,
            `"${auditor.email || ""}"`,
            `"${auditor.phone || ""}"`,
            `"${auditor.specialization || ""}"`,
            auditor.is_active ? "Active" : "Inactive",
            format(new Date(auditor.created_at), "yyyy-MM-dd"),
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `auditors_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${filteredAuditors.length} auditors to CSV`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const canEdit = hasRole(["Admin", "Encoder"]);
  const canDelete = hasRole(["Admin"]);

  const columns = [
    {
      key: "auditor_name",
      title: "Auditor Name",
      className: "font-medium text-blue-600",
    },
    {
      key: "company_name",
      title: "Company",
      render: (value: string | undefined) => value || "-",
    },
    {
      key: "certification",
      title: "Certification",
      render: (value: string | null) => value || "-",
    },
    {
      key: "specialization",
      title: "Specialization",
      render: (value: string | null) => value || "-",
    },
    {
      key: "email",
      title: "Email",
      render: (value: string | null) => value || "-",
    },
    {
      key: "is_active",
      title: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? "success" : "default"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      className: "w-32",
      render: (_: any, auditor: AuditorWithCompany) => (
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => handleOpenModal(auditor)}
              className="text-blue-600 hover:text-blue-800"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(auditor)}
              className="text-red-600 hover:text-red-800"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
          {!canEdit && !canDelete && <span className="text-gray-400">-</span>}
        </div>
      ),
    },
  ];

  // Pagination calculations
  const totalPages = Math.ceil(filteredAuditors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAuditors = filteredAuditors.slice(startIndex, endIndex);

  return (
    <ProtectedRoute allowedRoles={["Admin", "Encoder"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Auditors
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage auditors and their certifications
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleExport}>
                <ArrowDownTrayIcon className="h-5 w-5" />
                Export
              </Button>
              {canEdit && (
                <Button onClick={() => handleOpenModal()}>
                  <PlusIcon className="h-5 w-5" />
                  Add Auditor
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <Card>
            <div className="p-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search auditors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : paginatedAuditors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No auditors found</p>
                {canEdit && (
                  <Button onClick={() => handleOpenModal()} className="mt-4">
                    <PlusIcon className="h-5 w-5" />
                    Add Your First Auditor
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table columns={columns} data={paginatedAuditors} />
                {totalPages > 1 && (
                  <div className="p-4 border-t">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingAuditor ? "Edit Auditor" : "Add Auditor"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Audit Company"
              value={formData.audit_company_id}
              onChange={(e) =>
                setFormData({ ...formData, audit_company_id: e.target.value })
              }
              options={companies.map((c) => ({
                value: c.id,
                label: c.company_name,
              }))}
              required
            />

            <Input
              label="Auditor Name"
              type="text"
              value={formData.auditor_name}
              onChange={(e) =>
                setFormData({ ...formData, auditor_name: e.target.value })
              }
              required
            />

            <Input
              label="Certification"
              type="text"
              value={formData.certification}
              onChange={(e) =>
                setFormData({ ...formData, certification: e.target.value })
              }
              placeholder="e.g., ISO 9001 Lead Auditor"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <Input
              label="Phone"
              type="text"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />

            <Input
              label="Specialization"
              type="text"
              value={formData.specialization}
              onChange={(e) =>
                setFormData({ ...formData, specialization: e.target.value })
              }
              placeholder="e.g., Quality Management Systems"
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_active"
                className="ml-2 block text-sm text-gray-900"
              >
                Active
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting
                  ? "Saving..."
                  : editingAuditor
                    ? "Update"
                    : "Create"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}
