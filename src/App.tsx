import React, { useState, useEffect } from 'react';
import { NavBar, type RouteKey } from './components/NavBar.tsx';
import { GuideDrawer } from './components/GuideDrawer.tsx';
import { ToastProvider } from './components/Toast.tsx';
import { Radar } from './pages/Radar.tsx';
import { ReportChange } from './pages/ReportChange.tsx';
import { Review } from './pages/Review.tsx';
import { ContentMap } from './pages/ContentMap.tsx';
import { Export } from './pages/Export.tsx';
import { Guide } from './pages/Guide.tsx';
import { store } from './lib/store.ts';

export default function App() {
  const [route, setRoute] = useState<RouteKey>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash.replace(/^#\/?/, '');

    const candidate = hash || path.replace(/^\//, '');
    if (candidate === 'report') return 'report';
    if (candidate === 'review') return 'review';
    if (candidate === 'map') return 'map';
    if (candidate === 'export') return 'export';
    if (candidate === 'guide') return 'guide';
    return 'radar';
  });

  const [isGuideDrawerOpen, setIsGuideDrawerOpen] = useState(false);

  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(() => {
    return store.getProposals().filter((p) => !p.decision).length;
  });

  const handleRefreshState = () => {
    const proposals = store.getProposals();
    setPendingReviewsCount(proposals.filter((p) => !p.decision).length);
  };

  useEffect(() => {
    const onLocationChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const path = window.location.pathname.replace(/^\//, '');
      const candidate = hash || path;

      if (['radar', 'report', 'review', 'map', 'export', 'guide'].includes(candidate)) {
        setRoute(candidate as RouteKey);
      } else if (!candidate) {
        setRoute('radar');
      }
      handleRefreshState();
    };

    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  const navigateTo = (newRoute: RouteKey) => {
    setRoute(newRoute);
    window.location.hash = newRoute === 'radar' ? '' : newRoute;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleRefreshState();
  };

  return (
    <ToastProvider>
      <div className="app-container">
        {/* Top Navigation with Guide on the top right */}
        <NavBar
          currentRoute={route}
          onRouteChange={navigateTo}
          onOpenGuide={() => setIsGuideDrawerOpen(true)}
          pendingReviewsCount={pendingReviewsCount}
        />

        {/* Expansive Main Content Area */}
        <main className="main-content" role="main">
          {route === 'radar' && (
            <Radar onNavigate={navigateTo} onRefreshState={handleRefreshState} />
          )}
          {route === 'report' && (
            <ReportChange onNavigate={navigateTo} onRefreshState={handleRefreshState} />
          )}
          {route === 'review' && (
            <Review onNavigate={navigateTo} onRefreshState={handleRefreshState} />
          )}
          {route === 'map' && <ContentMap onNavigate={navigateTo} />}
          {route === 'export' && (
            <Export onNavigate={navigateTo} onRefreshState={handleRefreshState} />
          )}
          {route === 'guide' && <Guide onNavigate={navigateTo} />}
        </main>

        {/* Global Slide-Over Quick Guide Drawer */}
        <GuideDrawer
          isOpen={isGuideDrawerOpen}
          onClose={() => setIsGuideDrawerOpen(false)}
          onOpenFullGuide={() => navigateTo('guide')}
        />

        {/* App Footer */}
        <footer className="app-footer" role="contentinfo">
          <div className="footer-tagline">AI proposes. A human decides.</div>
          <div style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-muted)' }}>
            DriftWatch Documentation Intelligence • VaultLite Project Monitor
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
