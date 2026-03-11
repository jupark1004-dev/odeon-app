"use client";

import { useEffect, useState } from "react";

interface EarningsData {
    transactions: {
        id: string;
        amount: number;
        message: string | null;
        createdAt: string;
        sender: { username: string | null };
        stream: { title: string } | null;
    }[];
    totalAmount: number;
    totalCount: number;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function EarningsPage() {
    const [data, setData] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dashboard/earnings")
            .then((r) => r.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-full">불러오는 중...</div>;
    if (!data) return <div className="empty-state"><p>데이터를 불러올 수 없습니다.</p></div>;

    return (
        <div className="dashboard-content">
            <h1 className="dashboard-title">🍫 초코 수입 내역</h1>

            {/* 요약 카드 */}
            <div className="earnings-summary">
                <div className="stat-card highlight">
                    <p className="stat-label">총 누적 수입</p>
                    <p className="stat-value">🍫 {data.totalAmount.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">총 후원 횟수</p>
                    <p className="stat-value">{data.totalCount.toLocaleString()}</p>
                    <p className="stat-sub">번의 후원</p>
                </div>
            </div>

            {/* 거래 내역 테이블 */}
            <div className="earnings-table-wrapper">
                <h2 className="section-title">거래 내역</h2>
                {data.transactions.length === 0 ? (
                    <p className="empty-text">아직 수입 내역이 없습니다</p>
                ) : (
                    <table className="earnings-table">
                        <thead>
                            <tr>
                                <th>날짜</th>
                                <th>보낸 사람</th>
                                <th>방송</th>
                                <th>메시지</th>
                                <th>금액</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.transactions.map((t) => (
                                <tr key={t.id}>
                                    <td className="td-date">{formatDate(t.createdAt)}</td>
                                    <td className="td-sender">{t.sender.username ?? "익명"}</td>
                                    <td className="td-stream">{t.stream?.title ?? "—"}</td>
                                    <td className="td-message">{t.message ?? "—"}</td>
                                    <td className="td-amount">+{t.amount} 🍫</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
