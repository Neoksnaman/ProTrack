
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { Project, ProjectPriority, ProjectStatus, User, Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createProject } from '@/lib/sheets';
import { useAuth } from '@/hooks/use-auth';
import { useData } from '@/hooks/use-data';
import ClientForm from '../admin/client-form';
import { useTopLoaderStore } from '@/stores/use-top-loader-store';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Project name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  clientId: z.string({ required_error: 'Please select or create a client.' }),
  teamLeaderId: z.string({ required_error: 'Please select a team leader.' }),
  teamMemberIds: z.array(z.string()).min(1, { message: 'Please select at least one team member.' }),
  startDate: z.date({ required_error: 'A start date is required.' }),
  deadline: z.date({ required_error: 'A deadline is required.' }),
  status: z.enum(['Planning', 'In Progress', 'Blocked', 'Completed']),
  priority: z.enum(['High', 'Medium', 'Low']),
});

export default function CreateProjectForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { users: allUsers, clients, addProjectToCache, addClientToCache } = useData();
  const { start } = useTopLoaderStore();
  const [isLoading, setIsLoading] = useState(false);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [leaderPopoverOpen, setLeaderPopoverOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false);
  const [deadlinePopoverOpen, setDeadlinePopoverOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      teamMemberIds: [],
      status: 'Planning',
      priority: 'Medium',
      startDate: undefined,
      deadline: undefined,
    },
  });

  const selectedTeamLeader = form.watch('teamLeaderId');
  const selectedTeamMembers = form.watch('teamMemberIds') || [];

  const availableLeaders = useMemo(() => {
    if (!currentUser) return [];

    let leaders: User[] = [];
    const role = currentUser.role;

    if (role === 'Admin' || role === 'Supervisor') {
      leaders = allUsers.filter(user => !selectedTeamMembers.includes(user.id));
    } else if (role === 'Senior') {
      const teamMembers = allUsers.filter(u => u.team === currentUser.team && u.id !== currentUser.id);
      leaders = [currentUser, ...teamMembers].filter(user => !selectedTeamMembers.includes(user.id));
    } else if (role === 'Associate') {
      leaders = [currentUser];
    }

    return leaders.sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers, selectedTeamMembers, currentUser]);

  const availableMembers = useMemo(() => {
    return allUsers
      .filter(user => user.id !== selectedTeamLeader)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers, selectedTeamLeader]);

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return sortedClients;
    return sortedClients.filter(client => client.name.toLowerCase().includes(clientSearch.toLowerCase()));
  }, [sortedClients, clientSearch]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const newProjectData = {
        ...values,
        startDate: format(values.startDate, 'yyyy-MM-dd'),
        deadline: format(values.deadline, 'yyyy-MM-dd'),
      };

      const newProject = await createProject(newProjectData as any);
      addProjectToCache(newProject);
      
      toast({
        title: 'Project Created',
        description: `Project "${newProject.name}" has been successfully created.`,
      });
      
      router.push('/');
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error Creating Project',
        description: error instanceof Error ? error.message : 'Could not create project.',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleShowClientForm = () => {
    setClientPopoverOpen(false);
    setIsClientFormOpen(true);
  }

  const handleClientCreated = (newClient: Client) => {
    addClientToCache(newClient);
    form.setValue('clientId', newClient.id);
    setClientSearch(''); // Reset search after creation
    setIsClientFormOpen(false);
  }
  
  const showCreateClientOption = clientSearch && !filteredClients.some(c => c.name.toLowerCase() === clientSearch.toLowerCase());
  
  const handleCancel = () => {
    start();
    router.push('/');
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Q4 Product Launch" {...field} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the project goals and objectives." className="resize-y" {...field} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Client</FormLabel>
                    <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isLoading}
                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? clients.find(client => client.id === field.value)?.name : 'Select or create a client'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search or create client..."
                            value={clientSearch}
                            onValueChange={setClientSearch}
                          />
                          <CommandList className="max-h-[12rem]">
                            {showCreateClientOption && (
                                <CommandItem
                                  onSelect={handleShowClientForm}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <PlusCircle className="h-4 w-4" />
                                  Create "{clientSearch}"
                                </CommandItem>
                              )}
                            <CommandGroup>
                              {filteredClients.map(client => (
                                <CommandItem
                                  value={client.name}
                                  key={client.id}
                                  onSelect={() => {
                                    form.setValue('clientId', client.id);
                                    setClientSearch(client.name);
                                    setClientPopoverOpen(false);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check className={cn('mr-2 h-4 w-4', client.id === field.value ? 'opacity-100' : 'opacity-0')} />
                                  {client.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                             <CommandEmpty>
                              {clientSearch ? (
                                <Button variant="ghost" className="w-full justify-start font-normal" onClick={handleShowClientForm}>
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Create "{clientSearch}"
                                </Button>
                              ) : 'No clients found.'}
                            </CommandEmpty>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teamLeaderId"
                render={({ field }) => (
                   <FormItem className="flex flex-col">
                    <FormLabel>Team Leader</FormLabel>
                    <Popover open={leaderPopoverOpen} onOpenChange={setLeaderPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isLoading}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? availableLeaders.find(
                                  (leader) => leader.id === field.value
                                )?.name
                              : "Select a team leader"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search leader..." />
                          <CommandList className="max-h-[12rem]">
                            <CommandEmpty>No users found.</CommandEmpty>
                            <CommandGroup>
                              {availableLeaders.map((user) => (
                                <CommandItem
                                  value={user.name}
                                  key={user.id}
                                  onSelect={() => {
                                    form.setValue('teamLeaderId', user.id)
                                     if (selectedTeamMembers.includes(user.id)) {
                                      form.setValue('teamMemberIds', selectedTeamMembers.filter(id => id !== user.id));
                                    }
                                    setLeaderPopoverOpen(false);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      user.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {user.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teamMemberIds"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Team Members</FormLabel>
                     <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isLoading}
                            className={cn(
                              "w-full justify-between",
                              !field.value?.length && "text-muted-foreground"
                            )}
                          >
                            {field.value?.length > 0
                              ? `${field.value.length} selected`
                              : "Select team members"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search members..." />
                          <CommandList className="max-h-[12rem]">
                            <CommandEmpty>No users found.</CommandEmpty>
                            <CommandGroup>
                              {availableMembers.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  onSelect={() => {
                                    const currentValues = field.value || [];
                                    const newValue = currentValues.includes(user.id)
                                      ? currentValues.filter((id) => id !== user.id)
                                      : [...currentValues, user.id];
                                    field.onChange(newValue);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      (field.value || []).includes(user.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {user.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover open={startDatePopoverOpen} onOpenChange={setStartDatePopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              disabled={isLoading}
                              className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                           <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setStartDatePopoverOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Deadline</FormLabel>
                      <Popover open={deadlinePopoverOpen} onOpenChange={setDeadlinePopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              disabled={isLoading}
                              className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                           <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setDeadlinePopoverOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select initial status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Blocked">Blocked</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                 <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating Project...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <ClientForm
        isOpen={isClientFormOpen}
        setIsOpen={setIsClientFormOpen}
        client={null}
        onClientCreated={handleClientCreated}
        initialName={clientSearch}
      />
    </>
  );
}

    