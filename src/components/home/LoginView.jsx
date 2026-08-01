import { formatPhone } from '../../utils/format';

export default function LoginView({ phone, setPhone, handleIdentify, error }) {
    return (
        <section className="booking-section">
            <div className="booking-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <h1 className="identity-title">휴대전화 확인</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    예매를 계속하거나 내역을 확인할 때 사용하는 번호를 입력해주세요.
                </p>
                <form onSubmit={handleIdentify} className="booking-form">
                    <div className="form-group">
                        <label htmlFor="identity-phone">휴대전화 번호</label>
                        <input
                            id="identity-phone"
                            type="tel"
                            placeholder="010-0000-0000"
                            value={formatPhone(phone)}
                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            inputMode="numeric"
                            autoComplete="tel"
                            maxLength="13"
                            aria-describedby={error ? 'identity-error' : undefined}
                            aria-invalid={Boolean(error)}
                            required
                        />
                    </div>
                    {error && <div id="identity-error" className="form-message form-message-error" role="alert">{error}</div>}
                    <button type="submit" className="submit-btn">확인하고 계속</button>
                </form>
            </div>
        </section>
    );
}
