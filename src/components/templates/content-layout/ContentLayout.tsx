import { ReactNode } from "react";

interface ContentLayoutProps {
  children: ReactNode;
}

export const ContentLayout = ({ children }: ContentLayoutProps) => {
  return (
    <div className="flex-1 px-6">
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}; 