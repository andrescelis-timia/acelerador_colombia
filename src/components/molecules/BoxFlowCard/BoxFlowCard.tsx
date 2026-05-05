import { ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { BoxFlowCardProps } from './types';

export const BoxFlowCard = ({ 
  title, 
  schema,
  onFileClick, 
  selectedFile,
  isStatic = false,
  className,
  controls
}: BoxFlowCardProps) => {
  const isStringTitle = typeof title === 'string';
  const titleClasses = isStringTitle 
    ? "text-sm font-medium text-gray-900 truncate max-w-[120px]"
    : "text-sm font-medium text-gray-900 text-center max-w-[120px]";
  
  return (
    <div className={cn("w-[200px] h-[150px] flex-shrink-0 rounded-lg", className)}>
      <div className="h-full rounded-lg bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 p-2 bg-gray-50/80 h-[40px] flex items-center">
          {controls}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-center">
          {isStatic ? (
            <div className="flex items-center justify-center mb-2">
              <span className={titleClasses} title={isStringTitle ? title as string : undefined}>
                {title}
              </span>
            </div>
          ) : (
            <div 
              className="flex items-center justify-center mb-2 cursor-pointer group"
              onClick={onFileClick}
            >
              <span className={cn(titleClasses, "group-hover:text-timia-accent transition-colors")} title={isStringTitle ? title as string : undefined}>
                {title}
              </span>
              {onFileClick && (
                <ArrowUpTrayIcon 
                  className={cn(
                    "h-4 w-4 ml-2 flex-shrink-0 transition-colors",
                    selectedFile 
                      ? "text-green-500" 
                      : "text-gray-500 group-hover:text-timia-accent"
                  )}
                />
              )}
            </div>
          )}
          {schema && <div className="text-xs text-gray-500 text-center">{schema}</div>}
        </div>
      </div>
    </div>
  );
}; 