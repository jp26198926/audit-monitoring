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
import { vesselsApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { Vessel } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function VesselsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [filteredVessels, setFilteredVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [formData, setFormData] = useState({
    vessel_name: "",
    vessel_code: "",
    registration_number: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = useAuth();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({
    vessel_name: "",
    vessel_code: "",
    registration_number: "",
    status: "",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchVessels();
  }, []);

  useEffect(() => {
    filterVessels();
  }, [vessels, searchQuery, advancedFilters, currentPage]);

  const fetchVessels = async () => {
    try {
      setLoading(true);
      const data: any = await vesselsApi.getAll();
      setVessels(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load vessels");
    } finally {
      setLoading(false);
    }
  };

  const filterVessels = () => {
    let filtered = [...vessels];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        (vessel) =>
          vessel.vessel_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          vessel.vessel_code
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (vessel.registration_number &&
            vessel.registration_number
              .toLowerCase()
              .includes(searchQuery.toLowerCase())),
      );
    }

    // Apply advanced filters
    if (advancedFilters.vessel_name) {
      filtered = filtered.filter((vessel) =>
        vessel.vessel_name
          .toLowerCase()
          .includes(advancedFilters.vessel_name.toLowerCase()),
      );
    }
    if (advancedFilters.vessel_code) {
      filtered = filtered.filter((vessel) =>
        vessel.vessel_code
          .toLowerCase()
          .includes(advancedFilters.vessel_code.toLowerCase()),
      );
    }
    if (advancedFilters.registration_number) {
      filtered = filtered.filter((vessel) =>
        vessel.registration_number &&
        vessel.registration_number
          .toLowerCase()
          .includes(advancedFilters.registration_number.toLowerCase()),
      );
    }
    if (advancedFilters.status) {
      filtered = filtered.filter(
        (vessel) => vessel.status === advancedFilters.status,
      );
    }

    setFilteredVessels(filtered);
  };

  const handleExport = () => {
    try {
      // Create CSV content
      const headers = ["ID", "Vessel Name", "Registration Number", "Status"];
      const csvContent = [
        headers.join(","),
        ...filteredVessels.map((vessel) =>
          [
            vessel.id,
            `"${vessel.vessel_name}"`,
            `"${vessel.registration_number}"`,
            vessel.status || "Active",
          ].join(","),
        ),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `vessels_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Vessels exported successfully");
    } catch (error) {
      toast.error("Failed to export vessels");
    }
  };

  const handleAdvancedSearch = () => {
    setAdvancedSearchOpen(false);
    setCurrentPage(1);
    toast.success("Advanced filters applied");
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({
      vessel_name: "",
      vessel_code: "",
      registration_number: "",
      status: "",
    });
    setCurrentPage(1);
  };

  const handleOpenModal = (vessel?: Vessel) => {
    if (vessel) {
      setEditingVessel(vessel);
      setFormData({
        vessel_name: vessel.vessel_name,
        vessel_code: vessel.vessel_code,
        registration_number: vessel.registration_number || "",
      });
    } else {
      setEditingVessel(null);
      setFormData({ vessel_name: "", vessel_code: "", registration_number: "" });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingVessel(null);
    setFormData({ vessel_name: "", vessel_code: "", registration_number: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingVessel) {
        await vesselsApi.update(editingVessel.id, formData);
        toast.success("Vessel updated successfully");
      } else {
        await vesselsApi.create(formData);
        toast.success("Vessel created successfully");
      }
      handleCloseModal();
      fetchVessels();
    } catch (error: any) {
      toast.error(error.message || "Failed to save vessel");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vessel: Vessel) => {
    if (!confirm(`Are you sure you want to delete ${vessel.vessel_name}?`))
      return;

    try {
      await vesselsApi.delete(vessel.id);
      toast.success("Vessel deleted successfully");
      fetchVessels();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete vessel");
    }
  };

  const canEdit = hasRole(["Admin", "Encoder"]);
  const canDelete = hasRole(["Admin"]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredVessels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVessels = filteredVessels.slice(startIndex, endIndex);

  const columns = [
    {
      key: "id",
      title: "ID",
      className: "w-16",
    },
    {
      key: "vessel_name",
      title: "Vessel Name",
    },
    {
      key: "vessel_code",
      title: "Vessel Code",
    },
    {
      key: "registration_number",
      title: "Registration Number",
      render: (value: string | null) => value || "-",
    },
    {
      key: "actions",
      title: "Actions",
      className: "w-32",
      render: (_: any, vessel: Vessel) => (
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => handleOpenModal(vessel)}
              className="text-blue-600 hover:text-blue-800"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(vessel)}
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

  return (
    <ProtectedRoute allowedRoles={["Admin", "Encoder"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Vessels
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage vessels in the system
              </p>
            </div>
            {canEdit && (
              <Button onClick={() => handleOpenModal()}>
                <PlusIcon className="h-5 w-5" />
                Add Vessel
              </Button>
            )}
          </div>

          {/* Search and Filter Bar */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Box */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search vessels..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
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
                  disabled={filteredVessels.length === 0}
                  className="whitespace-nowrap"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(advancedFilters.vessel_name ||
              advancedFilters.vessel_code ||
              advancedFilters.registration_number ||
              advancedFilters.status) && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {advancedFilters.vessel_name && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Vessel: {advancedFilters.vessel_name}
                  </span>
                )}
                {advancedFilters.vessel_code && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Code: {advancedFilters.vessel_code}
                  </span>
                )}
                {advancedFilters.registration_number && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Reg: {advancedFilters.registration_number}
                  </span>
                )}
                {advancedFilters.status && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Status: {advancedFilters.status}
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
                  data={paginatedVessels}
                  emptyMessage="No vessels found. Click 'Add Vessel' to create one."
                />
                {filteredVessels.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredVessels.length}
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
          title={editingVessel ? "Edit Vessel" : "Add Vessel"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Vessel Name"
              placeholder="Enter vessel name"
              value={formData.vessel_name}
              onChange={(e) =>
                setFormData({ ...formData, vessel_name: e.target.value })
              }
              required
            />

            <Input
              label="Vessel Code"
              placeholder="Enter vessel code (e.g., VSL-001)"
              value={formData.vessel_code}
              onChange={(e) =>
                setFormData({ ...formData, vessel_code: e.target.value })
              }
              required
            />

            <Input
              label="Registration Number"
              placeholder="Enter registration number (optional)"
              value={formData.registration_number}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  registration_number: e.target.value,
                })
              }
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
                {editingVessel ? "Update" : "Create"}
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
              label="Vessel Name"
              placeholder="Search by vessel name"
              value={advancedFilters.vessel_name}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  vessel_name: e.target.value,
                })
              }
            />

            <Input
              label="Vessel Code"
              placeholder="Search by vessel code"
              value={advancedFilters.vessel_code}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  vessel_code: e.target.value,
                })
              }
            />

            <Input
              label="Registration Number"
              placeholder="Search by registration number"
              value={advancedFilters.registration_number}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  registration_number: e.target.value,
                })
              }
            />

            <Select
              label="Status"
              value={advancedFilters.status}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  status: e.target.value,
                })
              }
              options={[
                { value: "", label: "All Statuses" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
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
