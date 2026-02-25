import useReservationData from '../../hooks/useReservationData';
import SessionGroup from '../../components/admin/SessionGroup';
import PaymentModal from '../../components/admin/PaymentModal';
import ManualReservationForm from '../../components/admin/ManualReservationForm';
import './ReservationStatus.css';

function ReservationStatus() {
    const {
        performances, reservations,
        searchTerms, loading,
        collapsedPerfs, setCollapsedPerfs,
        collapsedSessions, setCollapsedSessions,
        paymentModal, setPaymentModal,
        modalPaidTickets, setModalPaidTickets,
        animateRef,
        showAddForm, setShowAddForm,
        manualForm, setManualForm,
        fetchData, getSessionGroups, handleSearchChange,
        handleDeleteReservation, handleUpdatePayment,
        handlePayFull, handleOpenPaymentModal, handleSavePaymentModal,
        handleAddReservation,
    } = useReservationData();

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
                        const perfReservations = reservations.filter(r => r.performance_id === perf.id);
                        const totalBooked = perfReservations.reduce((sum, r) => sum + r.tickets, 0);
                        const totalPaid = perfReservations.reduce((sum, r) => sum + (r.paid_tickets ?? (r.is_paid ? r.tickets : 0)), 0);

                        return (
                            <div key={perf.id} className="booking-card admin-booking-group" style={{ padding: '1.5rem', maxWidth: 'none', margin: '0 auto' }}>
                                <div className="admin-card-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: collapsedPerfs[perf.id] ? 0 : '1rem' }}>
                                    <div className="admin-header-row">
                                        <div>
                                            <h3 style={{ margin: 0, color: 'var(--accent-color)', marginBottom: '0.4rem' }}>{perf.title}</h3>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{perf.date_range}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>총 {totalPaid}석 결제 <span style={{ color: '#ccc', fontWeight: 'normal' }}>|</span> {totalBooked}석 예매</span>
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
                                        {showAddForm === perf.id && (
                                            <ManualReservationForm
                                                perf={perf}
                                                manualForm={manualForm}
                                                setManualForm={setManualForm}
                                                handleAddReservation={handleAddReservation}
                                                setShowAddForm={setShowAddForm}
                                            />
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {sessionGroups.map((group) => {
                                                const sessionKey = `${group.session.date}-${group.session.time}-${group.originalIdx}`;
                                                return (
                                                    <SessionGroup
                                                        key={sessionKey}
                                                        group={group}
                                                        sessionKey={sessionKey}
                                                        searchTerms={searchTerms}
                                                        perfId={perf.id}
                                                        collapsedSessions={collapsedSessions}
                                                        setCollapsedSessions={setCollapsedSessions}
                                                        animateRef={animateRef}
                                                        handleUpdatePayment={handleUpdatePayment}
                                                        handlePayFull={handlePayFull}
                                                        handleDeleteReservation={handleDeleteReservation}
                                                        handleOpenPaymentModal={handleOpenPaymentModal}
                                                    />
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

            <PaymentModal
                paymentModal={paymentModal}
                modalPaidTickets={modalPaidTickets}
                setModalPaidTickets={setModalPaidTickets}
                setPaymentModal={setPaymentModal}
                handlePayFull={handlePayFull}
                handleSavePaymentModal={handleSavePaymentModal}
            />
        </div>
    );
}

export default ReservationStatus;
