import { IconButtonProps } from './types';
import { cn } from '../../../lib/utils';

export const IconButton = ({ icon, onClick, disabled, className, title }: IconButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "h-4 w-4 text-gray-400",
      !disabled && "hover:text-timia-accent transition-smooth",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}
  >
    {icon}
  </button>
); 