import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function ManagePerformance() {
    const [performances, setPerformances] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPerformances();
    }, []);

    async function fetchPerformances() {
        const { data, error } = await supabase
            .from('performances')
            .select('*')
            .order('date_range', { ascending: false });

        if (error) {
            console.error('Error fetching performances:', error);
        } else {
            setPerformances(data);
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--text-primary)' }}>공연 관리</h2>
                <Link to="/admin/dashboard/create" className="submit-btn" style={{ width: 'auto', padding: '0.6rem 1.2rem', textDecoration: 'none', display: 'inline-block', fontSize: '0.9rem' }}>+ 신규 공연 등록</Link>
            </div>

            <div className="perf-admin-grid">
                {performances.map(perf => (
                    <div
                        key={perf.id}
                        onClick={() => navigate(`/admin/dashboard/edit/${perf.id}`)}
                        className="perf-admin-card"
                    >
                        <h3 className="perf-card-title">{perf.title}</h3>
                        <p className="perf-card-desc">
                            {perf.description}
                        </p>
                        <div className="perf-card-meta">
                            <p>📅 <span>일정:</span> {perf.date_range}</p>
                            <p>📍 <span>장소:</span> {perf.location}</p>
                            <p className="perf-card-price">{perf.price.toLocaleString()}원</p>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .perf-admin-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                }
                .perf-admin-card {
                    background: #ffffff;
                    padding: 1.5rem;
                    border-radius: 16px;
                    border: 1px solid #eee;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                }
                .perf-admin-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--accent-color);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.06);
                }
                .perf-card-title {
                    margin: 0 0 0.8rem 0;
                    color: var(--text-primary);
                    font-size: 1.2rem;
                    font-weight: 800;
                }
                .perf-card-desc {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    margin-bottom: 0.8rem;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    flex: 1;
                }
                .perf-card-meta {
                    font-size: 0.85rem;
                    color: var(--text-primary);
                    display: flex;
                    flex-direction: column;
                    gap: 0.3rem;
                    border-top: 1px solid #f5f5f5;
                    padding-top: 0.8rem;
                }
                .perf-card-meta p { margin: 0; }
                .perf-card-meta span { color: #888; margin-right: 0.3rem; }
                .perf-card-price {
                    margin-top: 0.5rem !important;
                    color: var(--accent-color);
                    font-weight: 800;
                    font-size: 1rem;
                }

                @media (max-width: 768px) {
                    .perf-admin-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                    .perf-admin-card {
                        padding: 1.2rem;
                    }
                    .perf-card-title {
                        font-size: 1.1rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default ManagePerformance;
