import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ManagePerformance from './ManagePerformance';
import ReservationStatus from './ReservationStatus';

function Dashboard() {
    const navigate = useNavigate();

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <h2 className="logo" style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Admin Link</h2>
                <nav className="side-nav">
                    <Link to="/admin/dashboard/manage" className="nav-item">공연 관리</Link>
                    <Link to="/admin/dashboard/status" className="nav-item">예매자 현황</Link>
                    <button onClick={() => navigate('/')} className="nav-item logout">로그아웃 (홈으로)</button>
                </nav>
            </aside>

            <main className="dashboard-content">
                <Routes>
                    <Route path="manage" element={<ManagePerformance />} />
                    <Route path="status" element={<ReservationStatus />} />
                    <Route path="*" element={<div style={{ padding: '2rem' }}><h3>메뉴를 선택해주세요.</h3></div>} />
                </Routes>
            </main>

            <style>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background: #1a1a1a;
        }
        .sidebar {
          width: 250px;
          background: var(--bg-secondary);
          padding: 2rem;
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        .side-nav {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .nav-item {
          color: var(--text-secondary);
          text-decoration: none;
          padding: 0.75rem;
          border-radius: 8px;
          transition: all 0.2s;
          text-align: left;
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
        }
        .nav-item:hover, .nav-item.active {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        .logout {
          margin-top: auto;
          color: #ff6b6b;
        }
        .dashboard-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          overflow: hidden;
        }
        th, td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        th {
          background: rgba(0,0,0,0.3);
          font-weight: 600;
        }
      `}</style>
        </div>
    );
}

export default Dashboard;
