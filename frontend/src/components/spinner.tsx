import React from "react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeMap = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-4",
    lg: "h-10 w-10 border-4",
};

export function Spinner({ size = "md", className = "", ...props }: SpinnerProps) {
    return (
        <div
            role="status"
            aria-label="Loading..."
            className={`inline-block animate-spin rounded-full border-current border-t-transparent text-primary-600 ${sizeMap[size]} ${className}`}
            {...props}
        />
    );
}