import useHomeData from '../hooks/useHomeData';
import LoginView from '../components/home/LoginView';
import PerformanceListView from '../components/home/PerformanceListView';
import BookingView from '../components/home/BookingView';
import HistoryView from '../components/home/HistoryView';
import PrivacyModal from '../components/home/PrivacyModal';
import '../App.css';

function Home() {
    const {
        // UI States
        view, setView,
        isIdentified,
        phone, setPhone,
        loading,

        // Data
        ongoingPerformances, endedPerformances,
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
    } = useHomeData();

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
                {view === 'login' && (
                    <LoginView
                        phone={phone}
                        setPhone={setPhone}
                        handleIdentify={handleIdentify}
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
                        setView={setView}
                        isPerformanceEnded={isPerformanceEnded}
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
                        setView={setView}
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
