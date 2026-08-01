import { formatPhone } from '../../utils/format';

export default function ReservationSuccess({ reservation, onHistory, onList }) {
    if (!reservation) return null;

    const { performance, date, time, name, phone, tickets, totalPrice, castingInfo } = reservation;

    return (
        <section className="reservation-step-card reservation-success" aria-labelledby="reservation-success-title" tabIndex="-1">
            <div className="success-icon" aria-hidden="true">✓</div>
            <div className="reservation-step-heading">
                <span className="step-kicker">예매 완료</span>
                <h3 id="reservation-success-title">예매가 완료됐어요!</h3>
                <p>아래 내용을 확인하고 공연 당일 현장에서 결제해주세요.</p>
            </div>

            <dl className="reservation-summary-list">
                <div><dt>공연</dt><dd>{performance.title}</dd></div>
                <div><dt>일시</dt><dd>{date} {time}</dd></div>
                {castingInfo && <div><dt>캐스팅</dt><dd>{castingInfo}</dd></div>}
                <div><dt>예매자</dt><dd>{name} · {formatPhone(phone)}</dd></div>
                <div><dt>인원</dt><dd>{tickets}명</dd></div>
                <div className="reservation-summary-total"><dt>현장 결제 금액</dt><dd>{totalPrice.toLocaleString()}원</dd></div>
            </dl>

            <div className="success-notice">
                공연 장소와 문의처는 이 페이지에서 다시 확인할 수 있습니다.
            </div>

            <div className="reservation-step-actions">
                <button type="button" className="btn btn-secondary btn-full" onClick={onList}>공연 목록</button>
                <button type="button" className="btn btn-primary btn-full" onClick={onHistory}>예매 내역 보기</button>
            </div>
        </section>
    );
}
