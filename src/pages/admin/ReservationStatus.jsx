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
    const [paymentModal, setPaymentModal] = useState(null); // reservation object
    const [modalPaidTickets, setModalPaidTickets] = useState(0); // local state for modal stepper

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
        const { error: resError } = await supabase
            .from('reservations')
            .update({ phone: '000-0000-0000' })
            .in('performance_id', targetPerfIds)
            .neq('phone', '000-0000-0000');

        // 3. Update phone numbers for reviews of these performances
        const { error: revError } = await supabase
            .from('performance_reviews')
            .update({ user_phone: '000-0000-0000' })
            .in('performance_id', targetPerfIds)
            .neq('user_phone', '000-0000-0000');

        if (resError || revError) {
            console.error('Data cleanup failed:', resError || revError);
        } else {
            console.log('Old data cleanup completed (Reservations & Reviews) for performances:', targetPerfIds);
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

    const handleUpdatePayment = async (res, delta) => {
        if (!res) return;

        const currentPaid = res.paid_tickets ?? (res.is_paid ? res.tickets : 0);
        let newPaid = currentPaid + delta;
        if (newPaid < 0) newPaid = 0;
        if (newPaid > res.tickets) newPaid = res.tickets;

        if (newPaid === currentPaid) return;

        const newIsPaid = newPaid === res.tickets;

        const { error } = await supabase
            .from('reservations')
            .update({ paid_tickets: newPaid, is_paid: newIsPaid })
            .eq('id', res.id);

        if (error) {
            alert('결제 상태 업데이트 실패: ' + error.message);
        } else {
            setReservations(prev => prev.map(r =>
                r.id === res.id ? { ...r, paid_tickets: newPaid, is_paid: newIsPaid } : r
            ));
        }
    };

    const handleOpenPaymentModal = (res) => {
        setPaymentModal(res);
        setModalPaidTickets(res.paid_tickets ?? (res.is_paid ? res.tickets : 0));
    };

    const handleSavePaymentModal = () => {
        if (!paymentModal) return;
        const currentPaid = paymentModal.paid_tickets ?? (paymentModal.is_paid ? paymentModal.tickets : 0);
        const delta = modalPaidTickets - currentPaid;
        if (delta !== 0) {
            handleUpdatePayment(paymentModal, delta);
        }
        setPaymentModal(null);
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
            const totalPaid = sessionRes.reduce((sum, r) => sum + (r.paid_tickets ?? (r.is_paid ? r.tickets : 0)), 0);
            const isEnded = isSessionEnded(perf, session);

            return {
                session,
                originalIdx: idx,
                reservations: filteredRes,
                booked,
                totalPaid,
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
                                                                flexWrap: 'wrap',
                                                                gap: '0.5rem',
                                                                userSelect: 'none'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 auto', minWidth: '200px' }}>
                                                                {/* Session Number & Date/Time */}
                                                                <span style={{ fontWeight: 'bold', fontSize: '1rem', color: group.isEnded ? '#888' : '#333' }}>
                                                                    {group.originalIdx !== -1 ? `${group.originalIdx + 1}회차` : '기타 회차'}
                                                                    {group.isEnded && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#999', fontWeight: 'normal' }}>[종료]</span>}
                                                                </span>
                                                                <span style={{ fontSize: '0.9rem', color: group.isEnded ? '#aaa' : '#666', marginLeft: '0.2rem' }}>
                                                                    ({group.session.date} {group.session.time})
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '0 1 auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                                <span style={{
                                                                    fontSize: '0.9rem',
                                                                    color: group.isEnded ? '#aaa' : '#555',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    결제: {group.totalPaid} / {group.booked}
                                                                </span>
                                                                <span style={{ color: '#ccc', display: 'inline-block' }}>|</span>
                                                                <span style={{
                                                                    fontSize: '0.9rem',
                                                                    color: group.isEnded ? '#aaa' : (occupancyRate >= 100 ? '#e74c3c' : '#2ecc71'),
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    예매: {group.booked} / {group.total}석 <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>({occupancyRate}%)</span>
                                                                </span>
                                                                <span style={{ fontSize: '0.8rem', color: '#999', marginLeft: '0.5rem' }}>{isExpanded ? '▲' : '▼'}</span>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div style={{ padding: '0', borderTop: '1px solid #eee' }}>
                                                                <div className="table-container desktop-only">
                                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                                        <colgroup>
                                                                            <col width="18%" />
                                                                            <col width="20%" />
                                                                            <col width="8%" />
                                                                            <col width="20%" />
                                                                            <col width="22%" />
                                                                            <col width="12%" />
                                                                        </colgroup>
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
                                                                            {group.reservations.map(res => {
                                                                                const paidCount = res.paid_tickets ?? (res.is_paid ? res.tickets : 0);
                                                                                return (
                                                                                    <tr key={res.id}>
                                                                                        <td style={{ paddingLeft: '1.5rem', fontWeight: 'bold' }}>{res.name}</td>
                                                                                        <td>{formatPhone(res.phone)}</td>
                                                                                        <td>{res.tickets}매</td>
                                                                                        <td>{new Date(res.created_at).toLocaleString()}</td>
                                                                                        <td style={{ textAlign: 'center', minWidth: '130px', padding: '0.8rem 1.5rem' }}>
                                                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                                                                                                <button
                                                                                                    onClick={() => handleUpdatePayment(res, -1)}
                                                                                                    disabled={paidCount === 0}
                                                                                                    style={{ padding: '0.2rem 0.6rem', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', cursor: paidCount === 0 ? 'not-allowed' : 'pointer', color: '#333' }}
                                                                                                >-</button>
                                                                                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', width: '30px', textAlign: 'center', color: paidCount === 0 ? '#999' : (paidCount === res.tickets ? '#2ecc71' : '#f39c12') }}>
                                                                                                    {paidCount} / {res.tickets}
                                                                                                </span>
                                                                                                <button
                                                                                                    onClick={() => handleUpdatePayment(res, 1)}
                                                                                                    disabled={paidCount === res.tickets}
                                                                                                    style={{ padding: '0.2rem 0.6rem', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', cursor: paidCount === res.tickets ? 'not-allowed' : 'pointer', color: '#333' }}
                                                                                                >+</button>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td>
                                                                                            <button
                                                                                                onClick={() => handleDeleteReservation(res.id)}
                                                                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                                                                            >취소</button>
                                                                                        </td>
                                                                                    </tr>
                                                                                )
                                                                            })}
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
                                                                    {group.reservations.map(res => {
                                                                        const paidCount = res.paid_tickets ?? (res.is_paid ? res.tickets : 0);
                                                                        const btnBg = paidCount === res.tickets ? '#2ecc71' : (paidCount > 0 ? '#f39c12' : '#fff');
                                                                        const btnColor = paidCount > 0 ? '#fff' : '#999';
                                                                        const btnBorder = paidCount === res.tickets ? '#2ecc71' : (paidCount > 0 ? '#f39c12' : '#ddd');
                                                                        const btnText = paidCount === 0 ? '결제 대기' : (paidCount === res.tickets ? '결제 완료' : `부분 결제 ${paidCount}/${res.tickets}`);

                                                                        return (
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
                                                                                    <div onClick={() => handleOpenPaymentModal(res)} style={{ flex: 1, padding: '0.5rem', textAlign: 'center', borderRadius: '4px', background: btnBg, color: btnColor, border: `1px solid ${btnBorder}`, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                                                        {btnText}
                                                                                    </div>
                                                                                    <div onClick={() => handleDeleteReservation(res.id)} style={{ flex: 1, padding: '0.5rem', textAlign: 'center', borderRadius: '4px', background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                                                        취소
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
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

            {/* Mobile Payment Modal */}
            {paymentModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                }} onClick={() => setPaymentModal(null)}>
                    <div style={{
                        background: '#fff',
                        width: '100%',
                        maxWidth: '500px',
                        padding: '2rem 1.5rem',
                        borderTopLeftRadius: '20px',
                        borderTopRightRadius: '20px',
                        animation: 'slideUp 0.3s ease-out'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{paymentModal.name}님의 결제 상태</h3>
                            <button onClick={() => setPaymentModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>&times;</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>총 예매 티켓: <strong>{paymentModal.tickets}매</strong></p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <button
                                    onClick={() => setModalPaidTickets(p => Math.max(0, p - 1))}
                                    disabled={modalPaidTickets === 0}
                                    style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: '#f5f5f5', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: modalPaidTickets === 0 ? 'not-allowed' : 'pointer', color: '#333' }}
                                >-</button>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', width: '80px', textAlign: 'center', color: modalPaidTickets === 0 ? '#999' : (modalPaidTickets === paymentModal.tickets ? '#2ecc71' : '#f39c12') }}>
                                    {modalPaidTickets} <span style={{ fontSize: '1rem', color: '#888' }}>/ {paymentModal.tickets}</span>
                                </div>
                                <button
                                    onClick={() => setModalPaidTickets(p => Math.min(paymentModal.tickets, p + 1))}
                                    disabled={modalPaidTickets === paymentModal.tickets}
                                    style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: '#f5f5f5', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: modalPaidTickets === paymentModal.tickets ? 'not-allowed' : 'pointer', color: '#333' }}
                                >+</button>
                            </div>
                        </div>
                        <button
                            onClick={handleSavePaymentModal}
                            style={{ width: '100%', padding: '1rem', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >완료</button>
                    </div>
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
                
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default ReservationStatus;
