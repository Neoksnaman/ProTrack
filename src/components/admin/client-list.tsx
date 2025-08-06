

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Client } from '@/lib/types';
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
import { Button } from '../ui/button';
import { Plus, Edit, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import ClientForm from './client-form';
import { useData } from '@/hooks/use-data';
import { Input } from '../ui/input';
import DeleteItemDialog from './delete-item-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteClient } from '@/lib/sheets';
import { useTopLoaderStore } from '@/stores/use-top-loader-store';

const ITEMS_PER_PAGE = 5;

export default function ClientList() {
  const { clients, projects, isLoading, removeClientFromCache, isProjectsLoading } = useData();
  const { toast } = useToast();
  const { start, finish } = useTopLoaderStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleDelete = (client: Client) => {
    setDeletingClient(client);
  };

  const onFormSubmit = () => {
    setIsFormOpen(false);
  };
  
  const filteredClients = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = clients.filter((client) => {
      return (
        client.name.toLowerCase().includes(lowercasedQuery) ||
        (client.address && client.address.toLowerCase().includes(lowercasedQuery))
      );
    });
    // Don't reset page on every keystroke, only when filter results change.
    // This simple implementation will reset on every query change.
    if (searchQuery) {
        setCurrentPage(1);
    }
    return filtered;
  }, [clients, searchQuery]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentClients = useMemo(() => {
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, startIndex, endIndex]);
  
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingClient) return;

    if (isProjectsLoading) {
        toast({
            variant: 'destructive',
            title: 'Please wait',
            description: 'Project data is still loading. Cannot perform deletion check yet.',
        });
        return;
    }

    const isClientInProject = projects.some(p => p.clientId === deletingClient.id);
    if (isClientInProject) {
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: `Cannot delete client "${deletingClient.name}". They are associated with one or more projects.`,
        });
        setDeletingClient(null);
        return;
    }

    start();
    setIsDeleting(true);
    try {
        await deleteClient(deletingClient.id);
        removeClientFromCache(deletingClient.id);
        toast({
            title: 'Client Deleted',
            description: `Client "${deletingClient.name}" has been successfully deleted.`,
        });
        setDeletingClient(null);
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Error Deleting Client',
            description: error instanceof Error ? error.message : 'Could not delete the client.',
        });
    } finally {
        setIsDeleting(false);
        finish();
    }
  }, [deletingClient, removeClientFromCache, projects, toast, start, finish, isProjectsLoading]);

  return (
    <>
      <ClientForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        client={editingClient}
        onSubmitSuccess={onFormSubmit}
      />
      <DeleteItemDialog
        isOpen={!!deletingClient}
        setIsOpen={() => setDeletingClient(null)}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        itemName={deletingClient?.name || ''}
        itemType="client"
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>All Clients</CardTitle>
              <CardDescription>A list of all clients for your projects.</CardDescription>
            </div>
             <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full md:w-64"
                    />
                </div>
                <Button onClick={handleAdd} className="shrink-0">
                  <Plus className="mr-2 h-4 w-4" />
                  New Client
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader className="hidden bg-muted/50 md:table-header-group">
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="grid gap-4 md:table-row-group md:[&_tr:last-child]:border-b">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i} className="hidden md:table-row">
                      <TableCell colSpan={3}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentClients.length > 0 ? (
                  currentClients.map((client) => (
                    <TableRow key={client.id} className="border rounded-lg p-4 grid grid-cols-2 gap-x-4 gap-y-2 relative md:table-row md:p-0 md:border-b md:rounded-none">
                      <TableCell className="p-0 col-span-2 md:p-4">
                          <div className="font-medium text-xs text-muted-foreground md:hidden">Client Name</div>
                          <div className="font-medium">{client.name}</div>
                      </TableCell>
                      <TableCell className="p-0 col-span-2 md:p-4">
                          <div className="font-medium text-xs text-muted-foreground md:hidden">Address</div>
                          <div>{client.address}</div>
                      </TableCell>
                       <TableCell className="p-0 absolute top-2 right-2 md:static md:p-4 md:text-right">
                        <div className="flex justify-end items-center">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit Client</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(client)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete Client</span>
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No clients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
           {isLoading && (
            <div className="space-y-4 p-4 md:hidden">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
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
