
'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Order } from '@/lib/types';

export type Filters = {
    orderId?: string;
    email?: string;
    status?: Order['status'];
    dateRange?: DateRange;
}

interface OrderFiltersProps {
    onFilterChange: (filters: Filters) => void;
}

const orderStatuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export function OrderFilters({ onFilterChange }: OrderFiltersProps) {
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<Order['status'] | ''>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const handleApplyFilters = () => {
        onFilterChange({
            orderId: orderId || undefined,
            email: email || undefined,
            status: status || undefined,
            dateRange: dateRange,
        });
    };

    const handleClearFilters = () => {
        setOrderId('');
        setEmail('');
        setStatus('');
        setDateRange(undefined);
        onFilterChange({});
    };
    
    const areFiltersActive = orderId || email || status || dateRange;

    return (
        <div className="p-4 bg-card rounded-lg border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                    placeholder="Search by Order ID..."
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                />
                <Input
                    placeholder="Search by customer email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Select value={status} onValueChange={(v) => setStatus(v as Order['status'] | '')}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        {orderStatuses.map(s => (
                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Filter by date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex justify-end gap-2">
                {areFiltersActive && (
                    <Button variant="ghost" onClick={handleClearFilters}>
                        <X className="mr-2 h-4 w-4"/>
                        Clear Filters
                    </Button>
                )}
                <Button onClick={handleApplyFilters}>Apply Filters</Button>
            </div>
        </div>
    );
}
