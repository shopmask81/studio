
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ChevronDown, Trash2 } from 'lucide-react';
import type { Order } from '@/lib/types';

interface BulkActionsBarProps {
  selectedCount: number;
  onStatusChange: (status: Order['status']) => void;
  onDelete: () => void;
}

const orderStatuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export function BulkActionsBar({ selectedCount, onStatusChange, onDelete }: BulkActionsBarProps) {
  
  return (
    <div className="border bg-card rounded-lg p-3 flex items-center justify-between shadow-sm sticky top-16 z-20">
      <p className="text-sm font-medium">
        <span className="font-bold text-primary">{selectedCount}</span> order(s) selected
      </p>
      <div className="flex items-center gap-2">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Change Status
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Set status to...</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {orderStatuses.map(status => (
                     <DropdownMenuItem key={status} onSelect={() => onStatusChange(status)} className="capitalize">
                        {status}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the selected {selectedCount} order(s). This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Yes, delete orders</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
