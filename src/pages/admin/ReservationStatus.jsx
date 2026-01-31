import { useEffect, useState } from 'react';

function ReservationStatus() {
    const [reservations, setReservations] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3000/api/reservations')
            .then(res => res.json())
            .then(data => setReservations(data))
            .catch(err => console.error('Error fetching reservations:', err));
    }, []);

    return (
        <div>
            <h2 style={{ marginBottom: '1.5rem' }}>예매자 현황</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>공연명</th>
                            <th>예매자</th>
                            <th>이메일</th>
                            <th>관람일시</th>
                            <th>티켓</th>
                            <th>결제금액</th>
                            <th>예매일시</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map(res => (
                            <tr key={res.id}>
                                <td>{res.id}</td>
                                <td>{res.performance_title}</td>
                                <td>{res.name}</td>
                                <td>{res.email}</td>
                                <td>{res.date}</td>
                                <td>{res.tickets}매</td>
                                <td>{res.total_price.toLocaleString()}원</td>
                                <td>{new Date(res.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                        {reservations.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', color: '#888' }}>예매 내역이 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ReservationStatus;
