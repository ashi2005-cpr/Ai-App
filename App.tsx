
import React, { useState } from 'react';
import { AppTab } from './types';
import ImageStudio from './components/ImageStudio';
import VideoHub from './components/VideoHub';
import AiChat from './components/AiChat';
import { ImagePlusIcon, VideoIcon, BotIcon } from './components/common/Icon';


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.IMAGE);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.IMAGE:
        return <ImageStudio />;
      case AppTab.VIDEO:
        return <VideoHub />;
      case AppTab.CHAT:
        return <AiChat />;
      default:
        return null;
    }
  };
  
  const tabs = [
    { name: AppTab.IMAGE, icon: <ImagePlusIcon className="h-5 w-5" /> },
    { name: AppTab.VIDEO, icon: <VideoIcon className="h-5 w-5" /> },
    { name: AppTab.CHAT, icon: <BotIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4 border-b border-gray-700">
                  <h1 className="text-2xl font-bold text-white">
                      Gemini <span className="text-blue-400">Creative Suite</span>
                  </h1>
                  <nav className="hidden md:flex space-x-2 bg-gray-800 p-1 rounded-lg">
                       {tabs.map((tab) => (
                           <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${
                                    activeTab === tab.name
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                {tab.icon}
                                {tab.name}
                           </button>
                       ))}
                  </nav>
              </div>
          </div>
      </header>

      <main>
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around p-2">
          {tabs.map((tab) => (
               <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className={`flex flex-col items-center justify-center w-full p-2 rounded-md transition-colors ${
                        activeTab === tab.name
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    {tab.icon}
                    <span className="text-xs mt-1">{tab.name}</span>
               </button>
           ))}
      </nav>
    </div>
  );
};

export default App;
