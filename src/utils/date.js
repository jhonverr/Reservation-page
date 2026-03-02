/**
 * Checks if a session (performance instance) has ended based on current time.
 * @param {Object} perf - The performance object (containing duration).
 * @param {Object} session - The session object (containing date and time).
 * @returns {boolean} True if the session has ended, false otherwise.
 */
export const isSessionEnded = (perf, session) => {
    if (!session.date) return false;

    const now = new Date();
    // Replaces dots with dashes and removes white spaces (e.g. "2023.10.25" -> "2023-10-25")
    const dateStr = session.date.trim().replace(/\s+/g, '').replace(/\./g, '-');
    const cleanDateStr = dateStr.endsWith('-') ? dateStr.slice(0, -1) : dateStr;

    // Handle missing or localized time
    let timeStr = session.time || '23:59';
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
        timeStr = '23:59'; // Default to end of day so it doesn't expire prematurely
    }

    const dateParts = cleanDateStr.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);

    const timeParts = timeStr.split(':');
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);

    // Create date using local time explicitly
    const startDateTime = new Date(year, month, day, hour, minute, 0);
    if (isNaN(startDateTime.getTime())) return false;

    let durationMinutes = 0;
    if (perf.duration) {
        const match = perf.duration.match(/(\d+)/);
        if (match) durationMinutes = parseInt(match[1]);
    }

    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    console.log(`[Date Debug] session_date: ${session.date}, session_time: ${session.time}, parsed_end: ${endDateTime.toISOString()}, now: ${now.toISOString()}`);

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
