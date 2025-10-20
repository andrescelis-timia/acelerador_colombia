import { cn } from '@/lib/utils';
import { BoxFlowControlsProps, IconConfig } from './types';
import { IconButton } from '@/components/atoms/IconButton';
import { ReadOnlyWrapper } from '@/components/organisms/ReadOnlyWrapper';

export const BoxFlowControls = ({ 
  leftIcons = [],
  rightIcons = [],
  centerContent,
  className
}: BoxFlowControlsProps) => (
  <div className={cn("flex items-center justify-between w-full", className)}>
    <div className="flex items-center space-x-2">
      {leftIcons.map((iconConfig: IconConfig, index) => (
        iconConfig.visible !== false && (
          <div key={index} className="flex items-center">
            {iconConfig.readOnlyWrapper ? (
              <ReadOnlyWrapper showFallback={false}>
                <IconButton
                  icon={iconConfig.icon}
                  onClick={iconConfig.onClick}
                  disabled={iconConfig.disabled}
                  className={iconConfig.className}
                  title={iconConfig.tooltip}
                />
              </ReadOnlyWrapper>
            ) : (
              <IconButton
                icon={iconConfig.icon}
                onClick={iconConfig.onClick}
                disabled={iconConfig.disabled}
                className={iconConfig.className}
                title={iconConfig.tooltip}
              />
            )}
            {iconConfig.badge && (
              <div className="ml-2">{iconConfig.badge}</div>
            )}
          </div>
        )
      ))}
    </div>

    {centerContent && (
      <div className="flex-1 text-center">
        {centerContent}
      </div>
    )}

    <div className="flex items-center space-x-2">
      {rightIcons.map((iconConfig: IconConfig, index) => (
        iconConfig.visible !== false && (
          iconConfig.readOnlyWrapper ? (
            <ReadOnlyWrapper key={index} showFallback={false}>
              <IconButton
                icon={iconConfig.icon}
                onClick={iconConfig.onClick}
                disabled={iconConfig.disabled}
                className={iconConfig.className}
                title={iconConfig.tooltip}
              />
            </ReadOnlyWrapper>
          ) : (
            <IconButton
              key={index}
              icon={iconConfig.icon}
              onClick={iconConfig.onClick}
              disabled={iconConfig.disabled}
              className={iconConfig.className}
              title={iconConfig.tooltip}
            />
          )
        )
      ))}
    </div>
  </div>
); 