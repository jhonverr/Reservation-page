import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import TimePicker from '../../components/TimePicker';
import '../../App.css';

function CreatePerformance() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        price: '',
        duration: '',
        ageRating: 'all', // all, 15, 19
        totalSeats: ''
    });

    const [posterFile, setPosterFile] = useState(null);
    const [sessions, setSessions] = useState([{ date: '', time: '' }]);

    // Handle Basic Inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle Session Changes
    const handleSessionChange = (index, field, value) => {
        const newSessions = [...sessions];
        newSessions[index][field] = value;
        setSessions(newSessions);
    };

    const addSession = () => {
        setSessions([...sessions, { date: '', time: '' }]);
    };

    const removeSession = (index) => {
        if (sessions.length > 1) {
            const newSessions = sessions.filter((_, i) => i !== index);
            setSessions(newSessions);
        }
    };

    // Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let posterUrl = null;

            // 1. Upload Image if exists
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

            // 2. Insert Performance
            const dateRange = `${formData.startDate.replace(/-/g, '.')} - ${formData.endDate.replace(/-/g, '.')}`;

            const { data: perfData, error: perfError } = await supabase
                .from('performances')
                .insert([{
                    title: formData.title,
                    description: formData.description,
                    date_range: dateRange,
                    location: formData.location,
                    price: parseInt(formData.price),
                    duration: formData.duration,
                    age_rating: formData.ageRating,
                    total_seats: parseInt(formData.totalSeats) || 0,
                    poster_url: posterUrl
                }])
                .select()
                .single();

            if (perfError) throw new Error(`공연 정보 저장 오류: ${perfError.message}`);

            // 3. Insert Sessions
            if (sessions.length > 0) {
                const sessionData = sessions.map(session => ({
                    performance_id: perfData.id,
                    date: session.date,
                    time: session.time
                }));

                const { error: sessionError } = await supabase
                    .from('performance_sessions')
                    .insert(sessionData);

                if (sessionError) throw new Error(`회차 정보 저장 오류: ${sessionError.message}`);
            }

            alert('공연이 성공적으로 등록되었습니다!');
            navigate('/admin/dashboard/manage');

        } catch (error) {
            console.error('Error creating performance:', error);
            alert('등록 실패: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-perf-container" style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <h2 style={{ marginBottom: '2.5rem', color: 'var(--accent-color)' }}>신규 공연 등록</h2>

            <form onSubmit={handleSubmit} className="booking-form">
                {/* 1. 기본 정보 */}
                <div className="form-section">
                    <h3>기본 정보</h3>
                    <div className="form-group">
                        <label>공연 제목</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="예: 뮤지컬 그것은 사랑" />
                    </div>
                    <div className="form-group">
                        <label>공연 내용 (줄거리)</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required rows="4" placeholder="공연에 대한 설명을 입력하세요" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd', color: 'var(--text-primary)' }} />
                    </div>
                </div>

                {/* 2. 포스터 이미지 */}
                <div className="form-section">
                    <h3>포스터 이미지</h3>
                    <div className="form-group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPosterFile(e.target.files[0])}
                            required
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>* 2MB 이하의 이미지 파일</p>
                    </div>
                </div>

                {/* 3. 상세 정보 */}
                <div className="admin-form-grid">
                    <div className="form-group">
                        <label>공연 장소</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="예: 예술의전당" />
                    </div>
                    <div className="form-group">
                        <label>티켓 가격 (원)</label>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} required placeholder="예: 10000" />
                    </div>
                    <div className="form-group">
                        <label>공연 길이 (예: 120분)</label>
                        <input type="text" name="duration" value={formData.duration} onChange={handleChange} required placeholder="예: 120분 (인터미션 15분)" />
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
                        <input type="number" name="totalSeats" value={formData.totalSeats} onChange={handleChange} required placeholder="예: 100" />
                    </div>
                </div>

                {/* 4. 일정 정보 */}
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

                {/* 5. 회차 정보 */}
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
                            {sessions.length > 1 && (
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
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '2rem' }}>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? '등록 중...' : '공연 등록하기'}
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

export default CreatePerformance;
