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
}: BoxFlowCardProps) => (
  <div className={cn("w-full flex-shrink-0 rounded-lg", className)}>
    <div className="h-full border-2 border-gray-400 rounded-lg bg-white shadow-sm overflow-hidden">
      <div className="border-b-2 border-gray-400 p-2 bg-white">
        {controls}
      </div>
      <div className="p-4">
        {isStatic ? (
          <div className="flex items-center justify-center mb-2">
            <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]" title={title}>
              {title}
            </span>
          </div>
        ) : (
          <div 
            className="flex items-center justify-center mb-2 cursor-pointer group"
            onClick={onFileClick}
          >
            <span className="text-sm font-medium group-hover:text-blue-600 transition-colors truncate max-w-[120px]" title={title}>
              {title}
            </span>
            {onFileClick && (
              <ArrowUpTrayIcon 
                className={cn(
                  "h-4 w-4 ml-2 flex-shrink-0 transition-colors",
                  selectedFile 
                    ? "text-green-500" 
                    : "text-gray-500 group-hover:text-blue-600"
                )}
              />
            )}
          </div>
        )}
        {schema && <div className="text-xs text-gray-500">{schema}</div>}
      </div>
    </div>
  </div>
); 