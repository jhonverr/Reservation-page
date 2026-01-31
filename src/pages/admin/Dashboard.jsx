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
      // Already on status page, trigger refresh
      setRefreshKey(prev => prev + 1);
    } else {
      // Navigate to status page
      navigate('/admin/dashboard/status');
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2 className="logo" style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Admin Page</h2>
        <nav className="side-nav">
          <Link to="/admin/dashboard/manage" className="nav-item">공연 관리</Link>
          <a href="#" onClick={handleStatusClick} className="nav-item">예약 현황</a>
          <button onClick={() => {
            localStorage.removeItem('isAdmin');
            navigate('/admin/login');
          }} className="nav-item logout">로그아웃 (로그인 페이지로)</button>
        </nav>
      </aside>

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
          min-height: 100vh;
          background: var(--bg-primary);
        }
        .sidebar {
          width: 250px;
          background: var(--bg-secondary);
          padding: 2rem;
          border-right: 1px solid rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
        }
        .side-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .nav-item {
          color: var(--text-secondary);
          text-decoration: none;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          transition: all 0.2s;
          text-align: left;
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 500;
        }
        .nav-item:hover, .nav-item.active {
          background: rgba(255, 159, 67, 0.1);
          color: var(--accent-color);
        }
        .logout {
          margin-top: auto;
          color: #e74c3c;
          border: 1px solid rgba(231, 76, 60, 0.2);
        }
        .logout:hover {
          background: rgba(231, 76, 60, 0.05);
        }
        .dashboard-content {
          flex: 1;
          padding: 2.5rem;
          overflow-y: auto;
          width: 100%;
        }
        .table-container {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.05);
          overflow-x: auto;
          margin-top: 1.5rem;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          /* Removed min-width to allow fitting if possible */
        }
        th, td {
          padding: 1rem 0.75rem; /* Reduced padding for better fit */
          text-align: left;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          white-space: nowrap;
        }
        th {
          background: #f8f9fa;
          font-weight: 700;
          color: var(--text-secondary);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        tr:last-child td {
          border-bottom: none;
        }
        tr:hover td {
          background: #fafafa;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
