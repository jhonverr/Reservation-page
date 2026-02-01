import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ManagePerformance from './ManagePerformance';
import CreatePerformance from './CreatePerformance';
import EditPerformance from './EditPerformance';
import ReservationStatus from './ReservationStatus';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleStatusClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/admin/dashboard/status') {
      setRefreshKey(prev => prev + 1);
    } else {
      navigate('/admin/dashboard/status');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Admin Header (Top Nav) */}
      <header className="admin-header">
        <div className="admin-header-top">
          <h1 className="admin-logo" onClick={() => navigate('/admin/dashboard')}>
            더열정 뮤지컬 <span style={{ fontWeight: 400, opacity: 0.8 }}>Admin</span>
          </h1>
          <button onClick={() => {
            localStorage.removeItem('isAdmin');
            navigate('/admin/login');
          }} className="admin-logout-btn">로그아웃</button>
        </div>
        <nav className="admin-nav-row">
          <Link
            to="/admin/dashboard/manage"
            className={`admin-nav-item ${location.pathname.includes('manage') || location.pathname === '/admin/dashboard' ? 'active' : ''}`}
          >
            공연 관리
          </Link>
          <Link
            to="/admin/dashboard/status"
            className={`admin-nav-item ${location.pathname.includes('status') ? 'active' : ''}`}
            onClick={handleStatusClick}
          >
            예약 현황
          </Link>
        </nav>
      </header>

      <main className="dashboard-content">
        <Routes>
          <Route index element={<Navigate to="manage" replace />} />
          <Route path="manage" element={<ManagePerformance />} />
          <Route path="create" element={<CreatePerformance />} />
          <Route path="edit/:id" element={<EditPerformance />} />
          <Route path="status" element={<ReservationStatus key={refreshKey} />} />
          <Route path="*" element={<div style={{ padding: '2rem' }}><h3>메뉴를 선택해주세요.</h3></div>} />
        </Routes>
      </main>

      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #f8f9fa;
        }

        .admin-header {
          background: #fff;
          border-bottom: 1px solid #eee;
          position: sticky;
          top: 0;
          z-index: 1000;
          width: 100%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        }

        .admin-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .admin-logo {
          margin: 0;
          font-size: 1.4rem;
          color: var(--text-primary);
          cursor: pointer;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .admin-logout-btn {
          padding: 0.5rem 1rem;
          background: #fff;
          color: #e74c3c;
          border: 1px solid #ffcfcc;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .admin-logout-btn:hover {
          background: #fff5f5;
          border-color: #e74c3c;
        }

        .admin-nav-row {
          display: flex;
          justify-content: center;
          gap: 2rem;
          border-top: 1px solid #f5f5f5;
          background: #fcfcfc;
          padding: 0 2rem;
          overflow-x: auto;
          scrollbar-width: none; /* Hide scrollbar Firefox */
        }
        .admin-nav-row::-webkit-scrollbar { display: none; } /* Hide scrollbar Chrome/Safari */

        .admin-nav-item {
          text-decoration: none;
          color: var(--text-secondary);
          padding: 1rem 0.5rem;
          font-weight: 600;
          font-size: 0.95rem;
          position: relative;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .admin-nav-item:hover {
          color: var(--accent-color);
        }

        .admin-nav-item.active {
          color: var(--accent-color);
        }

        .admin-nav-item.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--accent-color);
          border-radius: 3px 3px 0 0;
        }

        .dashboard-content {
          flex: 1;
          padding: 2.5rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .admin-header-top {
            padding: 0.8rem 1rem;
          }
          .admin-logo {
            font-size: 1.1rem;
          }
          .admin-nav-row {
            gap: 1.5rem;
            padding: 0 1rem;
            justify-content: flex-start;
          }
          .admin-nav-item {
            padding: 0.8rem 0.2rem;
            font-size: 0.9rem;
          }
          .dashboard-content {
            padding: 1.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
