import { formatPhone } from '../../utils/format';

export default function LoginView({ phone, setPhone, handleIdentify }) {
    return (
        <section className="booking-section">
            <div className="booking-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <h3 style={{ textAlign: 'center' }}>사용자 확인</h3>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    핸드폰 번호를 입력하시면 예매 및 <br /> 내역 확인이 가능합니다.
                </p>
                <form onSubmit={handleIdentify} className="booking-form">
                    <div className="form-group">
                        <label>핸드폰 번호</label>
                        <input
                            type="tel"
                            placeholder="010-0000-0000"
                            value={formatPhone(phone)}
                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            required
                        />
                    </div>
                    <button type="submit" className="submit-btn">확인하기</button>
                </form>
            </div>
        </section>
    );
}
