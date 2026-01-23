import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Search, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Faq, InsertFaq } from "@shared/schema";

const categories = [
  { value: "admissions", label: "Admissions" },
  { value: "academic", label: "Academic" },
  { value: "campus", label: "Campus" },
  { value: "scholarships", label: "Scholarships" },
  { value: "general", label: "General" },
];

export function FaqManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Partial<InsertFaq>>({
    question: "",
    answer: "",
    category: "general",
    priority: 0,
    isActive: true,
  });

  const { data: faqs = [] } = useQuery<Faq[]>({
    queryKey: ["/api/admin/faqs"],
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Filter FAQs based on search query
  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: InsertFaq) => apiRequest("POST", "/api/admin/faqs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "FAQ created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create FAQ",
        description: error.message || "Please check all fields",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Faq> }) =>
      apiRequest("PATCH", `/api/admin/faqs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "FAQ updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update FAQ",
        description: error.message || "Please check all fields",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/faqs/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "FAQ deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete FAQ",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map(id => apiRequest("DELETE", `/api/admin/faqs/${id}`, undefined))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: `${selectedIds.size} FAQs deleted successfully` });
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete FAQs",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category as "admissions" | "academic" | "campus" | "scholarships" | "general",
      priority: faq.priority,
      isActive: faq.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question || !formData.answer) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, data: formData as Partial<Faq> });
    } else {
      createMutation.mutate(formData as InsertFaq);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this FAQ?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      toast({ title: "Please select FAQs to delete", variant: "destructive" });
      return;
    }
    if (confirm(`Are you sure you want to delete ${selectedIds.size} FAQ(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "general",
      priority: 0,
      isActive: true,
    });
    setEditingFaq(null);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFaqs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFaqs.map((faq) => faq.id)));
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

  const getCategoryLabel = (categoryValue: string) => {
    return categories.find(c => c.value === categoryValue)?.label || categoryValue;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>FAQ Management</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => resetForm()}
                className="w-full sm:w-auto bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select
                    value={formData.category || "general"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        category: value as "admissions" | "academic" | "campus" | "scholarships" | "general",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Question</label>
                  <Input
                    value={formData.question || ""}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter the FAQ question..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Answer</label>
                  <Textarea
                    value={formData.answer || ""}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Enter the FAQ answer..."
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Priority (higher = shown first)</label>
                  <Input
                    type="number"
                    value={formData.priority || 0}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                  />
                  <label className="text-sm font-medium cursor-pointer">Active (visible to users)</label>
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
                    {editingFaq ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by question, answer, or category..."
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

          {/* Table */}
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No FAQs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">
                      <Checkbox
                        checked={selectedIds.size === filteredFaqs.length && filteredFaqs.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">Question</th>
                    <th className="px-4 py-2 text-left font-semibold">Category</th>
                    <th className="px-4 py-2 text-left font-semibold">Answer Preview</th>
                    <th className="px-4 py-2 text-left font-semibold">Priority</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaqs.map((faq) => (
                    <tr key={faq.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <Checkbox
                          checked={selectedIds.has(faq.id)}
                          onCheckedChange={() => toggleSelect(faq.id)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate">{faq.question}</div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">{getCategoryLabel(faq.category)}</Badge>
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate text-sm text-gray-600">{faq.answer}</div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge className="bg-[hsl(0,75%,25%)] text-[hsl(45,30%,98%)]">
                          {faq.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={faq.isActive ? "default" : "secondary"}>
                          {faq.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(faq)}
                            className="gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(faq.id)}
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
