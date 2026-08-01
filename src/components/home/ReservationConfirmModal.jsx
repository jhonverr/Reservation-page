import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { formatPhone } from '../../utils/format';

export default function ReservationConfirmModal({ performance, formData, phone, castingInfo, loading, onCancel, onConfirm }) {
    const dialogRef = useRef(null);
    const cancelButtonRef = useRef(null);

    useEffect(() => {
        const previouslyFocused = document.activeElement;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        cancelButtonRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !loading) {
                event.preventDefault();
                onCancel();
                return;
            }

            if (event.key !== 'Tab' || !dialogRef.current) return;
            const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled)')];
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
            previouslyFocused?.focus?.();
        };
    }, [loading, onCancel]);

    return (
        <div className="modal-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) onCancel();
        }}>
            <div
                ref={dialogRef}
                className="reservation-confirm-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reservation-confirm-title"
                aria-describedby="reservation-confirm-description"
            >
                <span className="step-kicker">예매 내용 확인</span>
                <h2 id="reservation-confirm-title">이 내용으로 예매를 진행하시겠습니까?</h2>
                <p id="reservation-confirm-description">공연 일시와 인원을 한 번 더 확인해주세요.</p>

                <dl className="reservation-summary-list confirm-summary-list">
                    <div><dt>공연</dt><dd>{performance.title}</dd></div>
                    <div><dt>일시</dt><dd>{formData.date} {formData.time}</dd></div>
                    {castingInfo && <div><dt>캐스팅</dt><dd>{castingInfo}</dd></div>}
                    <div><dt>예매자</dt><dd>{formData.name} · {formatPhone(phone)}</dd></div>
                    <div><dt>인원</dt><dd>{formData.tickets}명</dd></div>
                    <div className="reservation-summary-total"><dt>현장 결제 금액</dt><dd>{(formData.tickets * performance.price).toLocaleString()}원</dd></div>
                </dl>

                <div className="reservation-confirm-actions">
                    <button ref={cancelButtonRef} type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>다시 선택</button>
                    <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={loading}>
                        {loading ? '예매 처리 중…' : '예매 진행하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}

ReservationConfirmModal.propTypes = {
    performance: PropTypes.shape({ title: PropTypes.string.isRequired, price: PropTypes.number.isRequired }).isRequired,
    formData: PropTypes.shape({ date: PropTypes.string, time: PropTypes.string, name: PropTypes.string, tickets: PropTypes.number }).isRequired,
    phone: PropTypes.string.isRequired,
    castingInfo: PropTypes.string,
    loading: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
};
