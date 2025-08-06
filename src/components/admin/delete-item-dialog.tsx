
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteItemDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onConfirm: () => Promise<void>;
  itemName: string;
  itemType: 'user' | 'client' | 'project' | 'task' | 'activity';
  isDeleting: boolean;
}

export default function DeleteItemDialog({ isOpen, setIsOpen, onConfirm, itemName, itemType, isDeleting }: DeleteItemDialogProps) {

  const handleConfirmClick = async () => {
    await onConfirm();
  };
  
  const descriptions = {
      project: `This will permanently delete the project "${itemName}", along with all of its tasks and activities. This action cannot be undone.`,
      user: `This will permanently delete the user "${itemName}". This action cannot be undone.`,
      client: `This will permanently delete the client "${itemName}". This action cannot be undone.`,
      task: `This will permanently delete the task "${itemName}" and all of its associated activity logs. This action cannot be undone.`,
      activity: `This will permanently delete ${itemName}. This action cannot be undone.`,
  }

  const title = {
    activity: 'Delete Activity Log?',
    default: 'Are you absolutely sure?'
  }

  const buttonText = {
    user: 'Yes, delete user',
    client: 'Yes, delete client',
    project: 'Yes, delete project',
    task: 'Yes, delete task',
    activity: 'Yes, delete activity',
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={isDeleting ? () => {} : setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{itemType === 'activity' ? title.activity : title.default}</AlertDialogTitle>
          <AlertDialogDescription>
            {descriptions[itemType]}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={() => setIsOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmClick}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : buttonText[itemType]}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
