"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { settingsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { CompanySettings } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = useAuth();

  const [formData, setFormData] = useState({
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    contact_person: "",
    registration_number: "",
    tax_id: "",
    website: "",
  });

  const isAdmin = hasRole(["Admin"]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data: any = await settingsApi.get();
      setSettings(data);

      // Populate form with existing data
      if (data) {
        setFormData({
          company_name: data.company_name || "",
          company_address: data.company_address || "",
          company_phone: data.company_phone || "",
          company_email: data.company_email || "",
          contact_person: data.contact_person || "",
          registration_number: data.registration_number || "",
          tax_id: data.tax_id || "",
          website: data.website || "",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error("You don't have permission to update settings");
      return;
    }

    setSubmitting(true);
    try {
      await settingsApi.update(formData);
      toast.success("Settings updated successfully");
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Company Settings
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your company information and details
              </p>
            </div>
            <BuildingOfficeIcon className="h-10 w-10 text-gray-400" />
          </div>

          {/* Settings Form */}
          <Card>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Name */}
                <div>
                  <Input
                    label="Company Name"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    placeholder="Enter company name"
                    required
                    disabled={!isAdmin}
                  />
                </div>

                {/* Company Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Address
                  </label>
                  <textarea
                    value={formData.company_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company_address: e.target.value,
                      })
                    }
                    placeholder="Enter complete address"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!isAdmin}
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.company_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company_phone: e.target.value,
                      })
                    }
                    placeholder="+1 (234) 567-8900"
                    disabled={!isAdmin}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.company_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company_email: e.target.value,
                      })
                    }
                    placeholder="company@example.com"
                    disabled={!isAdmin}
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <Input
                    label="Contact Person"
                    value={formData.contact_person}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_person: e.target.value,
                      })
                    }
                    placeholder="Name of primary contact person"
                    disabled={!isAdmin}
                  />
                </div>

                {/* Business Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Registration Number"
                    value={formData.registration_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registration_number: e.target.value,
                      })
                    }
                    placeholder="Company registration number"
                    disabled={!isAdmin}
                  />
                  <Input
                    label="Tax ID"
                    value={formData.tax_id}
                    onChange={(e) =>
                      setFormData({ ...formData, tax_id: e.target.value })
                    }
                    placeholder="Tax identification number"
                    disabled={!isAdmin}
                  />
                </div>

                {/* Website */}
                <div>
                  <Input
                    label="Website"
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="https://www.example.com"
                    disabled={!isAdmin}
                  />
                </div>

                {/* Submit Button */}
                {isAdmin && (
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button type="submit" loading={submitting}>
                      <CheckCircleIcon className="h-5 w-5" />
                      Save Settings
                    </Button>
                  </div>
                )}

                {!isAdmin && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Only administrators can modify company settings.
                    </p>
                  </div>
                )}
              </form>
            </div>
          </Card>

          {/* Last Updated Info */}
          {settings && settings.updated_at && (
            <div className="text-sm text-gray-500 text-center">
              Last updated:{" "}
              {new Date(settings.updated_at).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
