
'use client';

import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, LayoutGrid, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { useCategoryCache } from '../category/category-cache-provider';

interface CategoryDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedCategory: Category | null;
  onSelectCategory: (category: Category | null) => void;
}

export function CategoryDrawer({
  isOpen,
  onOpenChange,
  selectedCategory,
  onSelectCategory,
}: CategoryDrawerProps) {
  const { categories, isLoading } = useCategoryCache();

  const handleSelect = (category: Category | null) => {
    onSelectCategory(category);
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-xl flex items-center justify-between">
            Categories
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-7 w-7">
                <X className="h-5 w-5" />
            </Button>
          </SheetTitle>
        </SheetHeader>
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <nav className="flex flex-col gap-1">
              <Button
                variant="ghost"
                onClick={() => handleSelect(null)}
                className={cn(
                  "justify-start text-base p-3 h-auto",
                  !selectedCategory && "bg-accent text-accent-foreground"
                )}
              >
                <LayoutGrid className="mr-3 h-5 w-5" />
                All Categories
              </Button>
              <Separator className="my-2" />
              {categories?.map((cat) => (
                <Button
                  key={cat.id}
                  variant="ghost"
                  onClick={() => handleSelect(cat)}
                  className={cn(
                    "justify-start text-base p-3 h-auto truncate",
                    selectedCategory?.id === cat.id && "bg-accent text-accent-foreground"
                  )}
                >
                  {cat.name}
                </Button>
              ))}
            </nav>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
