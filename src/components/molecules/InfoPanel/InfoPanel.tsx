'use client';

import { InfoPanelProps } from './types';

export const InfoPanel = ({
  title,
  children,
  variant = 'neutral',
  className = ''
}: InfoPanelProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'info':
        return {
          container: 'bg-white border border-info-border rounded-lg',
          header: 'px-4 py-3 border-b border-info-border bg-gray-50',
          title: 'text-lg font-medium text-blue-900'
        };
      case 'warning':
        return {
          container: 'bg-white border border-warning-border rounded-lg',
          header: 'px-4 py-3 border-b border-warning-border bg-warning-subtle',
          title: 'text-lg font-medium text-amber-900'
        };
      case 'success':
        return {
          container: 'bg-white border border-success-border rounded-lg',
          header: 'px-4 py-3 border-b border-success-border bg-success-subtle',
          title: 'text-lg font-medium text-green-900'
        };
      default: // neutral
        return {
          container: 'bg-white border border-gray-200 rounded-lg',
          header: 'px-4 py-3 border-b border-gray-200 bg-gray-50',
          title: 'text-lg font-medium text-gray-900'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`mb-6 ${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};