import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MapView from '../components/MapView';
import '../App.css';

function Home() {
    // UI States
    const [view, setView] = useState('performances'); // 'login', 'reserve', 'performances', 'history'
    const [isIdentified, setIsIdentified] = useState(false);
    const [phone, setPhone] = useState('');

    // Data States
    const [performances, setPerformances] = useState([]);
    const [selectedPerf, setSelectedPerf] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [userReservations, setUserReservations] = useState([]);
    const [occupancy, setOccupancy] = useState({}); // { perfId: totalTickets }

    // Review States
    const [reviews, setReviews] = useState([]);
    const [canReview, setCanReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        time: '',
        tickets: 1
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
        // Check if phone exists in sessionStorage
        const savedPhone = sessionStorage.getItem('userPhone');
        if (savedPhone) {
            setPhone(savedPhone);
            setIsIdentified(true);
        }
    }, []);

    async function fetchData() {
        await fetchPerformances();
        await fetchOccupancy();
    }

    async function fetchPerformances() {
        const { data, error } = await supabase.from('performances').select('*');
        if (!error && data) {
            setPerformances(data);
        }
    }

    async function fetchOccupancy() {
        const { data, error } = await supabase.from('reservations').select('performance_id, tickets');
        if (!error && data) {
            const counts = data.reduce((acc, res) => {
                acc[res.performance_id] = (acc[res.performance_id] || 0) + res.tickets;
                return acc;
            }, {});
            setOccupancy(counts);
        }
    }

    async function fetchUserReservations() {
        if (!phone) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('reservations')
            .select('*, performances(title)')
            .eq('phone', phone)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setUserReservations(data);
        }
        setLoading(false);
    }

    async function fetchSessions(perfId) {
        const { data, error } = await supabase
            .from('performance_sessions')
            .select('*')
            .eq('performance_id', perfId)
            .order('date', { ascending: true });

        if (!error && data) {
            setSessions(data);
            if (data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    date: data[0].date,
                    time: data[0].time
                }));
            }
        }
    }

    async function fetchReviews(perfId) {
        const { data, error } = await supabase
            .from('performance_reviews')
            .select('*')
            .eq('performance_id', perfId)
            .order('created_at', { ascending: false });
        if (!error && data) {
            setReviews(data);
        }
    }

    async function checkReviewEligibility(perfId) {
        if (!phone) {
            setCanReview(false);
            setHasReviewed(false);
            return;
        }

        // 1. Check if they have at least one reservation that has started
        const { data: resData, error: resError } = await supabase
            .from('reservations')
            .select('date, time')
            .eq('performance_id', perfId)
            .eq('phone', phone);

        const now = new Date();
        const hasAttended = !resError && resData && resData.some(res => {
            const sessionTime = new Date(res.date.replace(/\./g, '-') + ' ' + res.time);
            return sessionTime <= now;
        });

        setCanReview(hasAttended);

        // 2. Check if they already wrote a review
        if (hasAttended) {
            const { data: revData, error: revError } = await supabase
                .from('performance_reviews')
                .select('id')
                .eq('performance_id', perfId)
                .eq('user_phone', phone)
                .limit(1);
            setHasReviewed(!revError && revData && revData.length > 0);
        } else {
            setHasReviewed(false);
        }
    }

    const handleIdentify = (e) => {
        e.preventDefault();
        if (phone.length < 10) {
            alert('올바른 핸드폰 번호를 입력해주세요.');
            return;
        }
        sessionStorage.setItem('userPhone', phone);
        setIsIdentified(true);
        setView('performances');
    };

    const handleLogout = () => {
        sessionStorage.removeItem('userPhone');
        setPhone('');
        setIsIdentified(false);
        setView('performances');
    };

    const handleSelectPerf = (perf) => {
        setSelectedPerf(perf);
        fetchSessions(perf.id);
        fetchReviews(perf.id);
        checkReviewEligibility(perf.id);
        setView('reserve');
        window.scrollTo(0, 0);
    };

    const submitReview = async (e) => {
        e.preventDefault();
        const content = e.target.content.value.trim();
        if (!content) return;
        if (hasReviewed) {
            alert('이미 관람평을 작성하셨습니다.');
            return;
        }

        setLoading(true);
        // Display name = last 4 digits of phone
        const last4Digits = phone.slice(-4);

        const { error } = await supabase
            .from('performance_reviews')
            .insert([{
                performance_id: selectedPerf.id,
                user_phone: phone,
                user_name: `***${last4Digits}`,
                content
            }]);

        if (error) {
            if (error.code === '23505') {
                alert('이미 관람평을 작성하셨습니다.');
            } else {
                alert('등록 실패: ' + error.message);
            }
        } else {
            alert('관람평이 등록되었습니다.');
            e.target.reset();
            setHasReviewed(true);
            fetchReviews(selectedPerf.id);
        }
        setLoading(false);
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('관람평을 삭제하시겠습니까?')) return;

        setLoading(true);
        const { error } = await supabase
            .from('performance_reviews')
            .delete()
            .eq('id', reviewId)
            .eq('user_phone', phone); // Safety check

        if (error) {
            alert('삭제 실패: ' + error.message);
        } else {
            alert('삭제되었습니다.');
            setHasReviewed(false);
            fetchReviews(selectedPerf.id);
        }
        setLoading(false);
    };

    const handleUpdateReview = async (reviewId) => {
        if (!editContent.trim()) return;

        setLoading(true);
        const { error } = await supabase
            .from('performance_reviews')
            .update({ content: editContent.trim() })
            .eq('id', reviewId)
            .eq('user_phone', phone);

        if (error) {
            alert('수정 실패: ' + error.message);
        } else {
            alert('수정되었습니다.');
            setEditingReviewId(null);
            fetchReviews(selectedPerf.id);
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isIdentified) {
            alert('먼저 핸드폰 번호를 입력해주세요.');
            setView('login');
            return;
        }

        setLoading(true);

        // Real-time occupancy AND capacity check before proceeding
        const [resFetch, perfFetch] = await Promise.all([
            supabase.from('reservations').select('tickets').eq('performance_id', selectedPerf.id),
            supabase.from('performances').select('total_seats').eq('id', selectedPerf.id).single()
        ]);

        if (resFetch.error || perfFetch.error) {
            alert('정보 확인 실패: ' + (resFetch.error?.message || perfFetch.error?.message));
            setLoading(false);
            return;
        }

        const latestBooked = resFetch.data.reduce((sum, res) => sum + res.tickets, 0);
        const currentTotalSeats = perfFetch.data.total_seats;

        // Update local state for UI consistency
        setOccupancy(prev => ({ ...prev, [selectedPerf.id]: latestBooked }));
        setSelectedPerf(prev => ({ ...prev, total_seats: currentTotalSeats }));

        if (latestBooked + formData.tickets > currentTotalSeats) {
            alert(`죄송합니다. 예약 가능 인원이 변경되었거나 매진되었습니다.\n(현재 잔여 좌석: ${Math.max(0, currentTotalSeats - latestBooked)}석)`);
            setLoading(false);
            return;
        }

        const { error } = await supabase.from('reservations').insert([{
            name: formData.name,
            phone: phone, // Now identifying by phone
            date: formData.date,
            time: formData.time,
            tickets: formData.tickets,
            total_price: formData.tickets * selectedPerf.price,
            performance_id: selectedPerf.id
        }]);

        if (error) {
            alert('예약 실패: ' + error.message);
        } else {
            alert(`예약이 완료되었습니다!`);
            fetchOccupancy(); // Refresh occupancy
            setView('history');
            fetchUserReservations();
        }
        setLoading(false);
    };

    const handleCancelReservation = async (resId) => {
        if (!window.confirm('정말 예매를 취소하시겠습니까?')) return;

        setLoading(true);
        const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', resId);

        if (error) {
            alert('취소 실패: ' + error.message);
        } else {
            alert('예매가 취소되었습니다.');
            await fetchOccupancy();
            await fetchUserReservations();
        }
        setLoading(false);
    };

    const getDayOfWeek = (dateStr) => {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const date = new Date(dateStr.replace(/\./g, '-'));
        return days[date.getDay()];
    };

    return (
        <div className="container">
            <header className="header">
                <div className="header-top">
                    <h1 className="logo" onClick={() => setView('performances')} style={{ cursor: 'pointer' }}>더열정 뮤지컬 예매 페이지</h1>
                </div>
                <div className="header-bottom">
                    <nav className="nav-container">
                        <div className="menu-group">
                            <button className={`nav-btn ${view === 'performances' ? 'active' : ''}`} onClick={() => setView('performances')}>공연 정보</button>
                            <button className={`nav-btn ${view === 'history' ? 'active' : ''}`} onClick={() => {
                                if (!isIdentified) setView('login');
                                else {
                                    setView('history');
                                    fetchUserReservations();
                                }
                            }}>예매 내역</button>
                        </div>
                        <div className="auth-group">
                            {isIdentified ? (
                                <button className="auth-btn-logout" onClick={handleLogout}>로그아웃</button>
                            ) : (
                                <button className={`auth-btn ${view === 'login' ? 'active' : ''}`} onClick={() => setView('login')}>로그인</button>
                            )}
                        </div>
                    </nav>
                </div>
            </header>

            <main className="main-content">
                {/* 1. Login View */}
                {view === 'login' && (
                    <section className="booking-section">
                        <div className="booking-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <h3 style={{ textAlign: 'center' }}>사용자 확인</h3>
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                핸드폰 번호를 입력하시면 예매 및 <br /> 내역 확인이 가능합니다.
                            </p>
                            <form onSubmit={handleIdentify} className="booking-form">
                                <div className="form-group">
                                    <label>핸드폰 번호</label>
                                    <input
                                        type="tel"
                                        placeholder="010-0000-0000"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                        required
                                    />
                                </div>
                                <button type="submit" className="submit-btn">확인하기</button>
                            </form>
                        </div>
                    </section>
                )}

                {/* 2. Performance List View */}
                {view === 'performances' && (
                    <section className="performances-view">
                        {/* 2.1 Ongoing Performances */}
                        <div style={{ marginBottom: '4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                                <h2 style={{ margin: 0 }}>진행 중인 공연</h2>
                                <span style={{ padding: '0.4rem 0.8rem', background: 'var(--accent-color)', color: '#fff', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {performances.filter(p => {
                                        const [, endStr] = (p.date_range || '').split(' - ');
                                        if (!endStr) return true;
                                        const endDate = new Date(endStr.replace(/\./g, '-'));
                                        return endDate >= new Date(new Date().setHours(0, 0, 0, 0));
                                    }).length}건
                                </span>
                            </div>

                            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '2.5rem' }}>
                                {performances.filter(p => {
                                    const [, endStr] = (p.date_range || '').split(' - ');
                                    if (!endStr) return true;
                                    const endDate = new Date(endStr.replace(/\./g, '-'));
                                    return endDate >= new Date(new Date().setHours(0, 0, 0, 0));
                                }).map(perf => {
                                    const booked = occupancy[perf.id] || 0;
                                    const isSoldOut = perf.total_seats > 0 && booked >= perf.total_seats;
                                    return (
                                        <div
                                            key={perf.id}
                                            className="booking-card"
                                            style={{
                                                padding: '0',
                                                overflow: 'hidden',
                                                cursor: isSoldOut ? 'default' : 'pointer',
                                                position: 'relative',
                                                border: '1px solid #eee',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onClick={() => handleSelectPerf(perf)}
                                        >
                                            {/* Status Badge */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '1rem',
                                                right: '1rem',
                                                zIndex: 3,
                                                padding: '0.5rem 1rem',
                                                borderRadius: '30px',
                                                fontSize: '0.85rem',
                                                fontWeight: '900',
                                                background: isSoldOut ? 'rgba(231, 76, 60, 0.9)' : 'rgba(46, 204, 113, 0.9)',
                                                color: '#fff',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                            }}>
                                                {isSoldOut ? '잔여석 없음' : '예매 가능'}
                                            </div>

                                            {perf.poster_url && (
                                                <div style={{ position: 'relative', height: '320px', overflow: 'hidden' }}>
                                                    <img src={perf.poster_url} alt={perf.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} className="perf-poster" />
                                                    {isSoldOut && (
                                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'grayscale(0.5)' }} />
                                                    )}
                                                </div>
                                            )}

                                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '800' }}>{perf.title}</h3>
                                                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                                                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📅</span> {perf.date_range}</p>
                                                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📍</span> {perf.location}</p>
                                                </div>
                                                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #f5f5f5', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                        <span style={{ fontSize: '0.75rem', color: '#999' }}>현재 예매 상황</span>
                                                        <span style={{ fontWeight: '800', fontSize: '1rem', color: isSoldOut ? '#e74c3c' : 'var(--accent-color)' }}>
                                                            💺 {booked} / {perf.total_seats}석
                                                        </span>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ fontSize: '0.75rem', color: '#999', display: 'block', marginBottom: '0.2rem' }}>티켓 가격</span>
                                                        <span style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-primary)' }}>{perf.price.toLocaleString()}원</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2.2 Ended Performances */}
                        {performances.filter(p => {
                            const [, endStr] = (p.date_range || '').split(' - ');
                            if (!endStr) return false;
                            const endDate = new Date(endStr.replace(/\./g, '-'));
                            return endDate < new Date(new Date().setHours(0, 0, 0, 0));
                        }).length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                        <h2 style={{ margin: 0, color: '#999' }}>종료된 공연</h2>
                                    </div>
                                    <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '2.5rem' }}>
                                        {performances.filter(p => {
                                            const [, endStr] = (p.date_range || '').split(' - ');
                                            if (!endStr) return false;
                                            const endDate = new Date(endStr.replace(/\./g, '-'));
                                            return endDate < new Date(new Date().setHours(0, 0, 0, 0));
                                        }).map(perf => (
                                            <div
                                                key={perf.id}
                                                className="booking-card"
                                                style={{
                                                    padding: '0',
                                                    overflow: 'hidden',
                                                    opacity: 0.8,
                                                    border: '1px solid #ddd',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    filter: 'grayscale(0.6)'
                                                }}
                                                onClick={() => handleSelectPerf(perf)}
                                            >
                                                <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                                                    {perf.poster_url && <img src={perf.poster_url} alt={perf.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0, left: 0, right: 0, bottom: 0,
                                                        background: 'rgba(0,0,0,0.5)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#fff',
                                                        fontSize: '1.2rem',
                                                        fontWeight: 'bold',
                                                        letterSpacing: '2px'
                                                    }}>
                                                        공연 종료
                                                    </div>
                                                </div>
                                                <div style={{ padding: '1.5rem', flex: 1 }}>
                                                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.3rem' }}>{perf.title}</h4>
                                                    <div style={{ fontSize: '0.9rem', color: '#888', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📅</span> {perf.date_range}</p>
                                                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📍</span> {perf.location}</p>
                                                    </div>
                                                    <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                                                        <span style={{
                                                            fontSize: '0.8rem',
                                                            color: 'var(--accent-color)',
                                                            border: '1px solid var(--accent-color)',
                                                            padding: '0.3rem 0.8rem',
                                                            borderRadius: '4px',
                                                            fontWeight: 'bold'
                                                        }}>관람평 보기 →</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </section>
                )}

                {/* 3. Booking View */}
                {view === 'reserve' && selectedPerf && (
                    <section className="booking-detail perf-detail-grid">
                        <div className="perf-info-panel">
                            <img src={selectedPerf.poster_url} alt={selectedPerf.title} style={{ width: '100%', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <div style={{ marginTop: '2rem' }}>
                                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{selectedPerf.title}</h2>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.6rem',
                                    marginBottom: '2rem',
                                    fontSize: '0.95rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>📍</span> <b>장소:</b> {selectedPerf.location}
                                    </p>
                                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>⏱️</span> <b>공연 시간:</b> {selectedPerf.duration}
                                    </p>
                                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>👥</span>
                                        <span><b>관람 등급:</b> {selectedPerf.age_rating === 'all' ? '전체 관람가' : `${selectedPerf.age_rating}세 이상 관람가`}</span>
                                    </p>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '2rem' }}>{selectedPerf.description}</p>

                                {selectedPerf.latitude && selectedPerf.longitude && (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <MapView
                                            lat={selectedPerf.latitude}
                                            lng={selectedPerf.longitude}
                                            locationName={selectedPerf.location}
                                        />
                                    </div>
                                )}

                                <div style={{
                                    padding: '1.5rem',
                                    background: '#f8f9fa',
                                    borderRadius: '12px',
                                    border: '1px solid #eee'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>실시간 예매 현황</span>
                                        <span style={{
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            background: (occupancy[selectedPerf.id] || 0) >= selectedPerf.total_seats ? '#ffebee' : '#e8f5e9',
                                            color: (occupancy[selectedPerf.id] || 0) >= selectedPerf.total_seats ? '#e74c3c' : '#2ecc71'
                                        }}>
                                            {(occupancy[selectedPerf.id] || 0) >= selectedPerf.total_seats ? '매진 임박' : '예매 가능'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-color)', marginBottom: '0.5rem' }}>
                                        💺 {occupancy[selectedPerf.id] || 0} / {selectedPerf.total_seats}석 예약 완료
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                        (현재 잔여 좌석: {Math.max(0, selectedPerf.total_seats - (occupancy[selectedPerf.id] || 0))}석)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="booking-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {(() => {
                                const [, endStr] = (selectedPerf.date_range || '').split(' - ');
                                const isEnded = endStr && new Date(endStr.replace(/\./g, '-')) < new Date(new Date().setHours(0, 0, 0, 0));

                                if (!isEnded) {
                                    return (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                                                    <span>🎟️</span> 티켓 예매
                                                </h3>
                                                <button onClick={() => setView('performances')} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                                            </div>
                                            <form onSubmit={handleSubmit} className="booking-form">
                                                <div className="form-group">
                                                    <label>관람 일정 선택</label>
                                                    <select
                                                        className="form-control"
                                                        value={`${formData.date}|${formData.time}`}
                                                        onChange={(e) => {
                                                            const [d, t] = e.target.value.split('|');
                                                            setFormData(p => ({ ...p, date: d, time: t }));
                                                        }}
                                                        required
                                                    >
                                                        {sessions.map((s, idx) => (
                                                            <option key={idx} value={`${s.date}|${s.time}`}>
                                                                {s.date} ({getDayOfWeek(s.date)}) {s.time}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label>예매자 성함</label>
                                                    <input type="text" name="name" className="form-control" placeholder="성함을 입력해주세요" value={formData.name} onChange={handleChange} required />
                                                </div>

                                                <div className="form-group">
                                                    <label>핸드폰 번호</label>
                                                    <input type="text" className="form-control" value={phone} disabled style={{ background: '#f8f9fa', color: '#888' }} />
                                                </div>

                                                <div className="form-group">
                                                    <label>매수</label>
                                                    <div className="ticket-count-box" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            background: '#fff',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '8px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData(p => ({ ...p, tickets: Math.max(1, p.tickets - 1) }))}
                                                                style={{
                                                                    padding: '0.6rem 1rem',
                                                                    border: 'none',
                                                                    background: '#f8f9fa',
                                                                    cursor: 'pointer',
                                                                    fontSize: '1.1rem',
                                                                    borderRight: '1px solid #ddd'
                                                                }}
                                                            >-</button>
                                                            <div style={{ padding: '0 1rem', fontWeight: 'bold', minWidth: '3rem', textAlign: 'center', fontSize: '1.1rem' }}>
                                                                {formData.tickets}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData(p => ({ ...p, tickets: p.tickets + 1 }))}
                                                                style={{
                                                                    padding: '0.6rem 1rem',
                                                                    border: 'none',
                                                                    background: '#f8f9fa',
                                                                    cursor: 'pointer',
                                                                    fontSize: '1.1rem',
                                                                    borderLeft: '1px solid #ddd'
                                                                }}
                                                            >+</button>
                                                        </div>
                                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.9rem' }}>장</span>
                                                    </div>
                                                </div>

                                                <div className="payment-box">
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>최종 결제 금액 (현장 결제)</p>
                                                        <h3 style={{ margin: 0, fontSize: '1.6rem' }}>{(formData.tickets * selectedPerf.price).toLocaleString()}원</h3>
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        style={{
                                                            background: '#fff',
                                                            color: 'var(--accent-color)',
                                                            padding: '0.7rem 1.2rem',
                                                            borderRadius: '8px',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.95rem',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                                        }}
                                                    >
                                                        {loading ? '처리 중...' : '예매하기'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                <h3 style={{ margin: 0 }}>공연 안내</h3>
                                                <button onClick={() => setView('performances')} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                                            </div>
                                            <div style={{
                                                padding: '2rem',
                                                background: '#f8f9fa',
                                                borderRadius: '12px',
                                                textAlign: 'center',
                                                border: '2px dashed #ddd'
                                            }}>
                                                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⌛</span>
                                                <h3 style={{ color: '#999', margin: 0 }}>공연이 종료되어 예매가 불가합니다</h3>
                                                <p style={{ color: '#bbb', marginTop: '0.5rem' }}>관람평으로 공연의 감동을 나눠보세요!</p>
                                            </div>
                                        </div>
                                    );
                                }
                            })()}

                            {/* Review Section */}
                            <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '2rem' }}>
                                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>💬</span> 관람평 ({reviews.length})
                                </h3>

                                {canReview ? (
                                    hasReviewed ? (
                                        <div style={{
                                            padding: '1.5rem',
                                            background: '#f8f9fa',
                                            borderRadius: '12px',
                                            fontSize: '0.95rem',
                                            color: '#666',
                                            marginBottom: '2rem',
                                            textAlign: 'center',
                                            border: '1px solid #eee'
                                        }}>
                                            ✅ 이미 관람평을 작성하셨습니다. 소중한 의견 감사합니다!
                                        </div>
                                    ) : (
                                        <form onSubmit={submitReview} style={{ marginBottom: '2rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <textarea
                                                    name="content"
                                                    placeholder="공연은 어떠셨나요? 소중한 후기를 남겨주세요."
                                                    required
                                                    style={{
                                                        width: '100%',
                                                        height: '100px',
                                                        padding: '1rem',
                                                        borderRadius: '12px',
                                                        border: '1px solid #ddd',
                                                        resize: 'none',
                                                        fontSize: '0.95rem'
                                                    }}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '1rem',
                                                        right: '1rem',
                                                        background: 'var(--accent-color)',
                                                        color: '#fff',
                                                        padding: '0.4rem 1rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.85rem',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {loading ? '등록 중...' : '등록'}
                                                </button>
                                            </div>
                                        </form>
                                    )
                                ) : (
                                    isIdentified ? (
                                        <div style={{
                                            padding: '1rem',
                                            background: '#f8f9fa',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            color: '#999',
                                            marginBottom: '1.5rem',
                                            textAlign: 'center'
                                        }}>
                                            💡 공연 일정이 시작된 이후,<br />티켓을 예매하신 분들에 한해서만<br />관람평을 작성하실 수 있습니다.
                                        </div>
                                    ) : (
                                        <div style={{
                                            padding: '1rem',
                                            background: '#fff9f0',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            color: '#d35400',
                                            marginBottom: '1.5rem',
                                            textAlign: 'center'
                                        }}>
                                            💡 예매하신 핸드폰 번호로 로그인하시면 관람평을 작성하실 수 있습니다.
                                        </div>
                                    )
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {reviews.length === 0 ? (
                                        (() => {
                                            const [startStr] = (selectedPerf.date_range || '').split(' - ');
                                            const hasStarted = startStr && new Date(startStr.replace(/\./g, '-')) <= new Date();
                                            return hasStarted ? (
                                                <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>아직 등록된 관람평이 없습니다.</p>
                                            ) : null;
                                        })()
                                    ) : (
                                        reviews.map(rev => (
                                            <div key={rev.id} style={{ padding: '1.2rem', background: '#fcfcfc', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                    <div>
                                                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', marginRight: '0.8rem' }}>{rev.user_name}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#999' }}>{new Date(rev.created_at).toLocaleDateString()}</span>
                                                    </div>

                                                    {rev.user_phone === phone && (
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingReviewId(rev.id);
                                                                    setEditContent(rev.content);
                                                                }}
                                                                style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.75rem', cursor: 'pointer', padding: '0.2rem' }}
                                                            >수정</button>
                                                            <button
                                                                onClick={() => handleDeleteReview(rev.id)}
                                                                style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '0.75rem', cursor: 'pointer', padding: '0.2rem' }}
                                                            >삭제</button>
                                                        </div>
                                                    )}
                                                </div>

                                                {editingReviewId === rev.id ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <textarea
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                height: '80px',
                                                                padding: '0.5rem',
                                                                borderRadius: '8px',
                                                                border: '1px solid var(--accent-color)',
                                                                fontSize: '0.9rem'
                                                            }}
                                                        />
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                            <button
                                                                onClick={() => setEditingReviewId(null)}
                                                                style={{ padding: '0.3rem 0.8rem', borderRadius: '4px', border: '1px solid #ddd', background: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
                                                            >취소</button>
                                                            <button
                                                                onClick={() => handleUpdateReview(rev.id)}
                                                                disabled={loading}
                                                                style={{ padding: '0.3rem 0.8rem', borderRadius: '4px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
                                                            >저장</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', color: '#444' }}>{rev.content}</p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 4. History View */}
                {view === 'history' && (
                    <section className="history-view">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0 }}>나의 예매 내역</h2>
                            <button className="nav-btn" onClick={() => setView('performances')} style={{ margin: 0, fontSize: '0.9rem', color: 'var(--accent-color)' }}>← 공연 목록으로</button>
                        </div>

                        {loading ? (
                            <p style={{ textAlign: 'center', padding: '3rem' }}>불러오는 중...</p>
                        ) : userReservations.length > 0 ? (
                            <div className="grid-container" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {userReservations.map(res => (
                                    <div key={res.id} className="booking-card" style={{
                                        padding: '0',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        border: '1px solid #eee',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{
                                            background: 'var(--accent-color)',
                                            color: '#fff',
                                            padding: '1rem 1.5rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.9 }}>TICKET NO. {res.id}</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{res.tickets}매</span>
                                        </div>

                                        <div style={{ padding: '1.5rem', flex: 1 }}>
                                            <h4 style={{ fontSize: '1.2rem', marginBottom: '0.8rem', color: 'var(--text-primary)' }}>{res.performances?.title}</h4>

                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span>📅</span>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{res.date}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span>👤</span>
                                                    <span>{res.name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '1.2rem 1.5rem',
                                            borderTop: '1px dashed #eee',
                                            background: '#fafafa',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.2rem' }}>현장 결제 금액</span>
                                                <span style={{ color: 'var(--accent-color)', fontWeight: '800', fontSize: '1.1rem' }}>{(res.total_price || 0).toLocaleString()}원</span>
                                            </div>
                                            <button
                                                onClick={() => handleCancelReservation(res.id)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e74c3c',
                                                    color: '#e74c3c',
                                                    background: 'none',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => { e.target.style.background = '#e74c3c'; e.target.style.color = '#fff' }}
                                                onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.color = '#e74c3c' }}
                                            >
                                                예매 취소
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="booking-card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '100%' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎟️</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>아직 예매하신 내역이 없습니다.</p>
                                <button className="submit-btn" style={{ width: '240px' }} onClick={() => setView('performances')}>첫 예매하러 가기</button>
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}

export default Home;

