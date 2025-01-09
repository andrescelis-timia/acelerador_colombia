import { Children, cloneElement, isValidElement } from 'react';
import { TabListProps } from './types';
import { TabProps } from '@/components/atoms/Tab';

export const TabList = ({ children, selectedIndex = 0, onChange }: TabListProps) => {
  return (
    <div className="flex border-b border-gray-200">
      {Children.map(children, (child, index) => {
        if (!isValidElement<TabProps>(child)) return null;
        
        return cloneElement(child, {
          isSelected: index === selectedIndex,
          onClick: () => onChange?.(index)
        });
      })}
    </div>
  );
}; 