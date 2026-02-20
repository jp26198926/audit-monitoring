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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { rolesApi, pagesApi, permissionsApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Role, Page, Permission } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [rolePermissions, setRolePermissions] = useState<{
    [pageId: number]: number[];
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, pagesData, permissionsData]: any = await Promise.all([
        rolesApi.getAll(),
        pagesApi.getAll({ is_active: "true" }),
        permissionsApi.getAll(),
      ]);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setPages(Array.isArray(pagesData) ? pagesData : []);
      setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      is_active: Boolean(role.is_active),
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      await rolesApi.delete(id);
      toast.success("Role deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete role");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, formData);
        toast.success("Role updated successfully");
      } else {
        await rolesApi.create(formData);
        toast.success("Role created successfully");
      }
      setModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save role");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManagePermissions = async (role: Role) => {
    setSelectedRole(role);
    setSubmitting(true);
    try {
      const roleData: any = await rolesApi.getById(role.id);
      // Build rolePermissions object from the fetched data
      const permissionsMap: { [pageId: number]: number[] } = {};
      if (roleData.permissions && Array.isArray(roleData.permissions)) {
        roleData.permissions.forEach((perm: any) => {
          if (!permissionsMap[perm.page_id]) {
            permissionsMap[perm.page_id] = [];
          }
          permissionsMap[perm.page_id].push(perm.permission_id);
        });
      }
      setRolePermissions(permissionsMap);
      setPermissionsModalOpen(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to load role permissions");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePermissionToggle = (pageId: number, permissionId: number) => {
    setRolePermissions((prev) => {
      const pagePerms = prev[pageId] || [];
      const hasPermission = pagePerms.includes(permissionId);

      return {
        ...prev,
        [pageId]: hasPermission
          ? pagePerms.filter((id) => id !== permissionId)
          : [...pagePerms, permissionId],
      };
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    setSubmitting(true);
    try {
      // Convert rolePermissions object to array format
      const permissionsArray: any[] = [];
      Object.entries(rolePermissions).forEach(([pageId, permissionIds]) => {
        permissionIds.forEach((permissionId) => {
          permissionsArray.push({
            page_id: parseInt(pageId),
            permission_id: permissionId,
          });
        });
      });

      await rolesApi.assignPermissions(selectedRole.id, permissionsArray);
      toast.success("Permissions updated successfully");
      setPermissionsModalOpen(false);
      setSelectedRole(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save permissions");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "id", title: "ID" },
    { key: "name", title: "Name" },
    { key: "description", title: "Description" },
    {
      key: "is_active",
      title: "Status",
      render: (value: any, role: Role) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            role.is_active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {role.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      className: "w-48",
      render: (_: any, role: Role) =>
        hasRole(["Admin"]) ? (
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleManagePermissions(role)}
              title="Manage Permissions"
            >
              <ShieldCheckIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleEdit(role)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(role.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
            {hasRole(["Admin"]) && (
              <Button onClick={handleAdd}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Role
              </Button>
            )}
          </div>

          <Card>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <Table columns={columns} data={roles} />
            )}
          </Card>

          {/* Add/Edit Role Modal */}
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title={editingRole ? "Edit Role" : "Add Role"}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <Select
                label="Status"
                value={formData.is_active ? "true" : "false"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_active: e.target.value === "true",
                  })
                }
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
              />
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : editingRole ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Manage Permissions Modal */}
          <Modal
            isOpen={permissionsModalOpen}
            onClose={() => {
              setPermissionsModalOpen(false);
              setSelectedRole(null);
            }}
            title={`Manage Permissions - ${selectedRole?.name || ""}`}
            size="xl"
          >
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page
                      </th>
                      {permissions.map((perm) => (
                        <th
                          key={perm.id}
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {perm.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pages.map((page) => (
                      <tr key={page.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {page.name}
                        </td>
                        {permissions.map((perm) => (
                          <td
                            key={perm.id}
                            className="px-6 py-4 whitespace-nowrap text-center"
                          >
                            <input
                              type="checkbox"
                              checked={
                                rolePermissions[page.id]?.includes(perm.id) ||
                                false
                              }
                              onChange={() =>
                                handlePermissionToggle(page.id, perm.id)
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setPermissionsModalOpen(false);
                    setSelectedRole(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Permissions"}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
