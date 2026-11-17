"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";

interface TicketItem {
    id: string;
    entryNumber: number;
    createdAt: string;
    user: { id: string; username: string | null };
}

interface CheerItem {
    id: string;
    badge: string;
    message: string;
    createdAt: string;
    sender: { id: string; username: string | null };
}

interface PracticeLogItem {
    id: string;
    content: string;
    mediaUrl: string | null;
    audioUrl: string | null;
    audioTitle: string | null;
    practiceDay: number;
    category: string;
    createdAt: string;
}

interface LiveDetail {
    id: string;
    title: string;
    embedUrl: string;
    coverImage: string | null;
    audioUrl: string | null;
    isLive: boolean;
    status: string;
    scheduledAt: string;
    setlist: string | null;
    description: string | null;
    artist: { id: string; username: string | null; genre: string | null; bio: string | null; image: string | null };
    tickets: TicketItem[];
    cheers: CheerItem[];
    practiceLogs: PracticeLogItem[];
}

const SLOGAN_BADGES = [
    "🔥 무대찢음",
    "🕯️ 1열대기",
    "💪 땀방울증인",
    "🎸 미친사운드",
    "✨ 입덕완료",
];

function getYoutubeEmbedUrl(url: string): string | null {
    if (!url) return null;
    const regexps = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/shorts\/([^?]+)/,
        /youtube\.com\/embed\/([^?]+)/,
        /youtube\.com\/live\/([^?]+)/,
    ];
    for (const re of regexps) {
        const match = url.match(re);
        if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1`;
    }
    return null;
}

export default function LiveDetailPage() {
    const params = useParams();
    const { data: session } = useSession();
    const [live, setLive] = useState<LiveDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // 입장권 발권 상태
    const [issuingTicket, setIssuingTicket] = useState(false);
    const [ticketNotice, setTicketNotice] = useState("");

    // 응원 슬로건 상태
    const [selectedBadge, setSelectedBadge] = useState(SLOGAN_BADGES[0]);
    const [cheerMsg, setCheerMsg] = useState("");
    const [sendingCheer, setSendingCheer] = useState(false);
    const [cheerNotice, setCheerNotice] = useState("");

    const loadStage = useCallback(() => {
        fetch(`/api/lives/${params.id}`)
            .then((r) => r.json())
            .then((data) => setLive(data))
            .finally(() => setLoading(false));
    }, [params.id]);

    useEffect(() => {
        loadStage();
    }, [loadStage]);

    const userId = (session?.user as { id?: string })?.id;
    const myTicket = live?.tickets?.find((t) => t.user.id === userId);

    const handleIssueTicket = async () => {
        if (!live) return;
        setIssuingTicket(true);
        setTicketNotice("");
        try {
            const res = await fetch(`/api/lives/${live.id}/ticket`, {
                method: "POST",
            });
            const data = await res.json();
            if (res.ok) {
                setTicketNotice(data.message);
                loadStage();
            } else {
                setTicketNotice(`❌ ${data.error}`);
            }
        } finally {
            setIssuingTicket(false);
        }
    };

    const handleSendCheer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!live || !cheerMsg.trim()) return;
        setSendingCheer(true);
        setCheerNotice("");
        try {
            const res = await fetch("/api/cheers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiverId: live.artist.id,
                    streamId: live.id,
                    badge: selectedBadge,
                    message: cheerMsg,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setCheerNotice(data.message);
                setCheerMsg("");
                loadStage();
            } else {
                setCheerNotice(`❌ ${data.error}`);
            }
        } finally {
            setSendingCheer(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <main className="page-container">
                    <div className="loading-full">B1F 무대 조명 세팅 중...</div>
                </main>
            </>
        );
    }

    if (!live || ("error" in (live as object))) {
        return (
            <>
                <Header />
                <main className="page-container">
                    <div className="empty-state">
                        <span className="empty-icon">🎸</span>
                        <p>무대를 찾을 수 없습니다</p>
                    </div>
                </main>
            </>
        );
    }

    const ytEmbedUrl = getYoutubeEmbedUrl(live.embedUrl);
    const visualCover = live.coverImage || live.artist.image;
    const setlistLines = live.setlist
        ? live.setlist.split("\n").map((s) => s.trim()).filter(Boolean)
        : [];

    return (
        <>
            <Header />
            <main className="page-container">
                <div className="live-detail-layout">
                    {/* 좌측: B1F 커스텀 무대 모니터 + 셋리스트 + 연습일지 서사 타임라인 */}
                    <div className="player-section">
                        <div className="stage-monitor-frame">
                            <div className="stage-monitor-topbar">
                                <span className="monitor-brand">B1F STAGE MONITOR</span>
                                <span className={`stage-status-pill ${live.isLive ? "live" : live.status === "ENDED" ? "ended" : "upcoming"}`}>
                                    {live.isLive ? "🔴 LIVE ON AIR" : live.status === "ENDED" ? "📼 ARCHIVED STAGE" : "🎟️ UPCOMING STAGE"}
                                </span>
                            </div>

                            {/* 유튜브 영상이 있으면 영상 재생, 없으면 비주얼 & 오디오 스테이지 렌더링 */}
                            {ytEmbedUrl ? (
                                <div className="player-wrapper">
                                    <iframe
                                        src={ytEmbedUrl}
                                        title={live.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="youtube-iframe"
                                    />
                                </div>
                            ) : (
                                <div className="visual-audio-stage">
                                    {visualCover ? (
                                        <img src={visualCover} alt={live.title} className="visual-stage-img" />
                                    ) : (
                                        <div className="visual-stage-placeholder">
                                            <span className="visual-stage-icon">🎧</span>
                                            <p>{live.artist.username} — B1F AUDIO SHOWCASE</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 무대 전용 음원이 등록된 경우 모니터 하단에 마스터 오디오 데크 표시 */}
                            {live.audioUrl && (
                                <div className="stage-audio-deck">
                                    <div className="demo-audio-top">
                                        <span className="demo-tape-badge">🎧 B1F STAGE MASTER AUDIO</span>
                                        <span className="demo-audio-title">{live.title}</span>
                                    </div>
                                    <audio controls src={live.audioUrl} className="b1f-audio-player" />
                                </div>
                            )}
                        </div>

                        <div className="live-detail-info">
                            <div className="live-detail-header">
                                <h1 className="live-detail-title">{live.title}</h1>
                            </div>
                            <div className="stage-meta-bar">
                                <Link href={`/artist/${live.artist.id}`} className="artist-chip-link">
                                    🎤 {live.artist.username ?? "무명 뮤지션"}
                                </Link>
                                {live.artist.genre && (
                                    <span className="genre-mini-tag">{live.artist.genre}</span>
                                )}
                                <span className="stage-date-info">
                                    📅 공연 일시: {new Date(live.scheduledAt).toLocaleString("ko-KR")}
                                </span>
                            </div>

                            {live.description && (
                                <p className="stage-description-box">{live.description}</p>
                            )}

                            {/* 오늘의 셋리스트 */}
                            {setlistLines.length > 0 && (
                                <div className="setlist-card">
                                    <h3 className="setlist-title">🎼 오늘의 무대 셋리스트 (SETLIST)</h3>
                                    <ol className="setlist-items">
                                        {setlistLines.map((song, idx) => (
                                            <li key={idx} className="setlist-item">
                                                <span className="setlist-num">Track {String(idx + 1).padStart(2, "0")}</span>
                                                <span className="setlist-song">{song}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* 이 무대를 만든 땀방울 (연습일지 · 습작음원 타임라인) */}
                            <div className="stage-narrative-section">
                                <div className="section-header-row">
                                    <div>
                                        <span className="section-kicker">BEHIND THE STAGE</span>
                                        <h2 className="panel-title" style={{ marginBottom: 0 }}>
                                            📹 이 무대를 위해 쌓아 올린 연습실 · 습작 일지 ({live.practiceLogs.length}편)
                                        </h2>
                                    </div>
                                    <Link href="/posts" className="section-more-link">연습실 전체 보기 →</Link>
                                </div>

                                {live.practiceLogs.length === 0 ? (
                                    <p className="empty-donations">아직 이 무대에 연결된 연습일지가 없습니다.</p>
                                ) : (
                                    <div className="narrative-timeline">
                                        {live.practiceLogs.map((log) => (
                                            <div key={log.id} className="narrative-item">
                                                <div className="narrative-badge-col">
                                                    <span className="practice-day-badge">Day {log.practiceDay}</span>
                                                    <span className="practice-cat-badge">{log.category}</span>
                                                </div>
                                                <div className="narrative-body-col">
                                                    <p className="narrative-text">{log.content}</p>
                                                    {log.audioUrl && (
                                                        <div className="demo-audio-card" style={{ marginBottom: "8px" }}>
                                                            <div className="demo-audio-top">
                                                                <span className="demo-tape-badge">🎧 DEMO</span>
                                                                <span className="demo-audio-title">{log.audioTitle || "습작 데모 음원"}</span>
                                                            </div>
                                                            <audio controls src={log.audioUrl} className="b1f-audio-player" />
                                                        </div>
                                                    )}
                                                    {log.mediaUrl && !getYoutubeEmbedUrl(log.mediaUrl) && (
                                                        <img src={log.mediaUrl} alt="연습 사진" className="post-media" style={{ maxHeight: "220px", marginBottom: "8px" }} />
                                                    )}
                                                    <span className="narrative-date">
                                                        {new Date(log.createdAt).toLocaleDateString("ko-KR")} 기록
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 우측 사이드바: 1) B1F 정리번호 티켓 발권기 + 2) 응원 슬로건 전광판 */}
                    <div className="side-section">
                        {/* 1. 입장 정리번호 티켓 발권 패널 */}
                        <div className="ticket-panel">
                            <div className="ticket-panel-header">
                                <span className="ticket-kicker">B1F ENTRY PASS</span>
                                <h2 className="panel-title" style={{ marginBottom: "4px" }}>🎟️ 라이브하우스 입장권</h2>
                                <p className="ticket-sub">
                                    현재 <strong>{live.tickets.length}명</strong>의 관객이 입장 번호표를 발권했습니다
                                </p>
                            </div>

                            {myTicket ? (
                                <div className="issued-ticket-stub">
                                    <div className="ticket-stub-left">
                                        <span className="stub-venue">B1F UNDERGROUND</span>
                                        <span className="stub-title">{live.title}</span>
                                        <span className="stub-holder">관객: {session?.user?.name}</span>
                                    </div>
                                    <div className="ticket-stub-right">
                                        <span className="stub-label">입장 정리번호</span>
                                        <span className="stub-number">No.{String(myTicket.entryNumber).padStart(3, "0")}</span>
                                    </div>
                                </div>
                            ) : session ? (
                                <button
                                    className="btn-primary choco-submit"
                                    onClick={handleIssueTicket}
                                    disabled={issuingTicket}
                                >
                                    {issuingTicket ? "발권 중..." : "🎟️ 무료 입장권 발권하기 (정리번호 부여)"}
                                </button>
                            ) : (
                                <Link href="/login" className="btn btn-primary choco-submit" style={{ textAlign: "center" }}>
                                    🎟️ 로그인하고 입장 정리번호 받기
                                </Link>
                            )}

                            {ticketNotice && (
                                <p className={`donate-result ${ticketNotice.startsWith("❌") ? "error" : "success"}`}>
                                    {ticketNotice}
                                </p>
                            )}

                            {live.tickets.length > 0 && (
                                <div className="ticket-holder-list">
                                    <span className="holder-list-label">입장 대기 관객 라인업</span>
                                    <div className="holder-chips">
                                        {live.tickets.slice(0, 12).map((t) => (
                                            <span key={t.id} className="holder-chip">
                                                <strong>#{String(t.entryNumber).padStart(3, "0")}</strong> {t.user.username ?? "관객"}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. 응원 슬로건 작성 & 전광판 */}
                        <div className="choco-panel">
                            <h2 className="panel-title">🙌 무대 응원 슬로건 걸기</h2>
                            {session ? (
                                <form onSubmit={handleSendCheer} className="cheer-form">
                                    <div className="slogan-badges">
                                        {SLOGAN_BADGES.map((b) => (
                                            <button
                                                type="button"
                                                key={b}
                                                className={`slogan-badge-btn ${selectedBadge === b ? "active" : ""}`}
                                                onClick={() => setSelectedBadge(b)}
                                            >
                                                {b}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="무대 위 아티스트에게 응원 슬로건을 남겨주세요!"
                                        value={cheerMsg}
                                        onChange={(e) => setCheerMsg(e.target.value)}
                                        className="form-input"
                                        maxLength={100}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="btn-primary choco-submit"
                                        disabled={sendingCheer}
                                    >
                                        {sendingCheer ? "게시 중..." : "🙌 슬로건 전광판에 걸기"}
                                    </button>
                                    {cheerNotice && (
                                        <p className={`donate-result ${cheerNotice.startsWith("❌") ? "error" : "success"}`}>
                                            {cheerNotice}
                                        </p>
                                    )}
                                </form>
                            ) : (
                                <p className="empty-donations">
                                    <Link href="/login" className="auth-link">로그인</Link> 후 아티스트에게 응원 슬로건을 남길 수 있습니다.
                                </p>
                            )}
                        </div>

                        {/* 최근 응원 슬로건 목록 */}
                        <div className="donation-list-panel">
                            <h2 className="panel-title">💬 관객 응원 슬로건 ({live.cheers.length})</h2>
                            {live.cheers.length === 0 ? (
                                <p className="empty-donations">첫 번째 응원 슬로건을 걸어주세요!</p>
                            ) : (
                                <ul className="donation-list">
                                    {live.cheers.map((c) => (
                                        <li key={c.id} className="donation-item">
                                            <div className="donation-header">
                                                <span className="donor-name">{c.sender.username ?? "익명 관객"}</span>
                                                <span className="cheer-badge-tag">{c.badge}</span>
                                            </div>
                                            <p className="donation-message">{c.message}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
