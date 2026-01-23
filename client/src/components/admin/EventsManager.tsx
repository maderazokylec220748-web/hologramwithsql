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

interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: Date;
  eventEndDate?: Date;
  location: string;
  department?: string;
  organizer?: string;
  eventType: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertEvent {
  title: string;
  description: string;
  eventDate: string;
  eventEndDate?: string;
  location: string;
  department?: string;
  organizer?: string;
  eventType: string;
  image?: string;
  isActive: boolean;
}

const EVENT_TYPES = [
  { value: "event", label: "Event" },
  { value: "announcement", label: "Announcement" },
];

export function EventsManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Partial<InsertEvent>>({
    title: "",
    description: "",
    eventDate: "",
    eventEndDate: "",
    location: "",
    department: "",
    organizer: "",
    eventType: "event",
    image: "",
    isActive: true,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: InsertEvent) => apiRequest("POST", "/api/admin/events", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({ title: "Event created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create event",
        description: error.message || "Please check all fields",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) =>
      apiRequest("PUT", `/api/admin/events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({ title: "Event updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update event",
        description: error.message || "Please check all fields",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/events/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({ title: "Event deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete event",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map(id => apiRequest("DELETE", `/api/admin/events/${id}`, undefined))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({ title: `${selectedIds.size} events deleted successfully` });
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete events",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    const dateStr = new Date(event.eventDate).toISOString().slice(0, 16);
    const endDateStr = event.eventEndDate 
      ? new Date(event.eventEndDate).toISOString().slice(0, 16)
      : "";
    setFormData({
      ...event,
      eventDate: dateStr,
      eventEndDate: endDateStr,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.eventDate || !formData.location) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const dataToSubmit = {
      title: formData.title || "",
      description: formData.description || "",
      eventDate: formData.eventDate ? new Date(formData.eventDate) : new Date(),
      eventEndDate: formData.eventEndDate ? new Date(formData.eventEndDate) : null,
      location: formData.location || "",
      department: formData.department || "",
      organizer: formData.organizer || "",
      eventType: formData.eventType || "event",
      image: formData.image || null,
      isActive: formData.isActive !== false,
    };

    if (editingEvent) {
      updateMutation.mutate({
        id: editingEvent.id,
        data: dataToSubmit as any,
      });
    } else {
      createMutation.mutate(dataToSubmit as InsertEvent);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} events?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const resetForm = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      eventDate: "",
      eventEndDate: "",
      location: "",
      department: "",
      organizer: "",
      eventType: "event",
      image: "",
      isActive: true,
    });
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

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvents.map(e => e.id)));
    }
  };

  const getTypeColor = (type: string) => {
    return type === "event" 
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Events Management</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => resetForm()}
                className="w-full sm:w-auto bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Event title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Event details and description..."
                    required
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date/Time *</label>
                    <Input
                      type="datetime-local"
                      value={formData.eventDate || ""}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">End Date/Time</label>
                    <Input
                      type="datetime-local"
                      value={formData.eventEndDate || ""}
                      onChange={(e) => setFormData({ ...formData, eventEndDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location *</label>
                  <Input
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Main Auditorium, Building A..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <Select value={formData.eventType} onValueChange={(value) => setFormData({ ...formData, eventType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <Input
                      value={formData.department || ""}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g., Sports, Academic..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Organizer</label>
                  <Input
                    value={formData.organizer || ""}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    placeholder="Organization or person organizing..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                    Active
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingEvent ? "Update Event" : "Create Event"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 flex-col sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by title, location, or department..."
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

            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No events found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">
                        <Checkbox
                          checked={selectedIds.size === filteredEvents.length && filteredEvents.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-2 text-left font-semibold">Title</th>
                      <th className="px-4 py-2 text-left font-semibold">Date/Time</th>
                      <th className="px-4 py-2 text-left font-semibold">Location</th>
                      <th className="px-4 py-2 text-left font-semibold">Type</th>
                      <th className="px-4 py-2 text-left font-semibold">Department</th>
                      <th className="px-4 py-2 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <Checkbox
                            checked={selectedIds.has(event.id)}
                            onCheckedChange={() => toggleSelect(event.id)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="max-w-xs truncate font-medium">{event.title}</div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="max-w-xs truncate text-sm">
                            {new Date(event.eventDate).toLocaleDateString()} {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="max-w-xs truncate">{event.location}</div>
                        </td>
                        <td className="px-4 py-2">
                          <Badge className={getTypeColor(event.eventType)}>
                            {event.eventType}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          <div className="max-w-xs truncate">{event.department || "-"}</div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(event)}
                              className="gap-1"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(event.id)}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
