import ReservationItem from '../ReservationItem';
import { isSessionEnded } from '../../utils/date';

export default function HistoryView({ loading, userReservations, handleCancelReservation, setView }) {
    const ongoingReservations = userReservations.filter(res => !isSessionEnded(res.performances || {}, res));
    const endedReservations = userReservations.filter(res => isSessionEnded(res.performances || {}, res));

    return (
        <section className="history-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>나의 예매 내역</h2>
                <button className="nav-btn" onClick={() => setView('performances')} style={{ margin: 0, fontSize: '0.9rem', color: 'var(--accent-color)' }}>← 공연 목록으로</button>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', padding: '3rem' }}>불러오는 중...</p>
            ) : userReservations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {ongoingReservations.length > 0 && (
                        <div>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)' }}>
                                <span style={{ color: 'var(--accent-color)' }}>●</span> 진행 중인 예매
                            </h3>
                            <div className="grid-container" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {ongoingReservations.map(res => (
                                    <ReservationItem
                                        key={res.id}
                                        res={res}
                                        onCancel={handleCancelReservation}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {endedReservations.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#999' }}>
                                    <span style={{ color: '#ccc' }}>●</span> 관람 완료 / 종료된 공연
                                </h3>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.6rem',
                                    fontSize: '0.8rem',
                                    color: '#888',
                                    background: '#f8f9fa',
                                    padding: '0.8rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #eee',
                                    lineHeight: '1.4',
                                    wordBreak: 'keep-all'
                                }}>
                                    <span style={{ fontSize: '1.1rem', marginTop: '-0.1rem' }}>ℹ️</span>
                                    <span>종료된 예매 내역은 개인정보 처리방침에 따라 <b>3개월 후 안전하게 자동 삭제</b>됩니다.</span>
                                </div>
                            </div>
                            <div className="grid-container" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {endedReservations.map(res => (
                                    <ReservationItem
                                        key={res.id}
                                        res={res}
                                        onCancel={handleCancelReservation}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="booking-card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '100%' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎟️</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>아직 예매하신 내역이 없습니다.</p>
                    <button className="submit-btn" style={{ width: '240px' }} onClick={() => setView('performances')}>첫 예매하러 가기</button>
                </div>
            )}
        </section>
    );
}
