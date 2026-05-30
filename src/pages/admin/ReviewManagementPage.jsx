import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ReviewManagement from '../../components/admin/ReviewManagement';
import { isVisiblePerformance } from '../../utils/performance';
import './ReservationStatus.css';

function sortPerformancesByStartDate(performances) {
    return [...performances].sort((a, b) => {
        const dateA = new Date((a.date_range || '').split(' - ')[0].replace(/\./g, '-'));
        const dateB = new Date((b.date_range || '').split(' - ')[0].replace(/\./g, '-'));
        return dateB - dateA;
    });
}

function ReviewManagementPage() {
    const [performances, setPerformances] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);

        const [{ data: perfData, error: perfError }, { data: reviewData, error: reviewError }] = await Promise.all([
            supabase
                .from('performances')
                .select('id, title, date_range, is_deleted, deleted_at'),
            supabase
                .from('performance_reviews')
                .select('*')
                .order('created_at', { ascending: false })
        ]);

        if (perfError || reviewError) {
            alert('관람평 정보를 불러오지 못했습니다: ' + (perfError || reviewError).message);
        }

        const visiblePerformances = (perfData || []).filter(isVisiblePerformance);
        const visiblePerformanceIds = new Set(visiblePerformances.map(perf => String(perf.id)));
        const visibleReviews = (reviewData || []).filter(review => visiblePerformanceIds.has(String(review.performance_id)));

        setPerformances(sortPerformancesByStartDate(visiblePerformances));
        setReviews(visibleReviews);
        setLoading(false);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
    }, [fetchData]);

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('정말로 이 관람평을 삭제하시겠습니까?')) return;

        const { error } = await supabase
            .from('performance_reviews')
            .delete()
            .eq('id', reviewId);

        if (error) {
            alert('관람평 삭제 실패: ' + error.message);
        } else {
            alert('관람평이 삭제되었습니다.');
            setReviews(prev => prev.filter(review => review.id !== reviewId));
        }
    };

    const reviewGroups = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        const matchesReview = (review) => {
            if (!term) return true;
            return [
                review.user_name,
                review.user_phone,
                review.content
            ].some(value => String(value || '').toLowerCase().includes(term));
        };

        const groups = performances.map(perf => {
            const perfMatches = [perf.title, perf.date_range]
                .some(value => String(value || '').toLowerCase().includes(term));
            const perfReviews = reviews.filter(review => review.performance_id === perf.id);
            const filteredReviews = perfMatches ? perfReviews : perfReviews.filter(matchesReview);

            return {
                performance: perf,
                reviews: filteredReviews
            };
        }).filter(group => group.reviews.length > 0);

        return groups;
    }, [performances, reviews, searchTerm]);

    return (
        <div>
            <div className="admin-review-page-header">
                <div>
                    <h2>관람평 관리</h2>
                    <p>등록된 관람평 {reviews.length}개</p>
                </div>
                <button
                    type="button"
                    onClick={fetchData}
                    className="btn btn-primary"
                    style={{ padding: '0.7rem 1.5rem', fontSize: '1rem' }}
                >
                    새로고침
                </button>
            </div>

            <div className="admin-review-toolbar">
                <input
                    className="form-control-sm"
                    type="text"
                    placeholder="공연명, 작성자, 연락처, 내용 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <p>로딩 중...</p>
            ) : reviewGroups.length === 0 ? (
                <div className="booking-card admin-review-empty-card">
                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 관람평이 없습니다.'}
                </div>
            ) : (
                <div className="admin-review-group-list">
                    {reviewGroups.map(group => (
                        <div key={group.performance.id} className="booking-card admin-booking-group admin-review-performance-card">
                            <div className="admin-card-header">
                                <div className="admin-header-row">
                                    <div>
                                        <h3>{group.performance.title}</h3>
                                        <p>{group.performance.date_range}</p>
                                        <p className="admin-performance-id">관리 ID #{group.performance.id}</p>
                                    </div>
                                    <strong>관람평 {group.reviews.length}개</strong>
                                </div>
                            </div>

                            <ReviewManagement
                                reviews={group.reviews}
                                onDeleteReview={handleDeleteReview}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ReviewManagementPage;
