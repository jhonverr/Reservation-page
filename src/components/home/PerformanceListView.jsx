import PerformanceCard from '../PerformanceCard';

export default function PerformanceListView({ ongoingPerformances, endedPerformances, occupancy, handleSelectPerf }) {
    return (
        <section className="performances-view">
            {/* Ongoing Performances */}
            <div style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0 }}>진행 중인 공연</h2>
                    <span style={{ padding: '0.4rem 0.8rem', background: 'var(--accent-color)', color: '#fff', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
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
                            />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
