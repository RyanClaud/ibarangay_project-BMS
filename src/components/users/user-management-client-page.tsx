"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AddUserDialog } from "./add-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { useAppContext } from "@/contexts/app-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

export function UserManagementClientPage() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useAppContext();
  const [filter, setFilter] = React.useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [userToEdit, setUserToEdit] = React.useState<User | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [userToView, setUserToView] = React.useState<User | null>(null);

  // Filter staff users (non-residents, non-deleted)
  const staffUsers = (users || []).filter(
    (user) =>
      user.role !== 'Resident' &&
      !user.isDeleted &&
      user.barangayId === currentUser?.barangayId
  );

  const filteredData = staffUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(filter.toLowerCase()) ||
      user.email.toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleAddUser = async (newUser: Omit<User, 'id' | 'avatarUrl' | 'residentId'>) => {
    // This now returns a promise that can throw an error
    await addUser(newUser);
  };

  const handleUpdateUser = (updatedUser: Partial<User> & {id: string}) => {
    updateUser(updatedUser);
    setUserToEdit(null);
  };

  const handleDeleteUser = (userId: string) => {
    deleteUser(userId);
    setUserToDelete(null);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>View, add, edit, or remove staff and officials.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <Input
            placeholder="Filter by name or email..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="max-w-full sm:max-w-sm"
          />
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
            <PlusCircle />
            Add User
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length ? (
                filteredData.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                          <AvatarFallback>
                            {user.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{user.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToView(user)}
                          aria-label={`View ${user.name}`}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setUserToView(user)}>
                              <Eye className="mr-2 h-4 w-4" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setUserToEdit(user)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setUserToDelete(user)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <AddUserDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAddUser={handleAddUser}
          existingUsers={staffUsers}
        />
        {userToEdit && (
          <EditUserDialog
            isOpen={!!userToEdit}
            onClose={() => setUserToEdit(null)}
            onUpdateUser={handleUpdateUser}
            user={userToEdit}
          />
        )}
        {userToView && (
          <UserDetailsDialog user={userToView} onClose={() => setUserToView(null)} />
        )}
        {userToDelete && (
          <DeleteUserDialog
            isOpen={!!userToDelete}
            onClose={() => setUserToDelete(null)}
            onConfirm={() => handleDeleteUser(userToDelete.id)}
            userName={userToDelete.name}
          />
        )}
      </CardContent>
    </Card>
  );
}

function UserDetailsDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const details = [
    ["Full name", user.name],
    ["Email address", user.email],
    ["Role", user.role],
    ["Barangay", user.barangayId],
    ["Account status", user.isDeleted ? "Inactive" : "Active"],
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User details</DialogTitle>
          <DialogDescription>Account information for this staff member.</DialogDescription>
        </DialogHeader>
        <dl className="space-y-4">
          {details.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
              <dd className="text-sm">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
