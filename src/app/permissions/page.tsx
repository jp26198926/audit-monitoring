"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { permissionsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Permission } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data: any = await permissionsApi.getAll();
      setPermissions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPermission(null);
    setFormData({
      name: "",
      description: "",
    });
    setModalOpen(true);
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name,
      description: permission.description || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this permission?")) return;

    try {
      await permissionsApi.delete(id);
      toast.success("Permission deleted successfully");
      fetchPermissions();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete permission");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingPermission) {
        await permissionsApi.update(editingPermission.id, formData);
        toast.success("Permission updated successfully");
      } else {
        await permissionsApi.create(formData);
        toast.success("Permission created successfully");
      }
      setModalOpen(false);
      fetchPermissions();
    } catch (error: any) {
      toast.error(error.message || "Failed to save permission");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "id", title: "ID" },
    { key: "name", title: "Name" },
    { key: "description", title: "Description" },
    { key: "created_at", title: "Created At" },
    {
      key: "actions",
      title: "Actions",
      className: "w-32",
      render: (_: any, permission: Permission) =>
        hasRole(["Admin"]) ? (
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleEdit(permission)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(permission.id)}
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
            <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
            {hasRole(["Admin"]) && (
              <Button onClick={handleAdd}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Permission
              </Button>
            )}
          </div>

          <Card>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <Table columns={columns} data={permissions} />
            )}
          </Card>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title={editingPermission ? "Edit Permission" : "Add Permission"}
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
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingPermission
                      ? "Update"
                      : "Create"}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
