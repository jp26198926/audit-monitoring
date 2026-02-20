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
import { pagesApi } from "@/lib/api";
import toast from "react-hot-toast";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Page } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    display_order: 0,
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const data: any = await pagesApi.getAll();
      setPages(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPage(null);
    setFormData({
      name: "",
      path: "",
      display_order: 0,
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      name: page.name,
      path: page.path,
      display_order: page.display_order,
      is_active: Boolean(page.is_active),
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      await pagesApi.delete(id);
      toast.success("Page deleted successfully");
      fetchPages();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete page");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingPage) {
        await pagesApi.update(editingPage.id, formData);
        toast.success("Page updated successfully");
      } else {
        await pagesApi.create(formData);
        toast.success("Page created successfully");
      }
      setModalOpen(false);
      fetchPages();
    } catch (error: any) {
      toast.error(error.message || "Failed to save page");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "id", title: "ID" },
    { key: "name", title: "Name" },
    { key: "path", title: "Path" },
    { key: "display_order", title: "Order" },
    {
      key: "is_active",
      title: "Status",
      render: (value: any, page: Page) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            page.is_active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {page.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      className: "w-32",
      render: (_: any, page: Page) =>
        hasRole(["Admin"]) ? (
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleEdit(page)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(page.id)}
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
            <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
            {hasRole(["Admin"]) && (
              <Button onClick={handleAdd}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Page
              </Button>
            )}
          </div>

          <Card>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <Table columns={columns} data={pages} />
            )}
          </Card>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title={editingPage ? "Edit Page" : "Add Page"}
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
                label="Path"
                value={formData.path}
                onChange={(e) =>
                  setFormData({ ...formData, path: e.target.value })
                }
                required
                placeholder="/example-path"
              />
              <Input
                label="Display Order"
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    display_order: parseInt(e.target.value),
                  })
                }
                required
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
                  {submitting ? "Saving..." : editingPage ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
