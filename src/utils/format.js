/**
 * Formats a phone number string into 000-0000-0000 format.
 * @param {string} val - The raw phone number input.
 * @returns {string} The formatted phone number string.
 */
export const formatPhone = (val) => {
    if (!val) return '';
    const raw = val.replace(/[^0-9]/g, '');
    if (raw.length <= 3) return raw;
    if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
    return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
};
