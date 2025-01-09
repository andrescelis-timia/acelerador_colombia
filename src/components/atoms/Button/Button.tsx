import { ButtonProps } from './types';
import { cn } from '../../../lib/utils';

export const Button = ({ 
  variant = 'primary', 
  fullWidth = false,
  className,
  children,
  ...props 
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'rounded-md px-3 py-2 text-sm font-semibold shadow-sm',
        variant === 'primary' && 'bg-[#0A3977] text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}; 