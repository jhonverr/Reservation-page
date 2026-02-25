export default function PaymentModal({
    paymentModal, modalPaidTickets, setModalPaidTickets,
    setPaymentModal, handlePayFull, handleSavePaymentModal
}) {
    if (!paymentModal) return null;

    const currentPaid = paymentModal.paid_tickets ?? (paymentModal.is_paid ? paymentModal.tickets : 0);
    const showFullPayBtn = currentPaid !== paymentModal.tickets && paymentModal.tickets > 1;

    return (
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
                {showFullPayBtn && (
                    <button
                        onClick={() => { handlePayFull(paymentModal); setPaymentModal(null); }}
                        style={{ width: '100%', padding: '1rem', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '0.5rem' }}
                    >전체 결제</button>
                )}
                <button
                    onClick={handleSavePaymentModal}
                    style={{ width: '100%', padding: '1rem', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
                >완료</button>
            </div>
        </div>
    );
}
