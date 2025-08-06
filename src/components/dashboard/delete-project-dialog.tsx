
'use client';

import { useState } from 'react';
import DeleteItemDialog from "@/components/admin/delete-item-dialog";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onConfirm: () => void;
  projectName: string;
}

export default function DeleteProjectDialog({ isOpen, setIsOpen, onConfirm, projectName }: DeleteProjectDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
        } finally {
            setIsDeleting(false);
            // The parent component will handle closing the dialog on success
        }
    }

  return (
    <DeleteItemDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onConfirm={handleConfirm}
        itemName={projectName}
        itemType="project"
        isDeleting={isDeleting}
    />
  );
}
