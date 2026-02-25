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
    );
}
