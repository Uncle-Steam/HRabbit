import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = Math.min(100, Math.max(0, ((current) / total) * 100));

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between text-xs font-medium text-ibm-grey-500 mb-2 uppercase tracking-wider">
        <span>Knowledge Transfer Progress</span>
        <span>Gap {current} of {total}</span>
      </div>
      <div className="w-full bg-ibm-grey-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-ibm-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
