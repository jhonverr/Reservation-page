import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { isSessionEnded } from '../../utils/date';
import { formatPhone } from '../../utils/format';

function ReservationStatus() {
    const [performances, setPerformances] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [searchTerms, setSearchTerms] = useState({}); // { perfId: 'searchTerm' }
    const [loading, setLoading] = useState(true);
    const [collapsedPerfs, setCollapsedPerfs] = useState({}); // { perfId: true/false }
    const [collapsedSessions, setCollapsedSessions] = useState({}); // { sessionId: true/false }

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
        cleanupOldData();
        fetchData();
    }, []);

    async function cleanupOldData() {
        // 1. Get all performances that ended more than 3 months ago
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const { data: oldPerfs } = await supabase
            .from('performances')
            .select('id, date_range');

        if (!oldPerfs) return;

        const targetPerfIds = oldPerfs.filter(p => {
            const dateRange = p.date_range || '';
            const parts = dateRange.split(' - ');
            if (parts.length < 2) return false;

            const endDateStr = parts[1].replace(/\./g, '-');
            const endDate = new Date(endDateStr);

            // Check if end date is valid and older than 3 months
            return !isNaN(endDate) && endDate < threeMonthsAgo;
        }).map(p => p.id);

        if (targetPerfIds.length === 0) return;

        // 2. Update phone numbers for reservations of these performances
        // We only update if phone is not already '000-0000-0000' to save resources (though Supabase might handle it)
        const { error } = await supabase
            .from('reservations')
            .update({ phone: '000-0000-0000' })
            .in('performance_id', targetPerfIds)
            .neq('phone', '000-0000-0000');

        if (error) {
            console.error('Data cleanup failed:', error);
        } else {
            console.log('Old data cleanup completed for performances:', targetPerfIds);
        }
    }

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

            // Initialize collapsed state: collapse ended performances & sessions
            const now = new Date();
            const initialCollapsedPerfs = {};
            const initialCollapsedSessions = {};

            sortedPerf.forEach(perf => {
                // Collapse ended performances
                const endDateStr = (perf.date_range || '').split(' - ')[1];
                if (endDateStr) {
                    const endDate = new Date(endDateStr.replace(/\./g, '-'));
                    initialCollapsedPerfs[perf.id] = endDate < now;
                } else {
                    initialCollapsedPerfs[perf.id] = false;
                }

                // Collapse ended sessions
                perf.sessions.forEach((session, idx) => {
                    if (isSessionEnded(perf, session)) {
                        const sessionKey = `${session.date}-${session.time}-${idx}`;
                        initialCollapsedSessions[sessionKey] = true;
                    }
                });
            });
            setCollapsedPerfs(initialCollapsedPerfs);
            setCollapsedSessions(initialCollapsedSessions);
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

    const handleTogglePayment = async (resId, currentStatus) => {
        const { error } = await supabase
            .from('reservations')
            .update({ is_paid: !currentStatus })
            .eq('id', resId);

        if (error) {
            alert('결제 상태 업데이트 실패: ' + error.message);
        } else {
            setReservations(prev => prev.map(res =>
                res.id === resId ? { ...res, is_paid: !currentStatus } : res
            ));
        }
    };

    const handleAddReservation = async (perfId) => {
        if (!manualForm.name || !manualForm.phone || !manualForm.date || !manualForm.time) {
            alert('모든 정보를 입력해주세요.');
            return;
        }

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

    // Helper to group reservations by session
    const getSessionGroups = (perf) => {
        const term = (searchTerms[perf.id] || '').toLowerCase();
        const perfReservations = reservations.filter(r => r.performance_id === perf.id);

        // Find reservations that don't match known sessions (shouldn't happen often, but good for safety)
        const unknownSessionRes = perfReservations.filter(r =>
            !perf.sessions.some(s => s.date === r.date && s.time === r.time)
        );

        const groups = perf.sessions.map((session, idx) => {
            const sessionRes = perfReservations.filter(r => r.date === session.date && r.time === session.time);

            // Filter by search term
            const filteredRes = sessionRes.filter(r => {
                if (!term) return true;
                return r.name.toLowerCase().includes(term) || r.phone.includes(term);
            });

            // Calculate stats
            const booked = sessionRes.reduce((sum, r) => sum + r.tickets, 0);
            const isEnded = isSessionEnded(perf, session);

            return {
                session,
                originalIdx: idx,
                reservations: filteredRes,
                booked,
                total: perf.total_seats,
                isEnded
            };
        });

        // Sort: Active sessions first, then Ended sessions

        groups.sort((a, b) => {
            if (a.isEnded === b.isEnded) return 0;
            return a.isEnded ? 1 : -1;
        });


        // Loop unknown reservations if any matches search
        const filteredUnknown = unknownSessionRes.filter(r => {
            if (!term) return true;
            return r.name.toLowerCase().includes(term) || r.phone.includes(term);
        });

        if (filteredUnknown.length > 0) {
            groups.push({
                session: { date: '기타', time: '설정되지 않은 회차' },
                originalIdx: -1,
                reservations: filteredUnknown,
                booked: filteredUnknown.reduce((sum, r) => sum + r.tickets, 0),
                total: 0,
                isEnded: true
            });
        }

        return groups;
    };


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
                        const sessionGroups = getSessionGroups(perf);
                        const totalBooked = reservations.filter(r => r.performance_id === perf.id).reduce((sum, r) => sum + r.tickets, 0);

                        return (
                            <div key={perf.id} className="booking-card admin-booking-group" style={{ padding: '1.5rem', maxWidth: 'none', margin: '0 auto' }}>
                                <div className="admin-card-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: collapsedPerfs[perf.id] ? 0 : '1rem' }}>
                                    <div className="admin-header-row">
                                        <div>
                                            <h3 style={{ margin: 0, color: 'var(--accent-color)', marginBottom: '0.4rem' }}>{perf.title}</h3>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{perf.date_range}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>총 {totalBooked}매 예매</span>
                                        </div>
                                    </div>

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
                                        {/* Manual Add Form */}
                                        {showAddForm === perf.id && (
                                            <div className="manual-form-grid" style={{ background: '#fcfcfc', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                                {/* ... same as before, simplified for brevity in this logical block ... */}
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

                                        {/* Session Groups */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {sessionGroups.map((group) => {
                                                const sessionKey = `${group.session.date}-${group.session.time}-${group.originalIdx}`;
                                                // Only show if it matches search or no search
                                                if (searchTerms[perf.id] && group.reservations.length === 0) return null;

                                                const occupancyRate = group.total > 0 ? Math.round((group.booked / group.total) * 100) : 0;
                                                const isExpanded = !collapsedSessions[sessionKey] || (!!searchTerms[perf.id] && group.reservations.length > 0);

                                                return (
                                                    <div key={sessionKey} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', opacity: group.isEnded ? 0.7 : 1 }}>
                                                        <div
                                                            onClick={() => setCollapsedSessions(prev => ({ ...prev, [sessionKey]: !prev[sessionKey] }))}
                                                            style={{
                                                                padding: '1rem',
                                                                background: group.isEnded ? '#f0f0f0' : '#fafafa',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                userSelect: 'none'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                {/* Session Number & Date/Time */}
                                                                <span style={{ fontWeight: 'bold', fontSize: '1rem', color: group.isEnded ? '#888' : '#333' }}>
                                                                    {group.originalIdx !== -1 ? `${group.originalIdx + 1}회차` : '기타 회차'}
                                                                    {group.isEnded && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#999', fontWeight: 'normal' }}>[종료]</span>}
                                                                </span>
                                                                <span style={{ fontSize: '0.9rem', color: group.isEnded ? '#aaa' : '#666', marginLeft: '0.2rem' }}>
                                                                    ({group.session.date} {group.session.time})
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                <span style={{
                                                                    fontSize: '0.9rem',
                                                                    color: group.isEnded ? '#aaa' : (occupancyRate >= 100 ? '#e74c3c' : '#2ecc71'),
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {group.booked} / {group.total}석 ({occupancyRate}%)
                                                                </span>
                                                                <span style={{ fontSize: '0.8rem', color: '#999' }}>{isExpanded ? '▲' : '▼'}</span>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div style={{ padding: '0', borderTop: '1px solid #eee' }}>
                                                                <div className="table-container desktop-only">
                                                                    <table style={{ margin: 0 }}>
                                                                        <thead>
                                                                            <tr style={{ background: '#fff' }}>
                                                                                <th style={{ paddingLeft: '1.5rem' }}>예매자</th>
                                                                                <th>연락처</th>
                                                                                <th>티켓</th>
                                                                                <th>예매일시</th>
                                                                                <th style={{ width: '60px', textAlign: 'center' }}>결제</th>
                                                                                <th style={{ width: '80px' }}>관리</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {group.reservations.map(res => (
                                                                                <tr key={res.id}>
                                                                                    <td style={{ paddingLeft: '1.5rem', fontWeight: 'bold' }}>{res.name}</td>
                                                                                    <td>{formatPhone(res.phone)}</td>
                                                                                    <td>{res.tickets}매</td>
                                                                                    <td>{new Date(res.created_at).toLocaleString()}</td>
                                                                                    <td style={{ textAlign: 'center' }}>
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={!!res.is_paid}
                                                                                            onChange={() => handleTogglePayment(res.id, res.is_paid)}
                                                                                            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                                                                        />
                                                                                    </td>
                                                                                    <td>
                                                                                        <button
                                                                                            onClick={() => handleDeleteReservation(res.id)}
                                                                                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                                                                        >취소</button>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                            {group.reservations.length === 0 && (
                                                                                <tr>
                                                                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>예약 내역이 없습니다.</td>
                                                                                </tr>
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>

                                                                {/* Mobile View */}
                                                                <div className="mobile-only" style={{ padding: '1rem' }}>
                                                                    {group.reservations.map(res => (
                                                                        <div key={res.id} style={{
                                                                            background: '#fff',
                                                                            padding: '1rem',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid #eee',
                                                                            marginBottom: '0.8rem'
                                                                        }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                                                <span style={{ fontWeight: 'bold' }}>{res.name}</span>
                                                                                <span style={{ fontSize: '0.9rem', color: '#666' }}>{res.tickets}매</span>
                                                                            </div>
                                                                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.8rem' }}>
                                                                                <p style={{ margin: '0.2rem 0' }}>📱 {formatPhone(res.phone)}</p>
                                                                                <p style={{ margin: '0.2rem 0' }}>🕒 {new Date(res.created_at).toLocaleString()}</p>
                                                                            </div>

                                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                                <div onClick={() => handleTogglePayment(res.id, res.is_paid)} style={{ flex: 1, padding: '0.5rem', textAlign: 'center', borderRadius: '4px', background: res.is_paid ? '#2ecc71' : '#fff', color: res.is_paid ? '#fff' : '#2ecc71', border: '1px solid #2ecc71', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                                                    {res.is_paid ? '결제 완료' : '결제 대기'}
                                                                                </div>
                                                                                <div onClick={() => handleDeleteReservation(res.id)} style={{ flex: 1, padding: '0.5rem', textAlign: 'center', borderRadius: '4px', background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                                                    취소
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {group.reservations.length === 0 && (
                                                                        <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>예약 내역이 없습니다.</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
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
                        width: 90%;
                        padding: 1rem !important;
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
