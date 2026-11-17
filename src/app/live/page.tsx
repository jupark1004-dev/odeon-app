"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";

interface LiveStream {
    id: string;
    title: string;
    embedUrl: string;
    isLive: boolean;
    status: string;
    scheduledAt: string;
    createdAt: string;
    artist: { id: string; username: string | null; genre: string | null; image: string | null };
    _count: { tickets: number; cheers: number; practiceLogs: number };
}

function getDdayLabel(dateStr: string, status: string, isLive: boolean) {
    if (isLive || status === "LIVE") return "🔴 LIVE ON STAGE";
    if (status === "ENDED") return "📼 ARCHIVE";
    const target = new Date(dateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "🔥 TODAY STAGE";
    return `D-${diffDays}`;
}

function formatSchedule(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function LiveListPage() {
    const [lives, setLives] = useState<LiveStream[]>([]);
    const [filter, setFilter] = useState<"ALL" | "LIVE" | "UPCOMING" | "ENDED">("ALL");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/lives")
            .then((r) => r.json())
            .then((data) => setLives(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    }, []);

    const filtered = lives.filter((l) => {
        if (filter === "ALL") return true;
        if (filter === "LIVE") return l.isLive || l.status === "LIVE";
        if (filter === "UPCOMING") return !l.isLive && l.status === "UPCOMING";
        if (filter === "ENDED") return !l.isLive && l.status === "ENDED";
        return true;
    });

    return (
        <>
            <Header />
            <main className="page-container">
                <div className="page-header">
                    <span className="section-kicker">B1F LIVEHOUSE TIMETABLE</span>
                    <h1 className="page-title">
                        🎸 <span className="highlight">라이브하우스</span> 무대 편성표
                    </h1>
                    <p className="page-subtitle">
                        지하 연습실에서 갈고닦은 실력을 무대 위에서 증명하는 시간. 원하는 무대의 입장 정리번호를 무료로 발권하세요.
                    </p>

                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filter === "ALL" ? "active" : ""}`}
                            onClick={() => setFilter("ALL")}
                        >
                            전체 무대 ({lives.length})
                        </button>
                        <button
                            className={`filter-tab ${filter === "LIVE" ? "active" : ""}`}
                            onClick={() => setFilter("LIVE")}
                        >
                            🔴 지금 공연 중
                        </button>
                        <button
                            className={`filter-tab ${filter === "UPCOMING" ? "active" : ""}`}
                            onClick={() => setFilter("UPCOMING")}
                        >
                            🎟️ 예정된 무대 (입장권 발권)
                        </button>
                        <button
                            className={`filter-tab ${filter === "ENDED" ? "active" : ""}`}
                            onClick={() => setFilter("ENDED")}
                        >
                            📼 지난 무대 아카이브
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-grid">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="card-skeleton" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🎸</span>
                        <p>해당 조건의 무대가 없습니다</p>
                    </div>
                ) : (
                    <div className="card-grid">
                        {filtered.map((stage) => {
                            const dday = getDdayLabel(stage.scheduledAt, stage.status, stage.isLive);
                            return (
                                <div key={stage.id} className="stage-card">
                                    <Link href={`/live/${stage.id}`} className="stage-card-top">
                                        <span className={`stage-status-pill ${stage.isLive ? "live" : stage.status === "ENDED" ? "ended" : "upcoming"}`}>
                                            {dday}
                                        </span>
                                        <span className="stage-schedule-text">
                                            {formatSchedule(stage.scheduledAt)}
                                        </span>
                                        <div className="stage-poster-icon">
                                            {stage.isLive ? "🔥" : stage.status === "ENDED" ? "📼" : "🎤"}
                                        </div>
                                        <div className="stage-practice-pill">
                                            📹 연습일지 {stage._count.practiceLogs}편 누적
                                        </div>
                                    </Link>
                                    <div className="stage-card-body">
                                        <Link href={`/live/${stage.id}`} className="stage-card-title">
                                            {stage.title}
                                        </Link>
                                        <div className="stage-card-artist-row">
                                            <Link href={`/artist/${stage.artist.id}`} className="artist-chip-link">
                                                🎤 {stage.artist.username ?? "알 수 없음"}
                                            </Link>
                                            {stage.artist.genre && (
                                                <span className="genre-mini-tag">{stage.artist.genre}</span>
                                            )}
                                        </div>
                                        <div className="stage-card-footer">
                                            <span>🎟️ 입장 발권 <strong>{stage._count.tickets}명</strong></span>
                                            <span>🙌 슬로건 <strong>{stage._count.cheers}개</strong></span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </>
    );
}
