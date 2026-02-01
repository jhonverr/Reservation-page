import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

function ReservationStatus() {
    const [performances, setPerformances] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [searchTerms, setSearchTerms] = useState({}); // { perfId: 'searchTerm' }
    const [loading, setLoading] = useState(true);
    const [collapsedPerfs, setCollapsedPerfs] = useState({}); // { perfId: true/false }

    // Manual reservation form state
    const [showAddForm, setShowAddForm] = useState(null); // perfId
    const [manualForm, setManualForm] = useState({
        name: '',
        phone: '',
        tickets: 1,
        date: '',
        time: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        const { data: perfData } = await supabase.from('performances').select('*');
        const { data: resData } = await supabase
            .from('reservations')
            .select('*')
            .order('created_at', { ascending: false });

        // Fetch all sessions
        const { data: sessionsData } = await supabase
            .from('performance_sessions')
            .select('*')
            .order('date', { ascending: true });

        if (perfData) {
            // Attach sessions to each performance
            const perfWithSessions = perfData.map(perf => ({
                ...perf,
                sessions: sessionsData?.filter(s => s.performance_id === perf.id) || []
            }));

            // Sort by start date (descending)
            const sortedPerf = [...perfWithSessions].sort((a, b) => {
                const dateA = new Date((a.date_range || '').split(' - ')[0].replace(/\./g, '-'));
                const dateB = new Date((b.date_range || '').split(' - ')[0].replace(/\./g, '-'));
                return dateB - dateA;
            });
            setPerformances(sortedPerf);

            // Initialize collapsed state: collapse ended performances, expand ongoing ones
            const now = new Date();
            const initialCollapsed = {};
            sortedPerf.forEach(perf => {
                const endDateStr = (perf.date_range || '').split(' - ')[1];
                if (endDateStr) {
                    const endDate = new Date(endDateStr.replace(/\./g, '-'));
                    // If performance has ended, collapse it
                    initialCollapsed[perf.id] = endDate < now;
                } else {
                    initialCollapsed[perf.id] = false;
                }
            });
            setCollapsedPerfs(initialCollapsed);
        }
        if (resData) setReservations(resData);
        setLoading(false);
    }

    const handleDeleteReservation = async (resId) => {
        if (!window.confirm('정말로 이 예약을 취소하시겠습니까? (삭제 처리됩니다)')) return;

        const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', resId);

        if (error) {
            alert('취소 실패: ' + error.message);
        } else {
            alert('예약이 취소되었습니다.');
            fetchData();
        }
    };

    const handleAddReservation = async (perfId) => {
        if (!manualForm.name || !manualForm.phone || !manualForm.date || !manualForm.time) {
            alert('모든 정보를 입력해주세요.');
            return;
        }

        // Get performance price
        const { data: perfData, error: perfError } = await supabase
            .from('performances')
            .select('price')
            .eq('id', perfId)
            .single();

        if (perfError || !perfData) {
            alert('공연 정보를 가져오는데 실패했습니다.');
            return;
        }

        const totalPrice = manualForm.tickets * perfData.price;

        const { error } = await supabase
            .from('reservations')
            .insert([{
                performance_id: perfId,
                name: manualForm.name,
                phone: manualForm.phone,
                tickets: manualForm.tickets,
                date: manualForm.date,
                time: manualForm.time,
                total_price: totalPrice
            }]);

        if (error) {
            alert('추가 실패: ' + error.message);
        } else {
            alert('예약이 추가되었습니다.');
            setShowAddForm(null);
            setManualForm({ name: '', phone: '', tickets: 1, date: '', time: '' });
            fetchData();
        }
    };

    const getResForPerf = (perfId) => {
        const term = (searchTerms[perfId] || '').toLowerCase();
        return reservations.filter(r => {
            if (r.performance_id !== perfId) return false;
            if (!term) return true;
            return (
                r.name.toLowerCase().includes(term) ||
                r.phone.includes(term)
            );
        });
    };

    const getBookedCount = (perfId) => reservations.filter(r => r.performance_id === perfId).reduce((sum, r) => sum + r.tickets, 0);

    const handleSearchChange = (perfId, value) => {
        setSearchTerms(prev => ({ ...prev, [perfId]: value }));
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>예약 현황</h2>
                <button
                    onClick={fetchData}
                    style={{
                        padding: '0.7rem 1.5rem',
                        background: 'var(--accent-color)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600'
                    }}
                >
                    새로고침
                </button>
            </div>

            {loading ? (
                <p>로딩 중...</p>
            ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {performances.map(perf => {
                        const perfRes = getResForPerf(perf.id);
                        const booked = getBookedCount(perf.id);
                        return (
                            <div key={perf.id} className="booking-card admin-booking-group" style={{ padding: '1.5rem', maxWidth: 'none', margin: '0 auto' }}>
                                <div className="admin-card-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: collapsedPerfs[perf.id] ? 0 : '1rem' }}>
                                    {/* Row 1: Title and Stats */}
                                    <div className="admin-header-row">
                                        <div>
                                            <h3 style={{ margin: 0, color: 'var(--accent-color)', marginBottom: '0.4rem' }}>{perf.title}</h3>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{perf.date_range}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{booked} / {perf.total_seats}석</span>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>예약율: {perf.total_seats > 0 ? Math.round((booked / perf.total_seats) * 100) : 0}%</p>
                                        </div>
                                    </div>

                                    {/* Row 2: Actions (Search, Add, Toggle) */}
                                    <div className="admin-actions-row">
                                        {!collapsedPerfs[perf.id] && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                <input
                                                    type="text"
                                                    placeholder="예매자명 또는 연락처..."
                                                    value={searchTerms[perf.id] || ''}
                                                    onChange={(e) => handleSearchChange(perf.id, e.target.value)}
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fa', width: '200px', flex: '1 1 200px' }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        setShowAddForm(showAddForm === perf.id ? null : perf.id);
                                                        if (perf.sessions && perf.sessions.length > 0) {
                                                            setManualForm(p => ({ ...p, date: perf.sessions[0].date, time: perf.sessions[0].time }));
                                                        }
                                                    }}
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap', flex: '1 1 auto' }}
                                                >
                                                    + 수동 예약
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setCollapsedPerfs(prev => ({ ...prev, [perf.id]: !prev[perf.id] }))}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.85rem',
                                                background: '#666',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {collapsedPerfs[perf.id] ? '펼치기' : '접기'}
                                        </button>
                                    </div>
                                </div>

                                {!collapsedPerfs[perf.id] && (
                                    <>
                                        {showAddForm === perf.id && (
                                            <div className="manual-form-grid" style={{ background: '#fcfcfc', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>성함</label>
                                                    <input type="text" value={manualForm.name} onChange={(e) => setManualForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>연락처</label>
                                                    <input
                                                        type="tel"
                                                        value={manualForm.phone}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                                            setManualForm(p => ({ ...p, phone: value }));
                                                        }}
                                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>회차 일시</label>
                                                    <select
                                                        value={`${manualForm.date}|${manualForm.time}`}
                                                        onChange={(e) => {
                                                            const [d, t] = e.target.value.split('|');
                                                            setManualForm(p => ({ ...p, date: d, time: t }));
                                                        }}
                                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                                    >
                                                        <option value="">회차 선택</option>
                                                        {perf.sessions?.map((s, idx) => (
                                                            <option key={idx} value={`${s.date}|${s.time}`}>{s.date} ({s.time})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>매수</label>
                                                    <input type="number" min="1" value={manualForm.tickets} onChange={(e) => setManualForm(p => ({ ...p, tickets: parseInt(e.target.value) }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => setShowAddForm(null)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>취소</button>
                                                    <button onClick={() => handleAddReservation(perf.id)} style={{ flex: 1, padding: '0.5rem', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>저장</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="table-container desktop-only">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>예매자</th>
                                                        <th>회차</th>
                                                        <th>연락처</th>
                                                        <th>티켓</th>
                                                        <th>예매일시</th>
                                                        <th style={{ width: '80px' }}>관리</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {perfRes.map(res => (
                                                        <tr key={res.id}>
                                                            <td style={{ fontWeight: 'bold' }}>{res.name}</td>
                                                            <td>
                                                                {(() => {
                                                                    const sessions = Array.isArray(perf.sessions) ? perf.sessions : [];
                                                                    const index = sessions.findIndex(s => s.date === res.date && s.time === res.time);

                                                                    // Try to extract #number from res.time first
                                                                    const match = res.time?.match(/#(\d+)/);
                                                                    if (match) return `${match[1]}회차`;

                                                                    // If not in res.time, maybe it's in the matched session's time
                                                                    if (index !== -1) {
                                                                        const sessionTimeMatch = sessions[index].time?.match(/#(\d+)/);
                                                                        if (sessionTimeMatch) return `${sessionTimeMatch[1]}회차`;
                                                                        return `${index + 1}회차`;
                                                                    }

                                                                    return `${res.date} (${res.time})`;
                                                                })()}
                                                            </td>
                                                            <td>{res.phone}</td>
                                                            <td>{res.tickets}매</td>
                                                            <td>{new Date(res.created_at).toLocaleString()}</td>
                                                            <td>
                                                                <button
                                                                    onClick={() => handleDeleteReservation(res.id)}
                                                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                                                >취소</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="mobile-only" style={{ display: 'grid', gap: '0.8rem' }}>
                                            {perfRes.map(res => (
                                                <div key={res.id} style={{
                                                    background: '#fff',
                                                    padding: '1.2rem',
                                                    borderRadius: '12px',
                                                    border: '1px solid #eee',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{res.name}</span>
                                                        <span style={{
                                                            padding: '0.2rem 0.6rem',
                                                            background: 'var(--bg-secondary)',
                                                            borderRadius: '6px',
                                                            fontSize: '0.8rem',
                                                            color: 'var(--text-secondary)'
                                                        }}>
                                                            {(() => {
                                                                const sessions = Array.isArray(perf.sessions) ? perf.sessions : [];
                                                                const index = sessions.findIndex(s => s.date === res.date && s.time === res.time);
                                                                const match = res.time?.match(/#(\d+)/);
                                                                if (match) return `${match[1]}회차`;
                                                                return index !== -1 ? `${index + 1}회차` : res.time;
                                                            })()}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                                                        <p style={{ margin: '0.2rem 0' }}>📱 {res.phone}</p>
                                                        <p style={{ margin: '0.2rem 0' }}>🎟️ {res.tickets}매 ({(res.total_price || 0).toLocaleString()}원)</p>
                                                        <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', opacity: 0.8 }}>🕒 {new Date(res.created_at).toLocaleString()}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteReservation(res.id)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.6rem',
                                                            background: '#fff',
                                                            color: '#e74c3c',
                                                            border: '1px solid #ffcfcc',
                                                            borderRadius: '8px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        예약 취소
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {perfRes.length === 0 && (
                                            <div style={{ textAlign: 'center', color: '#888', padding: '3rem 1rem', background: '#fafafa', borderRadius: '12px', border: '1px dashed #ddd' }}>
                                                {searchTerms[perf.id] ? '검색 결과가 없습니다.' : '예약 내역이 없습니다.'}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .admin-booking-group {
                    width: 95%;
                }
                @media (max-width: 768px) {
                    .admin-booking-group {
                        width: 85%;
                    }
                    .desktop-only { display: none !important; }
                    .mobile-only { display: block !important; }
                    
                    .admin-header-row {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 1rem;
                    }
                    .admin-header-row > div:last-child {
                        text-align: left !important;
                        width: 100%;
                        padding-top: 0.5rem;
                        border-top: 1px dashed #eee;
                    }
                    .admin-actions-row {
                        justify-content: flex-start !important;
                        flex-direction: column;
                        align-items: stretch !important;
                    }
                    .admin-actions-row > div {
                        width: 100%;
                    }
                    .admin-actions-row input {
                        width: 100% !important;
                    }
                    .manual-form-grid {
                        grid-template-columns: 1fr !important;
                        padding: 1rem !important;
                    }
                }
                @media (min-width: 769px) {
                    .mobile-only { display: none !important; }
                }

                .mobile-only { display: none; }
            `}</style>
        </div>
    );
}

export default ReservationStatus;
