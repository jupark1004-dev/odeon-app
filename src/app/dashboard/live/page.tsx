"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LiveStream {
    id: string;
    title: string;
    embedUrl: string;
    isLive: boolean;
    createdAt: string;
    _count: { transactions: number };
}

export default function DashboardLivePage() {
    const [lives, setLives] = useState<LiveStream[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    const fetchLives = () => {
        fetch("/api/lives")
            .then((r) => r.json())
            .then((data) => setLives(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchLives(); }, []);

    const handleToggle = async (id: string) => {
        setToggling(id);
        await fetch(`/api/lives/${id}/toggle`, { method: "PATCH" });
        await fetchLives();
        setToggling(null);
    };

    if (loading) return <div className="loading-full">불러오는 중...</div>;

    return (
        <div className="dashboard-content">
            <div className="dashboard-page-header">
                <h1 className="dashboard-title">📡 라이브 관리</h1>
                <Link href="/dashboard/live/new" className="btn btn-primary">+ 새 방송 등록</Link>
            </div>

            {lives.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">📡</span>
                    <p>등록된 방송이 없습니다</p>
                    <Link href="/dashboard/live/new" className="auth-link">첫 번째 방송을 등록해보세요 →</Link>
                </div>
            ) : (
                <div className="manage-live-list">
                    {lives.map((live) => (
                        <div key={live.id} className="manage-live-item">
                            <div className="manage-live-info">
                                <div className="manage-live-title-row">
                                    <span className={`live-status-dot ${live.isLive ? "on" : "off"}`} />
                                    <span className="manage-live-title">{live.title}</span>
                                </div>
                                <p className="manage-live-url">{live.embedUrl}</p>
                                <p className="manage-live-meta">🍫 후원 {live._count.transactions}건</p>
                            </div>
                            <div className="manage-live-actions">
                                <Link href={`/live/${live.id}`} className="btn-sm btn-outline">
                                    보기
                                </Link>
                                <button
                                    className={`btn-sm ${live.isLive ? "btn-danger" : "btn-live"}`}
                                    onClick={() => handleToggle(live.id)}
                                    disabled={toggling === live.id}
                                >
                                    {toggling === live.id
                                        ? "처리 중..."
                                        : live.isLive ? "종료" : "LIVE 시작"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
