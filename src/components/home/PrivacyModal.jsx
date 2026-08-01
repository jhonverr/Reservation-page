import { useEffect, useRef } from 'react';

export default function PrivacyModal({ onClose }) {
    const dialogRef = useRef(null);
    const closeButtonRef = useRef(null);

    useEffect(() => {
        const previouslyFocused = document.activeElement;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== 'Tab' || !dialogRef.current) return;
            const focusable = [...dialogRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )].filter(element => !element.disabled);
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
    }, [onClose]);

    return (
        <div className="modal-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
        }}>
            <div
                ref={dialogRef}
                className="privacy-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="privacy-dialog-title"
                aria-describedby="privacy-dialog-description"
            >
                <button ref={closeButtonRef} type="button" className="modal-close" onClick={onClose} aria-label="개인정보 안내 닫기">×</button>
                <h2 id="privacy-dialog-title">개인정보 수집 및 이용 동의</h2>
                <div id="privacy-dialog-description" className="privacy-content">
                    <p><strong>1. 수집 및 이용 목적</strong><br />공연 예매 확인, 티켓 발권, 예매 내역 조회, 고객 상담 및 안내</p>
                    <p><strong>2. 수집 항목</strong><br />이름, 휴대전화번호</p>
                    <p><strong>3. 보유 및 이용 기간</strong><br /><span className="privacy-emphasis">공연 종료 후 3개월까지</span> (단, 관계 법령에 따름)</p>
                    <p><strong>4. 동의 거부 권리</strong><br />귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 단, 동의를 거부할 경우 예매가 불가능합니다.</p>
                </div>
                <button type="button" className="btn btn-primary btn-full" onClick={onClose}>확인했습니다</button>
            </div>
        </div>
    );
}
