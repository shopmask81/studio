
'use client';

import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
