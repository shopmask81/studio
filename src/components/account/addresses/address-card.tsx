'use client';

import type { Address } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Phone, Trash2, Edit, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  isProcessing: boolean;
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault, isProcessing }: AddressCardProps) {

  return (
    <Card className={cn("transition-all", address.isDefault && "border-primary")}>
      <CardHeader className="flex flex-row justify-between items-start">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Home className="h-5 w-5 text-muted-foreground" />
            {address.fullName}
        </CardTitle>
        {address.isDefault && <Badge>Default</Badge>}
      </CardHeader>
      <CardContent className="text-muted-foreground space-y-2">
        <p>{address.street}</p>
        <p>{address.city}, {address.zipCode}</p>
        <p>{address.country}</p>
        {address.phone && 
            <p className="flex items-center gap-2 pt-2">
                <Phone className="h-4 w-4" />
                {address.phone}
            </p>
        }
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {!address.isDefault && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSetDefault(address.id)} 
            disabled={isProcessing}
            >
                <Star className="mr-2 h-4 w-4" />
            Set as Default
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => onEdit(address)} disabled={isProcessing}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isProcessing}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this address.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(address.id)}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
