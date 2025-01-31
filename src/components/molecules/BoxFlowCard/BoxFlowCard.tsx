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
  <div className={cn("w-[200px] h-[150px] flex-shrink-0 rounded-lg", className)}>
    <div className="h-full rounded-lg bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="border-b border-[#94B5F0] p-2 bg-white h-[40px] flex items-center">
        {controls}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-center">
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
        {schema && <div className="text-xs text-gray-500 text-center">{schema}</div>}
      </div>
    </div>
  </div>
); 