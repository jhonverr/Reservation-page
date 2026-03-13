import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isSessionEnded } from '../utils/date';

export default function useHomeData() {
    // UI States
    const [view, setView] = useState('performances');
    const [isIdentified, setIsIdentified] = useState(false);
    const [phone, setPhone] = useState('');

    // Data States
    const [performances, setPerformances] = useState([]);
    const [selectedPerf, setSelectedPerf] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [userReservations, setUserReservations] = useState([]);
    const [occupancy, setOccupancy] = useState({});

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

    // Privacy State
    const [privacyAgreed, setPrivacyAgreed] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    const [loading, setLoading] = useState(false);
    const [bookedPerfIds, setBookedPerfIds] = useState(new Set());

    useEffect(() => {
        fetchData();
        const savedPhone = sessionStorage.getItem('userPhone');
        if (savedPhone) {
            setPhone(savedPhone);
            setIsIdentified(true);
        }

        // Initialize history state for SPA-like back behavior
        if (typeof window !== 'undefined' && window.history && !window.history.state) {
            window.history.replaceState({ view: 'performances' }, '');
        }

        const handlePopState = () => {
            // When user presses browser back from 예약(상세) 화면,
            // 우선 SPA 내부에서 공연 정보 탭으로만 돌아가도록 처리
            setView((prev) => (prev === 'reserve' ? 'performances' : prev));
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('popstate', handlePopState);
            }
        };
    }, []);

    // Fetch booked performance IDs when user is identified
    useEffect(() => {
        if (phone) {
            fetchBookedPerfIds();
        } else {
            setBookedPerfIds(new Set());
        }
    }, [phone]);

    async function fetchBookedPerfIds() {
        const { data } = await supabase
            .from('reservations')
            .select('performance_id')
            .eq('phone', phone);
        if (data) {
            setBookedPerfIds(new Set(data.map(r => r.performance_id)));
        }
    }

    async function fetchData() {
        await fetchPerformances();
        await fetchOccupancy();
    }

    async function fetchPerformances() {
        const { data: perfData, error: perfError } = await supabase.from('performances').select('*');
        const { data: sessionData } = await supabase.from('performance_sessions')
            .select('*')
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (!perfError && perfData) {
            const combined = perfData.map(p => ({
                ...p,
                sessions: sessionData?.filter(s => s.performance_id === p.id) || []
            }));
            console.log('[Debug] Fetched Performances:', combined);
            setPerformances(combined);
        }
    }

    async function fetchOccupancy() {
        const { data, error } = await supabase.from('reservations').select('performance_id, date, time, tickets');
        if (!error && data) {
            const occ = {};
            data.forEach(res => {
                if (!occ[res.performance_id]) occ[res.performance_id] = {};
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
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (!error && data) {
            setSessions(data);
            if (data.length > 0) {
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
            setSessions([]);
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

            // Push a history entry so that browser Back stays within the app first
            if (typeof window !== 'undefined' && window.history) {
                try {
                    window.history.pushState(
                        { view: 'reserve', performanceId: perf.id },
                        '',
                        window.location.pathname
                    );
                } catch (e) {
                    console.warn('Failed to push history state', e);
                }
            }
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
            .eq('user_phone', phone);

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

        if (!privacyAgreed) {
            alert('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }

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
            fetchOccupancy();
            return;
        }

        const { error } = await supabase.from('reservations').insert([{
            name: formData.name,
            phone: phone,
            date: formData.date,
            time: formData.time,
            tickets: formData.tickets,
            total_price: formData.tickets * selectedPerf.price,
            performance_id: selectedPerf.id
        }]);

        if (error) {
            alert('예약 실패: ' + error.message);
        } else {
            alert('예약이 완료되었습니다! 🎉\n(공연 관람 후 본 페이지에서 소중한 관람평을 남겨주세요.)');
            fetchOccupancy();
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

    function isPerformanceEnded(perf) {
        if (!perf.sessions || perf.sessions.length === 0) return false;
        return perf.sessions.every(s => isSessionEnded(perf, s));
    }

    const ongoingPerformances = performances.filter(p => !isPerformanceEnded(p));
    const endedPerformances = performances.filter(p => isPerformanceEnded(p));

    return {
        // UI States
        view, setView,
        isIdentified, setIsIdentified,
        phone, setPhone,
        loading,

        // Data
        performances, ongoingPerformances, endedPerformances,
        selectedPerf, sessions, userReservations, occupancy, bookedPerfIds,

        // Reviews
        reviews, canReview, hasReviewed,
        editingReviewId, setEditingReviewId,
        editContent, setEditContent,

        // Form
        formData, setFormData,
        privacyAgreed, setPrivacyAgreed,
        showPrivacyModal, setShowPrivacyModal,

        // Handlers
        handleIdentify, handleLogout, handleSelectPerf,
        handleChange, handleSubmit, handleCancelReservation,
        submitReview, handleDeleteReview, handleUpdateReview,
        fetchUserReservations, isPerformanceEnded,
    };
}
