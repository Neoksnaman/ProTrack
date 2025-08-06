

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { Plus, Edit, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import UserForm from './user-form';
import DeleteItemDialog from './delete-item-dialog';
import { useData } from '@/hooks/use-data';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { deleteUser } from '@/lib/sheets';
import { useTopLoaderStore } from '@/stores/use-top-loader-store';

const ITEMS_PER_PAGE = 5;

export default function UserList() {
  const { users, projects, isLoading, removeUserFromCache, isProjectsLoading } = useData();
  const { toast } = useToast();
  const { start, finish } = useTopLoaderStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };
  
  const handleDelete = (user: User) => {
    setDeletingUser(user);
  };

  const onFormSubmit = () => {
    setIsFormOpen(false);
  };

  const filteredUsers = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = users.filter((user) => {
      return (
        user.name.toLowerCase().includes(lowercasedQuery) ||
        user.username.toLowerCase().includes(lowercasedQuery) ||
        user.email.toLowerCase().includes(lowercasedQuery)
      );
    });
    // Reset page on search
    if (searchQuery) {
        setCurrentPage(1);
    }
    return filtered;
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = useMemo(() => {
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, startIndex, endIndex]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingUser) return;
    
    if (isProjectsLoading) {
      toast({
        variant: 'destructive',
        title: 'Please wait',
        description: 'Projects are still loading. Cannot perform deletion yet.',
      });
      return;
    }

    const isUserInProject = projects.some(p => p.teamLeaderId === deletingUser.id || p.teamMemberIds.some(id => id === deletingUser.id));
    if (isUserInProject) {
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: `Cannot delete user "${deletingUser.name}". They are assigned to one or more projects.`,
        });
        setDeletingUser(null);
        return;
    }

    start();
    setIsDeleting(true);
    try {
        await deleteUser(deletingUser.id);
        removeUserFromCache(deletingUser.id);
        toast({
            title: 'User Deleted',
            description: `User "${deletingUser.name}" has been successfully deleted.`,
        });
        setDeletingUser(null); 
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Error Deleting User',
            description: error instanceof Error ? error.message : 'Could not delete the user.',
        });
    } finally {
        setIsDeleting(false);
        finish();
    }
  }, [deletingUser, projects, removeUserFromCache, toast, start, finish, isProjectsLoading]);


  return (
    <>
      <UserForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        user={editingUser}
        onSubmitSuccess={onFormSubmit}
      />
       <DeleteItemDialog
        isOpen={!!deletingUser}
        setIsOpen={() => setDeletingUser(null)}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        itemName={deletingUser?.name || ''}
        itemType="user"
      />
      <Card>
        <CardHeader>
           <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>A list of all users in your organization.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, username, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full md:w-64"
                    />
                </div>
                <Button onClick={handleAdd} className="shrink-0">
                  <Plus className="mr-2 h-4 w-4" />
                  New User
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader className="hidden bg-muted/50 md:table-header-group">
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="grid gap-4 md:table-row-group md:[&_tr:last-child]:border-b">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="hidden md:table-row">
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <TableRow key={user.id} className="border rounded-lg p-4 grid grid-cols-2 gap-x-4 gap-y-2 relative md:table-row md:p-0 md:border-b md:rounded-none">
                      <TableCell className="p-0 col-span-2 md:p-4">
                          <div className="font-medium text-xs text-muted-foreground md:hidden">Username</div>
                          <div className="font-medium">{user.username}</div>
                      </TableCell>
                       <TableCell className="p-0 md:p-4">
                           <div className="font-medium text-xs text-muted-foreground md:hidden">Name</div>
                          <div>{user.name}</div>
                      </TableCell>
                      <TableCell className="p-0 md:p-4">
                          <div className="font-medium text-xs text-muted-foreground md:hidden">Email</div>
                          <div className="truncate">{user.email}</div>
                      </TableCell>
                      <TableCell className="p-0 md:p-4">
                          <div className="font-medium text-xs text-muted-foreground md:hidden">Role</div>
                        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-0 md:p-4">
                          <div className="font-medium text-xs text-muted-foreground md:hidden">Team</div>
                          {user.team || 'N/A'}
                      </TableCell>
                       <TableCell className="p-0 absolute top-2 right-2 md:static md:p-4 md:text-right">
                        <div className="flex justify-end items-center">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                            </Button>
                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(user)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          {isLoading && (
            <div className="space-y-4 p-4 md:hidden">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="flex justify-center items-center gap-4 pt-4">
                <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>
                <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        )}
      </Card>
    </>
  );
}
