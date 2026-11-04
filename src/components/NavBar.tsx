import React from 'react';
import { store } from '../lib/store.ts';

export type RouteKey = 'radar' | 'report' | 'review' | 'map' | 'export' | 'guide';

export interface NavBarProps {
  currentRoute: RouteKey;
  onRouteChange: (route: RouteKey) => void;
  onOpenGuide?: () => void;
  pendingReviewsCount?: number;
}

export const NavBar: React.FC<NavBarProps> = ({
  currentRoute,
  onRouteChange,
  onOpenGuide,
  pendingReviewsCount,
}) => {
  const proposals = store.getProposals();
  const pages = store.getPages();
  const pendingCount =
    pendingReviewsCount ?? proposals.filter((p) => !p.decision).length;

  // Guide moved from last tab to the top right as requested!
  const links: { key: RouteKey; label: string; badge?: number }[] = [
    { key: 'radar', label: 'Radar' },
    { key: 'report', label: 'Report Change' },
    { key: 'review', label: 'Review', badge: pendingCount > 0 ? pendingCount : undefined },
    { key: 'map', label: 'Content Map' },
    { key: 'export', label: 'Export' },
  ];

  return (
    <nav className="top-navbar" aria-label="Main Navigation">
      <div className="navbar-inner">
        {/* Left Brand Area */}
        <div className="brand-section">
          <a
            href="#radar"
            className="brand-logo"
            onClick={(e) => {
              e.preventDefault();
              onRouteChange('radar');
            }}
            aria-label="DriftWatch Home"
          >
            <span className="brand-dot" />
            <span>DriftWatch</span>
          </a>
          <span className="brand-badge" title="Monitored Project Repository">
            VaultLite {pages.length > 0 ? `(${pages.length} docs)` : ''}
          </span>
        </div>

        {/* Center/Left Navigation Links */}
        <ul className="nav-links">
          {links.map((link) => {
            const isActive = currentRoute === link.key;
            return (
              <li key={link.key}>
                <a
                  href={`#${link.key}`}
                  className={`nav-link-item ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onRouteChange(link.key);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                  {link.badge !== undefined && (
                    <span className="nav-badge" title={`${link.badge} pending reviews`}>
                      {link.badge}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Right Top Action: Guide & How-to-Use button */}
        <div className="nav-right-actions">
          <button
            type="button"
            className="how-to-use-btn"
            onClick={() => {
              if (onOpenGuide) {
                onOpenGuide();
              } else {
                onRouteChange('guide');
              }
            }}
            aria-label="Open documentation sync guide"
            title="Open 5-step workflow handbook & quick reference"
          >
            <span style={{ fontSize: '1.05rem' }}>📖</span>
            <span>How to Use</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
