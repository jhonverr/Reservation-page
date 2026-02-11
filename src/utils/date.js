/**
 * Checks if a session (performance instance) has ended based on current time.
 * @param {Object} perf - The performance object (containing duration).
 * @param {Object} session - The session object (containing date and time).
 * @returns {boolean} True if the session has ended, false otherwise.
 */
export const isSessionEnded = (perf, session) => {
    if (!session.date) return false;

    const now = new Date();
    const dateStr = session.date.trim().replace(/\s+/g, '').replace(/\./g, '-');
    const cleanDateStr = dateStr.endsWith('-') ? dateStr.slice(0, -1) : dateStr;

    // Handle missing or localized time
    let timeStr = session.time || '00:00';
    if (timeStr.includes('오후') || timeStr.includes('PM')) {
        const match = timeStr.match(/(\d+):(\d+)/);
        if (match) {
            let h = parseInt(match[1]);
            if (h !== 12) h += 12;
            timeStr = `${h.toString().padStart(2, '0')}:${match[2]}`;
        }
    } else if (timeStr.includes('오전') || timeStr.includes('AM')) {
        const match = timeStr.match(/(\d+):(\d+)/);
        if (match) {
            let h = parseInt(match[1]);
            if (h === 12) h = 0;
            timeStr = `${h.toString().padStart(2, '0')}:${match[2]}`;
        }
    }

    // Final HH:mm format check
    if (!/^\d{2}:\d{2}$/.test(timeStr)) {
        timeStr = '00:00';
    }

    const startDateTime = new Date(`${cleanDateStr}T${timeStr}:00`);
    if (isNaN(startDateTime.getTime())) return false;

    let durationMinutes = 0;
    if (perf.duration) {
        const match = perf.duration.match(/(\d+)/);
        if (match) durationMinutes = parseInt(match[1]);
    }

    // Add extra buffer (e.g. 3.5 hours = 210 mins) or just duration?
    // Based on previous logic, it seems it was date + duration.
    // The previous implementation used durationMinutes * 60000.
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    // In Home.jsx line 46: return now > endDateTime;
    return now > endDateTime;
};

/**
 * Returns the Korean day of the week for a given date string.
 * @param {string} dateStr - Date string (e.g., "2023.10.25").
 * @returns {string} Day of week (e.g., "수").
 */
export const getDayOfWeek = (dateStr) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const date = new Date(dateStr.replace(/\./g, '-'));
    return days[date.getDay()];
};
