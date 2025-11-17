
'use client';

import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, GripVertical, Loader2 } from 'lucide-react';
import type { Banner } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface BannerTableProps {
  banners: Banner[];
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  onStatusChange: (banner: Banner, active: boolean) => void;
  onOrderChange: (banners: Banner[]) => void;
  isUpdating: boolean;
}

export function BannerTable({
  banners,
  onEdit,
  onDelete,
  onStatusChange,
  onOrderChange,
  isUpdating
}: BannerTableProps) {
  if (banners.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground border rounded-lg">
        No banners found. Start by adding a new one.
      </div>
    );
  }
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(banners);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onOrderChange(items);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
        {isUpdating && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-48">Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-24 text-center">Active</TableHead>
            <TableHead className="hidden md:table-cell w-48">Created At</TableHead>
            <TableHead className="w-16">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="banners">
                {(provided) => (
                    <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                        {banners.map((banner, index) => (
                             <Draggable key={banner.id} draggableId={banner.id} index={index}>
                                {(provided) => (
                                    <TableRow ref={provided.innerRef} {...provided.draggableProps}>
                                         <TableCell className="text-center px-2 cursor-grab" {...provided.dragHandleProps}>
                                            <GripVertical className="h-5 w-5 text-muted-foreground"/>
                                        </TableCell>
                                        <TableCell>
                                            <div className="relative aspect-video w-full max-w-40 rounded-md overflow-hidden">
                                                <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {banner.title}
                                            {banner.cta && <Badge variant="secondary" className="ml-2">{banner.cta}</Badge>}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Switch
                                                checked={banner.active}
                                                onCheckedChange={(checked) => onStatusChange(banner, checked)}
                                                aria-label="Toggle banner status"
                                            />
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {banner.createdAt ? format(banner.createdAt.toDate(), 'PPP') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => onEdit(banner)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onSelect={() => onDelete(banner)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </Draggable>
                        ))}
                         {provided.placeholder}
                    </TableBody>
                )}
            </Droppable>
        </DragDropContext>
      </Table>
    </div>
  );
}
