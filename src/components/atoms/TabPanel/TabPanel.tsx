import { TabPanelProps } from './types';

export const TabPanel = ({ children, isSelected }: TabPanelProps) => {
  if (!isSelected) return null;
  
  return (
    <div className="py-4">
      {children}
    </div>
  );
}; 