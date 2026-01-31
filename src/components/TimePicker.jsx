import { useState, useEffect } from 'react';

function TimePicker({ value, onChange }) {
    // Initial state based on passed value (HH:MM) or default to 19:00 (PM 07:00)
    const [ampm, setAmpm] = useState('PM');
    const [hour, setHour] = useState('07');
    const [minute, setMinute] = useState('00');

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            const hNum = parseInt(h, 10);

            if (hNum >= 12) {
                setAmpm('PM');
                const pmHour = hNum > 12 ? hNum - 12 : hNum;
                setHour(pmHour.toString().padStart(2, '0'));
            } else {
                setAmpm('AM');
                const amHour = hNum === 0 ? 12 : hNum;
                setHour(amHour.toString().padStart(2, '0'));
            }
            setMinute(m);
        }
    }, [value]);

    const updateTime = (newAmpm, newHour, newMinute) => {
        let h = parseInt(newHour, 10);

        if (newAmpm === 'PM' && h !== 12) h += 12;
        if (newAmpm === 'AM' && h === 12) h = 0;

        const timeString = `${h.toString().padStart(2, '0')}:${newMinute}`;
        onChange(timeString);
    };

    const handleAmpmChange = (e) => {
        const newAmpm = e.target.value;
        setAmpm(newAmpm);
        updateTime(newAmpm, hour, minute);
    };

    const handleHourChange = (e) => {
        const newHour = e.target.value;
        setHour(newHour);
        updateTime(ampm, newHour, minute);
    };

    const handleMinuteChange = (e) => {
        const newMinute = e.target.value;
        setMinute(newMinute);
        updateTime(ampm, hour, newMinute);
    };

    return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
                value={ampm}
                onChange={handleAmpmChange}
                style={{ padding: '0.8rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd', color: 'var(--text-primary)' }}
            >
                <option value="AM">오전</option>
                <option value="PM">오후</option>
            </select>

            <select
                value={hour}
                onChange={handleHourChange}
                style={{ padding: '0.8rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd', color: 'var(--text-primary)' }}
            >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
                    const hStr = h.toString().padStart(2, '0');
                    return <option key={h} value={hStr}>{hStr}시</option>;
                })}
            </select>

            <select
                value={minute}
                onChange={handleMinuteChange}
                style={{ padding: '0.8rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd', color: 'var(--text-primary)' }}
            >
                <option value="00">00분</option>
                <option value="30">30분</option>
            </select>
        </div>
    );
}

export default TimePicker;
