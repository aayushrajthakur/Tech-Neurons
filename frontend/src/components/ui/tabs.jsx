import React, { useState, Children, cloneElement, useEffect, useRef } from 'react';

// Tabs container
export const Tabs = ({ defaultValue = '', children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const tabList = Children.toArray(children).find(
    (child) => child.type.displayName === 'TabsList'
  );

  const contents = Children.toArray(children).filter(
    (child) => child.type.displayName === 'TabsContent'
  );

  const activeContent = contents.find(
    (content) => content.props.value === activeTab
  );

  return (
    <div className="w-full">
      {tabList && cloneElement(tabList, { activeTab, setActiveTab })}
      <div className="mt-4 transition-opacity duration-300 ease-in-out opacity-100 animate-fade">
        {activeContent}
      </div>
    </div>
  );
};

// Tab header row with auto-scroll to selected tab
export const TabsList = ({ children, activeTab, setActiveTab }) => {
  const listRef = useRef(null);

  useEffect(() => {
    const activeIndex = Children.toArray(children).findIndex(
      (child) => child.props.value === activeTab
    );
    if (listRef.current && activeIndex !== -1) {
      const activeButton = listRef.current.children[activeIndex];
      if (activeButton?.scrollIntoView) {
        activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeTab, children]);

  return (
    <div
      ref={listRef}
      className="flex space-x-4 overflow-x-auto border-b pb-2 no-scrollbar"
    >
      {Children.map(children, (child) =>
        cloneElement(child, {
          isActive: activeTab === child.props.value,
          onClick: () => setActiveTab(child.props.value)
        })
      )}
    </div>
  );
};

// Individual tab button
export const TabsTrigger = ({ value, children, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap px-4 py-2 rounded-t text-sm font-medium transition-all ${
      isActive
        ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
        : 'text-gray-500 hover:text-blue-500'
    }`}
  >
    {children}
  </button>
);

// Tab content block
export const TabsContent = ({ children }) => (
  <div className="animate-fade-in">{children}</div>
);

// Display names
TabsList.displayName = 'TabsList';
TabsTrigger.displayName = 'TabsTrigger';
TabsContent.displayName = 'TabsContent';
