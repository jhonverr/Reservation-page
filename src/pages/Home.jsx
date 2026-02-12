import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PerformanceCard from '../components/PerformanceCard';
import ReservationItem from '../components/ReservationItem';
import MapView from '../components/MapView';
import { isSessionEnded, getDayOfWeek } from '../utils/date';
import { formatPhone } from '../utils/format';
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
    const [occupancy, setOccupancy] = useState({}); // { perfId: { 'date|time': count } }

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
        // Fetch performances and their sessions to ensure we have session data for "Sold Out" calculation
        const { data: perfData, error: perfError } = await supabase.from('performances').select('*');
        const { data: sessionData, error: sessionError } = await supabase.from('performance_sessions').select('*');

        if (!perfError && perfData) {
            const combined = perfData.map(p => ({
                ...p,
                sessions: sessionData?.filter(s => s.performance_id === p.id) || []
            }));
            setPerformances(combined);
        }
    }

    async function fetchOccupancy() {
        const { data, error } = await supabase.from('reservations').select('performance_id, date, time, tickets');
        if (!error && data) {
            const occ = {};
            data.forEach(res => {
                if (!occ[res.performance_id]) occ[res.performance_id] = {};
                // Normalize date/time key
                const key = `${res.date}|${res.time}`;
                occ[res.performance_id][key] = (occ[res.performance_id][key] || 0) + res.tickets;
            });
            setOccupancy(occ);
        }
    }

    async function fetchUserReservations() {
        if (!phone) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('reservations')
            .select('*, performances(*)')
            .eq('phone', phone)
            .order('created_at', { ascending: false });

        if (!error && data) {
            // For each reservation, we need to find its rank in that session
            // To avoid too many DB calls, we could fetch counts in parallel
            const enriched = await Promise.all(data.map(async (res) => {
                const { count } = await supabase
                    .from('reservations')
                    .select('*', { count: 'exact', head: true })
                    .eq('performance_id', res.performance_id)
                    .eq('date', res.date)
                    .eq('time', res.time)
                    .lt('created_at', res.created_at);

                return { ...res, rank: (count || 0) + 1 };
            }));
            setUserReservations(enriched);
        }
        setLoading(false);
    }

    async function fetchSessions(perf) {
        const { data, error } = await supabase
            .from('performance_sessions')
            .select('*')
            .eq('performance_id', perf.id)
            .order('date', { ascending: true });

        if (!error && data) {
            setSessions(data);
            if (data.length > 0) {
                // Find first session that is NOT ended
                const firstActive = data.find(s => !isSessionEnded(perf, s));

                setFormData(prev => ({
                    ...prev,
                    date: firstActive ? firstActive.date : data[0].date,
                    time: firstActive ? firstActive.time : ''
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
        try {
            setSelectedPerf(perf);
            setSessions([]); // Clear previous sessions to avoid mismatch
            // Reset form data
            setFormData({
                name: '',
                date: '',
                time: '',
                tickets: 1
            });
            fetchSessions(perf);
            fetchReviews(perf.id);
            checkReviewEligibility(perf.id);
            setView('reserve');
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('Error selecting performance:', error);
            alert('공연 정보를 불러오는 중 오류가 발생했습니다.');
        }
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

        // Final check: Is this session already ended?
        const currentSession = sessions.find(s => s.date === formData.date && s.time === formData.time);

        if (!currentSession) {
            alert('공연 회차(시간)를 선택해주세요.');
            return;
        }

        if (isSessionEnded(selectedPerf, currentSession)) {
            alert('이미 종료된 회차입니다. 예매가 불가능합니다.');
            return;
        }

        setLoading(true);

        // Real-time occupancy check for the SPECIFIC SESSION
        const { data: resFetch, error: resError } = await supabase
            .from('reservations')
            .select('tickets')
            .eq('performance_id', selectedPerf.id)
            .eq('date', formData.date)
            .eq('time', formData.time);

        if (resError) {
            alert('정보 확인 실패: ' + resError.message);
            setLoading(false);
            return;
        }

        const latestBooked = resFetch.reduce((sum, res) => sum + res.tickets, 0);
        const currentTotalSeats = selectedPerf.total_seats;

        if (latestBooked + formData.tickets > currentTotalSeats) {
            alert(`죄송합니다. 해당 회차는 잔여 좌석이 부족합니다.\n(현재 잔여 좌석: ${Math.max(0, currentTotalSeats - latestBooked)}석)`);
            setLoading(false);
            // Update local occupancy to reflect reality
            fetchOccupancy();
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


    // Memoize filtered performances to avoid recalculation on every render
    const ongoingPerformances = performances.filter(p => !isPerformanceEnded(p));
    const endedPerformances = performances.filter(p => isPerformanceEnded(p));

    function isPerformanceEnded(perf) {
        if (!perf.sessions || perf.sessions.length === 0) return false;
        return perf.sessions.every(s => isSessionEnded(perf, s));
    }

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
                                        value={formatPhone(phone)}
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
                                    {ongoingPerformances.length}건
                                </span>
                            </div>

                            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '2.5rem' }}>
                                {ongoingPerformances.map(perf => (
                                    <PerformanceCard
                                        key={perf.id}
                                        perf={perf}
                                        occupancy={occupancy}
                                        onSelect={handleSelectPerf}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 2.2 Ended Performances */}
                        {endedPerformances.length > 0 && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                    <h2 style={{ margin: 0, color: '#999' }}>종료된 공연</h2>
                                </div>
                                <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '2.5rem' }}>
                                    {endedPerformances.map(perf => (
                                        <PerformanceCard
                                            key={perf.id}
                                            perf={perf}
                                            occupancy={occupancy}
                                            onSelect={handleSelectPerf}
                                            isEnded={true}
                                        />
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
                            {selectedPerf.poster_url && <img src={selectedPerf.poster_url} alt={selectedPerf.title} style={{ width: '100%', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />}
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
                                        <span>⏱️</span> <b>공연 시간:</b> {selectedPerf.duration}
                                    </p>
                                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>👥</span>
                                        <span><b>관람 등급:</b> {selectedPerf.age_rating === 'all' ? '전체 관람가' : `${selectedPerf.age_rating}세 이상 관람가`}</span>
                                    </p>
                                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>💺</span>
                                        <span><b>총 좌석:</b> 회차당 {selectedPerf.total_seats}석</span>
                                    </p>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '3.5rem' }}>{selectedPerf.description}</p>
                                <div style={{ marginBottom: '3rem', paddingTop: '1rem', borderTop: '1px solid #efefef' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>📍</span> 오시는 길
                                    </h3>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
                                        : {selectedPerf.location} {selectedPerf.address ? `(${selectedPerf.address})` : ''}
                                    </p>
                                    {selectedPerf.latitude && selectedPerf.longitude && (
                                        <MapView
                                            lat={selectedPerf.latitude}
                                            lng={selectedPerf.longitude}
                                            locationName={selectedPerf.location}
                                        />
                                    )}
                                </div>


                            </div>
                        </div>

                        {/* Booking Form Panel */}
                        <div className="perf-booking-panel">
                            <div className="sticky-booking-card">
                                <h3>예매하기</h3>
                                <div style={{ marginBottom: '1.5rem' }}></div>
                                <form onSubmit={handleSubmit} className="booking-form">
                                    <div className="form-group">
                                        <label>날짜</label>
                                        <select
                                            name="date"
                                            value={formData.date}
                                            onChange={(e) => {
                                                const newDate = e.target.value;
                                                // Find first non-ended session for this date to auto-select
                                                const firstValidSession = sessions.filter(s => s.date === newDate).find(s => !isSessionEnded(selectedPerf, s));

                                                setFormData(prev => ({
                                                    ...prev,
                                                    date: newDate,
                                                    time: firstValidSession ? firstValidSession.time : ''
                                                }));
                                            }}
                                            required
                                            style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                                        >
                                            {/* Unique Dates */}
                                            {[...new Set(sessions.map(s => s.date))].map(date => (
                                                <option key={date} value={date}>{date} ({getDayOfWeek(date)})</option>
                                            ))}
                                            {sessions.length === 0 && <option value="">회차 정보 없음</option>}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>시간</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                            {sessions.filter(s => s.date === formData.date).map(s => {
                                                const key = `${s.date}|${s.time}`;
                                                // NOTE: selectedPerf.total_seats -> each performance has same total seats per user req.
                                                const booked = (occupancy[selectedPerf.id] && occupancy[selectedPerf.id][key]) || 0;
                                                const remaining = Math.max(0, selectedPerf.total_seats - booked);
                                                const isSoldOut = remaining <= 0;
                                                const isEnded = isSessionEnded(selectedPerf, s);

                                                return (
                                                    <button
                                                        key={s.time}
                                                        type="button"
                                                        disabled={isSoldOut || isEnded}
                                                        onClick={() => setFormData(prev => ({ ...prev, time: s.time }))}
                                                        style={{
                                                            padding: '0.8rem',
                                                            borderRadius: '8px',
                                                            border: formData.time === s.time ? '2px solid var(--accent-color)' : '1px solid #ddd',
                                                            background: formData.time === s.time ? '#fff5f5' : (isSoldOut || isEnded ? '#f0f0f0' : '#fff'),
                                                            color: formData.time === s.time ? 'var(--accent-color)' : (isSoldOut || isEnded ? '#aaa' : '#333'),
                                                            cursor: (isSoldOut || isEnded) ? 'not-allowed' : 'pointer',
                                                            fontWeight: formData.time === s.time ? 'bold' : 'normal',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '0.2rem'
                                                        }}
                                                    >
                                                        <span>{s.time}</span>
                                                        <span style={{ fontSize: '0.75rem', color: isSoldOut || isEnded ? '#e74c3c' : 'var(--accent-color)' }}>
                                                            {isSoldOut ? '매진' : (isEnded ? '관람 종료' : `${remaining}/${selectedPerf.total_seats}석`)}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>예매자명</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="홍길동"
                                            required
                                            style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                                        />
                                    </div>

                                    <div style={{
                                        marginTop: '2rem',
                                        padding: '1.2rem',
                                        background: '#f8f9fa',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '0.8rem' }}>관람 인원</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, tickets: Math.max(1, prev.tickets - 1) }))} style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{formData.tickets}</span>
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, tickets: Math.min(10, prev.tickets + 1) }))} style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '0.3rem' }}>총 티켓 금액</span>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-color)' }}>
                                                {(formData.tickets * selectedPerf.price).toLocaleString()}원
                                            </span>
                                            <p style={{ fontSize: '0.75rem', color: '#888', margin: '0.3rem 0 0 0' }}>* 결제는 현장에서 진행됩니다.</p>
                                        </div>
                                    </div>

                                    {(() => {
                                        const currentS = sessions.find(s => s.date === formData.date && s.time === formData.time);
                                        const isEnded = isPerformanceEnded(selectedPerf) || (currentS ? isSessionEnded(selectedPerf, currentS) : false);

                                        if (isEnded) {
                                            return (
                                                <button
                                                    type="button"
                                                    disabled
                                                    style={{
                                                        width: '100%',
                                                        padding: '1rem',
                                                        marginTop: '1.5rem',
                                                        fontSize: '1.1rem',
                                                        background: '#f0f0f0',
                                                        color: '#aaa',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '12px',
                                                        cursor: 'not-allowed',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    이미 종료된 공연/회차입니다
                                                </button>
                                            );
                                        }

                                        if (!isIdentified) {
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => setView('login')}
                                                    style={{
                                                        width: '100%',
                                                        padding: '1rem',
                                                        marginTop: '1.5rem',
                                                        fontSize: '1.1rem',
                                                        background: '#fff',
                                                        color: '#e74c3c', // Red text
                                                        border: '1px solid #e74c3c', // Red border
                                                        borderRadius: '12px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                    onMouseEnter={(e) => { e.target.style.background = '#fff5f5'; }} // Slight red check background on hover
                                                    onMouseLeave={(e) => { e.target.style.background = '#fff'; }}
                                                >
                                                    <span style={{ fontSize: '1.2rem' }}>🔒</span> 로그인 후 예매하기
                                                </button>
                                            );
                                        }

                                        return (
                                            <button
                                                type="submit"
                                                className="submit-btn"
                                                disabled={loading}
                                                style={{ marginTop: '1.5rem' }}
                                            >
                                                {loading ? '처리 중...' : '예매하기'}
                                            </button>
                                        );
                                    })()}
                                </form>
                            </div>

                            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
                                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    관람평 <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'normal' }}>({reviews.length})</span>
                                </h3>

                                {canReview && !hasReviewed ? (
                                    <form onSubmit={submitReview} style={{ marginBottom: '2rem', background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
                                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>관람평 작성하기</p>
                                        <textarea
                                            name="content"
                                            placeholder="공연 재밌게 보셨나요? 솔직한 후기를 들려주세요!"
                                            style={{ width: '100%', height: '80px', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', resize: 'none' }}
                                            required
                                        />
                                        <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                                            <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>등록</button>
                                        </div>
                                    </form>
                                ) : hasReviewed ? (
                                    <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f0fff4', borderRadius: '8px', textAlign: 'center', color: '#2ecc71', fontSize: '0.9rem' }}>
                                        이미 관람평을 작성하셨습니다. 감사합니다!
                                    </div>
                                ) : null}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {reviews.length === 0 ? (
                                        <p style={{ color: '#999', textAlign: 'center', padding: '1rem' }}>아직 등록된 관람평이 없습니다.</p>
                                    ) : (
                                        reviews.map(rev => (
                                            <div key={rev.id} style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{rev.user_name}</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#999' }}>{new Date(rev.created_at).toLocaleDateString()}</span>
                                                </div>

                                                {rev.user_phone === phone ? (
                                                    // My review
                                                    <div style={{ marginTop: '0.5rem' }}>
                                                        {editingReviewId === rev.id ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <textarea
                                                                    value={editContent}
                                                                    onChange={(e) => setEditContent(e.target.value)}
                                                                    style={{ width: '100%', height: '60px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--accent-color)' }}
                                                                />
                                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                    <button onClick={() => setEditingReviewId(null)} style={{ padding: '0.3rem 0.6rem', border: '1px solid #ddd', background: '#fff' }}>취소</button>
                                                                    <button onClick={() => handleUpdateReview(rev.id)} style={{ padding: '0.3rem 0.6rem', border: 'none', background: 'var(--accent-color)', color: '#fff' }}>저장</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{rev.content}</p>
                                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                    <button
                                                                        onClick={() => { setEditingReviewId(rev.id); setEditContent(rev.content); }}
                                                                        style={{ fontSize: '0.8rem', color: '#999', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                                                    >수정</button>
                                                                    <button
                                                                        onClick={() => handleDeleteReview(rev.id)}
                                                                        style={{ fontSize: '0.8rem', color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                                                    >삭제</button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p style={{ margin: 0, color: '#444' }}>{rev.content}</p>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                                {userReservations.filter(res => !isSessionEnded(res.performances || {}, res)).length > 0 && (
                                    <div>
                                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)' }}>
                                            <span style={{ color: 'var(--accent-color)' }}>●</span> 진행 중인 예매
                                        </h3>
                                        <div className="grid-container" style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                            gap: '1.5rem'
                                        }}>
                                            {userReservations.filter(res => !isSessionEnded(res.performances || {}, res)).map(res => (
                                                <ReservationItem
                                                    key={res.id}
                                                    res={res}
                                                    onCancel={handleCancelReservation}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 4.2 Ended Tickets */}
                                {userReservations.filter(res => isSessionEnded(res.performances || {}, res)).length > 0 && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#999' }}>
                                            <span style={{ color: '#ccc' }}>●</span> 관람 완료 / 종료된 공연
                                        </h3>
                                        <div className="grid-container" style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                            gap: '1.5rem'
                                        }}>
                                            {userReservations.filter(res => isSessionEnded(res.performances || {}, res)).map(res => (
                                                <ReservationItem
                                                    key={res.id}
                                                    res={res}
                                                    onCancel={handleCancelReservation}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
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
        </div >
    );
}

export default Home;
