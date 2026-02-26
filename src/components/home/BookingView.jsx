import MapView from '../MapView';
import ReviewSection from './ReviewSection';
import { isSessionEnded } from '../../utils/date';
import { getDayOfWeek } from '../../utils/date';

export default function BookingView({
    selectedPerf, sessions, occupancy,
    formData, setFormData, handleChange, handleSubmit,
    phone, isIdentified, loading,
    privacyAgreed, setPrivacyAgreed, setShowPrivacyModal,
    setView, isPerformanceEnded,
    // Review props
    reviews, canReview, hasReviewed,
    editingReviewId, setEditingReviewId,
    editContent, setEditContent,
    submitReview, handleDeleteReview, handleUpdateReview
}) {
    if (!selectedPerf) return null;

    return (
        <section className="booking-detail perf-detail-grid">
            <div className="perf-info-panel">
                {selectedPerf.poster_url && <img src={`https://wsrv.nl/?url=${encodeURIComponent(selectedPerf.poster_url)}`} alt={selectedPerf.title} loading="lazy" style={{ width: '100%', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />}
                <div style={{ marginTop: '2rem' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{selectedPerf.title}</h2>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                        marginBottom: '2rem',
                        fontSize: '0.95rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>⏱️</span> <b>공연 시간:</b> {selectedPerf.duration}
                        </p>
                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>👥</span>
                            <span><b>관람 등급:</b> {selectedPerf.age_rating === 'all' ? '전체 관람가' : `${selectedPerf.age_rating}세 이상 관람가`}</span>
                        </p>
                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>💺</span>
                            <span><b>총 좌석:</b> 회차당 {selectedPerf.total_seats}석</span>
                        </p>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '3.5rem' }}>{selectedPerf.description}</p>
                    <div style={{ marginBottom: '3rem', paddingTop: '1rem', borderTop: '1px solid #efefef' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📍</span> 오시는 길
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
                            : {selectedPerf.location} {selectedPerf.address ? `(${selectedPerf.address})` : ''}
                        </p>
                        {selectedPerf.latitude && selectedPerf.longitude && (
                            <MapView
                                lat={selectedPerf.latitude}
                                lng={selectedPerf.longitude}
                                locationName={selectedPerf.location}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Booking Form Panel */}
            <div className="perf-booking-panel">
                <div className="sticky-booking-card">
                    <h3>예매하기</h3>
                    <div style={{ marginBottom: '1.5rem' }}></div>
                    <form onSubmit={handleSubmit} className="booking-form">
                        <div className="form-group">
                            <label>날짜</label>
                            <select
                                name="date"
                                value={formData.date}
                                onChange={(e) => {
                                    const newDate = e.target.value;
                                    const firstValidSession = sessions.filter(s => s.date === newDate).find(s => !isSessionEnded(selectedPerf, s));
                                    setFormData(prev => ({
                                        ...prev,
                                        date: newDate,
                                        time: firstValidSession ? firstValidSession.time : ''
                                    }));
                                }}
                                required
                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                            >
                                {[...new Set(sessions.map(s => s.date))].map(date => (
                                    <option key={date} value={date}>{date} ({getDayOfWeek(date)})</option>
                                ))}
                                {sessions.length === 0 && <option value="">회차 정보 없음</option>}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>시간</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                {sessions.filter(s => s.date === formData.date).map(s => {
                                    const key = `${s.date}|${s.time}`;
                                    const booked = (occupancy[selectedPerf.id] && occupancy[selectedPerf.id][key]) || 0;
                                    const remaining = Math.max(0, selectedPerf.total_seats - booked);
                                    const isSoldOut = remaining <= 0;
                                    const isEnded = isSessionEnded(selectedPerf, s);

                                    return (
                                        <button
                                            key={s.time}
                                            type="button"
                                            disabled={isSoldOut || isEnded}
                                            onClick={() => setFormData(prev => ({ ...prev, time: s.time }))}
                                            style={{
                                                padding: '0.8rem',
                                                borderRadius: '8px',
                                                border: formData.time === s.time ? '2px solid var(--accent-color)' : '1px solid #ddd',
                                                background: formData.time === s.time ? '#fff5f5' : (isSoldOut || isEnded ? '#f0f0f0' : '#fff'),
                                                color: formData.time === s.time ? 'var(--accent-color)' : (isSoldOut || isEnded ? '#aaa' : '#333'),
                                                cursor: (isSoldOut || isEnded) ? 'not-allowed' : 'pointer',
                                                fontWeight: formData.time === s.time ? 'bold' : 'normal',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.2rem'
                                            }}
                                        >
                                            <span>{s.time}</span>
                                            <span style={{ fontSize: '0.75rem', color: isSoldOut || isEnded ? '#e74c3c' : 'var(--accent-color)' }}>
                                                {isSoldOut ? '매진' : (isEnded ? '관람 종료' : `${remaining}/${selectedPerf.total_seats}석`)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>예매자명</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="홍길동"
                                required
                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>핸드폰 번호</label>
                            <input type="text" className="form-control" value={phone} disabled style={{ background: '#f8f9fa', color: '#888' }} />
                        </div>

                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            background: '#f8f9fa',
                            borderRadius: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '0.5rem' }}>관람 인원</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, tickets: Math.max(1, prev.tickets - 1) }))}
                                        style={{
                                            width: '32px', height: '32px', minHeight: '32px', maxHeight: '32px',
                                            borderRadius: '50%', border: '1px solid #ddd', background: '#fff',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.1rem', padding: '0', flexShrink: 0
                                        }}
                                    >−</button>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', minWidth: '1rem', textAlign: 'center' }}>{formData.tickets}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, tickets: Math.min(10, prev.tickets + 1) }))}
                                        style={{
                                            width: '32px', height: '32px', minHeight: '32px', maxHeight: '32px',
                                            borderRadius: '50%', border: '1px solid #ddd', background: '#fff',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.1rem', padding: '0', flexShrink: 0
                                        }}
                                    >+</button>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '0.2rem' }}>총 금액</span>
                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-color)' }}>
                                    {(formData.tickets * selectedPerf.price).toLocaleString()}원
                                </span>
                                <p style={{ fontSize: '0.75rem', color: '#888', margin: '0.2rem 0 0 0' }}>* 현장 결제</p>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '0.5rem', marginTop: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <input
                                    type="checkbox"
                                    id="privacy-agree"
                                    checked={privacyAgreed}
                                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px', minHeight: 'unset', padding: '0', flexShrink: 0 }}
                                />
                                <label htmlFor="privacy-agree" style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#555', marginBottom: 0 }}>
                                    [필수] 개인정보 수집 및 이용 동의
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPrivacyModal(true)}
                                    style={{
                                        background: 'none', border: 'none', color: '#999',
                                        textDecoration: 'underline', fontSize: '0.8rem',
                                        cursor: 'pointer', padding: 0, minHeight: 'unset', whiteSpace: 'nowrap'
                                    }}
                                >
                                    자세히
                                </button>
                            </div>
                        </div>

                        {(() => {
                            const currentS = sessions.find(s => s.date === formData.date && s.time === formData.time);
                            const isEnded = isPerformanceEnded(selectedPerf) || (currentS ? isSessionEnded(selectedPerf, currentS) : false);

                            if (isEnded) {
                                return (
                                    <button
                                        type="button"
                                        disabled
                                        style={{
                                            width: '100%', padding: '1rem', marginTop: '0.5rem',
                                            fontSize: '1.1rem', background: '#f0f0f0', color: '#aaa',
                                            border: '1px solid #ddd', borderRadius: '12px',
                                            cursor: 'not-allowed', fontWeight: 'bold'
                                        }}
                                    >
                                        이미 종료된 공연/회차입니다
                                    </button>
                                );
                            }

                            if (!isIdentified) {
                                return (
                                    <button
                                        type="button"
                                        onClick={() => setView('login')}
                                        style={{
                                            width: '100%', padding: '1rem', marginTop: '0.5rem',
                                            fontSize: '1.1rem', background: '#fff',
                                            color: '#e74c3c', border: '1px solid #e74c3c',
                                            borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold',
                                            transition: 'all 0.2s',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                                        }}
                                        onMouseEnter={(e) => { e.target.style.background = '#fff5f5'; }}
                                        onMouseLeave={(e) => { e.target.style.background = '#fff'; }}
                                    >
                                        <span style={{ fontSize: '1.2rem' }}>🔒</span> 로그인 후 예매하기
                                    </button>
                                );
                            }

                            return (
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={loading}
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    {loading ? '처리 중...' : '예매하기'}
                                </button>
                            );
                        })()}
                    </form>
                </div>

                <ReviewSection
                    reviews={reviews}
                    canReview={canReview}
                    hasReviewed={hasReviewed}
                    loading={loading}
                    phone={phone}
                    editingReviewId={editingReviewId}
                    setEditingReviewId={setEditingReviewId}
                    editContent={editContent}
                    setEditContent={setEditContent}
                    submitReview={submitReview}
                    handleDeleteReview={handleDeleteReview}
                    handleUpdateReview={handleUpdateReview}
                />
            </div>
        </section>
    );
}
