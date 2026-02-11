import { useEffect, useRef } from 'react';

export default function MapView({ lat, lng, locationName }) {
    const mapElement = useRef(null);

    useEffect(() => {
        if (!mapElement.current || !window.naver || !lat || !lng) return;

        const position = new window.naver.maps.LatLng(lat, lng);

        const mapOptions = {
            center: position,
            zoom: 16,
            minZoom: 8,
            scaleControl: false,
            logoControl: false,
            mapDataControl: false,
            zoomControl: true,
            draggable: true,
            scrollWheel: false, // Prevent scrolling page when zooming map
            zoomControlOptions: {
                position: window.naver.maps.Position.TOP_RIGHT
            }
        };

        const map = new window.naver.maps.Map(mapElement.current, mapOptions);

        const marker = new window.naver.maps.Marker({
            position: position,
            map: map
        });

        // Add click listener to open Naver Map
        window.naver.maps.Event.addListener(map, 'click', () => {
            openNaverMap();
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
            openNaverMap();
        });

    }, [lat, lng]);

    const openNaverMap = () => {
        // Mobile scheme or Web URL
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const encodedName = encodeURIComponent(locationName || '공연장');

        if (isMobile) {
            // Try formatting for mobile app schema if possible, or fallback to web
            window.open(`https://m.map.naver.com/search2/search.naver?query=${encodedName}&sm=hty&style=v5`);
        } else {
            window.open(`https://map.naver.com/v5/search/${encodedName}?c=${lng},${lat},15,0,0,0,dh`);
        }
    };

    if (!lat || !lng) return null;

    return (
        <div className="map-view-container" style={{ marginTop: '1rem' }}>
            <div
                ref={mapElement}
                style={{ width: '100%', height: '250px', borderRadius: '12px', border: '1px solid #eee', cursor: 'pointer' }}
                title="클릭하면 네이버 지도로 이동합니다"
            />
            <button
                onClick={openNaverMap}
                style={{
                    marginTop: '0.8rem',
                    width: '100%',
                    padding: '0.8rem',
                    background: '#03C75A', // Naver Green
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                }}
            >
                <span>📍 네이버 지도로 보기</span>
            </button>
        </div>
    );
}
