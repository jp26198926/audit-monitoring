"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Badge from "@/components/ui/Badge";
import { auditPartiesApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import { AuditParty } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function AuditPartiesPage() {
  const [auditParties, setAuditParties] = useState<AuditParty[]>([]);
  const [filteredParties, setFilteredParties] = useState<AuditParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<AuditParty | null>(null);
  const [formData, setFormData] = useState({ party_name: "" });
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({
    party_name: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    fetchAuditParties();
  }, [showDeleted]);

  useEffect(() => {
    filterParties();
  }, [auditParties, searchQuery, advancedFilters, currentPage]);

  const fetchAuditParties = async () => {
    try {
      setLoading(true);
      const data: any = await auditPartiesApi.getAll(showDeleted);
      setAuditParties(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load audit parties");
    } finally {
      setLoading(false);
    }
  };

  const filterParties = () => {
    let filtered = [...auditParties];

    if (searchQuery) {
      filtered = filtered.filter((party) =>
        party.party_name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (advancedFilters.party_name) {
      filtered = filtered.filter((party) =>
        party.party_name
          .toLowerCase()
          .includes(advancedFilters.party_name.toLowerCase()),
      );
    }

    setFilteredParties(filtered);
  };

  const handleExport = () => {
    try {
      const headers = ["ID", "Party Name"];
      const csvContent = [
        headers.join(","),
        ...filteredParties.map((party) =>
          [party.id, `"${party.party_name}"`].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `audit_parties_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Audit parties exported successfully");
    } catch (error) {
      toast.error("Failed to export audit parties");
    }
  };

  const handleAdvancedSearch = () => {
    setAdvancedSearchOpen(false);
    setCurrentPage(1);
    toast.success("Advanced filters applied");
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({ party_name: "" });
    setCurrentPage(1);
  };

  const handleOpenModal = (party?: AuditParty) => {
    if (party) {
      setEditingParty(party);
      setFormData({ party_name: party.party_name });
    } else {
      setEditingParty(null);
      setFormData({ party_name: "" });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingParty(null);
    setFormData({ party_name: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingParty) {
        await auditPartiesApi.update(editingParty.id, formData);
        toast.success("Audit party updated successfully");
      } else {
        await auditPartiesApi.create(formData);
        toast.success("Audit party created successfully");
      }
      handleCloseModal();
      fetchAuditParties();
    } catch (error: any) {
      toast.error(error.message || "Failed to save audit party");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (party: AuditParty) => {
    if (!confirm(`Are you sure you want to delete ${party.party_name}?`))
      return;

    try {
      await auditPartiesApi.delete(party.id);
      toast.success("Audit party deleted successfully");
      fetchAuditParties();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete audit party");
    }
  };

  const handleRestore = async (party: AuditParty) => {
    if (!confirm(`Are you sure you want to restore ${party.party_name}?`))
      return;

    try {
      await auditPartiesApi.restore(party.id);
      toast.success("Audit party restored successfully");
      fetchAuditParties();
    } catch (error: any) {
      toast.error(error.message || "Failed to restore audit party");
    }
  };

  const canEdit = hasRole(["Admin", "Encoder"]);
  const canDelete = hasRole(["Admin"]);

  const totalPages = Math.ceil(filteredParties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedParties = filteredParties.slice(startIndex, endIndex);

  const columns = [
    {
      key: "id",
      title: "ID",
      className: "w-16",
    },
    {
      key: "party_name",
      title: "Name",
      render: (value: string, party: AuditParty) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          {party.deleted_at && (
            <Badge variant="danger" size="sm">
              Deleted
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      className: "w-32",
      render: (_: any, party: AuditParty) => (
        <div className="flex gap-2">
          {party.deleted_at ? (
            canDelete && (
              <button
                onClick={() => handleRestore(party)}
                className="text-green-600 hover:text-green-800"
                title="Restore"
              >
                <ArrowUturnLeftIcon className="h-5 w-5" />
              </button>
            )
          ) : (
            <>
              {canEdit && (
                <button
                  onClick={() => handleOpenModal(party)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(party)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </>
          )}
          {!canEdit && !canDelete && <span className="text-gray-400">-</span>}
        </div>
      ),
    },
  ];

  const getRowClassName = (party: AuditParty) => {
    return party.deleted_at ? "bg-gray-100" : "";
  };

  return (
    <ProtectedRoute allowedRoles={["Admin", "Encoder"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Audit Parties
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage audit parties and organizations
              </p>
            </div>
            <div className="flex gap-2">
              {canDelete && (
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleted(!showDeleted)}
                >
                  {showDeleted ? "Hide Deleted" : "Show Deleted"}
                </Button>
              )}
              {canEdit && (
                <Button onClick={() => handleOpenModal()}>
                  <PlusIcon className="h-5 w-5" />
                  Add Party
                </Button>
              )}
            </div>
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
                  placeholder="Search audit parties..."
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
                  disabled={filteredParties.length === 0}
                  className="whitespace-nowrap"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>

            {advancedFilters.party_name && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  Name: {advancedFilters.party_name}
                </span>
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
                  data={paginatedParties}
                  emptyMessage="No audit parties found. Click 'Add Party' to create one."
                  getRowClassName={getRowClassName}
                />
                {filteredParties.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredParties.length}
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
          title={editingParty ? "Edit Audit Party" : "Add Audit Party"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              placeholder="Enter audit party name"
              value={formData.party_name}
              onChange={(e) =>
                setFormData({ ...formData, party_name: e.target.value })
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
                {editingParty ? "Update" : "Create"}
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
              label="Party Name"
              placeholder="Search by party name"
              value={advancedFilters.party_name}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  party_name: e.target.value,
                })
              }
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
