"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Summary {
    chocoBalance: number;
    totalEarned: number;
    liveCount: number;
    postCount: number;
    recentDonations: {
        id: string;
        amount: number;
        message: string | null;
        createdAt: string;
        sender: { username: string | null };
        stream: { title: string } | null;
    }[];
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "방금 전";
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
}

export default function DashboardPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dashboard/summary")
            .then((r) => r.json())
            .then(setSummary)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="loading-full">데이터를 불러오는 중...</div>;
    }

    if (!summary) {
        return <div className="empty-state"><p>데이터를 불러올 수 없습니다.</p></div>;
    }

    return (
        <div className="dashboard-content">
            <h1 className="dashboard-title">📊 대시보드 개요</h1>

            {/* 통계 카드 */}
            <div className="stats-grid">
                <div className="stat-card highlight">
                    <p className="stat-label">보유 초코</p>
                    <p className="stat-value">🍫 {summary.chocoBalance.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">누적 수입</p>
                    <p className="stat-value">+{summary.totalEarned.toLocaleString()}</p>
                    <p className="stat-sub">총 후원 초코</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">라이브 방송</p>
                    <p className="stat-value">{summary.liveCount}</p>
                    <p className="stat-sub">등록된 방송</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">포스트</p>
                    <p className="stat-value">{summary.postCount}</p>
                    <p className="stat-sub">작성한 글</p>
                </div>
            </div>

            {/* 빠른 링크 */}
            <div className="quick-actions">
                <Link href="/dashboard/live/new" className="btn btn-primary">
                    📡 새 라이브 등록
                </Link>
                <Link href="/posts/new" className="btn btn-secondary">
                    📝 포스트 작성
                </Link>
                <Link href="/dashboard/earnings" className="btn btn-secondary">
                    🍫 수입 상세 보기
                </Link>
            </div>

            {/* 최근 후원 */}
            <div className="recent-section">
                <h2 className="section-title">최근 후원</h2>
                {summary.recentDonations.length === 0 ? (
                    <p className="empty-text">아직 후원이 없습니다</p>
                ) : (
                    <div className="recent-donations">
                        {summary.recentDonations.map((d) => (
                            <div key={d.id} className="recent-donation-item">
                                <div className="donation-left">
                                    <span className="donor-name">{d.sender.username ?? "익명"}</span>
                                    {d.stream && (
                                        <span className="donation-stream">📡 {d.stream.title}</span>
                                    )}
                                    {d.message && <span className="donation-msg">💬 {d.message}</span>}
                                </div>
                                <div className="donation-right">
                                    <span className="donation-choco">🍫 +{d.amount}</span>
                                    <span className="donation-time">{timeAgo(d.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
