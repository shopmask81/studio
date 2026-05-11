
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { Affiliate } from '@/lib/types';
import { format } from 'date-fns';
import { useCurrency } from '@/components/currency/currency-provider';

interface AffiliateTableProps {
  affiliates: Affiliate[];
  onEdit: (affiliate: Affiliate) => void;
  onDelete: (affiliate: Affiliate) => void;
  onStatusChange: (affiliate: Affiliate, status: Affiliate['status']) => void;
}

export function AffiliateTable({
  affiliates,
  onEdit,
  onDelete,
  onStatusChange,
}: AffiliateTableProps) {
  const { formatPrice } = useCurrency();

  if (affiliates.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground border rounded-lg">
        No affiliates found.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Affiliate</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead className="text-right">Earnings</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Created At</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {affiliates.map((affiliate) => (
            <TableRow key={affiliate.id}>
              <TableCell>
                <div>
                    <p className="font-medium">{affiliate.name}</p>
                    <p className="text-xs text-muted-foreground">{affiliate.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                    {affiliate.code}
                </code>
              </TableCell>
              <TableCell>{(affiliate.commissionRate * 100).toFixed(0)}%</TableCell>
              <TableCell className="text-right font-mono">{affiliate.totalOrders || 0}</TableCell>
              <TableCell className="text-right font-mono font-bold text-primary">
                {formatPrice(affiliate.totalEarnings || 0)}
              </TableCell>
              <TableCell>
                <Badge variant={affiliate.status === 'active' ? 'default' : 'destructive'}>
                  {affiliate.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                {affiliate.createdAt ? format(affiliate.createdAt.toDate(), 'PP') : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => onEdit(affiliate)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    
                    {affiliate.status === 'active' ? (
                        <DropdownMenuItem onSelect={() => onStatusChange(affiliate, 'suspended')}>
                            <ShieldAlert className="mr-2 h-4 w-4" /> Suspend
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onSelect={() => onStatusChange(affiliate, 'active')}>
                            <ShieldCheck className="mr-2 h-4 w-4" /> Activate
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => onDelete(affiliate)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
