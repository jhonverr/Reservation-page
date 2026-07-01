import PropTypes from 'prop-types';
import { isSessionEnded } from '../utils/date';

/**
 * Renders a performance card with details and status.
 * @param {Object} props
 * @param {Object} props.perf - Performance data.
 * @param {Object} props.occupancy - Occupancy data map.
 * @param {Function} props.onSelect - Handler when card is clicked.
 * @param {boolean} [props.isEnded=false] - Whether the performance is ended.
 * @param {boolean} [props.compact=false] - Whether to use a more compact layout.
 * @param {boolean} [props.showCopyButton=false] - Whether to show copy button (e.g. in admin).
 * @param {Function} [props.onCopy] - Handler when copy button is clicked; receives perf.
 */
const PerformanceCard = ({ perf, occupancy, onSelect, isEnded = false, compact = false, canReview = false, showCopyButton = false, onCopy, posterVariant = 'wide' }) => {
    // Helper to check if a performance is fully sold out across all REMAINING sessions
    const isPerformanceSoldOut = () => {
        if (!perf.sessions || perf.sessions.length === 0) return false;

        const ongoingSessions = perf.sessions.filter(s => !isSessionEnded(perf, s));
        if (ongoingSessions.length === 0) return false; // It's ended, not "sold out" in this context

        return ongoingSessions.every(s => {
            const key = `${s.date}|${s.time}`;
            const booked = (occupancy[perf.id] && occupancy[perf.id][key]) || 0;
            return booked >= perf.total_seats;
        });
    };

    const isSoldOut = !isEnded && isPerformanceSoldOut();
    const imageFrameStyle = {
        position: 'relative',
        overflow: 'hidden',
        filter: isEnded ? 'grayscale(0.6)' : 'none',
        ...(posterVariant === 'portrait'
            ? {
                width: compact ? '100%' : 'min(100%, 360px)',
                aspectRatio: '3 / 4',
                margin: compact ? 0 : '1.25rem auto 0',
                borderRadius: compact ? 0 : '12px',
                border: compact ? 'none' : '1px solid #eee',
                background: '#f8f9fa',
                boxSizing: 'border-box'
            }
            : { height: compact ? '220px' : '320px' })
    };

    return (
        <div
            className="booking-card"
            style={{
                padding: '0',
                overflow: 'hidden',
                cursor: isEnded ? 'pointer' : (isSoldOut ? 'default' : 'pointer'),
                position: 'relative',
                border: '1px solid #eee',
                transition: 'all 0.3s ease',
                opacity: isEnded ? 0.9 : 1
            }}
            onClick={() => onSelect(perf)}
        >
            {/* Status Badge (Only for Active and if occupancy is provided) */}
            {!isEnded && occupancy && (
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    zIndex: 3,
                    padding: '0.5rem 1rem',
                    borderRadius: '30px',
                    fontSize: '0.85rem',
                    fontWeight: '900',
                    background: isSoldOut ? 'rgba(231, 76, 60, 0.9)' : 'rgba(46, 204, 113, 0.9)',
                    color: '#fff',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                }}>
                    {isSoldOut ? '전석 매진' : '예매 가능'}
                </div>
            )}

            {/* 복사 버튼 (관리자 공연 관리 탭 등) */}
            {showCopyButton && onCopy && (
                <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={(e) => { e.stopPropagation(); onCopy(perf); }}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        zIndex: 3,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    복사
                </button>
            )}

            <div style={imageFrameStyle}>
                {perf.poster_url && (
                    <img
                        src={`https://wsrv.nl/?url=${encodeURIComponent(perf.poster_url)}`}
                        alt={perf.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                        className="perf-poster"
                    />
                )}

                {/* Overlay for Sold Out or Ended */}
                {(isSoldOut || isEnded) && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: (isEnded || !occupancy) ? 'none' : 'grayscale(0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        letterSpacing: '2px'
                    }}>
                        {isEnded ? '공연 종료' : (occupancy ? '매진' : '')}
                    </div>
                )}
            </div>

            <div style={{ padding: compact ? '1.1rem' : '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ filter: isEnded ? 'grayscale(0.6)' : 'none' }}>
                    <h3 style={{ marginBottom: compact ? '0.6rem' : '1rem', fontSize: compact ? '1.2rem' : '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{perf.title}</h3>
                    {showCopyButton && (
                        <div style={{ margin: '-0.45rem 0 0.7rem', fontSize: '0.8rem', color: '#999', fontWeight: 700 }}>
                            관리 ID #{perf.id}
                        </div>
                    )}
                    <div style={{ fontSize: '0.85rem', color: isEnded ? '#888' : 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 1rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1rem' }}>📅</span>
                            <span>{perf.date_range}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1rem' }}>⏰</span>
                            <span>{perf.duration || '정보 없음'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1rem' }}>👥</span>
                            <span>{perf.age_rating === 'all' ? '전체 관람가' : `${perf.age_rating}세 이상`}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1rem' }}>🪑</span>
                            <span>총 {perf.total_seats}석</span>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.4rem',
                        marginTop: '0.8rem',
                        paddingBottom: '0.8rem',
                        marginBottom: '0.4rem',
                        fontSize: '0.85rem',
                        color: isEnded ? '#888' : 'var(--text-secondary)'
                    }}>
                        <span style={{ fontSize: '1rem', lineHeight: 1.4 }}>📍</span>
                        <span style={{ whiteSpace: 'pre-line' }}>{perf.location}</span>
                    </div>
                </div>

                <div style={{
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: isEnded ? 'flex-end' : 'space-between',
                    alignItems: 'center'
                }}>
                    {!isEnded ? (
                        <>
                            <div style={{ fontSize: '0.75rem', color: '#999', fontWeight: 'bold' }}>TICKET PRICE</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-primary)' }}>{perf.price.toLocaleString()}원</div>
                        </>
                    ) : (
                        <span className={`status-chip ${canReview ? 'status-chip-primary' : 'status-chip-muted'}`} style={{
                            boxShadow: canReview ? '0 4px 10px rgba(0,0,0,0.15)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                        }}>
                            ✍️ 관람평 작성
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

PerformanceCard.propTypes = {
    perf: PropTypes.shape({
        id: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        poster_url: PropTypes.string,
        date_range: PropTypes.string,
        duration: PropTypes.string,
        age_rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        total_seats: PropTypes.number,
        location: PropTypes.string,
        price: PropTypes.number,
        sessions: PropTypes.array
    }).isRequired,
    occupancy: PropTypes.object,
    onSelect: PropTypes.func.isRequired,
    isEnded: PropTypes.bool,
    compact: PropTypes.bool,
    canReview: PropTypes.bool,
    showCopyButton: PropTypes.bool,
    onCopy: PropTypes.func,
    posterVariant: PropTypes.oneOf(['wide', 'portrait'])
};

export default PerformanceCard;
