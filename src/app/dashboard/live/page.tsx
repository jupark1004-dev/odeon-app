"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface LiveStream {
    id: string;
    title: string;
    embedUrl: string;
    isLive: boolean;
    status: string;
    scheduledAt: string;
    createdAt: string;
    artist: { id: string };
    _count: { tickets: number; cheers: number; practiceLogs: number };
}

export default function DashboardLivePage() {
    const { data: session } = useSession();
    const [lives, setLives] = useState<LiveStream[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    const userId = (session?.user as { id?: string })?.id;

    const fetchLives = () => {
        fetch("/api/lives")
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setLives(userId ? data.filter((d: LiveStream) => d.artist?.id === userId) : data);
                } else {
                    setLives([]);
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchLives();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const handleChangeStatus = async (id: string, status: string) => {
        setToggling(id);
        await fetch(`/api/lives/${id}/toggle`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        await fetchLives();
        setToggling(null);
    };

    const handleDeleteStage = async (id: string) => {
        if (!confirm("이 무대를 삭제하시겠습니까? 발권된 티켓 기록도 함께 삭제됩니다.")) return;
        setToggling(id);
        const res = await fetch(`/api/lives/${id}`, { method: "DELETE" });
        if (res.ok) {
            setLives((prev) => prev.filter((item) => item.id !== id));
        }
        setToggling(null);
    };

    if (loading) return <div className="loading-full">불러오는 중...</div>;

    return (
        <div className="dashboard-content">
            <div className="dashboard-page-header">
                <h1 className="dashboard-title">🎸 라이브하우스 무대 편성 · 관리</h1>
                <Link href="/dashboard/live/new" className="btn btn-primary">+ 새 무대 편성</Link>
            </div>

            {lives.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">🎸</span>
                    <p>편성된 무대가 없습니다</p>
                    <Link href="/dashboard/live/new" className="auth-link">첫 번째 무대를 편성해보세요 →</Link>
                </div>
            ) : (
                <div className="manage-live-list">
                    {lives.map((live) => (
                        <div key={live.id} className="manage-live-item">
                            <div className="manage-live-info">
                                <div className="manage-live-title-row">
                                    <span className={`live-status-dot ${live.isLive ? "on" : "off"}`} />
                                    <span className="manage-live-title">{live.title}</span>
                                    <span className={`stage-status-pill ${live.isLive ? "live" : live.status === "ENDED" ? "ended" : "upcoming"}`}>
                                        {live.isLive ? "LIVE" : live.status}
                                    </span>
                                </div>
                                <p className="manage-live-url">
                                    📅 {new Date(live.scheduledAt).toLocaleString("ko-KR")} · {live.embedUrl}
                                </p>
                                <p className="manage-live-meta">
                                    🎟️ 입장 발권 {live._count.tickets}명 · 📹 연습일지 {live._count.practiceLogs}편 · 🙌 슬로건 {live._count.cheers}개
                                </p>
                            </div>
                            <div className="manage-live-actions">
                                <Link href={`/live/${live.id}`} className="btn-sm btn-outline">
                                    무대 보기
                                </Link>
                                {live.status !== "LIVE" && (
                                    <button
                                        className="btn-sm btn-live"
                                        onClick={() => handleChangeStatus(live.id, "LIVE")}
                                        disabled={toggling === live.id}
                                    >
                                        🔴 무대 ON
                                    </button>
                                )}
                                {live.status === "LIVE" && (
                                    <button
                                        className="btn-sm btn-outline"
                                        onClick={() => handleChangeStatus(live.id, "ENDED")}
                                        disabled={toggling === live.id}
                                    >
                                        공연 종료
                                    </button>
                                )}
                                <button
                                    className="btn-sm btn-danger"
                                    onClick={() => handleDeleteStage(live.id)}
                                    disabled={toggling === live.id}
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
