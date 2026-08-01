import { useState } from 'react';
import PerformanceCard from '../PerformanceCard';
import ChevronIcon from '../icons/ChevronIcon';

const PerformanceSkeleton = () => (
    <div className="performance-skeleton" aria-hidden="true">
        <div className="skeleton-poster" />
        <div className="skeleton-copy">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-short" />
        </div>
    </div>
);

export default function PerformanceListView({
    ongoingPerformances,
    endedPerformances,
    occupancy,
    handleSelectPerf,
    isIdentified,
    bookedPerfIds,
    loading,
    error,
    onRetry
}) {
    const [showEnded, setShowEnded] = useState(false);

    if (loading) {
        return (
            <section className="performances-view" aria-busy="true" aria-labelledby="ongoing-title">
                <div className="section-heading">
                    <div><span className="section-kicker">공연 예매</span><h1 id="ongoing-title">진행 중인 공연</h1></div>
                </div>
                <div className="performance-grid" role="status" aria-label="공연 목록을 불러오는 중">
                    <PerformanceSkeleton />
                    <PerformanceSkeleton />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="performances-view">
                <div className="page-status page-status-error" role="alert">
                    <div><strong>공연 목록을 불러오지 못했어요.</strong><p>{error}</p></div>
                    <button type="button" className="btn btn-secondary" onClick={onRetry}>다시 시도</button>
                </div>
            </section>
        );
    }

    return (
        <section className="performances-view" aria-labelledby="ongoing-title">
            <div className="ongoing-section">
                <div className="section-heading">
                    <div>
                        <h1 id="ongoing-title">진행 중인 공연</h1>
                    </div>
                    <span className="status-chip status-chip-primary" aria-label={`${ongoingPerformances.length}개 공연`}>
                        {ongoingPerformances.length}건
                    </span>
                </div>

                {ongoingPerformances.length > 0 ? (
                    <div className="performance-grid">
                        {ongoingPerformances.map((perf, index) => (
                            <PerformanceCard
                                key={perf.id}
                                perf={perf}
                                occupancy={occupancy}
                                onSelect={handleSelectPerf}
                                posterVariant="portrait"
                                priority={index === 0}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <span aria-hidden="true">🎭</span>
                        <h2>현재 예매 가능한 공연이 없습니다.</h2>
                        <p>새 공연이 등록되면 이곳에서 바로 확인할 수 있어요.</p>
                    </div>
                )}
            </div>

            {endedPerformances.length > 0 && (
                <section className="ended-section" aria-labelledby="ended-title">
                    <button
                        type="button"
                        className="ended-toggle"
                        aria-expanded={showEnded}
                        aria-controls="ended-performance-list"
                        onClick={() => setShowEnded(prev => !prev)}
                    >
                        <span><strong id="ended-title">지난 공연</strong><small>{endedPerformances.length}개의 공연과 관람평</small></span>
                        <span className="ended-toggle-action">{showEnded ? '접기' : '보기'} <ChevronIcon direction={showEnded ? 'up' : 'down'} size={18} /></span>
                    </button>

                    {showEnded && (
                        <div id="ended-performance-list" className="performance-grid ended-performance-grid">
                            {endedPerformances.map(perf => (
                                <PerformanceCard
                                    key={perf.id}
                                    perf={perf}
                                    occupancy={occupancy}
                                    onSelect={handleSelectPerf}
                                    isEnded
                                    canReview={isIdentified && bookedPerfIds?.has(perf.id)}
                                    posterVariant="portrait"
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}
        </section>
    );
}
