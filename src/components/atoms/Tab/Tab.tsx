import { TabProps } from './types';

export const Tab = ({ children, isSelected, onClick }: TabProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors
        ${isSelected 
          ? 'text-[#00A3FF] border-b-2 border-[#00A3FF]' 
          : 'text-gray-500 hover:text-gray-700'
        }`}
    >
      {children}
    </button>
  );
}; 