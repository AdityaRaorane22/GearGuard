import React from "react";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  label?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  fullScreen = false,
  label,
}) => {
  const spinnerContent = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeClasses[size]} rounded-full border-4 border-emerald-400 border-t-transparent animate-spin`}
      />
      {label && <p className="text-sm text-slate-400">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm grid place-items-center">
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="min-h-[40vh] grid place-items-center">
      {spinnerContent}
    </div>
  );
};

export default LoadingSpinner;
