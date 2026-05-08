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
        <div className="booking-card" style={{
            padding: '0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #eee',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            opacity: isEnded ? 0.7 : 1,
            filter: isEnded ? 'grayscale(0.5)' : 'none',
            background: isEnded ? '#fcfcfc' : '#fff'
        }}>
            <div style={{
                background: isEnded ? '#999' : 'var(--accent-color)',
                color: '#fff',
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.9 }}>TICKET NO. {res.rank || '-'}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{res.tickets}매</span>
            </div>

            <div style={{ padding: '1.5rem', flex: 1 }}>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.8rem', color: isEnded ? '#666' : 'var(--text-primary)' }}>{res.performances?.title}</h4>

                <div style={{ fontSize: '0.9rem', color: isEnded ? '#888' : 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📅</span>
                        <span style={{ fontWeight: isEnded ? 'normal' : 'bold', color: isEnded ? '#888' : 'var(--text-primary)' }}>
                            {res.date} {res.time} {isEnded ? '(종료)' : ''}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>👤</span>
                        <span>{res.name}</span>
                    </div>
                </div>
            </div>

            <div style={{
                padding: '1.2rem 1.5rem',
                borderTop: res.isEnded ? '1px dashed #ddd' : '1px dashed #eee',
                background: isEnded ? '#f5f5f5' : '#fafafa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: isEnded ? '#aaa' : '#999', marginBottom: '0.2rem' }}>
                        {isEnded ? '결제 금액' : '현장 결제 금액'}
                    </span>
                    <span style={{ color: isEnded ? '#888' : 'var(--accent-color)', fontWeight: '800', fontSize: '1.1rem' }}>
                        {(res.total_price || 0).toLocaleString()}원
                    </span>
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
