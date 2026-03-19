import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import {
  LuActivity,
  LuClipboardList,
  LuLayoutDashboard,
  LuLogOut,
  LuScanLine,
} from 'react-icons/lu';

const navItems = [
  {
    to: '/home',
    label: 'Home',
    description: 'Dashboard and summary',
    icon: LuLayoutDashboard,
  },
  {
    to: '/diagnosis',
    label: 'Diagnostics',
    description: 'MRI screening workflow',
    icon: LuScanLine,
  },
  {
    to: '/diagnosis-chat',
    label: 'Diagnosis Chat',
    description: 'WhatsApp-style demo flow',
    icon: LuScanLine,
  },
  {
    to: '/reports',
    label: 'Reports',
    description: 'Clinical exports and logs',
    icon: LuClipboardList,
  },
  {
    to: '/outcome-analysis',
    label: 'Outcome Analysis',
    description: 'Detection metrics and trends',
    icon: LuActivity,
  },
];

const Sidebar = ({ collapsed = false }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-nav__label">{collapsed ? 'BTDS' : 'Navigation'}</div>

      <Nav className="sidebar-nav__list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <Nav.Link
              key={item.to}
              as={Link}
              to={item.to}
              className={`sidebar-nav__item ${active ? 'is-active' : ''}`}
            >
              <span className="sidebar-nav__indicator" />
              <span className="sidebar-nav__icon-box">
                <Icon size={18} strokeWidth={1.9} />
              </span>
              {!collapsed ? (
                <span className="sidebar-nav__copy">
                  <span className="sidebar-nav__title">{item.label}</span>
                  <span className="sidebar-nav__description">{item.description}</span>
                </span>
              ) : null}
            </Nav.Link>
          );
        })}
      </Nav>

      <div className="sidebar-nav__footer">
        <Nav.Link as={Link} to="/logout" className="sidebar-nav__item sidebar-nav__item--logout">
          <span className="sidebar-nav__indicator" />
          <span className="sidebar-nav__icon-box">
            <LuLogOut size={18} strokeWidth={1.9} />
          </span>
          {!collapsed ? (
            <span className="sidebar-nav__copy">
              <span className="sidebar-nav__title">Logout</span>
              <span className="sidebar-nav__description">End current session</span>
            </span>
          ) : null}
        </Nav.Link>
      </div>
    </aside>
  );
};

export default Sidebar;
