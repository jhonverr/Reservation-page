import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { isHiddenPerformance } from '../../utils/performance';
import './ReservationStatus.css';

function HiddenPerformances() {
    const navigate = useNavigate();
    const [performances, setPerformances] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchHiddenPerformances = useCallback(async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('performances')
            .select('*')
            .order('deleted_at', { ascending: false, nullsFirst: false });

        if (error) {
            alert('숨김 공연을 불러오지 못했습니다: ' + error.message);
            setPerformances([]);
        } else {
            setPerformances((data || []).filter(isHiddenPerformance));
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchHiddenPerformances();
    }, [fetchHiddenPerformances]);

    const filteredPerformances = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return performances;

        return performances.filter(perf => [
            perf.title,
            perf.date_range,
            perf.location
        ].some(value => String(value || '').toLowerCase().includes(term)));
    }, [performances, searchTerm]);

    const handleRestore = async (perfId) => {
        if (!window.confirm('이 공연을 다시 노출하시겠습니까?')) return;

        const { error } = await supabase
            .from('performances')
            .update({
                is_deleted: false,
                deleted_at: null
            })
            .eq('id', perfId);

        if (error) {
            alert('복구 실패: ' + error.message);
        } else {
            alert('공연이 복구되었습니다.');
            setPerformances(prev => prev.filter(perf => perf.id !== perfId));
        }
    };

    return (
        <div>
            <div className="admin-review-page-header">
                <div>
                    <h2>숨김 공연 관리</h2>
                    <p>숨김 처리된 공연 {performances.length}개</p>
                </div>
                <button
                    type="button"
                    onClick={fetchHiddenPerformances}
                    className="btn btn-primary"
                    style={{ padding: '0.7rem 1.5rem', fontSize: '1rem' }}
                >
                    새로고침
                </button>
            </div>

            <div className="admin-review-toolbar">
                <input
                    className="form-control-sm"
                    type="text"
                    placeholder="공연명, 기간, 장소 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <p>로딩 중...</p>
            ) : filteredPerformances.length === 0 ? (
                <div className="booking-card admin-review-empty-card">
                    {searchTerm ? '검색 결과가 없습니다.' : '숨김 처리된 공연이 없습니다.'}
                </div>
            ) : (
                <div className="admin-hidden-performance-list">
                    {filteredPerformances.map(perf => (
                        <article
                            key={perf.id}
                            className="booking-card admin-hidden-performance-card"
                            style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                        >
                            <div className="admin-hidden-performance-info">
                                {perf.poster_url && (
                                    <img
                                        src={`https://wsrv.nl/?url=${encodeURIComponent(perf.poster_url)}`}
                                        alt={perf.title}
                                        loading="lazy"
                                    />
                                )}
                                <div>
                                    <h3>{perf.title}</h3>
                                    <p>{perf.date_range}</p>
                                    <p className="admin-performance-id">관리 ID #{perf.id}</p>
                                    <p>{perf.location}</p>
                                    <span>
                                        숨김 처리일: {perf.deleted_at ? new Date(perf.deleted_at).toLocaleString() : '기록 없음'}
                                    </span>
                                </div>
                            </div>
                            <div className="admin-hidden-performance-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => navigate(`/admin/dashboard/edit/${perf.id}`)}
                                >
                                    수정
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleRestore(perf.id)}
                                >
                                    복구
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

export default HiddenPerformances;
