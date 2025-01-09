'use client';

import { useState, Children, ReactElement, isValidElement, cloneElement } from 'react';
import { TabGroupProps } from './types';
import { TabList } from '../TabList';
import { TabPanel, TabPanelProps } from '@/components/atoms/TabPanel';
import { TabListProps } from '../TabList/types';

export const TabGroup = ({ children, defaultIndex = 0 }: TabGroupProps) => {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);

  const tabList = Children.toArray(children).find(
    (child): child is React.ReactElement<TabListProps> => 
      isValidElement(child) && child.type === TabList
  );

  if (!tabList) return null;

  const panels = Children.toArray(children).filter(
    (child) => isValidElement(child) && child.type === TabPanel
  ) as ReactElement<TabPanelProps>[];

  return (
    <div>
      {cloneElement(tabList as React.ReactElement<TabListProps>, {
        selectedIndex,
        onChange: setSelectedIndex,
      })}
      {panels.map((panel, index) =>
        isValidElement(panel) &&
        cloneElement(panel, {
          key: index,
          isSelected: index === selectedIndex,
        })
      )}
    </div>
  );
}; 