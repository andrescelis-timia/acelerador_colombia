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
        'rounded-lg font-semibold shadow-sm transition-smooth inline-flex items-center justify-center',
        // Size classes
        (size === 'small' || size === 'sm') && 'px-3 py-1.5 text-xs',
        size === 'medium' && 'px-4 py-2.5 text-sm',
        size === 'large' && 'px-5 py-3 text-base',
        // Variant classes
        variant === 'primary' && 'bg-timia-accent text-white hover:bg-timia-accent-hover hover:shadow-glow-accent active:scale-[0.98]',
        variant === 'secondary' && 'bg-white/80 text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]',
        variant === 'outline' && 'border border-gray-300 bg-white text-gray-700 hover:border-timia-accent/30 hover:text-timia-accent hover:bg-red-50/30',
        fullWidth && 'w-full',
        props.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};