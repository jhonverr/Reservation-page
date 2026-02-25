export default function PrivacyModal({ onClose }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            boxSizing: 'border-box'
        }} onClick={onClose}>
            <div style={{
                background: '#fff',
                width: '100%',
                maxWidth: '480px',
                borderRadius: '16px',
                padding: '1.5rem',
                position: 'relative',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                boxSizing: 'border-box'
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>개인정보 수집 및 이용 동의</h3>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#444' }}>
                    <p><strong>1. 수집 및 이용 목적</strong><br />
                        공연 예매 확인, 티켓 발권, 예매 내역 조회, 고객 상담 및 안내</p>
                    <p><strong>2. 수집 항목</strong><br />
                        이름, 휴대전화번호</p>
                    <p><strong>3. 보유 및 이용 기간</strong><br />
                        <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>공연 종료 후 3개월까지</span> (단, 관계 법령에 따름)</p>
                    <p><strong>4. 동의 거부 권리</strong><br />
                        귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 단, 동의를 거부할 경우 예매가 불가능합니다.</p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '0.8rem',
                        background: 'var(--accent-color)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        marginTop: '1.5rem',
                        cursor: 'pointer'
                    }}
                >
                    확인했습니다
                </button>
            </div>
        </div>
    );
}
