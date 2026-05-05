import { TabProps } from './types';

export const Tab = ({ children, isSelected, onClick }: TabProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 font-medium text-sm rounded-t-lg transition-smooth
        ${isSelected 
          ? 'text-timia-accent border-b-2 border-timia-accent' 
          : 'text-gray-500 hover:text-gray-700'
        }`}
    >
      {children}
    </button>
  );
}; 