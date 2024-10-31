import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({ value, max = 100, className }) => {
  // Asegurarse de que el valor esté dentro del rango
  const safeValue = Math.min(Math.max(value, 0), max);

  return (
    <div className={`relative w-full h-4 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-blue-500 transition-all"
        style={{ width: `${(safeValue / max) * 100}%` }}
      />
    </div>
  );
};

export { Progress };
