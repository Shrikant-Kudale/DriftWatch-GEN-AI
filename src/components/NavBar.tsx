import React from 'react';
import { store } from '../lib/store.ts';

export type RouteKey = 'radar' | 'report' | 'review' | 'map' | 'export' | 'guide';

export interface NavBarProps {
  currentRoute: RouteKey;
  onRouteChange: (route: RouteKey) => void;
  pendingReviewsCount?: number;
}

export const NavBar: React.FC<NavBarProps> = ({
  currentRoute,
  onRouteChange,
  pendingReviewsCount,
}) => {
  const proposals = store.getProposals();
  const pendingCount =
    pendingReviewsCount ?? proposals.filter((p) => !p.decision).length;

  const links: { key: RouteKey; label: string; badge?: number }[] = [
    { key: 'radar', label: 'Radar' },
    { key: 'report', label: 'Report Change' },
    { key: 'review', label: 'Review', badge: pendingCount > 0 ? pendingCount : undefined },
    { key: 'map', label: 'Content Map' },
    { key: 'export', label: 'Export' },
    { key: 'guide', label: 'Guide' },
  ];

  return (
    <nav className="top-navbar" aria-label="Main Navigation">
      <div className="navbar-inner">
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
      </div>
    </nav>
  );
};
