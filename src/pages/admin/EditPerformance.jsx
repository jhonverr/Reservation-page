import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import TimePicker from '../../components/TimePicker';
import '../../App.css';

function EditPerformance() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Form States
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        price: '',
        duration: '',
        ageRating: 'all',
        totalSeats: ''
    });

    const [posterFile, setPosterFile] = useState(null);
    const [existingPosterUrl, setExistingPosterUrl] = useState('');
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        fetchPerformanceData();
    }, [id]);

    async function fetchPerformanceData() {
        try {
            // 1. Fetch Performance
            const { data: perf, error: perfError } = await supabase
                .from('performances')
                .select('*')
                .eq('id', id)
                .single();

            if (perfError) throw perfError;

            // Parse Date Range (YYYY.MM.DD - YYYY.MM.DD)
            const [start, end] = perf.date_range.split(' - ').map(d => d.replace(/\./g, '-'));

            setFormData({
                title: perf.title,
                description: perf.description,
                startDate: start,
                endDate: end,
                location: perf.location,
                price: perf.price.toString(),
                duration: perf.duration,
                ageRating: perf.age_rating,
                totalSeats: perf.total_seats?.toString() || '0'
            });
            setExistingPosterUrl(perf.poster_url);

            // 2. Fetch Sessions
            const { data: sess, error: sessError } = await supabase
                .from('performance_sessions')
                .select('*')
                .eq('performance_id', id)
                .order('date', { ascending: true });

            if (sessError) throw sessError;
            setSessions(sess.map(s => ({ id: s.id, date: s.date, time: s.time })));

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('정보를 불러오는데 실패했습니다.');
            navigate('/admin/dashboard/manage');
        } finally {
            setFetching(false);
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSessionChange = (index, field, value) => {
        const newSessions = [...sessions];
        newSessions[index][field] = value;
        setSessions(newSessions);
    };

    const addSession = () => {
        setSessions([...sessions, { date: '', time: '' }]);
    };

    const removeSession = (index) => {
        const newSessions = sessions.filter((_, i) => i !== index);
        setSessions(newSessions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let posterUrl = existingPosterUrl;

            // 1. Upload new image if exists
            if (posterFile) {
                const fileExt = posterFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('posters')
                    .upload(fileName, posterFile);

                if (uploadError) throw new Error(`이미지 업로드 오류: ${uploadError.message}`);

                const { data: publicData } = supabase.storage
                    .from('posters')
                    .getPublicUrl(fileName);

                posterUrl = publicData.publicUrl;
            }

            // 2. Update Performance
            const dateRange = `${formData.startDate.replace(/-/g, '.')} - ${formData.endDate.replace(/-/g, '.')}`;

            const { error: perfError } = await supabase
                .from('performances')
                .update({
                    title: formData.title,
                    description: formData.description,
                    date_range: dateRange,
                    location: formData.location,
                    price: parseInt(formData.price),
                    duration: formData.duration,
                    age_rating: formData.ageRating,
                    total_seats: parseInt(formData.totalSeats) || 0,
                    poster_url: posterUrl
                })
                .eq('id', id);

            if (perfError) throw new Error(`공연 정보 수정 오류: ${perfError.message}`);

            // 3. Update Sessions (Delete old and Insert new for simplicity, or sync)
            // Delete existing sessions first
            const { error: deleteError } = await supabase
                .from('performance_sessions')
                .delete()
                .eq('performance_id', id);

            if (deleteError) throw new Error(`기존 회차 삭제 오류: ${deleteError.message}`);

            // Insert current sessions
            if (sessions.length > 0) {
                const sessionData = sessions.map(session => ({
                    performance_id: id,
                    date: session.date,
                    time: session.time
                }));

                const { error: insertSessError } = await supabase
                    .from('performance_sessions')
                    .insert(sessionData);

                if (insertSessError) throw new Error(`회차 정보 저장 오류: ${insertSessError.message}`);
            }

            alert('공연 정보가 수정되었습니다!');
            navigate('/admin/dashboard/manage');

        } catch (error) {
            console.error('Error updating performance:', error);
            alert('수정 실패: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('정말 이 공연을 삭제하시겠습니까? 관련 모든 데이터가 삭제됩니다.')) return;

        setLoading(true);
        try {
            // 1. Delete Sessions
            const { error: sessionError } = await supabase
                .from('performance_sessions')
                .delete()
                .eq('performance_id', id);

            if (sessionError) throw new Error(`회차 정보 삭제 오류: ${sessionError.message}`);

            // 2. Delete Performance
            const { error: perfError } = await supabase
                .from('performances')
                .delete()
                .eq('id', id);

            if (perfError) throw new Error(`공연 삭제 오류: ${perfError.message}`);

            alert('공연이 삭제되었습니다.');
            navigate('/admin/dashboard/manage');

        } catch (error) {
            console.error('Error deleting performance:', error);
            alert('삭제 실패: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>로딩 중...</div>;

    return (
        <div className="create-perf-container" style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <h2 style={{ marginBottom: '2.5rem', color: 'var(--accent-color)' }}>공연 정보 수정</h2>

            <form onSubmit={handleSubmit} className="booking-form">
                <div className="form-section">
                    <h3>기본 정보</h3>
                    <div className="form-group">
                        <label>공연 제목</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>공연 내용 (줄거리)</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required rows="4" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd', color: 'var(--text-primary)' }} />
                    </div>
                </div>

                <div className="form-section">
                    <h3>포스터 이미지</h3>
                    <div className="form-group">
                        {existingPosterUrl && !posterFile && (
                            <div style={{ marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>기존 포스터:</p>
                                <img src={existingPosterUrl} alt="Poster" style={{ width: '100px', borderRadius: '8px', marginTop: '0.5rem' }} />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPosterFile(e.target.files[0])}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>* 변경할 이미지가 있을 경우에만 선택하세요 (2MB 이하)</p>
                    </div>
                </div>

                <div className="admin-form-grid">
                    <div className="form-group">
                        <label>공연 장소</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>티켓 가격 (원)</label>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>공연 길이</label>
                        <input type="text" name="duration" value={formData.duration} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>관람 등급</label>
                        <select name="ageRating" value={formData.ageRating} onChange={handleChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd', color: 'var(--text-primary)' }}>
                            <option value="all">전체 관람가</option>
                            <option value="15">15세 이상 관람가</option>
                            <option value="19">19세 이상 관람가</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>총 좌석수</label>
                        <input type="number" name="totalSeats" value={formData.totalSeats} onChange={handleChange} required />
                    </div>
                </div>

                <div className="form-section" style={{ marginTop: '2rem' }}>
                    <h3>공연 기간</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            onClick={(e) => e.target.showPicker && e.target.showPicker()}
                            required
                            style={{ flex: 1, background: '#fff', border: '1px solid #ddd', color: 'var(--text-primary)' }}
                        />
                        <span style={{ color: 'var(--text-secondary)' }}>~</span>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            onClick={(e) => e.target.showPicker && e.target.showPicker()}
                            required
                            style={{ flex: 1, background: '#fff', border: '1px solid #ddd', color: 'var(--text-primary)' }}
                        />
                    </div>
                </div>

                <div className="form-section" style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>회차 정보</h3>
                        <button type="button" onClick={addSession} style={{ background: 'var(--accent-color)', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'white' }}>+ 회차 추가</button>
                    </div>

                    {sessions.map((session, index) => (
                        <div key={index} className="session-entry">
                            <span style={{ color: 'var(--text-secondary)', minWidth: '30px', fontWeight: '600' }}>#{index + 1}</span>
                            <input
                                type="date"
                                value={session.date}
                                onChange={(e) => handleSessionChange(index, 'date', e.target.value)}
                                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                required
                                style={{ flex: 1, background: '#fff', border: '1px solid #ddd', color: 'var(--text-primary)' }}
                            />
                            <TimePicker
                                value={session.time}
                                onChange={(newTime) => handleSessionChange(index, 'time', newTime)}
                            />
                            <button
                                type="button"
                                onClick={() => removeSession(index)}
                                style={{
                                    background: '#ffefef',
                                    color: '#e74c3c',
                                    border: '1px solid #ffcfcc',
                                    padding: '0.6rem 1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                삭제
                            </button>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="submit-btn" disabled={loading} style={{ flex: 2 }}>
                        {loading ? '수정 중...' : '공연 정보 수정'}
                    </button>
                    <button type="button" onClick={handleDelete} className="submit-btn" disabled={loading} style={{ flex: 1, background: '#ff6b6b' }}>
                        삭제
                    </button>
                    <button type="button" onClick={() => navigate('/admin/dashboard/manage')} className="submit-btn" style={{ flex: 1, background: '#636e72' }}>
                        취소
                    </button>
                </div>
            </form>
            <style>{`
                .admin-form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }
                .session-entry {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    align-items: center;
                    background: var(--bg-secondary);
                    padding: 1.25rem;
                    border-radius: 12px;
                }
                @media (max-width: 768px) {
                    .admin-form-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                    .session-entry {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 0.8rem;
                        padding: 1rem;
                    }
                    .session-entry > input {
                        width: 100%;
                        box-sizing: border-box;
                    }
                }
            `}</style>
        </div>
    );
}

export default EditPerformance;
