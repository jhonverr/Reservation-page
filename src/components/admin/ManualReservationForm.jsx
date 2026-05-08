export default function ManualReservationForm({ perf, manualForm, setManualForm, handleAddReservation, setShowAddForm }) {
    return (
        <div className="manual-form-grid control-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>성함</label>
                <input className="form-control-sm" type="text" value={manualForm.name} onChange={(e) => setManualForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>연락처</label>
                <input
                    className="form-control-sm"
                    type="tel"
                    value={manualForm.phone}
                    onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setManualForm(p => ({ ...p, phone: value }));
                    }}
                />
            </div>
            <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>회차 일시</label>
                <select
                    className="form-control-sm"
                    value={`${manualForm.date}|${manualForm.time}`}
                    onChange={(e) => {
                        const [d, t] = e.target.value.split('|');
                        setManualForm(p => ({ ...p, date: d, time: t }));
                    }}
                >
                    <option value="">회차 선택</option>
                    {perf.sessions?.map((s, idx) => (
                        <option key={idx} value={`${s.date}|${s.time}`}>{s.date} ({s.time})</option>
                    ))}
                </select>
            </div>
            <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>매수</label>
                <input className="form-control-sm" type="number" min="1" value={manualForm.tickets} onChange={(e) => setManualForm(p => ({ ...p, tickets: parseInt(e.target.value) }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddForm(null)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>취소</button>
                <button type="button" onClick={() => handleAddReservation(perf.id)} className="btn btn-success btn-sm" style={{ flex: 1 }}>저장</button>
            </div>
        </div>
    );
}
