
'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Search, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Order } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';

export type Filters = {
    searchQuery?: string;
    status?: Order['status'];
    dateRange?: DateRange;
}

interface OrderFiltersProps {
    onFilterChange: (filters: Filters) => void;
}

const orderStatuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export function OrderFilters({ onFilterChange }: OrderFiltersProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [status, setStatus] = useState<Order['status'] | ''>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    
    // Debounce the search query to avoid excessive re-renders while typing
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // This effect calls the parent component's onFilterChange when any filter value changes.
    useEffect(() => {
        onFilterChange({
            searchQuery: debouncedSearchQuery || undefined,
            status: status || undefined,
            dateRange: dateRange,
        });
    }, [debouncedSearchQuery, status, dateRange, onFilterChange]);


    const handleClearFilters = () => {
        setSearchQuery('');
        setStatus('');
        setDateRange(undefined);
    };
    
    const areFiltersActive = searchQuery || status || dateRange;

    return (
        <div className="p-4 bg-card rounded-lg border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by ID, name, email, phone, address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={status} onValueChange={(v) => setStatus(v === 'all' ? '' : v as Order['status'])}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
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
                        Clear All Filters
                    </Button>
                )}
            </div>
        </div>
    );
}

