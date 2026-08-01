import PropTypes from 'prop-types';

export default function ChevronIcon({ direction = 'right', size = 18, className = '' }) {
    const rotation = { right: 0, down: 90, left: 180, up: 270 }[direction];

    return (
        <svg
            className={`chevron-icon ${className}`.trim()}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
            style={{ transform: `rotate(${rotation}deg)` }}
        >
            <path d="M9 5.5 15.5 12 9 18.5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

ChevronIcon.propTypes = {
    direction: PropTypes.oneOf(['right', 'down', 'left', 'up']),
    size: PropTypes.number,
    className: PropTypes.string
};
