import React from "react";
import { InboxIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  fullScreen?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <InboxIcon className="w-12 h-12 text-slate-400" />,
  title,
  description,
  action,
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex justify-center">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-[40vh] grid place-items-center p-4">
      {content}
    </div>
  );
};

export default EmptyState;
