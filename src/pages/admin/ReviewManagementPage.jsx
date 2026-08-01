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
    const [transferSourceId, setTransferSourceId] = useState(null);
    const [transferTargetId, setTransferTargetId] = useState('');
    const [transferring, setTransferring] = useState(false);

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

    const handleTransferReviews = async (sourcePerformance) => {
        const targetPerformance = performances.find(perf => String(perf.id) === String(transferTargetId));
        const sourceReviews = reviews.filter(review => String(review.performance_id) === String(sourcePerformance.id));

        if (!targetPerformance || sourceReviews.length === 0) return;

        const reservedPhoneKeys = new Set(
            reviews
                .filter(review => String(review.performance_id) === String(targetPerformance.id))
                .map(review => review.user_phone)
                .filter(Boolean)
        );
        const transferPlan = sourceReviews.map(review => {
            const originalPhone = review.user_phone;
            let transferPhone = originalPhone;

            if (originalPhone && reservedPhoneKeys.has(transferPhone)) {
                let suffix = 2;
                while (reservedPhoneKeys.has(`${originalPhone}-${suffix}`)) suffix += 1;
                transferPhone = `${originalPhone}-${suffix}`;
            }

            if (transferPhone) reservedPhoneKeys.add(transferPhone);
            return { review, transferPhone };
        });
        const collisionCount = transferPlan.filter(({ review, transferPhone }) => review.user_phone !== transferPhone).length;

        const confirmed = window.confirm(
            `‘${sourcePerformance.title}’의 관람평 ${sourceReviews.length}개를\n‘${targetPerformance.title}’로 이관할까요?\n\n이관하면 기존 공연에서는 보이지 않고 대상 공연에 이어서 표시됩니다.${collisionCount > 0 ? `\n동일 연락처 관람평 ${collisionCount}개도 작성일을 유지해 함께 이관됩니다.` : ''}`
        );
        if (!confirmed) return;

        setTransferring(true);
        const results = await Promise.all(transferPlan.map(({ review, transferPhone }) => (
            supabase
                .from('performance_reviews')
                .update({ performance_id: targetPerformance.id, user_phone: transferPhone })
                .eq('id', review.id)
        )));
        const failedResults = results.filter(result => result.error);

        if (failedResults.length > 0) {
            await fetchData();
            alert(`관람평 ${sourceReviews.length - failedResults.length}개를 이관했지만 ${failedResults.length}개는 실패했습니다.\n${failedResults[0].error.message}`);
        } else {
            const transferredById = new Map(transferPlan.map(({ review, transferPhone }) => [String(review.id), transferPhone]));
            setReviews(prev => prev.map(review => transferredById.has(String(review.id))
                ? { ...review, performance_id: targetPerformance.id, user_phone: transferredById.get(String(review.id)) }
                : review));
            setTransferSourceId(null);
            setTransferTargetId('');
            alert(`관람평 ${sourceReviews.length}개를 이관했습니다.${collisionCount > 0 ? `\n동일 연락처 ${collisionCount}개는 내부 키에 접미사를 붙여 보존했습니다.` : ''}`);
        }
        setTransferring(false);
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
                                    <div className="admin-review-group-actions">
                                        <strong>관람평 {reviews.filter(review => String(review.performance_id) === String(group.performance.id)).length}개</strong>
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            onClick={() => {
                                                setTransferSourceId(current => current === group.performance.id ? null : group.performance.id);
                                                setTransferTargetId('');
                                            }}
                                        >
                                            관람평 이관
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {transferSourceId === group.performance.id && (
                                <div className="review-transfer-panel">
                                    <div>
                                        <strong>이 공연의 관람평 전체 이관</strong>
                                        <p>대상 공연으로 연결을 변경합니다. 관람평 내용과 작성일은 그대로 유지됩니다.</p>
                                    </div>
                                    <div className="review-transfer-controls">
                                        <label htmlFor={`review-transfer-${group.performance.id}`}>대상 공연</label>
                                        <select
                                            id={`review-transfer-${group.performance.id}`}
                                            className="form-control-sm"
                                            value={transferTargetId}
                                            onChange={(event) => setTransferTargetId(event.target.value)}
                                        >
                                            <option value="">공연을 선택해주세요</option>
                                            {performances.filter(perf => perf.id !== group.performance.id).map(perf => (
                                                <option key={perf.id} value={perf.id}>{perf.title} · {perf.date_range}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            disabled={!transferTargetId || transferring}
                                            onClick={() => handleTransferReviews(group.performance)}
                                        >
                                            {transferring ? '이관 중…' : '선택한 공연으로 이관'}
                                        </button>
                                    </div>
                                </div>
                            )}

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
