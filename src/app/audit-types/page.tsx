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
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { auditTypesApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { AuditType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function AuditTypesPage() {
  const [auditTypes, setAuditTypes] = useState<AuditType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<AuditType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [editingType, setEditingType] = useState<AuditType | null>(null);
  const [formData, setFormData] = useState({ type_name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = useAuth();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({
    type_name: "",
    description: "",
    is_active: "",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchAuditTypes();
  }, []);

  useEffect(() => {
    filterTypes();
  }, [auditTypes, searchQuery, advancedFilters, currentPage]);

  const fetchAuditTypes = async () => {
    try {
      setLoading(true);
      const data: any = await auditTypesApi.getAll();
      setAuditTypes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load audit types");
    } finally {
      setLoading(false);
    }
  };

  const filterTypes = () => {
    let filtered = [...auditTypes];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        (type) =>
          type.type_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (type.description &&
            type.description.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    // Apply advanced filters
    if (advancedFilters.type_name) {
      filtered = filtered.filter((type) =>
        type.type_name
          .toLowerCase()
          .includes(advancedFilters.type_name.toLowerCase()),
      );
    }
    if (advancedFilters.description) {
      filtered = filtered.filter((type) =>
        type.description
          ?.toLowerCase()
          .includes(advancedFilters.description.toLowerCase()),
      );
    }
    if (advancedFilters.is_active) {
      filtered = filtered.filter(
        (type) => type.is_active === (advancedFilters.is_active === "true"),
      );
    }

    setFilteredTypes(filtered);
  };

  const handleExport = () => {
    try {
      const headers = ["ID", "Type Name", "Description", "Active"];
      const csvContent = [
        headers.join(","),
        ...filteredTypes.map((type) =>
          [
            type.id,
            `"${type.type_name}"`,
            `"${type.description || ""}"`,
            type.is_active ? "Yes" : "No",
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `audit_types_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Audit types exported successfully");
    } catch (error) {
      toast.error("Failed to export audit types");
    }
  };

  const handleAdvancedSearch = () => {
    setAdvancedSearchOpen(false);
    setCurrentPage(1);
    toast.success("Advanced filters applied");
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({
      type_name: "",
      description: "",
      is_active: "",
    });
    setCurrentPage(1);
  };

  const handleOpenModal = (type?: AuditType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        type_name: type.type_name,
        description: type.description || "",
      });
    } else {
      setEditingType(null);
      setFormData({ type_name: "", description: "" });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingType(null);
    setFormData({ type_name: "", description: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingType) {
        await auditTypesApi.update(editingType.id, formData);
        toast.success("Audit type updated successfully");
      } else {
        await auditTypesApi.create(formData);
        toast.success("Audit type created successfully");
      }
      handleCloseModal();
      fetchAuditTypes();
    } catch (error: any) {
      toast.error(error.message || "Failed to save audit type");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type: AuditType) => {
    if (!confirm(`Are you sure you want to delete ${type.type_name}?`)) return;

    try {
      await auditTypesApi.delete(type.id);
      toast.success("Audit type deleted successfully");
      fetchAuditTypes();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete audit type");
    }
  };

  const canEdit = hasRole(["Admin", "Auditor"]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTypes = filteredTypes.slice(startIndex, endIndex);

  const columns = [
    {
      key: "id",
      title: "ID",
      className: "w-16",
    },
    {
      key: "type_name",
      title: "Name",
    },
    {
      key: "description",
      title: "Description",
      render: (value: string) => value || "-",
    },
    {
      key: "actions",
      title: "Actions",
      className: "w-32",
      render: (_: any, type: AuditType) =>
        canEdit ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenModal(type)}
              className="text-blue-600 hover:text-blue-800"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDelete(type)}
              className="text-red-600 hover:text-red-800"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
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
                Audit Types
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage audit types in the system
              </p>
            </div>
            {canEdit && (
              <Button onClick={() => handleOpenModal()}>
                <PlusIcon className="h-5 w-5" />
                Add Type
              </Button>
            )}
          </div>

          {/* Search and Filter Bar */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search audit types..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setAdvancedSearchOpen(true)}
                  className="whitespace-nowrap"
                >
                  <FunnelIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Advanced Search</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExport}
                  disabled={filteredTypes.length === 0}
                  className="whitespace-nowrap"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>

            {(advancedFilters.type_name ||
              advancedFilters.description ||
              advancedFilters.is_active) && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {advancedFilters.type_name && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Name: {advancedFilters.type_name}
                  </span>
                )}
                {advancedFilters.description && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Desc: {advancedFilters.description}
                  </span>
                )}
                {advancedFilters.is_active && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Active:{" "}
                    {advancedFilters.is_active === "true" ? "Yes" : "No"}
                  </span>
                )}
                <button
                  onClick={handleClearAdvancedFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </Card>

          {/* Table Card */}
          <Card>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <Table
                  columns={columns}
                  data={paginatedTypes}
                  emptyMessage="No audit types found. Click 'Add Type' to create one."
                />
                {filteredTypes.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredTypes.length}
                    itemsPerPage={itemsPerPage}
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
          title={editingType ? "Edit Audit Type" : "Add Audit Type"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              placeholder="Enter audit type name"
              value={formData.type_name}
              onChange={(e) =>
                setFormData({ ...formData, type_name: e.target.value })
              }
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter description (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
                {editingType ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Advanced Search Modal */}
        <Modal
          isOpen={advancedSearchOpen}
          onClose={() => setAdvancedSearchOpen(false)}
          title="Advanced Search"
        >
          <div className="space-y-4">
            <Input
              label="Type Name"
              placeholder="Search by type name"
              value={advancedFilters.type_name}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  type_name: e.target.value,
                })
              }
            />

            <Input
              label="Description"
              placeholder="Search by description"
              value={advancedFilters.description}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  description: e.target.value,
                })
              }
            />

            <Select
              label="Active Status"
              value={advancedFilters.is_active}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  is_active: e.target.value,
                })
              }
              options={[
                { value: "", label: "All" },
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClearAdvancedFilters}
              >
                Clear Filters
              </Button>
              <Button type="button" onClick={handleAdvancedSearch}>
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}
