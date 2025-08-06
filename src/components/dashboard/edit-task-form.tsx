
'use client';

import { useState, useEffect } from 'react';
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
import { updateTask } from '@/lib/sheets';
import type { Task, TaskStatus } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';

interface EditTaskFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  task: Task;
  onTaskUpdated: (task: Task) => void;
}

const formSchema = z.object({
  name: z.string().min(3, { message: 'Task name must be at least 3 characters.' }),
  description: z.string().optional(),
  status: z.enum(['To Do', 'In Progress', 'Done']),
});

const statuses: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

export default function EditTaskForm({ isOpen, setIsOpen, task, onTaskUpdated }: EditTaskFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: task.name,
      description: task.description,
      status: task.status,
    },
  });
  
  useEffect(() => {
    if (task) {
        form.reset({
            name: task.name,
            description: task.description,
            status: task.status,
        });
    }
  }, [task, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const updatedTaskData = {
        ...task,
        ...values,
        description: values.description || '',
      };
      const updatedTask = await updateTask(updatedTaskData);
      onTaskUpdated(updatedTask);
      toast({
        title: 'Task Updated',
        description: `Task "${updatedTask.name}" has been updated.`,
      });
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
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the details for this task.</DialogDescription>
            </DialogHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Task Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Design homepage mockups" {...field} disabled={isLoading} />
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
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Add a brief description of the task..." {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {statuses.map(status => (
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
                        {isLoading ? 'Saving...' : 'Save Changes'}
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
