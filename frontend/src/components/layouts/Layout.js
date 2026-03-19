import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LuActivity,
  LuBadgeCheck,
  LuBrainCircuit,
  LuClipboardList,
  LuFileScan,
  LuLayoutDashboard,
  LuScanLine,
  LuSettings2,
  LuShieldCheck,
  LuUserRound,
  LuUsers,
} from 'react-icons/lu';
import Sidebar from '../Sidebar';
import { getStoredAuthUser } from '../../api';

const pageMeta = {
  '/home': {
    tag: 'Dashboard',
    title: 'Clinical Overview',
    description: 'Live operational summary for the current diagnostic workspace.',
    Icon: LuLayoutDashboard,
  },
  '/diagnosis': {
    tag: 'Screening',
    title: 'MRI Diagnosis',
    description: 'Upload and review imaging through the diagnostic pipeline.',
    Icon: LuScanLine,
  },
  '/diagnosis-chat': {
    tag: 'Chat',
    title: 'Diagnosis Chat',
    description: 'WhatsApp-style in-app scan intake for rapid diagnostic demos.',
    Icon: LuScanLine,
  },
  '/patient-history': {
    tag: 'Records',
    title: 'Patient History',
    description: 'Retrieve prior imaging context and specialist notes.',
    Icon: LuClipboardList,
  },
  '/patient-details': {
    tag: 'Records',
    title: 'Patient Details',
    description: 'Inspect patient metadata, MRI references, and recommendations.',
    Icon: LuFileScan,
  },
  '/profile': {
    tag: 'Account',
    title: 'Clinician Profile',
    description: 'Manage your department, phone, and professional credentials.',
    Icon: LuUserRound,
  },
  '/patient-registration': {
    tag: 'Intake',
    title: 'Patient Registration',
    description: 'Register a new patient and capture clinical intake details.',
    Icon: LuUsers,
  },
  '/reports': {
    tag: 'Analytics',
    title: 'Reports & Analytics',
    description: 'Review detection trends, exports, and recent diagnostic activity.',
    Icon: LuActivity,
  },
  '/mri-scan-analysis': {
    tag: 'Imaging',
    title: 'MRI Scan Analysis',
    description: 'Inspect scan outcomes and classification support signals.',
    Icon: LuBrainCircuit,
  },
  '/outcome-analysis': {
    tag: 'Analytics',
    title: 'Outcome Analysis',
    description: 'Study longitudinal outcomes and decision-support metrics.',
    Icon: LuBadgeCheck,
  },
  '/role-management': {
    tag: 'Security',
    title: 'Role Management',
    description: 'Maintain permissions, roles, and access assignments.',
    Icon: LuSettings2,
  },
  '/logout': {
    tag: 'Session',
    title: 'Secure Sign Out',
    description: 'End the current clinical session safely.',
    Icon: LuShieldCheck,
  },
};

const Layout = ({ children }) => {
  const { username, role } = getStoredAuthUser();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const currentPage = useMemo(
    () => pageMeta[location.pathname] || pageMeta['/home'],
    [location.pathname]
  );

  const PageIcon = currentPage.Icon;

  return (
    <div className={`app-shell ${collapsed ? 'app-shell--collapsed' : ''}`}>
      <header className="app-shell__topbar">
        <div className="app-shell__brand-zone">
          <div className="app-shell__brand-mark">BT</div>
          <div>
            <div className="app-shell__brand-name">BTDS</div>
            <div className="app-shell__brand-subtitle">Brain Tumor Detection System</div>
          </div>
        </div>

        <button
          type="button"
          className="app-shell__toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-label="Toggle sidebar"
        >
          <span />
          <span />
        </button>

        <div className="app-shell__status-strip">
          <span className="app-shell__status-pill">
            <span className="app-shell__status-dot" />
            System Online
          </span>
          <span className="app-shell__status-divider" />
          <span>Clinical Workspace</span>
          <span className="app-shell__status-divider" />
          <span>Secure Review Mode</span>
        </div>

        <div className="app-shell__user">
          <div className="app-shell__user-chip">
            <span className="app-shell__user-avatar">
              {(username || 'C').charAt(0).toUpperCase()}
            </span>
            <span className="app-shell__user-name">{username || 'Clinician'}</span>
          </div>
        </div>
      </header>

      <aside className="app-shell__sidebar">
        <Sidebar collapsed={collapsed} />
      </aside>

      <div className="app-shell__content">
        <div className="app-page-header">
          <div className="app-page-header__left">
            <div className="app-page-header__icon-box">
              <PageIcon size={18} strokeWidth={1.9} />
            </div>
            <div className="app-page-header__copy">
              <div className="app-page-header__tag">{currentPage.tag}</div>
              <h1 className="app-page-header__title">{currentPage.title}</h1>
              <p className="app-page-header__description">{currentPage.description}</p>
            </div>
          </div>

          <div className="app-page-header__right">
            <span className="app-page-header__role-badge">{role || 'Doctor'}</span>
          </div>
        </div>

        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
