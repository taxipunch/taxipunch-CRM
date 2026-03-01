import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './screens/Dashboard';
import { TerritoryHealth } from './screens/TerritoryHealth';
import { NextActions } from './screens/NextActions';
import { TerritoryDetail } from './screens/TerritoryDetail';
import { IntroduceFlow } from './screens/IntroduceFlow';
import { RoadmapModal } from './screens/RoadmapModal';
import { getActionItems, getDashboardStats } from './lib/queries';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('DASHBOARD');
  const [screenContext, setScreenContext] = useState<any>({});
  const [pendingActions, setPendingActions] = useState(0);
  const [mrr, setMrr] = useState(0);
  const [showRoadmap, setShowRoadmap] = useState(false);

  useEffect(() => {
    async function loadGlobalData() {
      try {
        const actions = await getActionItems();
        setPendingActions(actions.length);
        const stats = await getDashboardStats();
        setMrr(stats.mrr);
      } catch (error) {
        console.error("Failed to load global data:", error);
      }
    }
    loadGlobalData();
  }, []);

  const navigate = (screen: string, context: any = {}) => {
    if (screen === 'ROADMAP') {
      setShowRoadmap(true);
      return;
    }
    setCurrentScreen(screen);
    setScreenContext(context);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'DASHBOARD':
        return <Dashboard navigate={navigate} />;
      case 'TERRITORY_HEALTH':
        return <TerritoryHealth navigate={navigate} />;
      case 'TERRITORY_DETAIL':
        return <TerritoryDetail territoryId={screenContext.territoryId} navigate={navigate} />;
      case 'NEXT_ACTIONS':
        return <NextActions navigate={navigate} filterType={screenContext.filterType} />;
      case 'INTRODUCE_FLOW':
        return <IntroduceFlow context={screenContext} navigate={navigate} />;
      default:
        return <Dashboard navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex">
      <Sidebar 
        currentScreen={currentScreen} 
        onNavigate={navigate} 
        pendingActions={pendingActions} 
        mrr={mrr}
      />
      
      <main className="flex-1 md:ml-[200px] pb-16 md:pb-0 min-h-screen relative">
        {renderScreen()}
      </main>

      {showRoadmap && (
        <RoadmapModal onClose={() => setShowRoadmap(false)} />
      )}
    </div>
  );
}
