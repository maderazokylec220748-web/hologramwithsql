import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AdminUser, InsertAdminUser } from "@shared/schema";

interface UserManagerProps {
  currentUser: { id: string; username: string; role: string } | null;
}

export function UserManager({ currentUser }: UserManagerProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<Partial<InsertAdminUser>>({
    username: "",
    password: "",
    fullName: "",
    email: "",
    role: "admin",
  });

  const { data: users } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!currentUser, // Only fetch when currentUser exists
    retry: false, // Don't retry on failure
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertAdminUser) => apiRequest("POST", "/api/admin/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create user", 
        description: error.message || "Password must contain uppercase, lowercase, and number (min 8 chars)",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminUser> }) => 
      apiRequest("PUT", `/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update user", 
        description: error.message || "Please check all fields and try again",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      const userToDelete = users?.find(u => u.id === id);
      // Prevent professors from deleting admin users
      if (currentUser?.role === 'professor' && userToDelete?.role === 'admin') {
        throw new Error("Professors cannot delete admin users");
      }
      return apiRequest("DELETE", `/api/admin/users/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete user", 
        description: error.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: currentUser?.role === 'professor' ? 'professor' : 'admin',
    });
    setEditingUser(null);
  };

  const handleEdit = (user: AdminUser) => {
    // Prevent professors from editing admin users
    if (currentUser?.role === 'professor' && user.role === 'admin') {
      toast({ 
        title: "Permission denied", 
        description: "Professors cannot edit admin users",
        variant: "destructive" 
      });
      return;
    }
    
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      password: "", // Don't populate password
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.username || !formData.fullName || !formData.email) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    // Prevent professors from creating or changing role to admin
    if (currentUser?.role === 'professor' && formData.role === 'admin') {
      toast({ 
        title: "Permission denied", 
        description: "Professors cannot create or assign admin role",
        variant: "destructive" 
      });
      return;
    }

    if (editingUser) {
      // Update existing user
      const updateData: Partial<AdminUser> = {
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
      };
      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      // Create new user
      if (!formData.password) {
        toast({ title: "Password is required for new users", variant: "destructive" });
        return;
      }
      createMutation.mutate(formData as InsertAdminUser);
    }
  };

  const getRoleBadge = (role: string) => {
    return role === "admin" 
      ? "bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)]"
      : "bg-[hsl(0,75%,25%)] text-[hsl(45,30%,98%)]";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">User Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm(); // Reset form when dialog closes
          }
        }}>
          <DialogTrigger asChild>
            <Button
              className="bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)]"
              data-testid="button-add-user"
              onClick={() => {
                resetForm(); // Reset form when opening for new user
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Update user information and permissions." : "Add a new user to the system."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Juan Dela Cruz"
                  data-testid="input-user-fullname"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan@westmead-is.edu.ph"
                  data-testid="input-user-email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="jdelacruz"
                  data-testid="input-user-username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Password {editingUser && <span className="text-muted-foreground">(leave blank to keep current)</span>}
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  data-testid="input-user-password"
                />
                {!editingUser && (
                  <p className="text-xs text-muted-foreground">
                    Min 8 characters, must include uppercase, lowercase, and number
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as "admin" | "professor" })}
                >
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin" disabled={currentUser?.role === 'professor'}>
                      Admin {currentUser?.role === 'professor' && '(Admin only)'}
                    </SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)]"
                data-testid="button-save-user"
              >
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users?.map((user) => (
          <Card key={user.id} className="border-[hsl(48,100%,50%)] hover-elevate" data-testid={`card-user-${user.id}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(0,75%,25%)] to-[hsl(0,75%,35%)] flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-[hsl(48,100%,50%)]" />
                </div>
                <div>
                  <CardTitle className="text-base">{user.fullName}</CardTitle>
                  <Badge className={getRoleBadge(user.role)}>
                    {user.role}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(user)}
                  disabled={currentUser?.role === 'professor' && user.role === 'admin'}
                  data-testid={`button-edit-user-${user.id}`}
                >
                  <Edit2 className="w-4 h-4 text-[hsl(48,100%,50%)]" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(user.id)}
                  disabled={currentUser?.role === 'professor' && user.role === 'admin'}
                  data-testid={`button-delete-user-${user.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Username:</span>
                <span className="ml-2 font-mono">{user.username}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-2">{user.email}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Created {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
