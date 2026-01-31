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

            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.2rem' }}>
                {performances.map(perf => (
                    <div
                        key={perf.id}
                        onClick={() => navigate(`/admin/dashboard/edit/${perf.id}`)}
                        style={{
                            background: '#ffffff',
                            padding: '1.2rem',
                            borderRadius: '16px',
                            border: '1px solid rgba(0,0,0,0.05)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{perf.title}</h3>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            marginBottom: '1rem',
                            whiteSpace: 'pre-line',
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1
                        }}>
                            {perf.description}
                        </p>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid #f1f1f1', paddingTop: '0.8rem' }}>
                            <p>📅 <span style={{ color: 'var(--text-secondary)' }}>일정:</span> {perf.date_range}</p>
                            <p>📍 <span style={{ color: 'var(--text-secondary)' }}>장소:</span> {perf.location}</p>
                            <p>💰 <span style={{ color: 'var(--accent-color)', fontWeight: '700' }}>{perf.price.toLocaleString()}원</span></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ManagePerformance;
