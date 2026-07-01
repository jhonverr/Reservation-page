import PerformanceCard from '../PerformanceCard';

export default function PerformanceListView({ ongoingPerformances, endedPerformances, occupancy, handleSelectPerf, isIdentified, bookedPerfIds }) {
    return (
        <section className="performances-view">
            {/* Ongoing Performances */}
            <div style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0 }}>진행 중인 공연</h2>
                    <span className="status-chip status-chip-primary">
                        {ongoingPerformances.length}건
                    </span>
                </div>

                <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '2.5rem' }}>
                    {ongoingPerformances.map(perf => (
                        <PerformanceCard
                            key={perf.id}
                            perf={perf}
                            occupancy={occupancy}
                            onSelect={handleSelectPerf}
                            posterVariant="portrait"
                        />
                    ))}
                </div>
            </div>

            {/* Ended Performances */}
            {endedPerformances.length > 0 && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <h2 style={{ margin: 0, color: '#999' }}>종료된 공연</h2>
                    </div>
                    <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '2.5rem' }}>
                        {endedPerformances.map(perf => (
                            <PerformanceCard
                                key={perf.id}
                                perf={perf}
                                occupancy={occupancy}
                                onSelect={handleSelectPerf}
                                isEnded={true}
                                canReview={isIdentified && bookedPerfIds?.has(perf.id)}
                                posterVariant="portrait"
                            />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
