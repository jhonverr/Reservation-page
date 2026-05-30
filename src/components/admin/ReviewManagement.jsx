import { formatPhone } from '../../utils/format';

export default function ReviewManagement({ reviews, onDeleteReview, animateRef }) {
    return (
        <div className="admin-review-section">
            <div className="admin-review-header">
                <div>
                    <h4>관람평 관리</h4>
                    <p>해당 공연에 등록된 관람평을 확인하고 삭제할 수 있습니다.</p>
                </div>
                <span>{reviews.length}개</span>
            </div>

            {reviews.length === 0 ? (
                <div className="admin-review-empty">등록된 관람평이 없습니다.</div>
            ) : (
                <>
                    <div className="table-container desktop-only admin-review-table">
                        <table>
                            <colgroup>
                                <col width="12%" />
                                <col width="18%" />
                                <col width="42%" />
                                <col width="18%" />
                                <col width="10%" />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'center' }}>작성자</th>
                                    <th style={{ textAlign: 'center' }}>연락처</th>
                                    <th>내용</th>
                                    <th style={{ textAlign: 'center' }}>작성일</th>
                                    <th style={{ textAlign: 'center' }}>관리</th>
                                </tr>
                            </thead>
                            <tbody ref={animateRef}>
                                {reviews.map(review => (
                                    <tr key={review.id} className="review-row">
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{review.user_name || '-'}</td>
                                        <td style={{ textAlign: 'center' }}>{formatPhone(review.user_phone)}</td>
                                        <td className="admin-review-content">{review.content}</td>
                                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{new Date(review.created_at).toLocaleString()}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteReview(review.id)}
                                                className="btn btn-danger btn-xs"
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mobile-only admin-review-mobile-list" ref={animateRef}>
                        {reviews.map(review => (
                            <div key={review.id} className="review-card">
                                <div className="admin-review-card-head">
                                    <span>{review.user_name || '-'}</span>
                                    <time>{new Date(review.created_at).toLocaleDateString()}</time>
                                </div>
                                <p className="admin-review-phone">{formatPhone(review.user_phone)}</p>
                                <p className="admin-review-content">{review.content}</p>
                                <button
                                    type="button"
                                    onClick={() => onDeleteReview(review.id)}
                                    className="btn btn-danger-outline btn-sm"
                                >
                                    삭제
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
