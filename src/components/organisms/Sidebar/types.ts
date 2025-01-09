import { ElementType } from 'react';

export interface NavItem {
  icon: ElementType;
  label: string;
  href: string;
}

export interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  navItems: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href: string;
  }[];
} 