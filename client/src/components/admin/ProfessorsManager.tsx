import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Search, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Professor {
  id: string;
  fullName: string;
  position: string;
  department: string;
  email?: string;
  phone?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertProfessor {
  fullName: string;
  position: string;
  department: string;
  email?: string;
  phone?: string;
  description?: string;
}

export function ProfessorsManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Partial<InsertProfessor>>({
    fullName: "",
    position: "",
    department: "",
    email: "",
    phone: "",
    description: "",
  });

  const { data: professors = [] } = useQuery<Professor[]>({
    queryKey: ["/api/admin/professors"],
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const filteredProfessors = professors.filter((prof) =>
    prof.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prof.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prof.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: InsertProfessor) => apiRequest("POST", "/api/admin/professors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professors"] });
      toast({ title: "Professor created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create professor",
        description: error.message || "Please check all fields",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Professor> }) =>
      apiRequest("PUT", `/api/admin/professors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professors"] });
      toast({ title: "Professor updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update professor",
        description: error.message || "Please check all fields",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/professors/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professors"] });
      toast({ title: "Professor deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete professor",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map(id => apiRequest("DELETE", `/api/admin/professors/${id}`, undefined))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professors"] });
      toast({ title: `${selectedIds.size} professors deleted successfully` });
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete professors",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setFormData(professor);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.position || !formData.department) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    // Remove empty optional fields
    const dataToSubmit = {
      fullName: formData.fullName || "",
      position: formData.position || "",
      department: formData.department || "",
      ...(formData.email && { email: formData.email }),
      ...(formData.phone && { phone: formData.phone }),
      ...(formData.description && { description: formData.description }),
    };

    if (editingProfessor) {
      updateMutation.mutate({ id: editingProfessor.id, data: dataToSubmit as any });
    } else {
      createMutation.mutate(dataToSubmit as InsertProfessor);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this professor?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      toast({ title: "Please select professors to delete", variant: "destructive" });
      return;
    }
    if (confirm(`Are you sure you want to delete ${selectedIds.size} professor(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      position: "",
      department: "",
      email: "",
      phone: "",
      description: "",
    });
    setEditingProfessor(null);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProfessors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProfessors.map((prof) => prof.id)));
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Professors Management</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => resetForm()}
                className="w-full sm:w-auto bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Professor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProfessor ? "Edit Professor" : "Add New Professor"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <Input
                    value={formData.fullName || ""}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter full name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Position *</label>
                  <Input
                    value={formData.position || ""}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g., Dean, Professor, Instructor..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Department *</label>
                  <Input
                    value={formData.department || ""}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Computer Science, Mathematics..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="professor@university.edu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a description of the professor's background and expertise..."
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
                    {editingProfessor ? "Update" : "Create"}
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
                placeholder="Search by name, position, or department..."
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

          {filteredProfessors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No professors found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">
                      <Checkbox
                        checked={selectedIds.size === filteredProfessors.length && filteredProfessors.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">Full Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Position</th>
                    <th className="px-4 py-2 text-left font-semibold">Department</th>
                    <th className="px-4 py-2 text-left font-semibold">Description</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfessors.map((professor) => (
                    <tr key={professor.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <Checkbox
                          checked={selectedIds.has(professor.id)}
                          onCheckedChange={() => toggleSelect(professor.id)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate font-medium">{professor.fullName}</div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">{professor.position}</Badge>
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate">{professor.department}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate text-sm text-gray-600">{professor.description || "-"}</div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(professor)}
                            className="gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(professor.id)}
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
