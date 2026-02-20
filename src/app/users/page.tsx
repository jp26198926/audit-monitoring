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
import { usersApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { User } from "@/types";

interface Role {
  id: number;
  name: string;
  description: string;
}

const ROLE_VARIANTS: Record<string, "default" | "info" | "success" | "danger"> =
  {
    Admin: "danger",
    Encoder: "info",
    Viewer: "success",
  };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: undefined as number | undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({
    name: "",
    email: "",
    role: "",
    is_active: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [showDeleted]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, advancedFilters, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data: any = await usersApi.getAll(showDeleted);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data: any = await usersApi.getRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load roles:", error);
      // Don't show error toast as this is not critical for page load
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.role_name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (advancedFilters.name) {
      filtered = filtered.filter((user) =>
        user.name.toLowerCase().includes(advancedFilters.name.toLowerCase()),
      );
    }
    if (advancedFilters.email) {
      filtered = filtered.filter((user) =>
        user.email.toLowerCase().includes(advancedFilters.email.toLowerCase()),
      );
    }
    if (advancedFilters.role) {
      filtered = filtered.filter(
        (user) => user.role_name === advancedFilters.role,
      );
    }
    if (advancedFilters.is_active) {
      filtered = filtered.filter(
        (user) => user.is_active === (advancedFilters.is_active === "true"),
      );
    }

    setFilteredUsers(filtered);
  };

  const handleExport = () => {
    try {
      const headers = ["ID", "Name", "Email", "Role", "Active"];
      const csvContent = [
        headers.join(","),
        ...filteredUsers.map((user) =>
          [
            user.id,
            `"${user.name}"`,
            `"${user.email}"`,
            user.role_name,
            user.is_active ? "Yes" : "No",
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `users_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Users exported successfully");
    } catch (error) {
      toast.error("Failed to export users");
    }
  };

  const handleAdvancedSearch = () => {
    setAdvancedSearchOpen(false);
    setCurrentPage(1);
    toast.success("Advanced filters applied");
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({
      name: "",
      email: "",
      role: "",
      is_active: "",
    });
    setCurrentPage(1);
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        role_id: user.role_id,
      });
    } else {
      setEditingUser(null);
      // Default to Viewer role if available
      const viewerRole = roles.find((r) => r.name === "Viewer");
      setFormData({
        name: "",
        email: "",
        password: "",
        role_id: viewerRole?.id,
      });
    }
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    const viewerRole = roles.find((r) => r.name === "Viewer");
    setFormData({
      name: "",
      email: "",
      password: "",
      role_id: viewerRole?.id,
    });
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role_id: formData.role_id,
      };

      // Only include password if it's provided
      if (formData.password) {
        payload.password = formData.password;
      } else if (!editingUser) {
        toast.error("Password is required for new users");
        setSubmitting(false);
        return;
      }

      if (editingUser) {
        await usersApi.update(editingUser.id, payload);
        toast.success("User updated successfully");
      } else {
        await usersApi.create(payload);
        toast.success("User created successfully");
      }
      handleCloseModal();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    try {
      await usersApi.delete(user.id);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleRestore = async (user: User) => {
    if (!confirm(`Are you sure you want to restore ${user.name}?`)) return;

    try {
      await usersApi.restore(user.id);
      toast.success("User restored successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to restore user");
    }
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const columns = [
    {
      key: "id",
      title: "ID",
      className: "w-16",
    },
    {
      key: "name",
      title: "Name",
      render: (_: any, user: User) => (
        <div className="flex items-center gap-2">
          <span className={user.deleted_at ? "text-gray-400 line-through" : ""}>
            {user.name}
          </span>
          {user.deleted_at && <Badge variant="danger">Deleted</Badge>}
        </div>
      ),
    },
    {
      key: "email",
      title: "Email",
    },
    {
      key: "role",
      title: "Role",
      render: (value: string) => (
        <Badge variant={ROLE_VARIANTS[value] || "default"}>{value}</Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      className: "w-32",
      render: (_: any, user: User) => (
        <div className="flex gap-2">
          {user.deleted_at ? (
            <button
              onClick={() => handleRestore(user)}
              className="text-green-600 hover:text-green-800"
              title="Restore user"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => handleOpenModal(user)}
                className="text-blue-600 hover:text-blue-800"
                title="Edit user"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDelete(user)}
                className="text-red-600 hover:text-red-800"
                title="Delete user"
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
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Users
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage system users and their roles
              </p>
            </div>
            <Button onClick={() => handleOpenModal()}>
              <PlusIcon className="h-5 w-5" />
              Add User
            </Button>
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
                  placeholder="Search users..."
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
                  variant={showDeleted ? "primary" : "secondary"}
                  onClick={() => setShowDeleted(!showDeleted)}
                  className="whitespace-nowrap"
                  title={
                    showDeleted ? "Hide deleted users" : "Show deleted users"
                  }
                >
                  <TrashIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">
                    {showDeleted ? "Hide Deleted" : "Show Deleted"}
                  </span>
                </Button>
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
                  disabled={filteredUsers.length === 0}
                  className="whitespace-nowrap"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>

            {(advancedFilters.name ||
              advancedFilters.email ||
              advancedFilters.role ||
              advancedFilters.is_active) && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {advancedFilters.name && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Name: {advancedFilters.name}
                  </span>
                )}
                {advancedFilters.email && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Email: {advancedFilters.email}
                  </span>
                )}
                {advancedFilters.role && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Role: {advancedFilters.role}
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
                  data={paginatedUsers}
                  emptyMessage="No users found. Click 'Add User' to create one."
                />
                {filteredUsers.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredUsers.length}
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
          title={editingUser ? "Edit User" : "Add User"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

            <Input
              type="email"
              label="Email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                label={
                  editingUser
                    ? "Password (leave empty to keep current)"
                    : "Password"
                }
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required={!editingUser}
                helperText={
                  editingUser
                    ? "Leave empty to keep the current password"
                    : "Minimum 6 characters"
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <Select
              label="Role"
              value={formData.role_id?.toString() || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role_id: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              options={roles.map((role) => ({
                value: role.id.toString(),
                label: `${role.name}${role.description ? ` - ${role.description}` : ""}`,
              }))}
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
                {editingUser ? "Update" : "Create"}
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
              label="Name"
              placeholder="Search by name"
              value={advancedFilters.name}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  name: e.target.value,
                })
              }
            />

            <Input
              label="Email"
              placeholder="Search by email"
              value={advancedFilters.email}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  email: e.target.value,
                })
              }
            />

            <Select
              label="Role"
              value={advancedFilters.role}
              onChange={(e) =>
                setAdvancedFilters({
                  ...advancedFilters,
                  role: e.target.value,
                })
              }
              options={[
                { value: "", label: "All Roles" },
                ...roles.map((role) => ({
                  value: role.name,
                  label: role.name,
                })),
              ]}
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
