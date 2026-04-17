import * as React from 'react';

import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl border border-lake/20 bg-white/75 px-3 py-2 text-sm text-ink outline-none ring-0 transition placeholder:text-ink/45 focus:border-lake focus:bg-white',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
