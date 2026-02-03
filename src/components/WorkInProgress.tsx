import React from 'react';

interface WorkInProgressProps {
  title: string;
  description?: string;
  icon?: string;
}

const WorkInProgress: React.FC<WorkInProgressProps> = ({ 
  title, 
  description = "This feature is currently under development and will be available soon.",
  icon = "🚧"
}) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="text-8xl mb-6">{icon}</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-600 text-lg mb-6">{description}</p>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
          <div className="flex items-center">
            <span className="text-yellow-600 text-xl mr-3">⚠️</span>
            <p className="text-yellow-700 font-medium">Work in Progress</p>
          </div>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <p>Phase 2 & 3 features coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default WorkInProgress;
