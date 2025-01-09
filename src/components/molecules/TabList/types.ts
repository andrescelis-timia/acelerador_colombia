export interface TabListProps {
  children: React.ReactNode;
  selectedIndex?: number;
  onChange?: (index: number) => void;
} 