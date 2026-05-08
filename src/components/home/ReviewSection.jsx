export default function ReviewSection({
    reviews, canReview, hasReviewed, loading,
    phone, editingReviewId, setEditingReviewId,
    editContent, setEditContent,
    submitReview, handleDeleteReview, handleUpdateReview
}) {
    return (
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                관람평 <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'normal' }}>({reviews.length})</span>
            </h3>

            {canReview && !hasReviewed ? (
                <form onSubmit={submitReview} className="control-panel" style={{ marginBottom: '2rem', padding: '1rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>관람평 작성하기</p>
                    <textarea
                        className="form-control-sm"
                        name="content"
                        placeholder="공연 재밌게 보셨나요? 솔직한 후기를 들려주세요!"
                        style={{ height: '80px', resize: 'none' }}
                        required
                    />
                    <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                        <button type="submit" disabled={loading} className="btn btn-primary btn-sm">등록</button>
                    </div>
                </form>
            ) : hasReviewed ? (
                <div className="control-panel" style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--success-soft)', textAlign: 'center', color: 'var(--success-color)', fontSize: '0.9rem' }}>
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
                                <div style={{ marginTop: '0.5rem' }}>
                                    {editingReviewId === rev.id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <textarea
                                                className="form-control-sm"
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                style={{ height: '60px', borderColor: 'var(--accent-color)' }}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button type="button" onClick={() => setEditingReviewId(null)} className="btn btn-secondary btn-xs">취소</button>
                                                <button type="button" onClick={() => handleUpdateReview(rev.id)} className="btn btn-primary btn-xs">저장</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{rev.content}</p>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditingReviewId(rev.id); setEditContent(rev.content); }}
                                                    className="link-button"
                                                >수정</button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteReview(rev.id)}
                                                    className="link-button link-button-danger"
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
    );
}
