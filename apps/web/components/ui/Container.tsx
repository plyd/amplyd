import * as React from 'react';
import { cn } from '@/lib/utils';

export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto max-w-[1280px] px-6 lg:px-10', className)} {...props} />;
}
