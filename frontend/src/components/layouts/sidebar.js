import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

// ── Update routes to match your actual app ───────────────────────────────────
const NAV = [
  {
    group: 'Clinical',
    items: [
      {
        label: 'Dashboard',
        to: '/home',
        icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      },
      {
        label: 'Diagnosis',
        to: '/diagnosis',
        badge: 'AI',
        icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
      },
      {
        label: 'Patients',
        to: '/patients',
        icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      },
      {
        label: 'Medical Records',
        to: '/records',
        icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
      },
    ],
  },
  {
    group: 'Analytics',
    items: [
      {
        label: 'Reports',
        to: '/reports',
        icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      },
      {
        label: 'Outcome Analysis',
        to: '/outcome-analysis',
        icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>,
      },
      {
        label: 'Audit Log',
        to: '/audit',
        icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
      },
    ],
  },
  {
    group: 'System',
    items: [
      {
        label: 'Settings',
        to: '/settings',
        icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      },
    ],
  },
];

const Sidebar = ({ collapsed = false }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      <style>{`
        :root {
          --teal:      #0a7b6e;
          --teal-dark: #075e55;
          --teal-soft: #e7f6f3;
          --navy:      #10273b;
          --slate:     #567080;
          --border:    #d9ebe7;
          --white:     #ffffff;
          --bg:        #f7fbfa;
          --font-sans: 'DM Sans', system-ui, sans-serif;
        }

        .sb-root {
          height: 100%; display: flex; flex-direction: column;
          font-family: var(--font-sans); overflow: hidden;
        }

        /* ── SCROLL AREA ── */
        .sb-scroll {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          padding: 1rem 0.5rem;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
        .sb-scroll::-webkit-scrollbar { width: 3px; }
        .sb-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

        /* ── GROUP ── */
        .sb-group { margin-bottom: 0.25rem; }
        .sb-group-label {
          font-size: 0.63rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.09em; color: var(--slate);
          padding: 0.65rem 0.75rem 0.3rem;
          white-space: nowrap; overflow: hidden;
          transition: opacity .15s, max-height .15s;
          opacity: ${props => props.collapsed ? 0 : 1};
          max-height: ${props => props.collapsed ? '0' : '2rem'};
        }

        /* ── ITEM ── */
        .sb-item {
          display: flex; align-items: center; gap: 0.65rem;
          padding: 0 0.7rem; height: 38px;
          border-radius: 0.75rem; margin: 1px 0;
          text-decoration: none; cursor: pointer;
          color: var(--slate); font-size: 0.855rem; font-weight: 500;
          transition: background .15s, color .15s;
          white-space: nowrap; overflow: hidden;
          position: relative;
        }
        .sb-item:hover {
          background: var(--teal-soft);
          color: var(--teal-dark);
        }
        .sb-item.active {
          background: var(--teal-soft);
          color: var(--teal);
          font-weight: 600;
        }
        .sb-item.active .sb-icon { color: var(--teal); }

        /* Active left bar */
        .sb-item.active::before {
          content: '';
          position: absolute; left: -0.5rem; top: 50%; transform: translateY(-50%);
          width: 3px; height: 18px;
          background: var(--teal); border-radius: 0 3px 3px 0;
        }

        .sb-icon {
          flex-shrink: 0; width: 17px; height: 17px;
          display: flex; align-items: center; justify-content: center;
          color: var(--slate);
          transition: color .15s;
        }

        .sb-label {
          flex: 1; overflow: hidden; text-overflow: ellipsis;
          transition: opacity .15s;
        }

        .sb-badge {
          font-size: 0.6rem; font-weight: 700;
          padding: 1px 6px; border-radius: 999px;
          background: var(--teal-soft); color: var(--teal-dark);
          border: 1px solid #bfe1da; letter-spacing: 0.03em;
          flex-shrink: 0; transition: opacity .15s;
        }

        /* Tooltip when collapsed */
        .sb-item::after {
          content: attr(data-tip);
          position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%);
          background: var(--navy); color: #fff;
          font-size: 0.78rem; font-weight: 500;
          padding: 5px 10px; border-radius: 8px;
          white-space: nowrap; pointer-events: none;
          opacity: 0; transition: opacity .15s; z-index: 9999;
          box-shadow: 0 4px 12px rgba(16,39,59,0.15);
        }

        /* ── DIVIDER ── */
        .sb-divider { height: 1px; background: var(--border); margin: 0.4rem 0.25rem; }

        /* ── BOTTOM ── */
        .sb-bottom {
          padding: 0.5rem; border-top: 1px solid var(--border);
        }
        .sb-logout {
          display: flex; align-items: center; gap: 0.65rem;
          width: 100%; padding: 0 0.7rem; height: 38px;
          border-radius: 0.75rem; border: none; background: transparent;
          font-family: var(--font-sans); font-size: 0.855rem; font-weight: 500;
          color: var(--slate); cursor: pointer;
          transition: background .15s, color .15s;
          white-space: nowrap; overflow: hidden;
        }
        .sb-logout:hover { background: #fef2f2; color: #dc2626; }
        .sb-logout:hover .sb-logout-icon { color: #dc2626; }
        .sb-logout-icon { flex-shrink: 0; color: var(--slate); transition: color .15s; }
      `}</style>

      <div className="sb-root">
        <div className="sb-scroll">
          {NAV.map((group, gi) => (
            <div key={group.group} className="sb-group">

              {/* Group label — hide when collapsed */}
              {!collapsed && (
                <div className="sb-group-label">{group.group}</div>
              )}
              {collapsed && gi > 0 && <div className="sb-divider" />}

              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  data-tip={item.label}
                  className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
                  style={collapsed ? { justifyContent: 'center', padding: '0 0.7rem' } : {}}
                >
                  <span className="sb-icon">{item.icon}</span>

                  {!collapsed && (
                    <>
                      <span className="sb-label">{item.label}</span>
                      {item.badge && <span className="sb-badge">{item.badge}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="sb-bottom">
          <button
            className="sb-logout"
            onClick={handleLogout}
            data-tip="Sign Out"
            style={collapsed ? { justifyContent: 'center', padding: '0 0.7rem' } : {}}
          >
            <span className="sb-logout-icon">
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
