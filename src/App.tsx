import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          Welcome to Kiddoo
        </h1>
        
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Frontend Status
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">React:</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Working
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">TypeScript:</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Working
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tailwind CSS:</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Working
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-gray-500 text-sm">
            Your frontend is ready! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
 