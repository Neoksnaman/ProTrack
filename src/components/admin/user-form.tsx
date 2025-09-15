

'use client';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createUser, updateUser } from '@/lib/sheets';
import type { User, UserRole, Team, UserStatus } from '@/lib/types';
import { UserRoles, Teams, UserStatuses } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useData } from '@/hooks/use-data';
import { Card, CardContent } from '../ui/card';

interface UserFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  onSubmitSuccess: () => void;
}

const formSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .max(20, { message: 'Username must be no more than 20 characters.' })
    .regex(/^[a-z0-9_]+$/, { message: 'Username can only contain lowercase letters, numbers, and underscores.' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().optional(),
  role: z.enum(UserRoles),
  team: z.enum(Teams).optional(),
  status: z.enum(UserStatuses).optional(),
});

export default function UserForm({ isOpen, setIsOpen, user, onSubmitSuccess }: UserFormProps) {
  const { toast } = useToast();
  const { addUserToCache, updateUserInCache } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!user;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'Associate',
      team: undefined,
      status: 'Active',
    },
  });
  
  const watchedRole = form.watch('role');

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        name: user.name,
        email: user.email,
        password: '', // Password is not pre-filled for security
        role: user.role,
        team: user.team,
        status: user.status || 'Active',
      });
    } else {
      form.reset({
        username: '',
        name: '',
        email: '',
        password: '',
        role: 'Associate',
        team: undefined,
        status: 'Active',
      });
    }
  }, [user, form, isOpen]);

  useEffect(() => {
    if (watchedRole === 'Admin' || watchedRole === 'Supervisor') {
      form.setValue('team', undefined);
    }
  }, [watchedRole, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    if (isEditing && !values.password) {
      // If editing and password is empty, don't update it
      delete values.password;
    } else if (!isEditing && !values.password) {
      form.setError('password', { type: 'manual', message: 'Password is required for new users.' });
      setIsLoading(false);
      return;
    }
    
    try {
      if (isEditing) {
        const updatedUser = await updateUser({ id: user.id, ...values });
        updateUserInCache(updatedUser);
        toast({
          title: 'User Updated',
          description: `Details for ${updatedUser.name} have been updated.`,
        });
      } else {
        const newUser = await createUser(values as any);
        addUserToCache(newUser);
        toast({
          title: 'User Created',
          description: `${newUser.name} has been added to the system.`,
        });
      }
      onSubmitSuccess();
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

  const isTeamDisabled = watchedRole === 'Admin' || watchedRole === 'Supervisor';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 bg-transparent border-0">
        <Card>
            <DialogHeader className="p-6 pb-0">
            <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
                {isEditing ? 'Update the details for this user.' : 'Fill out the form to add a new user.'}
            </DialogDescription>
            </DialogHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                            <Input placeholder="johndoe" {...field} disabled={isLoading}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                            <Input placeholder="John Doe" {...field} disabled={isLoading}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="name@example.com" {...field} disabled={isLoading}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder={isEditing ? 'Leave blank to keep current' : '••••••••'} {...field} disabled={isLoading}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {UserRoles.map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="team"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Team</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''} disabled={isTeamDisabled || isLoading}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a team" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {Teams.map(team => (
                                <SelectItem key={team} value={team}>{team}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                     <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {UserStatuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
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
