import { useCallback, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useHomeData from '../hooks/useHomeData';
import LoginView from '../components/home/LoginView';
import PerformanceListView from '../components/home/PerformanceListView';
import BookingView from '../components/home/BookingView';
import HistoryView from '../components/home/HistoryView';
import PrivacyModal from '../components/home/PrivacyModal';
import '../App.css';

function Home() {
    const location = useLocation();
    const navigate = useNavigate();
    const { performanceId } = useParams();
    const navigatePath = useCallback((path) => {
        if (location.pathname !== path) navigate(path);
    }, [location.pathname, navigate]);

    const {
        // UI States
        view, setView,
        isIdentified,
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
    } = useHomeData(navigatePath);

    const goToView = (nextView) => {
        if (nextView === 'performances') {
            setView('performances');
            navigatePath('/');
        } else if (nextView === 'history') {
            if (!isIdentified) {
                setView('login');
                navigate('/login', { state: { from: '/history' } });
                return;
            }
            setView('history');
            fetchUserReservations();
            navigatePath('/history');
        } else if (nextView === 'login') {
            setView('login');
            const returnPath = location.pathname.startsWith('/performance/')
                ? `${location.pathname}#booking-panel`
                : location.pathname === '/history' ? '/history' : '/';
            navigate('/login', { state: { from: returnPath } });
        } else {
            setView(nextView);
        }
    };

    useEffect(() => {
        if (location.pathname === '/history') {
            if (!isIdentified) {
                setView('login');
                navigate('/login', { replace: true, state: { from: '/history' } });
                return;
            }
            setView('history');
            fetchUserReservations();
            return;
        }

        if (location.pathname === '/login') {
            setView('login');
            return;
        }

        if (performanceId) {
            const parsedId = Number(performanceId);
            if (!Number.isInteger(parsedId)) {
                setView('performances');
                navigate('/', { replace: true });
                return;
            }

            if (selectedPerf?.id === parsedId) {
                setView('reserve');
                return;
            }

            const routePerf = performances.find(perf => perf.id === parsedId);
            if (routePerf) {
                handleSelectPerf(routePerf, { updatePath: false, scrollToTop: false });
            } else if (performances.length > 0) {
                setView('performances');
                navigate('/', { replace: true });
            }
            return;
        }

        setView('performances');
        // Route changes are the source of truth for top-level home tabs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, performanceId, performances, selectedPerf?.id, isIdentified]);

    useEffect(() => {
        if (location.hash === '#booking-panel' && view === 'reserve' && selectedPerf) {
            requestAnimationFrame(() => {
                document.getElementById('booking-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }, [location.hash, selectedPerf, view]);

    useEffect(() => {
        const siteName = '더열정 뮤지컬 예매 페이지';
        document.title = selectedPerf && performanceId
            ? `${selectedPerf.title} | ${siteName}`
            : siteName;
    }, [performanceId, selectedPerf]);

    return (
        <div className="container">
            <header className="header">
                <div className="header-top">
                    <Link className="logo" to="/" onClick={() => setView('performances')}>더열정 뮤지컬 예매</Link>
                </div>
                <div className="header-bottom">
                    <nav className="nav-container">
                        <div className="menu-group">
                            <button aria-current={view === 'performances' || view === 'reserve' ? 'page' : undefined} className={`nav-btn ${view === 'performances' || view === 'reserve' ? 'active' : ''}`} onClick={() => goToView('performances')}>공연 목록</button>
                            <button aria-current={view === 'history' ? 'page' : undefined} className={`nav-btn ${view === 'history' ? 'active' : ''}`} onClick={() => goToView('history')}>예매 내역</button>
                        </div>
                        <div className="auth-group">
                            {isIdentified ? (
                                <button className="auth-btn-logout" onClick={handleLogout}>로그아웃</button>
                            ) : (
                                <button aria-current={view === 'login' ? 'page' : undefined} className={`auth-btn ${view === 'login' ? 'active' : ''}`} onClick={() => goToView('login')}>휴대전화 확인</button>
                            )}
                        </div>
                    </nav>
                </div>
            </header>

            <main className="main-content">
                {view === 'login' && (
                    <LoginView
                        phone={phone}
                        setPhone={setPhone}
                        error={identityError}
                        handleIdentify={(e) => handleIdentify(e, location.state?.from || '/')}
                    />
                )}

                {view === 'performances' && (
                    <PerformanceListView
                        ongoingPerformances={ongoingPerformances}
                        endedPerformances={endedPerformances}
                        occupancy={occupancy}
                        handleSelectPerf={handleSelectPerf}
                        isIdentified={isIdentified}
                        bookedPerfIds={bookedPerfIds}
                        loading={initialLoading}
                        error={dataError}
                        onRetry={fetchData}
                    />
                )}

                {view === 'reserve' && selectedPerf && (
                    <BookingView
                        selectedPerf={selectedPerf}
                        sessions={sessions}
                        occupancy={occupancy}
                        formData={formData}
                        setFormData={setFormData}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        phone={phone}
                        isIdentified={isIdentified}
                        loading={loading}
                        privacyAgreed={privacyAgreed}
                        setPrivacyAgreed={setPrivacyAgreed}
                        setShowPrivacyModal={setShowPrivacyModal}
                        setView={goToView}
                        isPerformanceEnded={isPerformanceEnded}
                        detailLoading={detailLoading}
                        detailError={detailError}
                        onRetryDetail={() => handleSelectPerf(selectedPerf, { updatePath: false, scrollToTop: false })}
                        bookingStep={bookingStep}
                        reservationError={reservationError}
                        completedReservation={completedReservation}
                        resetBookingFlow={resetBookingFlow}
                        handleConfirmReservation={handleConfirmReservation}
                        reviews={reviews}
                        canReview={canReview}
                        hasReviewed={hasReviewed}
                        editingReviewId={editingReviewId}
                        setEditingReviewId={setEditingReviewId}
                        editContent={editContent}
                        setEditContent={setEditContent}
                        submitReview={submitReview}
                        handleDeleteReview={handleDeleteReview}
                        handleUpdateReview={handleUpdateReview}
                    />
                )}

                {view === 'history' && (
                    <HistoryView
                        loading={loading}
                        userReservations={userReservations}
                        handleCancelReservation={handleCancelReservation}
                        setView={goToView}
                        error={historyError}
                        onRetry={fetchUserReservations}
                    />
                )}

                {showPrivacyModal && (
                    <PrivacyModal onClose={() => setShowPrivacyModal(false)} />
                )}
            </main>
        </div>
    );
}

export default Home;
