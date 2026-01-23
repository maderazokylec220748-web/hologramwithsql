import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Search, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Facility {
  id: string;
  name: string;
  type: string;
  location: string;
  capacity?: number;
  status: "active" | "inactive" | "maintenance";
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertFacility {
  name: string;
  type: string;
  location: string;
  capacity?: number;
  status: "active" | "inactive" | "maintenance";
  description?: string;
}

export function FacilitiesManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Partial<InsertFacility>>({
    name: "",
    type: "",
    location: "",
    capacity: 0,
    status: "active",
    description: "",
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/admin/facilities"],
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const filteredFacilities = facilities.filter((facility) =>
    facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: InsertFacility) => apiRequest("POST", "/api/admin/facilities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/facilities"] });
      toast({ title: "Facility created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create facility",
        description: error.message || "Please check all fields",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Facility> }) =>
      apiRequest("PUT", `/api/admin/facilities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/facilities"] });
      toast({ title: "Facility updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update facility",
        description: error.message || "Please check all fields",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/facilities/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/facilities"] });
      toast({ title: "Facility deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete facility",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map(id => apiRequest("DELETE", `/api/admin/facilities/${id}`, undefined))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/facilities"] });
      toast({ title: `${selectedIds.size} facilities deleted successfully` });
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete facilities",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData(facility);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.location) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    // Remove empty optional fields
    const dataToSubmit = {
      name: formData.name || "",
      type: formData.type || "",
      location: formData.location || "",
      status: formData.status || "active",
      ...(formData.capacity && { capacity: formData.capacity }),
      ...(formData.description && { description: formData.description }),
    };

    if (editingFacility) {
      updateMutation.mutate({ id: editingFacility.id, data: dataToSubmit as any });
    } else {
      createMutation.mutate(dataToSubmit as InsertFacility);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this facility?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      toast({ title: "Please select facilities to delete", variant: "destructive" });
      return;
    }
    if (confirm(`Are you sure you want to delete ${selectedIds.size} facilit(y|ies)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      location: "",
      capacity: 0,
      status: "active",
      description: "",
    });
    setEditingFacility(null);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFacilities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFacilities.map((fac) => fac.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Facilities Management</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => resetForm()}
                className="w-full sm:w-auto bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Facility
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFacility ? "Edit Facility" : "Add New Facility"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Facility Name *</label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Computer Lab, Library Building..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <Input
                    value={formData.type || ""}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="e.g., Classroom, Lab, Office, Library..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location *</label>
                  <Input
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Building A, Floor 3, Room 301..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <Input
                    type="number"
                    value={formData.capacity || 0}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    placeholder="Number of people"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status *</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a description of the facility..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)]"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingFacility ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, type, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedIds.size > 0 && (
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete ({selectedIds.size})
              </Button>
            )}
          </div>

          {filteredFacilities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No facilities found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">
                      <Checkbox
                        checked={selectedIds.size === filteredFacilities.length && filteredFacilities.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">Facility Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Type</th>
                    <th className="px-4 py-2 text-left font-semibold">Location</th>
                    <th className="px-4 py-2 text-left font-semibold">Capacity</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((facility) => (
                    <tr key={facility.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <Checkbox
                          checked={selectedIds.has(facility.id)}
                          onCheckedChange={() => toggleSelect(facility.id)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate font-medium">{facility.name}</div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">{facility.type}</Badge>
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate">{facility.location}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate">{facility.capacity || "-"}</div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge className={getStatusColor(facility.status)}>
                          {facility.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(facility)}
                            className="gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(facility.id)}
                            className="gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
