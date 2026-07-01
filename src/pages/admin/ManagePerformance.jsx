import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import PerformanceCard from '../../components/PerformanceCard';
import { isVisiblePerformance } from '../../utils/performance';

function ManagePerformance() {
    const [performances, setPerformances] = useState([]);
    const navigate = useNavigate();

    const fetchPerformances = useCallback(async () => {
        const { data, error } = await supabase
            .from('performances')
            .select('*')
            .order('date_range', { ascending: false });

        if (error) {
            console.error('Error fetching performances:', error);
        } else {
            setPerformances((data || []).filter(isVisiblePerformance));
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchPerformances();
    }, [fetchPerformances]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--text-primary)' }}>공연 관리</h2>
                <Link to="/admin/dashboard/create" className="submit-btn" style={{ width: 'auto', padding: '0.6rem 1.2rem', textDecoration: 'none', display: 'inline-block', fontSize: '0.9rem' }}>+ 신규 공연 등록</Link>
            </div>

            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '2.5rem' }}>
                {performances.map(perf => (
                    <PerformanceCard
                        key={perf.id}
                        perf={perf}
                        onSelect={() => navigate(`/admin/dashboard/edit/${perf.id}`)}
                        posterVariant="portrait"
                        showCopyButton
                        onCopy={(p) => navigate('/admin/dashboard/create', { state: { copyFrom: p } })}
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
