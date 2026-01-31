import { useEffect, useState } from 'react';

function ManagePerformance() {
    const [performances, setPerformances] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3000/api/performances')
            .then(res => res.json())
            .then(data => setPerformances(data))
            .catch(err => console.error('Error fetching performances:', err));
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>공연 관리</h2>
                <button className="submit-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}>+ 공연 등록</button>
            </div>

            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {performances.map(perf => (
                    <div key={perf.id} style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>{perf.title}</h3>
                        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem', whiteSpace: 'pre-line' }}>{perf.description}</p>
                        <div style={{ fontSize: '0.9rem' }}>
                            <p>📅 {perf.date_range}</p>
                            <p>📍 {perf.location}</p>
                            <p>💰 {perf.price.toLocaleString()}원</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ManagePerformance;
