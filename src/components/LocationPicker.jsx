import { useEffect, useRef, useState } from 'react';

export default function LocationPicker({ initLat, initLng, initAddress, onLocationSelect }) {
    const mapElement = useRef(null);
    const searchInputRef = useRef(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);

    // Default: Seoul City Hall
    const defaultLat = 37.5665;
    const defaultLng = 126.9780;

    useEffect(() => {
        // Initialize input value if provided
        if (initAddress && searchInputRef.current) {
            searchInputRef.current.value = initAddress;
        }

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
                    // When clicking map, we don't necessarily have a new address string,
                    // but we keep the current one in the input if exists.
                    onLocationSelect({
                        lat,
                        lng,
                        address: searchInputRef.current?.value || ''
                    });
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
            alert("네이버 지도 서비스(Geocoder)가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        if (!query) return;

        naver.maps.Service.geocode({
            query: query
        }, (status, response) => {
            if (status !== naver.maps.Service.Status.OK) {
                console.error("Geocoding failed status:", status);
                return alert('주소 검색 중 오류가 발생했습니다. (상태: ' + status + ')');
            }

            // Check for v2 structure
            const addresses = response.v2?.addresses || response.addresses;

            if (!addresses || addresses.length === 0) {
                return alert('검색 결과가 없습니다. 도로명 주소나 지번 주소를 입력해 보세요.\n(예: 서울시 중구 태평로1가 31)');
            }

            const result = addresses[0];
            const lat = parseFloat(result.y || result.latitude);
            const lng = parseFloat(result.x || result.longitude);

            const newCenter = new naver.maps.LatLng(lat, lng);
            if (map && marker) {
                map.setCenter(newCenter);
                marker.setPosition(newCenter);
                map.setZoom(16);
            }

            if (onLocationSelect) {
                onLocationSelect({ lat, lng, address: query });
            }
        });
    };

    return (
        <div className="location-picker">
            <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="도로명 또는 지번 주소 입력 (예: 태평로1가 31)"
                    style={{ flex: 1, padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', color: 'var(--text-primary)', background: '#fff' }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchAddress(e.target.value); } }}
                />
                <button
                    type="button"
                    onClick={() => searchAddress(searchInputRef.current?.value)}
                    style={{ padding: '0.6rem 1.2rem', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    검색
                </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#e74c3c', marginBottom: '0.5rem', fontWeight: '500' }}>
                💡 장소명(예: 예술의전당) 대신 정확한 '주소'를 입력해야 검색됩니다.
            </p>
            <div id="map" ref={mapElement} style={{ width: '100%', height: '300px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>* 정확한 지점을 찾으려면 지도를 직접 클릭하세요.</p>
        </div>
    );
}
