"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { auditCompaniesApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { AuditCompany } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export default function AuditCompaniesPage() {
  const [auditCompanies, setAuditCompanies] = useState<AuditCompany[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<AuditCompany[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<AuditCompany | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    is_active: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchAuditCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [auditCompanies, searchQuery]);

  const fetchAuditCompanies = async () => {
    try {
      setLoading(true);
      const data: any = await auditCompaniesApi.getAll();
      setAuditCompanies(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load audit companies");
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = [...auditCompanies];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.company_name.toLowerCase().includes(query) ||
          company.contact_person?.toLowerCase().includes(query) ||
          company.email?.toLowerCase().includes(query),
      );
    }

    setFilteredCompanies(filtered);
  };

  const handleOpenModal = (company?: AuditCompany) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        company_name: company.company_name,
        contact_person: company.contact_person || "",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        is_active: company.is_active,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        company_name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCompany(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        contact_person: formData.contact_person || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      };

      if (editingCompany) {
        await auditCompaniesApi.update(editingCompany.id, payload);
        toast.success("Audit company updated successfully");
      } else {
        await auditCompaniesApi.create(payload);
        toast.success("Audit company created successfully");
      }
      handleCloseModal();
      fetchAuditCompanies();
    } catch (error: any) {
      toast.error(error.message || "Failed to save audit company");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (company: AuditCompany) => {
    if (!confirm(`Are you sure you want to delete "${company.company_name}"?`))
      return;

    try {
      await auditCompaniesApi.delete(company.id);
      toast.success("Audit company deleted successfully");
      fetchAuditCompanies();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete audit company");
    }
  };

  const handleExport = () => {
    try {
      const headers = [
        "ID",
        "Company Name",
        "Contact Person",
        "Email",
        "Phone",
        "Address",
        "Status",
        "Created At",
      ];
      const csvContent = [
        headers.join(","),
        ...filteredCompanies.map((company) =>
          [
            company.id,
            `"${company.company_name}"`,
            `"${company.contact_person || ""}"`,
            `"${company.email || ""}"`,
            `"${company.phone || ""}"`,
            `"${company.address || ""}"`,
            company.is_active ? "Active" : "Inactive",
            format(new Date(company.created_at), "yyyy-MM-dd"),
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `audit_companies_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${filteredCompanies.length} companies to CSV`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const canEdit = hasRole(["Admin", "Encoder"]);
  const canDelete = hasRole(["Admin"]);

  const columns = [
    {
      key: "company_name",
      title: "Company Name",
      className: "font-medium text-blue-600",
    },
    {
      key: "contact_person",
      title: "Contact Person",
      render: (value: string | null) => value || "-",
    },
    {
      key: "email",
      title: "Email",
      render: (value: string | null) => value || "-",
    },
    {
      key: "phone",
      title: "Phone",
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
      render: (_: any, company: AuditCompany) => (
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => handleOpenModal(company)}
              className="text-blue-600 hover:text-blue-800"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(company)}
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
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  return (
    <ProtectedRoute allowedRoles={["Admin", "Encoder"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Audit Companies
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage auditing companies and their information
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
                  Add Company
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
                  placeholder="Search companies..."
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
            ) : paginatedCompanies.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No audit companies found</p>
                {canEdit && (
                  <Button onClick={() => handleOpenModal()} className="mt-4">
                    <PlusIcon className="h-5 w-5" />
                    Add Your First Company
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table columns={columns} data={paginatedCompanies} />
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
          title={editingCompany ? "Edit Audit Company" : "Add Audit Company"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Company Name"
              type="text"
              value={formData.company_name}
              onChange={(e) =>
                setFormData({ ...formData, company_name: e.target.value })
              }
              required
            />

            <Input
              label="Contact Person"
              type="text"
              value={formData.contact_person}
              onChange={(e) =>
                setFormData({ ...formData, contact_person: e.target.value })
              }
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

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
                  : editingCompany
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
