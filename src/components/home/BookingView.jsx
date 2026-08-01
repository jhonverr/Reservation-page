import { useEffect, useRef, useState } from 'react';
import MapView from '../MapView';
import ReviewSection from './ReviewSection';
import ReservationSuccess from './ReservationSuccess';
import ReservationConfirmModal from './ReservationConfirmModal';
import ChevronIcon from '../icons/ChevronIcon';
import { isSessionEnded, getDayOfWeek } from '../../utils/date';
import { formatPhone } from '../../utils/format';

export default function BookingView({
    selectedPerf, sessions, occupancy,
    formData, setFormData, handleChange, handleSubmit,
    phone, isIdentified, loading,
    privacyAgreed, setPrivacyAgreed, setShowPrivacyModal,
    setView, isPerformanceEnded,
    detailLoading, detailError, onRetryDetail,
    bookingStep, reservationError, completedReservation,
    handleConfirmReservation, resetBookingFlow,
    reviews, canReview, hasReviewed,
    editingReviewId, setEditingReviewId,
    editContent, setEditContent,
    submitReview, handleDeleteReview, handleUpdateReview
}) {
    const bookingPanelRef = useRef(null);
    const [showMobileCta, setShowMobileCta] = useState(true);
    const [showReservationConfirm, setShowReservationConfirm] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(true);

    useEffect(() => {
        const panel = bookingPanelRef.current;
        if (!panel || typeof IntersectionObserver === 'undefined') return undefined;

        const observer = new IntersectionObserver(([entry]) => {
            setShowMobileCta(!entry.isIntersecting);
        }, { threshold: 0.18 });
        observer.observe(panel);
        return () => observer.disconnect();
    }, [bookingStep]);

    useEffect(() => {
        if (bookingStep === 'success') {
            requestAnimationFrame(() => {
                bookingPanelRef.current?.querySelector('.reservation-success')?.focus();
            });
        }
    }, [bookingStep]);

    if (!selectedPerf) return null;

    const visibleSessions = sessions.length > 0 ? sessions : selectedPerf.sessions || [];
    const selectedSession = visibleSessions.find(s => s.date === formData.date && s.time === formData.time);
    const castingInfo = selectedSession?.casting_info ? String(selectedSession.casting_info).trim() : '';
    const selectedKey = selectedSession ? `${selectedSession.date}|${selectedSession.time}` : '';
    const selectedBooked = selectedKey
        ? (occupancy[selectedPerf.id]?.[selectedKey] || 0)
        : 0;
    const selectedRemaining = selectedSession
        ? Math.max(0, selectedPerf.total_seats - selectedBooked)
        : 10;
    const maxTickets = selectedSession ? Math.min(10, selectedRemaining) : 10;
    const optimizedPosterUrl = selectedPerf.poster_url
        ? `https://wsrv.nl/?url=${encodeURIComponent(selectedPerf.poster_url)}&w=900&output=webp&q=82`
        : '';

    const scrollToBooking = () => {
        bookingPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleReservationSubmit = async (event) => {
        const isValid = await handleSubmit(event);
        if (isValid) setShowReservationConfirm(true);
    };

    const confirmReservation = async () => {
        const wasCreated = await handleConfirmReservation();
        setShowReservationConfirm(false);
        if (!wasCreated) {
            requestAnimationFrame(() => bookingPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        }
    };

    const renderBookingForm = () => (
        <div className="sticky-booking-card">
            <div className="booking-panel-heading">
                <span className="step-kicker">빠른 예매</span>
                <h2 id="booking-form-title">예매하기</h2>
                <p>원하는 회차와 관람 인원을 선택해주세요.</p>
            </div>

            {detailLoading && (
                <div className="inline-status" role="status">최신 회차 정보를 확인하고 있어요…</div>
            )}

            <form onSubmit={handleReservationSubmit} className="booking-form" aria-labelledby="booking-form-title" noValidate>
                <div className="form-group">
                    <label htmlFor="performance-date">날짜</label>
                    <select
                        id="performance-date"
                        className="form-control-sm"
                        name="date"
                        value={formData.date}
                        onChange={(e) => {
                            const newDate = e.target.value;
                            setFormData(prev => ({ ...prev, date: newDate, time: '' }));
                        }}
                        required
                        disabled={detailLoading || sessions.length === 0}
                    >
                        {[...new Set(sessions.map(s => s.date))].map(date => (
                            <option key={date} value={date}>{date} ({getDayOfWeek(date)})</option>
                        ))}
                        {sessions.length === 0 && <option value="">회차 정보 없음</option>}
                    </select>
                </div>

                <fieldset className="form-group session-fieldset">
                    <legend>시간</legend>
                    <div className="session-grid">
                        {sessions.filter(s => s.date === formData.date).map(s => {
                            const key = `${s.date}|${s.time}`;
                            const booked = occupancy[selectedPerf.id]?.[key] || 0;
                            const remaining = Math.max(0, selectedPerf.total_seats - booked);
                            const isSoldOut = remaining <= 0;
                            const isEnded = isSessionEnded(selectedPerf, s);
                            const isSelected = formData.time === s.time;

                            return (
                                <button
                                    key={`${s.date}-${s.time}`}
                                    type="button"
                                    className={`session-option ${isSelected ? 'selected' : ''}`}
                                    disabled={isSoldOut || isEnded}
                                    aria-pressed={isSelected}
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        time: s.time,
                                        tickets: Math.min(prev.tickets, Math.max(1, remaining))
                                    }))}
                                >
                                    <span>{s.time}</span>
                                    <small>{isSoldOut ? '매진' : (isEnded ? '관람 종료' : `잔여 ${remaining}석`)}</small>
                                </button>
                            );
                        })}
                    </div>
                    {!detailLoading && sessions.length > 0 && sessions.filter(s => s.date === formData.date).length === 0 && (
                        <p className="field-help">선택 가능한 시간이 없습니다.</p>
                    )}
                    {castingInfo && (
                        <div className="casting-card">
                            <strong>캐스팅</strong>
                            <span>{castingInfo}</span>
                        </div>
                    )}
                </fieldset>

                <div className="form-group">
                    <label htmlFor="reservation-name">예매자명</label>
                    <input
                        id="reservation-name"
                        className="form-control-sm"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="홍길동"
                        autoComplete="name"
                        required
                    />
                </div>

                {isIdentified ? (
                    <div className="form-group">
                        <label htmlFor="reservation-phone">확인된 휴대전화 번호</label>
                        <input
                            id="reservation-phone"
                            type="tel"
                            className="form-control-sm verified-input"
                            value={formatPhone(phone)}
                            readOnly
                            aria-readonly="true"
                        />
                    </div>
                ) : (
                    <div className="verification-notice">
                        <span aria-hidden="true">🔒</span>
                        <div>
                            <strong>로그인이 필요해요</strong>
                            <p>로그인 후에도 지금 선택한 내용은 그대로 유지됩니다.</p>
                        </div>
                    </div>
                )}

                <div className="ticket-price-panel">
                    <div>
                        <span className="field-label">관람 인원</span>
                        <div className="ticket-stepper">
                            <button
                                type="button"
                                className="btn btn-secondary btn-icon-circle"
                                aria-label="관람 인원 줄이기"
                                disabled={formData.tickets <= 1}
                                onClick={() => setFormData(prev => ({ ...prev, tickets: Math.max(1, prev.tickets - 1) }))}
                            >−</button>
                            <output aria-live="polite" aria-label={`관람 인원 ${formData.tickets}명`}>{formData.tickets}</output>
                            <button
                                type="button"
                                className="btn btn-secondary btn-icon-circle"
                                aria-label="관람 인원 늘리기"
                                disabled={Boolean(selectedSession) && formData.tickets >= maxTickets}
                                onClick={() => setFormData(prev => ({ ...prev, tickets: Math.min(maxTickets, prev.tickets + 1) }))}
                            >+</button>
                        </div>
                    </div>
                    <div className="price-summary">
                        <span>현장 결제 금액</span>
                        <strong>{(formData.tickets * selectedPerf.price).toLocaleString()}원</strong>
                        <small>공연 당일 현장 결제</small>
                    </div>
                </div>

                <div className="privacy-row">
                    <input
                        type="checkbox"
                        id="privacy-agree"
                        checked={privacyAgreed}
                        onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    />
                    <label htmlFor="privacy-agree">[필수] 개인정보 수집 및 이용 동의</label>
                    <button type="button" className="link-button touch-link" onClick={() => setShowPrivacyModal(true)}>
                        자세히
                    </button>
                </div>

                {reservationError && <div className="form-message form-message-error" role="alert">{reservationError}</div>}

                {(() => {
                    const currentS = sessions.find(s => s.date === formData.date && s.time === formData.time);
                    const ended = isPerformanceEnded(selectedPerf) || (currentS ? isSessionEnded(selectedPerf, currentS) : false);

                    if (ended) {
                        return <button type="button" disabled className="btn btn-muted btn-full booking-primary-action">종료된 공연 또는 회차입니다</button>;
                    }
                    if (!isIdentified) {
                        return (
                            <button type="button" className="btn btn-primary btn-full booking-primary-action" onClick={() => setView('login')}>
                                로그인 후 계속
                            </button>
                        );
                    }
                    return (
                        <button type="submit" className="btn btn-primary btn-full booking-primary-action" disabled={loading || detailLoading}>
                            {loading ? '예매 처리 중…' : '예매 완료하기'}
                        </button>
                    );
                })()}
            </form>
        </div>
    );

    return (
        <section className="booking-detail">
            <button type="button" className="back-link" onClick={() => setView('performances')}>
                <ChevronIcon direction="left" size={18} /> 공연 목록
            </button>

            <header className="perf-detail-summary">
                <div>
                    <span className="detail-eyebrow">공연 상세</span>
                    <h1>{selectedPerf.title}</h1>
                    <p className="detail-location"><span aria-hidden="true">📍</span>{selectedPerf.location}</p>
                </div>
                <div className="detail-price">
                    <span>티켓 가격 · 현장 결제</span>
                    <strong>{selectedPerf.price.toLocaleString()}원</strong>
                </div>
                <ul className="detail-facts" aria-label="공연 기본 정보">
                    <li><span aria-hidden="true">⏱</span><strong>공연 시간</strong><span className="detail-fact-value">{selectedPerf.duration}</span></li>
                    <li><span aria-hidden="true">👥</span><strong>관람 등급</strong><span className="detail-fact-value">{selectedPerf.age_rating === 'all' ? '전체 관람가' : `${selectedPerf.age_rating}세 이상`}</span></li>
                    <li><span aria-hidden="true">💺</span><strong>회차당 좌석</strong><span className="detail-fact-value">{selectedPerf.total_seats}석</span></li>
                    {selectedPerf.contact_phone && (
                        <li><span aria-hidden="true">☎</span><strong>공연 문의</strong><a className="detail-fact-value" href={`tel:${selectedPerf.contact_phone}`}>{formatPhone(selectedPerf.contact_phone)}</a></li>
                    )}
                </ul>
            </header>

            {detailError && (
                <div className="page-status page-status-error" role="alert">
                    <div><strong>상세 정보를 불러오지 못했어요.</strong><p>{detailError}</p></div>
                    <button type="button" className="btn btn-secondary" onClick={onRetryDetail}>다시 시도</button>
                </div>
            )}

            <div className="perf-detail-grid">
                <div className="perf-poster-panel">
                    {optimizedPosterUrl ? (
                        <div className="detail-poster-frame">
                            <img
                                src={optimizedPosterUrl}
                                alt={`${selectedPerf.title} 공연 포스터`}
                                width="900"
                                height="1200"
                                loading="eager"
                                fetchPriority="high"
                            />
                        </div>
                    ) : (
                        <div className="poster-placeholder">등록된 공연 포스터가 없습니다.</div>
                    )}
                </div>

                <div id="booking-panel" className="perf-booking-panel" ref={bookingPanelRef}>
                    {bookingStep === 'success' ? (
                        <ReservationSuccess
                            reservation={completedReservation}
                            onHistory={() => { resetBookingFlow(); setView('history'); }}
                            onList={() => { resetBookingFlow(); setView('performances'); }}
                        />
                    ) : renderBookingForm()}
                </div>

                <div className="perf-description-panel">
                    <details open={detailsOpen} onToggle={(e) => setDetailsOpen(e.currentTarget.open)}>
                        <summary><span>작품 소개 · 캐스트</span><span className="details-hint">내용 보기</span></summary>
                        <div className="performance-description">{selectedPerf.description}</div>
                    </details>

                    <section className="venue-section" aria-labelledby="venue-title">
                        <h2 id="venue-title"><span aria-hidden="true">📍</span> 공연장 정보</h2>
                        <p>{selectedPerf.location}</p>
                        {selectedPerf.latitude && selectedPerf.longitude && (
                            <MapView lat={selectedPerf.latitude} lng={selectedPerf.longitude} locationName={selectedPerf.location} />
                        )}
                    </section>
                </div>

                <div className="perf-reviews-panel">
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
            </div>

            {bookingStep === 'form' && showMobileCta && (
                <div className="mobile-booking-cta">
                    <div><span>티켓 가격</span><strong>{selectedPerf.price.toLocaleString()}원</strong></div>
                    <button type="button" className="btn btn-primary" onClick={scrollToBooking}>예매하기</button>
                </div>
            )}

            {showReservationConfirm && (
                <ReservationConfirmModal
                    performance={selectedPerf}
                    formData={formData}
                    phone={phone}
                    castingInfo={castingInfo}
                    loading={loading}
                    onCancel={() => setShowReservationConfirm(false)}
                    onConfirm={confirmReservation}
                />
            )}
        </section>
    );
}
