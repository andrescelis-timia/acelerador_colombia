import { ButtonProps } from './types';
import { cn } from '../../../lib/utils';

export const Button = ({ 
  variant = 'primary',
  size = 'medium', 
  fullWidth = false,
  className,
  children,
  ...props 
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'rounded-md font-semibold shadow-sm',
        // Size classes
        (size === 'small' || size === 'sm') && 'px-2 py-1 text-xs',
        size === 'medium' && 'px-3 py-2 text-sm',
        size === 'large' && 'px-4 py-3 text-base',
        // Variant classes
        variant === 'primary' && 'bg-[#0A3977] text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'outline' && 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50',
        fullWidth && 'w-full',
        props.disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}; 