import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isSessionEnded, isReviewTimeReached } from '../utils/date';
import { isVisiblePerformance } from '../utils/performance';

const getSavedPhone = () => {
    if (typeof window === 'undefined') return '';
    return (sessionStorage.getItem('userPhone') || '').replace(/[^0-9]/g, '');
};

export default function useHomeData(navigatePath = () => {}) {
    // UI States
    const [view, setView] = useState('performances');
    const [phone, setPhone] = useState(getSavedPhone);
    const [isIdentified, setIsIdentified] = useState(() => Boolean(getSavedPhone()));

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
    const [initialLoading, setInitialLoading] = useState(true);
    const [dataError, setDataError] = useState('');
    const [historyError, setHistoryError] = useState('');
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [identityError, setIdentityError] = useState('');
    const [bookingStep, setBookingStep] = useState('form');
    const [reservationError, setReservationError] = useState('');
    const [completedReservation, setCompletedReservation] = useState(null);
    const [bookedPerfIds, setBookedPerfIds] = useState(new Set());

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
        setInitialLoading(true);
        setDataError('');
        try {
            await Promise.all([
                fetchPerformances(),
                fetchOccupancy({ throwOnError: true })
            ]);
        } catch (error) {
            console.error('Error loading home data:', error);
            setDataError('공연 정보를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해주세요.');
        } finally {
            setInitialLoading(false);
        }
    }

    async function fetchPerformances() {
        const [performanceResult, sessionResult] = await Promise.all([
            supabase.from('performances').select('*'),
            supabase.from('performance_sessions')
                .select('*')
                .order('date', { ascending: true })
                .order('time', { ascending: true })
        ]);
        const { data: perfData, error: perfError } = performanceResult;
        const { data: sessionData, error: sessionError } = sessionResult;

        if (perfError || sessionError) {
            throw perfError || sessionError;
        }

        if (perfData) {
            const visiblePerfData = perfData.filter(isVisiblePerformance);
            const combined = visiblePerfData.map(p => ({
                ...p,
                sessions: sessionData?.filter(s => s.performance_id === p.id) || []
            }));

            // 날짜 기준 최신순 정렬 (첫 번째 세션 날짜 기준 내림차순)
            combined.sort((a, b) => {
                const dateAStr = a.sessions[0]?.date?.replace(/\./g, '-') || '0000-00-00';
                const dateBStr = b.sessions[0]?.date?.replace(/\./g, '-') || '0000-00-00';
                return new Date(dateBStr) - new Date(dateAStr);
            });

            setPerformances(combined);
        }
    }

    async function fetchOccupancy(options = {}) {
        const { throwOnError = false } = options;
        const { data, error } = await supabase.from('reservations').select('performance_id, date, time, tickets');
        if (error) {
            if (throwOnError) throw error;
            return false;
        }

        const occ = {};
        (data || []).forEach(res => {
            if (!occ[res.performance_id]) occ[res.performance_id] = {};
            const key = `${res.date}|${res.time}`;
            occ[res.performance_id][key] = (occ[res.performance_id][key] || 0) + res.tickets;
        });
        setOccupancy(occ);
        return true;
    }

    async function fetchUserReservations() {
        if (!phone) return;
        setLoading(true);
        setHistoryError('');
        const { data, error } = await supabase
            .from('reservations')
            .select('*, performances(*)')
            .eq('phone', phone)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading reservation history:', error);
            setHistoryError('예매 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        } else if (data) {
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

        if (error) throw error;

        if (data) {
            setSessions(data);
            if (data.length > 0) {
                const firstActive = data.find(s => !isSessionEnded(perf, s));
                setFormData(prev => ({
                    ...prev,
                    date: firstActive ? firstActive.date : data[0].date,
                    time: ''
                }));
            }
            // 세션 데이터를 가져온 후 관람평 작성 권한(및 노출 여부)을 한 번 더 체크
            checkReviewEligibility(perf.id, data, perf);
        }
        return data || [];
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

    async function checkReviewEligibility(perfId, currentSessions = sessions, currentPerf = selectedPerf) {
        // 1. 시간 기반 노출 여부 체크 (로그인 여부와 상관없이)
        // currentPerf가 없으면 최소한의 객체라도 전달 (duration이 없으면 기본값 0분으로 계산됨)
        const isTimeReached = isReviewTimeReached(currentPerf || { id: perfId }, currentSessions);

        if (!phone) {
            // 로그인하지 않은 경우, "시간이 되었으면" 작성 폼을 보여줌
            setCanReview(isTimeReached);
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

        // 2. 로그인한 경우: 참석했거나 노출 시간이 되었으면 폼을 보여줌
        setCanReview(hasAttended || isTimeReached);

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

    const handleIdentify = (e, returnTo = '/') => {
        e.preventDefault();
        setIdentityError('');
        if (phone.length < 10) {
            setIdentityError('휴대전화 번호를 정확히 입력해주세요.');
            return;
        }
        const normalizedPhone = phone.replace(/[^0-9]/g, '');
        const safeReturnTo = typeof returnTo === 'string' && returnTo.startsWith('/')
            ? returnTo
            : '/';
        sessionStorage.setItem('userPhone', normalizedPhone);
        setPhone(normalizedPhone);
        setIsIdentified(true);
        if (safeReturnTo.startsWith('/performance/')) {
            setView('reserve');
        } else if (safeReturnTo.startsWith('/history')) {
            setView('history');
        } else {
            setView('performances');
        }
        navigatePath(safeReturnTo);
        return true;
    };

    const handleLogout = () => {
        sessionStorage.removeItem('userPhone');
        setPhone('');
        setIsIdentified(false);
        setView('performances');
        navigatePath('/');
    };

    const handleSelectPerf = async (perf, options = {}) => {
        const { updatePath = true, scrollToTop = true } = options;
        setSelectedPerf(perf);
        setSessions([]);
        setDetailError('');
        setDetailLoading(true);
        setBookingStep('form');
        setCompletedReservation(null);
        setReservationError('');
        setPrivacyAgreed(false);
        setFormData({
            name: '',
            date: '',
            time: '',
            tickets: 1
        });
        setView('reserve');
        if (updatePath) {
            navigatePath(`/performance/${perf.id}`);
        }
        if (scrollToTop && typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }

        try {
            const { data: latestPerf, error: perfError } = await supabase
                .from('performances')
                .select('*')
                .eq('id', perf.id)
                .single();

            if (perfError) throw perfError;
            if (!latestPerf || !isVisiblePerformance(latestPerf)) throw new Error('Performance not found');

            const detailPerf = latestPerf ? { ...perf, ...latestPerf } : perf;

            setSelectedPerf(detailPerf);
            await Promise.all([
                fetchSessions(detailPerf),
                fetchReviews(detailPerf.id)
            ]);
        } catch (error) {
            console.error('Error selecting performance:', error);
            setDetailError('공연 상세 정보를 불러오지 못했습니다. 다시 시도해주세요.');
        } finally {
            setDetailLoading(false);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        const content = e.target.content.value.trim();
        if (!content) return;

        // 로그인 여부 체크 (핸드폰 번호 및 인증 상태 확인)
        if (!phone || !isIdentified) {
            alert('관람평 작성을 위해서는 공연 관람하신 분의 로그인이 필요합니다!');
            setView('login');
            navigatePath('/login');
            return false;
        }

        if (hasReviewed) {
            alert('이미 관람평을 작성하셨습니다.');
            return;
        }

        setLoading(true);

        // 실제 예매 여부 확인
        const { data: resData, error: resError } = await supabase
            .from('reservations')
            .select('id')
            .eq('performance_id', selectedPerf.id)
            .eq('phone', phone)
            .limit(1);

        if (resError || !resData || resData.length === 0) {
            alert('관람평은 공연을 예매하신 분에 한해서 작성이 가능합니다!');
            setLoading(false);
            return;
        }

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
        setReservationError('');
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setReservationError('');
        if (!isIdentified) {
            setIdentityError('예매를 계속하려면 휴대전화 확인이 필요합니다.');
            setView('login');
            navigatePath('/login');
            return;
        }

        if (!privacyAgreed) {
            setReservationError('개인정보 수집 및 이용에 동의해주세요.');
            return false;
        }

        if (!formData.name.trim()) {
            setReservationError('예매자명을 입력해주세요.');
            return false;
        }

        const currentSession = sessions.find(s => s.date === formData.date && s.time === formData.time);

        if (!currentSession) {
            setReservationError('관람할 시간을 선택해주세요.');
            return false;
        }

        if (isSessionEnded(selectedPerf, currentSession)) {
            setReservationError('이미 종료된 회차입니다. 다른 시간을 선택해주세요.');
            return false;
        }

        return true;
    };

    const handleConfirmReservation = async () => {
        const currentSession = sessions.find(s => s.date === formData.date && s.time === formData.time);
        if (!currentSession) {
            setReservationError('선택한 회차를 다시 확인해주세요.');
            setBookingStep('form');
            return false;
        }

        setLoading(true);
        setReservationError('');

        const { data: resFetch, error: resError } = await supabase
            .from('reservations')
            .select('tickets')
            .eq('performance_id', selectedPerf.id)
            .eq('date', formData.date)
            .eq('time', formData.time);

        if (resError) {
            console.error('Reservation availability check failed:', resError);
            setReservationError('잔여 좌석을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');
            setLoading(false);
            return false;
        }

        const latestBooked = (resFetch || []).reduce((sum, res) => sum + res.tickets, 0);
        const currentTotalSeats = selectedPerf.total_seats;

        if (latestBooked + formData.tickets > currentTotalSeats) {
            setReservationError(`현재 잔여 좌석은 ${Math.max(0, currentTotalSeats - latestBooked)}석입니다. 인원을 다시 선택해주세요.`);
            setLoading(false);
            fetchOccupancy();
            setBookingStep('form');
            return false;
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
            console.error('Reservation creation failed:', error);
            setReservationError('예매를 완료하지 못했습니다. 잠시 후 다시 시도해주세요.');
            setLoading(false);
            return false;
        } else {
            setCompletedReservation({
                performance: selectedPerf,
                date: formData.date,
                time: formData.time,
                name: formData.name,
                phone,
                tickets: formData.tickets,
                totalPrice: formData.tickets * selectedPerf.price,
                castingInfo: currentSession.casting_info || ''
            });
            setBookingStep('success');
            await fetchOccupancy();
        }
        setLoading(false);
        return true;
    };

    const resetBookingFlow = () => {
        setBookingStep('form');
        setReservationError('');
        setCompletedReservation(null);
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

    useEffect(() => {
        fetchData();
        // Initial app bootstrap only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch booked performance IDs when user is identified
    useEffect(() => {
        if (phone) {
            fetchBookedPerfIds();
        } else {
            setBookedPerfIds(new Set());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phone]);

    const ongoingPerformances = performances.filter(p => !isPerformanceEnded(p));
    const endedPerformances = performances.filter(p => isPerformanceEnded(p));

    return {
        // UI States
        view, setView,
        isIdentified, setIsIdentified,
        phone, setPhone,
        loading, initialLoading, dataError, historyError,
        detailLoading, detailError, identityError,
        bookingStep, reservationError, completedReservation,

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
        handleConfirmReservation, resetBookingFlow,
        submitReview, handleDeleteReview, handleUpdateReview,
        fetchUserReservations, fetchData, isPerformanceEnded,
    };
}
