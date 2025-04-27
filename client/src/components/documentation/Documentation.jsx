import React, { useState } from 'react';

// icons
import { Menu, X, ChevronRight } from 'lucide-react';

const Documentation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className={`fixed lg:relative inset-y-0 left-0 transform ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 transition-transform duration-200 ease-in-out lg:block w-64 overflow-y-auto h-[calc(100vh-4rem)] pb-10 ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          } lg:bg-transparent`}>
            <nav className="space-y-1 px-2">
              {[
                { name: 'Getting Started', isActive: true },
                { name: 'Core Concepts', submenu: ['Overview', 'Architecture', 'Best Practices'] },
                { name: 'Capabilities', submenu: ['Natural Language', 'Code Generation', 'Analysis'] },
                { name: 'Safety & Ethics' },
                { name: 'API Reference' },
                { name: 'Examples' }
              ].map((item, index) => (
                <div key={index} className="space-y-1">
                  <a href="#" className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                    item.isActive 
                      ? (isDarkMode ? 'bg-gray-800 text-purple-400' : 'bg-purple-50 text-purple-700')
                      : (isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50')
                  }`}>
                    <span className="truncate">{item.name}</span>
                    {item.submenu && <ChevronRight size={16} className="ml-auto" />}
                  </a>
                  {item.submenu && (
                    <div className="ml-4 space-y-1">
                      {item.submenu.map((subitem, subindex) => (
                        <a
                          key={subindex}
                          href="#"
                          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                            isDarkMode 
                              ? 'text-gray-400 hover:bg-gray-800' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {subitem}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Hero Section */}
            <div className={`p-8 rounded-2xl mb-8 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-purple-50 to-pink-50'
            }`}>
              <h1 className="text-4xl font-bold mb-4">Welcome to Claude</h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Explore how BargainWala simplifies your business operations with efficient order management, billing, analytics, and more. Dive into our features designed to transform the way you work and drive your business forward
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Natural Language Processing",
                  description: "Understand and generate human-like text for various purposes including analysis, writing, and more."
                },
                {
                  title: "Code Generation & Analysis",
                  description: "Get help with programming tasks, code review, and technical documentation across multiple languages."
                },
                {
                  title: "Data Analysis",
                  description: "Process and analyze data, create visualizations, and derive meaningful insights from complex datasets."
                },
                {
                  title: "Safety & Ethics",
                  description: "Learn about my built-in safety measures and ethical principles that guide my responses."
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl ${
                    isDarkMode 
                      ? 'bg-gray-800 hover:bg-gray-750' 
                      : 'bg-white hover:bg-gray-50'
                  } shadow-sm transition-colors duration-200 cursor-pointer`}
                >
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Start Section */}
            <div className={`mt-8 p-6 rounded-xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-sm`}>
              <h2 className="text-2xl font-semibold mb-4">Quick Start Guide</h2>
              <div className="space-y-4">
                {[
                  "Start with clear, specific requests",
                  "Provide context and examples when needed",
                  "Break down complex tasks into smaller steps",
                  "Ask for clarification if my responses aren't clear"
                ].map((tip, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`h-6 w-6 rounded-full ${
                      isDarkMode ? 'bg-purple-600' : 'bg-purple-100'
                    } flex items-center justify-center`}>
                      <span className={`text-sm ${
                        isDarkMode ? 'text-white' : 'text-purple-600'
                      }`}>{index + 1}</span>
                    </div>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {tip}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
