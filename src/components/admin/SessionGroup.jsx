import { formatPhone } from '../../utils/format';

export default function SessionGroup({
    group, sessionKey, searchTerms, perfId,
    collapsedSessions, setCollapsedSessions,
    animateRef,
    handleUpdatePayment, handlePayFull, handleDeleteReservation, handleOpenPaymentModal
}) {
    if (searchTerms[perfId] && group.reservations.length === 0) return null;

    const occupancyRate = group.total > 0 ? Math.round((group.booked / group.total) * 100) : 0;
    const isExpanded = !collapsedSessions[sessionKey] || (!!searchTerms[perfId] && group.reservations.length > 0);

    return (
        <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', opacity: group.isEnded ? 0.7 : 1 }}>
            {/* Session Header */}
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
                    <span style={{ fontWeight: 'bold', fontSize: '1rem', color: group.isEnded ? '#888' : '#333' }}>
                        {group.originalIdx !== -1 ? `${group.originalIdx + 1}회차` : '기타 회차'}
                        {group.isEnded && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#999', fontWeight: 'normal' }}>[종료]</span>}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: group.isEnded ? '#aaa' : '#666', marginLeft: '0.2rem' }}>
                        ({group.session.date} {group.session.time})
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: '0 1 auto', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.85rem', color: group.isEnded ? '#aaa' : '#555', fontWeight: 'bold', whiteSpace: 'nowrap', background: '#eee', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        결제 {group.totalPaid}/{group.booked}
                    </span>
                    <span style={{
                        fontSize: '0.85rem',
                        color: group.isEnded ? '#aaa' : (occupancyRate >= 100 ? '#e74c3c' : '#2ecc71'),
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        background: group.isEnded ? '#f5f5f5' : (occupancyRate >= 100 ? '#fceeee' : '#eafaf1'),
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px'
                    }}>
                        예매 {group.booked}/{group.total} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>({occupancyRate}%)</span>
                    </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#999', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
            </div>

            {/* Session Body */}
            {isExpanded && (
                <div style={{ padding: '0', borderTop: '1px solid #eee' }}>
                    {/* Desktop Table */}
                    <div className="table-container desktop-only">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <colgroup>
                                <col width="12%" />
                                <col width="18%" />
                                <col width="10%" />
                                <col width="20%" />
                                <col width="25%" />
                                <col width="15%" />
                            </colgroup>
                            <thead>
                                <tr style={{ background: '#fff' }}>
                                    <th style={{ textAlign: 'center' }}>예매자</th>
                                    <th style={{ textAlign: 'center' }}>연락처</th>
                                    <th>티켓</th>
                                    <th style={{ textAlign: 'center' }}>예매일시</th>
                                    <th style={{ width: '60px', textAlign: 'center' }}>결제</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>관리</th>
                                </tr>
                            </thead>
                            <tbody ref={animateRef}>
                                {group.reservations.map(res => {
                                    const paidCount = res.paid_tickets ?? (res.is_paid ? res.tickets : 0);
                                    const isFullyPaid = paidCount === res.tickets;
                                    return (
                                        <tr key={res.id} className="reservation-row" style={{ opacity: isFullyPaid ? 0.8 : 1 }}>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{res.name}</td>
                                            <td style={{ textAlign: 'center' }}>{formatPhone(res.phone)}</td>
                                            <td>{res.tickets}매</td>
                                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{new Date(res.created_at).toLocaleString()}</td>
                                            <td style={{ textAlign: 'left', minWidth: '130px', padding: '0.8rem 1rem 0.8rem 4.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.5rem', flexWrap: 'nowrap' }}>
                                                    <button
                                                        onClick={() => handleUpdatePayment(res, -1)}
                                                        disabled={paidCount === 0}
                                                        style={{ padding: '0.2rem 0.6rem', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', cursor: paidCount === 0 ? 'not-allowed' : 'pointer', color: '#333' }}
                                                    >-</button>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', minWidth: '45px', textAlign: 'center', whiteSpace: 'nowrap', color: paidCount === 0 ? '#999' : (isFullyPaid ? '#2ecc71' : '#f39c12') }}>
                                                        {paidCount} <span style={{ fontSize: '0.8rem', color: '#888' }}>/ {res.tickets}</span>
                                                    </span>
                                                    <button
                                                        onClick={() => handleUpdatePayment(res, 1)}
                                                        disabled={isFullyPaid}
                                                        style={{ padding: '0.2rem 0.6rem', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', cursor: isFullyPaid ? 'not-allowed' : 'pointer', color: '#333' }}
                                                    >+</button>
                                                    {!isFullyPaid && res.tickets > 1 && (
                                                        <button
                                                            onClick={() => handlePayFull(res)}
                                                            style={{ padding: '0.2rem 0.4rem', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                                                        >+ All</button>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleDeleteReservation(res.id)}
                                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                                >취소</button>
                                            </td>
                                        </tr>
                                    );
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
                    <div className="mobile-only" style={{ padding: '1rem' }} ref={animateRef}>
                        {group.reservations.map(res => {
                            const paidCount = res.paid_tickets ?? (res.is_paid ? res.tickets : 0);
                            const isFullyPaid = paidCount === res.tickets;
                            const btnBg = paidCount === res.tickets ? '#2ecc71' : (paidCount > 0 ? '#f39c12' : '#fff');
                            const btnColor = paidCount > 0 ? '#fff' : '#999';
                            const btnBorder = paidCount === res.tickets ? '#2ecc71' : (paidCount > 0 ? '#f39c12' : '#ddd');
                            const btnText = paidCount === 0 ? '결제 진행' : (paidCount === res.tickets ? '결제 완료' : `부분 결제 ${paidCount}/${res.tickets}`);

                            return (
                                <div key={res.id} className="reservation-card" style={{
                                    background: '#fff',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #eee',
                                    marginBottom: '0.8rem',
                                    opacity: isFullyPaid ? 0.8 : 1
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
                            );
                        })}
                        {group.reservations.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>예약 내역이 없습니다.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
