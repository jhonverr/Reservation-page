import { useEffect, useRef, useState } from 'react';

export default function LocationPicker({ initLat, initLng, onLocationSelect }) {
    const mapElement = useRef(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);

    // Default: Seoul City Hall
    const defaultLat = 37.5665;
    const defaultLng = 126.9780;

    useEffect(() => {
        let mapInstance = null;
        let markerInstance = null;

        const initMap = () => {
            // Check if Naver Maps SDK is fully loaded
            const naver = window.naver;
            if (!mapElement.current || !naver || !naver.maps) return;

            const centerLat = initLat ? parseFloat(initLat) : defaultLat;
            const centerLng = initLng ? parseFloat(initLng) : defaultLng;
            const center = new naver.maps.LatLng(centerLat, centerLng);

            const mapOptions = {
                center: center,
                zoom: 16,
                minZoom: 8,
                scaleControl: false,
                logoControl: false,
                mapDataControl: false,
                zoomControl: true,
                zoomControlOptions: {
                    position: naver.maps.Position.TOP_RIGHT
                }
            };

            mapInstance = new naver.maps.Map(mapElement.current, mapOptions);
            setMap(mapInstance);

            markerInstance = new naver.maps.Marker({
                position: center,
                map: mapInstance
            });
            setMarker(markerInstance);

            naver.maps.Event.addListener(mapInstance, 'click', (e) => {
                const lat = e.coord.lat();
                const lng = e.coord.lng();

                markerInstance.setPosition(e.coord);
                if (onLocationSelect) {
                    onLocationSelect({ lat, lng });
                }
            });
        };

        // Poll for Naver Maps SDK
        if (window.naver && window.naver.maps) {
            initMap();
        } else {
            const checkInterval = setInterval(() => {
                if (window.naver && window.naver.maps) {
                    initMap();
                    clearInterval(checkInterval);
                }
            }, 100);
            return () => clearInterval(checkInterval);
        }

    }, []);

    const searchAddress = (query) => {
        const naver = window.naver;
        if (!naver || !naver.maps || !naver.maps.Service) {
            alert("네이버 지도 서비스가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        if (!query) return;

        naver.maps.Service.geocode({
            query: query
        }, (status, response) => {
            if (status !== naver.maps.Service.Status.OK) {
                return alert('주소를 찾을 수 없습니다.');
            }

            if (response.v2.addresses.length === 0) {
                return alert('검색 결과가 없습니다.');
            }

            const result = response.v2.addresses[0];
            const lat = parseFloat(result.y);
            const lng = parseFloat(result.x);

            const newCenter = new naver.maps.LatLng(lat, lng);
            if (map && marker) {
                map.setCenter(newCenter);
                marker.setPosition(newCenter);
                map.setZoom(16);
            }

            if (onLocationSelect) {
                onLocationSelect({ lat, lng });
            }
        });
    };

    return (
        <div className="location-picker">
            <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    id="address-search"
                    placeholder="장소 검색 (예: 예술의전당)"
                    style={{ flex: 1, padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', color: 'var(--text-primary)', background: '#fff' }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchAddress(e.target.value); } }}
                />
                <button
                    type="button"
                    onClick={() => searchAddress(document.getElementById('address-search').value)}
                    style={{ padding: '0.6rem 1.2rem', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    검색
                </button>
            </div>
            <div id="map" ref={mapElement} style={{ width: '100%', height: '300px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>* 저장할 위치를 지도에서 클릭하거나 장소를 검색하세요.</p>
        </div>
    );
}
