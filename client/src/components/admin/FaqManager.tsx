import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertFaq>>({
    question: "",
    answer: "",
    category: "general",
    priority: 0,
    isActive: true,
  });

  const { data: faqs } = useQuery<Faq[]>({
    queryKey: ["/api/admin/faqs"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertFaq) => apiRequest("POST", "/api/admin/faqs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "FAQ created successfully" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Faq> }) =>
      apiRequest("PATCH", `/api/admin/faqs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "FAQ updated successfully" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/faqs/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "FAQ deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "general",
      priority: 0,
      isActive: true,
    });
    setSelectedFaq(null);
    setIsCreating(false);
  };

  const handleEdit = (faq: Faq) => {
    setSelectedFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category as "admissions" | "academic" | "campus" | "scholarships" | "general",
      priority: faq.priority,
      isActive: faq.isActive,
    });
    setIsCreating(false);
  };

  const handleSave = () => {
    if (!formData.question || !formData.answer || !formData.category) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (selectedFaq) {
      updateMutation.mutate({ id: selectedFaq.id, data: formData as Partial<Faq> });
    } else {
      createMutation.mutate(formData as InsertFaq);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* FAQ List */}
      <Card className="border-[hsl(48,100%,50%)]">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>FAQ Library</CardTitle>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Add FAQ button clicked");
              setIsCreating(true);
              setSelectedFaq(null);
              setFormData({
                question: "",
                answer: "",
                category: "general",
                priority: 0,
                isActive: true,
              });
            }}
            size="sm"
            className="bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)]"
            data-testid="button-create-faq"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add FAQ
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {faqs?.map((faq) => (
                <Card
                  key={faq.id}
                  className={`hover-elevate cursor-pointer ${
                    selectedFaq?.id === faq.id ? "border-[hsl(48,100%,50%)]" : ""
                  }`}
                  onClick={() => handleEdit(faq)}
                  data-testid={`card-faq-${faq.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge className="bg-[hsl(0,75%,25%)] text-[hsl(45,30%,98%)]">
                        {faq.category}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(faq);
                          }}
                          data-testid={`button-edit-faq-${faq.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(faq.id);
                          }}
                          data-testid={`button-delete-faq-${faq.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{faq.question}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card className="border-[hsl(48,100%,50%)]">
        <CardHeader>
          <CardTitle>{selectedFaq ? "Edit FAQ" : isCreating ? "Create FAQ" : "Select FAQ"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(selectedFaq || isCreating) ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as "admissions" | "academic" | "campus" | "scholarships" | "general" })}
                >
                  <SelectTrigger data-testid="select-faq-category">
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Question</label>
                <Input
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter the FAQ question..."
                  data-testid="input-faq-question"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Answer</label>
                <Textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Enter the FAQ answer..."
                  rows={8}
                  data-testid="textarea-faq-answer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority (higher = shown first)</label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  data-testid="input-faq-priority"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)]"
                  data-testid="button-save-faq"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel-faq"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
              Select an FAQ to edit or create a new one
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
