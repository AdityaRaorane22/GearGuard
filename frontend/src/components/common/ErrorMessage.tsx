import React from "react";
import { AlertCircle, X } from "lucide-react";

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  fullScreen?: boolean;
  title?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss,
  fullScreen = false,
  title = "Error",
}) => {
  const content = (
    <div className="flex gap-3">
      <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-semibold text-rose-700 mb-1">{title}</h3>
        <p className="text-sm text-rose-600 mb-3">{message}</p>
        <div className="flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs px-3 py-1.5 rounded-md bg-white hover:bg-rose-50 border border-rose-200 text-rose-700"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-500 hover:text-rose-700 flex-shrink-0 mt-1"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm grid place-items-center p-4">
        <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 max-w-md w-full shadow-lg">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[40vh] grid place-items-center p-4">
      <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 max-w-md w-full shadow-sm">
        {content}
      </div>
    </div>
  );
};

export default ErrorMessage;
