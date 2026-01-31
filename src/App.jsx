import { useState } from 'react';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '2026-02-14',
    tickets: 1
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`예약이 완료되었습니다!\n이름: ${formData.name}\n날짜: ${formData.date}\n티켓: ${formData.tickets}매`);
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="logo">더열정 뮤지컬 예매 페이지</h1>
        <nav>
          <button className="nav-btn">공연 정보</button>
          <button className="nav-btn active">예매하기</button>
        </nav>
      </header>

      <main className="main-content">
        <section className="hero-section">
          <div className="perf-tag">NOW SHOWING</div>
          <h2 className="perf-title">별들이 쏟아지는 밤</h2>
          <p className="perf-desc">
            당신의 잊혀진 꿈을 찾아 떠나는 환상적인 여정. <br />
            압도적인 비주얼과 감동적인 선율이 함께합니다.
          </p>
          <div className="perf-info">
            <span>📅 2026.02.01 - 2026.03.15</span>
            <span>📍 루미나 대극장</span>
            <span>⏳ 120분 (인터미션 15분)</span>
          </div>
        </section>

        <section className="booking-section">
          <div className="booking-card">
            <h3>티켓 예매</h3>
            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-group">
                <label>관람일 선택</label>
                <select name="date" value={formData.date} onChange={handleChange}>
                  <option value="2026-02-14">2월 14일 (토) 19:00</option>
                  <option value="2026-02-15">2월 15일 (일) 14:00</option>
                  <option value="2026-02-21">2월 21일 (토) 19:00</option>
                  <option value="2026-02-22">2월 22일 (일) 14:00</option>
                </select>
              </div>

              <div className="form-group">
                <label>예매자 성함</label>
                <input
                  type="text"
                  name="name"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>이메일</label>
                <input
                  type="email"
                  name="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>매수</label>
                <div className="ticket-control">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, tickets: Math.max(1, p.tickets - 1) }))}>-</button>
                  <span>{formData.tickets}매</span>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, tickets: Math.min(10, p.tickets + 1) }))}>+</button>
                </div>
              </div>

              <div className="total-price">
                <span>총 결제금액</span>
                <span className="price">{(formData.tickets * 120000).toLocaleString()}원</span>
              </div>

              <button type="submit" className="submit-btn">예매하기</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
