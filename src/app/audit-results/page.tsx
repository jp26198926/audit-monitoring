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
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { AuditResultType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function AuditResultsPage() {
  const [auditResults, setAuditResults] = useState<AuditResultType[]>([]);
  const [filteredResults, setFilteredResults] = useState<AuditResultType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<AuditResultType | null>(
    null,
  );
  const [formData, setFormData] = useState({
    result_name: "",
    description: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = useAuth();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({
    result_name: "",
    description: "",
    is_active: "",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchAuditResults();
  }, []);

  useEffect(() => {
    filterResults();
  }, [auditResults, searchQuery, advancedFilters, currentPage]);

  const fetchAuditResults = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/audit-results");
      const data = await response.json();
      setAuditResults(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load audit results");
    } finally {
      setLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = [...auditResults];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        (result) =>
          result.result_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (result.description &&
            result.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase())),
      );
    }

    // Apply advanced filters
    if (advancedFilters.result_name) {
      filtered = filtered.filter((result) =>
        result.result_name
          .toLowerCase()
          .includes(advancedFilters.result_name.toLowerCase()),
      );
    }
    if (advancedFilters.description) {
      filtered = filtered.filter((result) =>
        result.description
          ?.toLowerCase()
          .includes(advancedFilters.description.toLowerCase()),
      );
    }
    if (advancedFilters.is_active) {
      filtered = filtered.filter(
        (result) => result.is_active === (advancedFilters.is_active === "true"),
      );
    }

    setFilteredResults(filtered);
  };

  const handleExport = () => {
    try {
      const headers = ["ID", "Result Name", "Description", "Active"];
      const csvContent = [
        headers.join(","),
        ...filteredResults.map((result) =>
          [
            result.id,
            `"${result.result_name}"`,
            `"${result.description || ""}"`,
            result.is_active ? "Yes" : "No",
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `audit_results_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Audit results exported successfully");
    } catch (error) {
      toast.error("Failed to export audit results");
    }
  };

  const handleAdvancedSearch = () => {
    setAdvancedSearchOpen(false);
    setCurrentPage(1);
    toast.success("Advanced filters applied");
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({
      result_name: "",
      description: "",
      is_active: "",
    });
    setCurrentPage(1);
  };

  const handleOpenModal = (result?: AuditResultType) => {
    if (result) {
      setEditingResult(result);
      setFormData({
        result_name: result.result_name,
        description: result.description || "",
        is_active: result.is_active,
      });
    } else {
      setEditingResult(null);
      setFormData({ result_name: "", description: "", is_active: true });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingResult
        ? `/api/audit-results/${editingResult.id}`
        : "/api/audit-results";

      const method = editingResult ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Operation failed");
      }

      toast.success(
        editingResult
          ? "Audit result updated successfully"
          : "Audit result created successfully",
      );
      handleCloseModal();
      fetchAuditResults();
    } catch (error: any) {
      toast.error(error.message || "Failed to save audit result");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (result: AuditResultType) => {
    if (!confirm(`Are you sure you want to delete "${result.result_name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/audit-results/${result.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete audit result");
      }

      toast.success("Audit result deleted successfully");
      fetchAuditResults();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete audit result");
    }
  };

  const canEdit = hasRole(["Admin"]);

  const columns = [
    {
      key: "id",
      title: "ID",
      className: "w-20",
    },
    {
      key: "result_name",
      title: "Result Name",
      className: "font-medium",
    },
    {
      key: "description",
      title: "Description",
      render: (value: string | null) => value || "-",
    },
    {
      key: "is_active",
      title: "Status",
      className: "w-32",
      render: (value: boolean) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      className: "w-32",
      render: (_: any, result: AuditResultType) =>
        canEdit ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenModal(result)}
              className="text-blue-600 hover:text-blue-800"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDelete(result)}
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Audit Results
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage audit result types
              </p>
            </div>
            {canEdit && (
              <Button onClick={() => handleOpenModal()}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Result
              </Button>
            )}
          </div>

          {/* Search and Actions Bar */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search by result name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setAdvancedSearchOpen(true)}
                  className="whitespace-nowrap"
                >
                  <FunnelIcon className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Advanced Search</span>
                  <span className="sm:hidden">Filter</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExport}
                  className="whitespace-nowrap"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table
                    columns={columns}
                    data={paginatedResults}
                    emptyMessage="No audit results found."
                  />
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredResults.length}
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
          title={editingResult ? "Edit Audit Result" : "Add Audit Result"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Result Name"
              value={formData.result_name}
              onChange={(e) =>
                setFormData({ ...formData, result_name: e.target.value })
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
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Active
              </label>
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
                {editingResult ? "Update" : "Create"}
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
              label="Result Name"
              value={advancedFilters.result_name}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  result_name: e.target.value,
                })
              }
            />

            <Input
              label="Description"
              value={advancedFilters.description}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  description: e.target.value,
                })
              }
            />

            <Select
              label="Status"
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

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClearAdvancedFilters}
              >
                Clear
              </Button>
              <Button onClick={handleAdvancedSearch}>Apply Filters</Button>
            </div>
          </div>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}
