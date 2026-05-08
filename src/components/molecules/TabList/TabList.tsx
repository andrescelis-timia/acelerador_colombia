import { Children, cloneElement, isValidElement } from 'react';
import { TabListProps } from './types';
import { TabProps } from '@/components/atoms/Tab';

export const TabList = ({ children, selectedIndex = 0, onChange }: TabListProps) => {
  // Children.toArray filtra null/undefined/false/true. Asi los indices se alinean
  // con los TabPanel del TabGroup cuando hay tabs renderizados condicionalmente
  // ({condition && <Tab/>}); usar Children.map dejaria gaps en el index.
  const validTabs = Children.toArray(children).filter(
    (child): child is React.ReactElement<TabProps> => isValidElement<TabProps>(child)
  );

  return (
    <div className="flex border-b border-gray-200">
      {validTabs.map((child, index) =>
        cloneElement(child, {
          isSelected: index === selectedIndex,
          onClick: () => onChange?.(index),
        })
      )}
    </div>
  );
}; 