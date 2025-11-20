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
import { FileDown, MoreHorizontal, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Resident } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { EditResidentDialog } from "./edit-resident-dialog";
import { DeleteResidentDialog } from "./delete-resident-dialog";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app-context";

export function ResidentClientPage() {
  const { residents, updateResident, deleteResident } = useAppContext();
  const [filter, setFilter] = React.useState("");
  const [residentToEdit, setResidentToEdit] = React.useState<Resident | null>(null);
  const [residentToDelete, setResidentToDelete] = React.useState<Resident | null>(null);
  const router = useRouter();

  const filteredData = (residents || []).filter(
    (resident) =>
      resident.firstName.toLowerCase().includes(filter.toLowerCase()) ||
      resident.lastName.toLowerCase().includes(filter.toLowerCase()) ||
      resident.userId.toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => {
    // Assuming IDs are sortable strings like 'RES001', 'RES002'
    return b.id.localeCompare(a.id);
  });

  const handleUpdateResident = (residentId: string, dataToUpdate: Partial<Resident>) => {
    updateResident(residentId, dataToUpdate);
    setResidentToEdit(null);
  };

  const handleDeleteResident = (residentId: string) => {
    deleteResident(residentId);
    setResidentToDelete(null);
  };
  
  const handleViewProfile = (residentId: string) => {
    router.push(`/residents/${residentId}`);
  };

  return (
    <div className="space-y-4">
      {/* Info banner about resident registration */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 dark:text-blue-400 text-xl">ℹ️</div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Resident Self-Registration
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Residents can register their own accounts at <strong>/register</strong>. 
              They will automatically be added to your barangay's resident list after registration.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950 rounded-lg border">
        <Input
          placeholder="🔍 Search by name or User ID..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-full sm:max-w-sm h-11"
        />
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto h-11">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="hidden md:table-cell font-semibold">User ID</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="hidden sm:table-cell font-semibold">Address</TableHead>
              <TableHead className="hidden md:table-cell font-semibold">Birthdate</TableHead>
              <TableHead className="text-right font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length ? (
              filteredData.map((resident, index) => (
                <TableRow 
                  key={resident.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium hidden md:table-cell">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-mono">
                      {resident.userId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-purple-200 dark:border-purple-800">
                        <AvatarImage src={resident.avatarUrl || undefined} alt={resident.firstName} />
                        <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold">
                          {resident.firstName?.[0]}
                          {resident.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{resident.firstName} {resident.lastName}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{resident.userId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{resident.address}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{resident.birthdate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" className="hover:bg-purple-100 dark:hover:bg-purple-900">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewProfile(resident.id)} className="cursor-pointer">
                          👤 View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResidentToEdit(resident)} className="cursor-pointer">
                          ✏️ Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => setResidentToDelete(resident)}>
                          🗑️ Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <span className="text-4xl">👥</span>
                    <p className="font-medium">No residents found</p>
                    <p className="text-sm">Try adjusting your search or add a new resident</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {residentToEdit && (
        <EditResidentDialog
          isOpen={!!residentToEdit}
          onClose={() => setResidentToEdit(null)}
          onUpdateResident={handleUpdateResident}
          resident={residentToEdit}
        />
      )}
      {residentToDelete && (
        <DeleteResidentDialog
          isOpen={!!residentToDelete}
          onClose={() => setResidentToDelete(null)}
          onConfirm={() => handleDeleteResident(residentToDelete.id)}
          residentName={`${residentToDelete.firstName} ${residentToDelete.lastName}`}
        />
      )}
    </div>
  );
}
