"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";

interface StageItem {
    id: string;
    title: string;
    isLive: boolean;
    status: string;
    scheduledAt: string;
    artist: { id: string; username: string | null; genre: string | null };
    _count: { tickets: number; cheers: number; practiceLogs: number };
}

interface PracticeLogItem {
    id: string;
    content: string;
    mediaUrl: string | null;
    practiceDay: number;
    category: string;
    createdAt: string;
    artist: { id: string; username: string | null; genre: string | null };
    stage: { id: string; title: string; scheduledAt: string } | null;
}

interface ArtistItem {
    id: string;
    username: string | null;
    genre: string | null;
    bio: string | null;
    _count: { liveStreams: number; posts: number; receivedCheers: number };
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
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function HomePage() {
    const [stages, setStages] = useState<StageItem[]>([]);
    const [logs, setLogs] = useState<PracticeLogItem[]>([]);
    const [artists, setArtists] = useState<ArtistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/home")
            .then((r) => r.json())
            .then((data) => {
                setStages(data.stages ?? []);
                setLogs(data.practiceLogs ?? []);
                setArtists(data.artists ?? []);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Header />
            <main className="b1f-home">
                {/* 1. B1F 히어로 배너 */}
                <section className="b1f-hero">
                    <div className="b1f-hero-inner">
                        <div className="hero-badge">BASEMENT 1ST FLOOR · UNDERGROUND LIVEHOUSE</div>
                        <h1 className="hero-title">
                            지하 1층의 땀방울이<br />
                            <span className="hero-title-highlight">하나의 무대가 되는 곳, B1F</span>
                        </h1>
                        <p className="hero-subtitle">
                            화려한 알고리즘 대신 좁은 지하 연습실의 합주 일지와 진짜 라이브 무대로 증명합니다.<br />
                            뮤지션의 연습 과정을 함께 지켜보고, 약속된 날 1열 입장권을 발권하세요.
                        </p>
                        <div className="hero-actions">
                            <Link href="/live" className="btn btn-primary">
                                🎟️ 무대 편성표 & 입장권 발권
                            </Link>
                            <Link href="/posts" className="btn btn-secondary">
                                📹 지하 연습실 일지 보기
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="page-container">
                    {/* 2. B1F 무대 타임테이블 (Stage Timetable) */}
                    <section className="home-section">
                        <div className="section-header-row">
                            <div>
                                <span className="section-kicker">STAGE TIMETABLE</span>
                                <h2 className="home-section-title">🎸 B1F 라이브하우스 무대 편성표</h2>
                            </div>
                            <Link href="/live" className="section-more-link">전체 무대 보기 →</Link>
                        </div>

                        {loading ? (
                            <div className="loading-grid">
                                {[...Array(3)].map((_, i) => <div key={i} className="card-skeleton" />)}
                            </div>
                        ) : stages.length === 0 ? (
                            <div className="empty-box">
                                <p>아직 편성된 무대가 없습니다. 첫 번째 무대의 주인공이 되어보세요!</p>
                            </div>
                        ) : (
                            <div className="card-grid">
                                {stages.map((stage) => {
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
                                                        🎤 {stage.artist.username ?? "무명 뮤지션"}
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
                    </section>

                    {/* 3. 지하 연습실 실시간 노트 (Practice Logs) */}
                    <section className="home-section">
                        <div className="section-header-row">
                            <div>
                                <span className="section-kicker">BACKSTAGE & PRACTICE ROOM</span>
                                <h2 className="home-section-title">📹 지하 연습실 땀방울 기록</h2>
                            </div>
                            <Link href="/posts" className="section-more-link">연습실 전체 보기 →</Link>
                        </div>

                        {loading ? (
                            <div className="loading-grid">
                                {[...Array(3)].map((_, i) => <div key={i} className="card-skeleton" />)}
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="empty-box">
                                <p>아직 등록된 연습 일지가 없습니다.</p>
                            </div>
                        ) : (
                            <div className="practice-grid">
                                {logs.map((log) => (
                                    <div key={log.id} className="practice-preview-card">
                                        <div className="practice-preview-top">
                                            <span className="practice-day-badge">DAY {log.practiceDay}</span>
                                            <span className="practice-cat-badge">{log.category}</span>
                                        </div>
                                        <p className="practice-preview-content">{log.content}</p>
                                        {log.stage && (
                                            <Link href={`/live/${log.stage.id}`} className="practice-target-stage">
                                                🎯 목표 무대: {log.stage.title}
                                            </Link>
                                        )}
                                        <div className="practice-preview-footer">
                                            <Link href={`/artist/${log.artist.id}`} className="artist-chip-link">
                                                🎤 {log.artist.username}
                                            </Link>
                                            <Link href="/posts" className="practice-more-btn">일지 보기 →</Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 4. B1F 아티스트 라인업 */}
                    <section className="home-section">
                        <div className="section-header-row">
                            <div>
                                <span className="section-kicker">UNDERGROUND LINEUP</span>
                                <h2 className="home-section-title">🔥 B1F 입주 뮤지션 라인업</h2>
                            </div>
                        </div>

                        {artists.length > 0 && (
                            <div className="artist-lineup-grid">
                                {artists.map((artist) => (
                                    <Link href={`/artist/${artist.id}`} key={artist.id} className="artist-lineup-card">
                                        <div className="artist-lineup-avatar">
                                            {(artist.username ?? "?")[0].toUpperCase()}
                                        </div>
                                        <div className="artist-lineup-info">
                                            <div className="artist-lineup-name-row">
                                                <h3 className="artist-lineup-name">{artist.username}</h3>
                                                {artist.genre && <span className="genre-mini-tag">{artist.genre}</span>}
                                            </div>
                                            <p className="artist-lineup-bio">
                                                {artist.bio || "지하 연습실에서 다음 무대를 준비 중입니다."}
                                            </p>
                                            <div className="artist-lineup-stats">
                                                <span>📹 연습 {artist._count.posts}회</span>
                                                <span>🎸 무대 {artist._count.liveStreams}회</span>
                                                <span>🙌 응원 {artist._count.receivedCheers}건</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
