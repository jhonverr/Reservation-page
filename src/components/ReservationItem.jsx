import PropTypes from 'prop-types';
import { isSessionEnded } from '../utils/date';

/**
 * Renders a single reservation item for the history view.
 * @param {Object} props
 * @param {Object} props.res - Reservation data object.
 * @param {Function} props.onCancel - Handler for cancelling reservation.
 */
const ReservationItem = ({ res, onCancel }) => {
    // Determine if the session is ended based on its performance data and timestamp
    const isEnded = isSessionEnded(res.performances || {}, res);

    return (
        <div className={`booking-card history-reservation-card ${isEnded ? 'is-ended' : ''}`}>
            <div className="history-reservation-head">
                <span>예매 순번 {res.rank || '-'}</span>
                <strong>{res.tickets}매</strong>
            </div>

            <div className="history-reservation-body">
                <h4>{res.performances?.title}</h4>

                <div className="history-reservation-meta">
                    <div>
                        <span aria-hidden="true">📅</span>
                        <strong>
                            {res.date} {res.time} {isEnded ? '(종료)' : ''}
                        </strong>
                    </div>
                    <div>
                        <span aria-hidden="true">👤</span>
                        <span>{res.name}</span>
                    </div>
                </div>
            </div>

            <div className="history-reservation-footer">
                <div className="history-reservation-amount">
                    <span>
                        {isEnded ? '결제 금액' : '현장 결제 금액'}
                    </span>
                    <strong>
                        {(res.total_price || 0).toLocaleString()}원
                    </strong>
                </div>
                {isEnded ? (
                    <button
                        type="button"
                        disabled
                        className="btn btn-muted btn-sm"
                    >
                        관람 완료
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => onCancel(res.id)}
                        className="btn btn-danger-outline btn-sm cancel-btn-history"
                    >
                        예매 취소
                    </button>
                )}
            </div>
        </div>
    );
};

ReservationItem.propTypes = {
    res: PropTypes.shape({
        id: PropTypes.number.isRequired,
        rank: PropTypes.number,
        tickets: PropTypes.number,
        date: PropTypes.string,
        time: PropTypes.string,
        name: PropTypes.string,
        total_price: PropTypes.number,
        performances: PropTypes.shape({
            title: PropTypes.string,
            duration: PropTypes.string
        })
    }).isRequired,
    onCancel: PropTypes.func.isRequired
};

export default ReservationItem;
