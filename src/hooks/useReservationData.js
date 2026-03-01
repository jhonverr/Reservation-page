import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isSessionEnded } from '../utils/date';
import autoAnimate from '@formkit/auto-animate';

export default function useReservationData() {
    const [performances, setPerformances] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [searchTerms, setSearchTerms] = useState({});
    const [loading, setLoading] = useState(true);
    const [collapsedPerfs, setCollapsedPerfs] = useState({});
    const [collapsedSessions, setCollapsedSessions] = useState({});
    const [paymentModal, setPaymentModal] = useState(null);
    const [modalPaidTickets, setModalPaidTickets] = useState(0);

    const animatedElements = useRef(new Set());
    const animateRef = useCallback((el) => {
        if (el && !animatedElements.current.has(el)) {
            animatedElements.current.add(el);
            autoAnimate(el, { duration: 400 });
        }
    }, []);

    // Manual reservation form state
    const [showAddForm, setShowAddForm] = useState(null);
    const [manualForm, setManualForm] = useState({
        name: '',
        phone: '',
        tickets: 1,
        date: '',
        time: ''
    });

    useEffect(() => {
        cleanupOldData();
        fetchData();
    }, []);

    async function cleanupOldData() {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const { data: oldPerfs } = await supabase
            .from('performances')
            .select('id, date_range');

        if (!oldPerfs) return;

        const targetPerfIds = oldPerfs.filter(p => {
            const dateRange = p.date_range || '';
            const parts = dateRange.split(' - ');
            if (parts.length < 2) return false;

            const endDateStr = parts[1].replace(/\./g, '-');
            const endDate = new Date(endDateStr);

            return !isNaN(endDate) && endDate < threeMonthsAgo;
        }).map(p => p.id);

        if (targetPerfIds.length === 0) return;

        const { error: resError } = await supabase
            .from('reservations')
            .update({ phone: '000-0000-0000' })
            .in('performance_id', targetPerfIds)
            .neq('phone', '000-0000-0000');

        const { error: revError } = await supabase
            .from('performance_reviews')
            .update({ user_phone: '000-0000-0000' })
            .in('performance_id', targetPerfIds)
            .neq('user_phone', '000-0000-0000');

        if (resError || revError) {
            console.error('Data cleanup failed:', resError || revError);
        } else {
            console.log('Old data cleanup completed (Reservations & Reviews) for performances:', targetPerfIds);
        }
    }

    async function fetchData() {
        setLoading(true);
        const { data: perfData } = await supabase.from('performances').select('*');
        const { data: resData } = await supabase
            .from('reservations')
            .select('*')
            .order('created_at', { ascending: false });

        const { data: sessionsData } = await supabase
            .from('performance_sessions')
            .select('*')
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (perfData) {
            const perfWithSessions = perfData.map(perf => ({
                ...perf,
                sessions: sessionsData?.filter(s => s.performance_id === perf.id) || []
            }));

            const sortedPerf = [...perfWithSessions].sort((a, b) => {
                const dateA = new Date((a.date_range || '').split(' - ')[0].replace(/\./g, '-'));
                const dateB = new Date((b.date_range || '').split(' - ')[0].replace(/\./g, '-'));
                return dateB - dateA;
            });
            setPerformances(sortedPerf);

            const now = new Date();
            const initialCollapsedPerfs = {};
            const initialCollapsedSessions = {};

            sortedPerf.forEach(perf => {
                const endDateStr = (perf.date_range || '').split(' - ')[1];
                if (endDateStr) {
                    const endDate = new Date(endDateStr.replace(/\./g, '-'));
                    initialCollapsedPerfs[perf.id] = endDate < now;
                } else {
                    initialCollapsedPerfs[perf.id] = false;
                }

                perf.sessions.forEach((session, idx) => {
                    if (isSessionEnded(perf, session)) {
                        const sessionKey = `${session.date}-${session.time}-${idx}`;
                        initialCollapsedSessions[sessionKey] = true;
                    }
                });
            });
            setCollapsedPerfs(initialCollapsedPerfs);
            setCollapsedSessions(initialCollapsedSessions);
        }
        if (resData) setReservations(resData);
        setLoading(false);
    }

    const handleDeleteReservation = async (resId) => {
        if (!window.confirm('정말로 이 예약을 취소하시겠습니까? (삭제 처리됩니다)')) return;

        const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', resId);

        if (error) {
            alert('취소 실패: ' + error.message);
        } else {
            alert('예약이 취소되었습니다.');
            fetchData();
        }
    };

    const handleUpdatePayment = async (res, delta) => {
        if (!res) return;

        const currentPaid = res.paid_tickets ?? (res.is_paid ? res.tickets : 0);
        let newPaid = currentPaid + delta;
        if (newPaid < 0) newPaid = 0;
        if (newPaid > res.tickets) newPaid = res.tickets;

        if (newPaid === currentPaid) return;

        const newIsPaid = newPaid === res.tickets;

        const { error } = await supabase
            .from('reservations')
            .update({ paid_tickets: newPaid, is_paid: newIsPaid })
            .eq('id', res.id);

        if (error) {
            alert('결제 상태 업데이트 실패: ' + error.message);
        } else {
            setReservations(prev => prev.map(r =>
                r.id === res.id ? { ...r, paid_tickets: newPaid, is_paid: newIsPaid } : r
            ));
        }
    };

    const handlePayFull = async (res) => {
        if (!res) return;
        const { error } = await supabase
            .from('reservations')
            .update({ paid_tickets: res.tickets, is_paid: true })
            .eq('id', res.id);

        if (error) {
            alert('결제 처리 실패: ' + error.message);
        } else {
            setReservations(prev => prev.map(r =>
                r.id === res.id ? { ...r, paid_tickets: res.tickets, is_paid: true } : r
            ));
            if (paymentModal && paymentModal.id === res.id) {
                setModalPaidTickets(res.tickets);
            }
        }
    };

    const handleOpenPaymentModal = (res) => {
        setPaymentModal(res);
        setModalPaidTickets(res.paid_tickets ?? (res.is_paid ? res.tickets : 0));
    };

    const handleSavePaymentModal = () => {
        if (!paymentModal) return;
        const currentPaid = paymentModal.paid_tickets ?? (paymentModal.is_paid ? paymentModal.tickets : 0);
        const delta = modalPaidTickets - currentPaid;
        if (delta !== 0) {
            handleUpdatePayment(paymentModal, delta);
        }
        setPaymentModal(null);
    };

    const handleAddReservation = async (perfId) => {
        if (!manualForm.name || !manualForm.phone || !manualForm.date || !manualForm.time) {
            alert('모든 정보를 입력해주세요.');
            return;
        }

        const { data: perfData, error: perfError } = await supabase
            .from('performances')
            .select('price')
            .eq('id', perfId)
            .single();

        if (perfError || !perfData) {
            alert('공연 정보를 가져오는데 실패했습니다.');
            return;
        }

        const totalPrice = manualForm.tickets * perfData.price;

        const { error } = await supabase
            .from('reservations')
            .insert([{
                performance_id: perfId,
                name: manualForm.name,
                phone: manualForm.phone,
                tickets: manualForm.tickets,
                date: manualForm.date,
                time: manualForm.time,
                total_price: totalPrice
            }]);

        if (error) {
            alert('추가 실패: ' + error.message);
        } else {
            alert('예약이 추가되었습니다.');
            setShowAddForm(null);
            setManualForm({ name: '', phone: '', tickets: 1, date: '', time: '' });
            fetchData();
        }
    };

    const getSessionGroups = (perf) => {
        const term = (searchTerms[perf.id] || '').toLowerCase();
        const perfReservations = reservations.filter(r => r.performance_id === perf.id);

        const unknownSessionRes = perfReservations.filter(r =>
            !perf.sessions.some(s => s.date === r.date && s.time === r.time)
        );

        const groups = perf.sessions.map((session, idx) => {
            const sessionRes = perfReservations.filter(r => r.date === session.date && r.time === session.time);

            const filteredRes = sessionRes.filter(r => {
                if (!term) return true;
                return r.name.toLowerCase().includes(term) || r.phone.includes(term);
            });

            filteredRes.sort((a, b) => {
                const aPaid = (a.paid_tickets ?? (a.is_paid ? a.tickets : 0)) === a.tickets;
                const bPaid = (b.paid_tickets ?? (b.is_paid ? b.tickets : 0)) === b.tickets;
                if (aPaid === bPaid) return 0;
                return aPaid ? 1 : -1;
            });

            const booked = sessionRes.reduce((sum, r) => sum + r.tickets, 0);
            const totalPaid = sessionRes.reduce((sum, r) => sum + (r.paid_tickets ?? (r.is_paid ? r.tickets : 0)), 0);
            const isEnded = isSessionEnded(perf, session);

            return {
                session,
                originalIdx: idx,
                reservations: filteredRes,
                booked,
                totalPaid,
                total: perf.total_seats,
            };
        });

        groups.sort((a, b) => {
            if (a.isEnded === b.isEnded) return 0;
            return a.isEnded ? 1 : -1;
        });

        const filteredUnknown = unknownSessionRes.filter(r => {
            if (!term) return true;
            return r.name.toLowerCase().includes(term) || r.phone.includes(term);
        });

        if (filteredUnknown.length > 0) {
            groups.push({
                session: { date: '기타', time: '설정되지 않은 회차' },
                originalIdx: -1,
                reservations: filteredUnknown,
                booked: filteredUnknown.reduce((sum, r) => sum + r.tickets, 0),
                total: 0,
                isEnded: true
            });
        }

        return groups;
    };

    const handleSearchChange = (perfId, value) => {
        setSearchTerms(prev => ({ ...prev, [perfId]: value }));
    };

    return {
        performances, reservations,
        searchTerms, loading,
        collapsedPerfs, setCollapsedPerfs,
        collapsedSessions, setCollapsedSessions,
        paymentModal, setPaymentModal,
        modalPaidTickets, setModalPaidTickets,
        animateRef,
        showAddForm, setShowAddForm,
        manualForm, setManualForm,
        fetchData, getSessionGroups, handleSearchChange,
        handleDeleteReservation, handleUpdatePayment,
        handlePayFull, handleOpenPaymentModal, handleSavePaymentModal,
        handleAddReservation,
    };
}
