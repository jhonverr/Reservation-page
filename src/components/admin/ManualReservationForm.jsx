export default function ManualReservationForm({ perf, manualForm, setManualForm, handleAddReservation, setShowAddForm }) {
    return (
        <div className="manual-form-grid" style={{ background: '#fcfcfc', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>성함</label>
                <input type="text" value={manualForm.name} onChange={(e) => setManualForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>연락처</label>
                <input
                    type="tel"
                    value={manualForm.phone}
                    onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setManualForm(p => ({ ...p, phone: value }));
                    }}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
            </div>
            <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>회차 일시</label>
                <select
                    value={`${manualForm.date}|${manualForm.time}`}
                    onChange={(e) => {
                        const [d, t] = e.target.value.split('|');
                        setManualForm(p => ({ ...p, date: d, time: t }));
                    }}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                    <option value="">회차 선택</option>
                    {perf.sessions?.map((s, idx) => (
                        <option key={idx} value={`${s.date}|${s.time}`}>{s.date} ({s.time})</option>
                    ))}
                </select>
            </div>
            <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>매수</label>
                <input type="number" min="1" value={manualForm.tickets} onChange={(e) => setManualForm(p => ({ ...p, tickets: parseInt(e.target.value) }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setShowAddForm(null)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>취소</button>
                <button onClick={() => handleAddReservation(perf.id)} style={{ flex: 1, padding: '0.5rem', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>저장</button>
            </div>
        </div>
    );
}
