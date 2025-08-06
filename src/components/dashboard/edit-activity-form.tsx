
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
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
import { updateActivity } from '@/lib/sheets';
import type { Activity, Task } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { Card, CardContent } from '../ui/card';

interface EditActivityFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activity: Activity;
  tasks: Task[];
  onActivityUpdated: (activity: Activity) => void;
}

const formSchema = z.object({
  activity: z.string().min(3, { message: 'Activity description must be at least 3 characters.' }),
  taskId: z.string({ required_error: 'Please select a task.' }),
  date: z.date({ required_error: 'Please select a date.' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format (HH:mm)." }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format (HH:mm)." }),
}).refine(data => {
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
        return false;
    }
    return true;
}, {
    message: 'End time must be after start time.',
    path: ['endTime'],
});

export default function EditActivityForm({ isOpen, setIsOpen, activity, tasks, onActivityUpdated }: EditActivityFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const padTime = (time: string) => {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  useEffect(() => {
    if (activity) {
      form.reset({
        activity: activity.activity,
        taskId: activity.taskId,
        date: parseISO(activity.date),
        startTime: padTime(activity.startTime),
        endTime: padTime(activity.endTime),
      });
    }
  }, [activity, form, isOpen]);
  

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const updatedActivityData = {
        ...activity,
        ...values,
        date: format(values.date, 'yyyy-MM-dd'),
        startTime: padTime(values.startTime),
        endTime: padTime(values.endTime),
      };
      
      const updatedActivity = await updateActivity(updatedActivityData);
      onActivityUpdated(updatedActivity);
      
      toast({
        title: 'Activity Updated',
        description: `Your activity log has been successfully updated.`,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Updating Activity',
        description: error instanceof Error ? error.message : 'Could not update activity.',
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
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>Update the details of your logged activity.</DialogDescription>
            </DialogHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                    control={form.control}
                    name="taskId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Task</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a task" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {tasks.map(task => (
                                <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="activity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Activity Description</FormLabel>
                        <FormControl>
                            <Textarea {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Activity Date</FormLabel>
                            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
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
                                  setDatePopoverOpen(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                                <Input type="time" {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                                <Input type="time" {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
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
