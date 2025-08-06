
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createClient, updateClient } from '@/lib/sheets';
import type { Client } from '@/lib/types';
import { useData } from '@/hooks/use-data';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';

interface ClientFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  client: Client | null;
  onSubmitSuccess?: () => void;
  onClientCreated?: (client: Client) => void;
  initialName?: string;
}

const formSchema = z.object({
  name: z.string().min(2, { message: 'Client name must be at least 2 characters.' }),
  address: z.string().optional(),
});

export default function ClientForm({ isOpen, setIsOpen, client, onSubmitSuccess, onClientCreated, initialName }: ClientFormProps) {
  const { toast } = useToast();
  const { addClientToCache, updateClientInCache } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!client;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        if (client) {
            form.reset({
                name: client.name,
                address: client.address,
            });
        } else {
            form.reset({
                name: initialName || '',
                address: '',
            });
        }
    }
  }, [client, form, isOpen, initialName]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      if (isEditing) {
        const updatedClient = await updateClient({ id: client.id, ...values });
        updateClientInCache(updatedClient);
        toast({
          title: 'Client Updated',
          description: `Details for ${updatedClient.name} have been updated.`,
        });
        onSubmitSuccess?.();
      } else {
        const newClient = await createClient(values);
        toast({
          title: 'Client Created',
          description: `${newClient.name} has been added to the system.`,
        });
        onClientCreated?.(newClient);
        onSubmitSuccess?.();
      }
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 bg-transparent border-0">
        <Card>
            <DialogHeader className="p-6 pb-0">
            <DialogTitle>{isEditing ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
                {isEditing ? 'Update the details for this client.' : 'Fill out the form to add a new client.'}
            </DialogDescription>
            </DialogHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Acme Corporation" {...field} disabled={isLoading}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="123 Main St, Anytown, USA" {...field} disabled={isLoading}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <DialogFooter className="pt-4">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isLoading}>
                        Cancel
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (isEditing ? 'Saving...' : 'Creating...') : 'Save Changes'}
                    </Button>
                    </DialogFooter>
                </form>
                </Form>
            </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
