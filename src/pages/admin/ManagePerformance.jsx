import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import PerformanceCard from '../../components/PerformanceCard';

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

            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
                {performances.map(perf => (
                    <PerformanceCard
                        key={perf.id}
                        perf={perf}
                        onSelect={() => navigate(`/admin/dashboard/edit/${perf.id}`)}
                        compact={true}
                    />
                ))}
            </div>

            <style>{`
                .grid-container {
                    margin-top: 1rem;
                }
                @media (max-width: 768px) {
                    .grid-container {
                        gap: 1.5rem !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default ManagePerformance;
