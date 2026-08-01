import PropTypes from 'prop-types';
import { isSessionEnded } from '../utils/date';
import ChevronIcon from './icons/ChevronIcon';

const PerformanceCard = ({
    perf,
    occupancy,
    onSelect,
    isEnded = false,
    compact = false,
    canReview = false,
    showCopyButton = false,
    onCopy,
    posterVariant = 'wide',
    priority = false,
    href
}) => {
    const ongoingSessions = (perf.sessions || []).filter(session => !isSessionEnded(perf, session));
    const isSoldOut = !isEnded && ongoingSessions.length > 0 && ongoingSessions.every(session => {
        const key = `${session.date}|${session.time}`;
        return (occupancy?.[perf.id]?.[key] || 0) >= perf.total_seats;
    });
    const detailHref = href || `/performance/${perf.id}`;
    const optimizedPosterUrl = perf.poster_url
        ? `https://wsrv.nl/?url=${encodeURIComponent(perf.poster_url)}&w=720&output=webp&q=80`
        : '';

    return (
        <article className={`booking-card performance-card ${isEnded ? 'is-ended' : ''} ${compact ? 'is-compact' : ''} ${showCopyButton ? 'performance-card-admin' : 'performance-card-public'} poster-${posterVariant}`}>
            <a
                className="performance-card-link"
                href={detailHref}
                onClick={(event) => {
                    event.preventDefault();
                    onSelect(perf);
                }}
            >
                <div className="performance-poster-frame">
                    {optimizedPosterUrl ? (
                        <img
                            src={optimizedPosterUrl}
                            alt=""
                            width="720"
                            height="960"
                            loading={priority ? 'eager' : 'lazy'}
                            fetchPriority={priority ? 'high' : 'auto'}
                            className="perf-poster"
                        />
                    ) : (
                        <div className="poster-placeholder">포스터 준비 중</div>
                    )}

                    {!isEnded && (
                        <span className={`availability-badge ${isSoldOut ? 'sold-out' : ''}`}>
                            {isSoldOut ? '전석 매진' : '예매 가능'}
                        </span>
                    )}
                    {isEnded && <span className="ended-overlay">공연 종료</span>}
                </div>

                <div className="performance-card-content">
                    <div className="performance-card-copy">
                        <h2>{perf.title}</h2>
                        {showCopyButton && <span className="admin-performance-id">관리 ID #{perf.id}</span>}
                        <dl className="performance-card-facts">
                            <div><dt aria-label="공연 기간">📅</dt><dd>{perf.date_range}</dd></div>
                            <div><dt aria-label="공연 시간">⏱</dt><dd>{perf.duration || '정보 없음'}</dd></div>
                            <div><dt aria-label="관람 등급">👥</dt><dd>{perf.age_rating === 'all' ? '전체 관람가' : `${perf.age_rating}세 이상`}</dd></div>
                            <div><dt aria-label="좌석 수">💺</dt><dd>회차당 {perf.total_seats}석</dd></div>
                        </dl>
                        <p className="performance-location"><span aria-hidden="true">📍</span>{perf.location}</p>
                    </div>

                    <div className="performance-card-footer">
                        {!isEnded ? (
                            <>
                                <span>티켓 가격</span>
                                <strong>{perf.price.toLocaleString()}원</strong>
                                <em>상세·예매하기 <ChevronIcon size={17} /></em>
                            </>
                        ) : (
                            <span className={`ended-card-action ${canReview ? 'can-review' : ''}`}>
                                {canReview ? '✍ 관람평 작성' : '공연·관람평 보기'} <ChevronIcon size={17} />
                            </span>
                        )}
                    </div>
                </div>
            </a>

            {showCopyButton && onCopy && (
                <button type="button" className="btn btn-outline btn-sm performance-copy-button" onClick={() => onCopy(perf)}>
                    복사
                </button>
            )}
        </article>
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
    posterVariant: PropTypes.oneOf(['wide', 'portrait']),
    priority: PropTypes.bool,
    href: PropTypes.string
};

export default PerformanceCard;
