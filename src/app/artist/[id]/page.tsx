"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { compressImageFile } from "@/lib/media";

interface ArtistProfile {
    id: string;
    username: string | null;
    genre: string | null;
    bio: string | null;
    image: string | null;
    createdAt: string;
    totalTickets: number;
    liveStreams: {
        id: string;
        title: string;
        coverImage: string | null;
        audioUrl: string | null;
        isLive: boolean;
        status: string;
        scheduledAt: string;
        createdAt: string;
        _count: { tickets: number; cheers: number };
    }[];
    posts: {
        id: string;
        content: string;
        mediaUrl: string | null;
        audioUrl: string | null;
        audioTitle: string | null;
        practiceDay: number;
        category: string;
        createdAt: string;
        stage: { id: string; title: string } | null;
    }[];
    receivedCheers: {
        id: string;
        badge: string;
        message: string;
        createdAt: string;
        sender: { username: string | null };
    }[];
    _count: { liveStreams: number; posts: number; receivedCheers: number };
}

const GENRE_OPTIONS = [
    "AI 버추얼 싱어 / 프로듀서",
    "지하아이돌 / 퍼포먼스팀",
    "인디 밴드 / 록",
    "싱어송라이터",
    "보컬리스트",
    "피아노 / 기타 / 세션",
    "힙합 / R&B / 일렉트로닉",
];

const SLOGAN_BADGES = [
    "🔥 최애뮤지션",
    "🕯️ 1열대기",
    "💪 땀방울증인",
    "🎸 실력파인정",
    "✨ 입덕완료",
];

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "방금 전";
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
}

export default function ArtistProfilePage() {
    const params = useParams();
    const { data: session } = useSession();
    const [artist, setArtist] = useState<ArtistProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // 본인 프로필 바로 수정 상태
    const [editingProfile, setEditingProfile] = useState(false);
    const [editUsername, setEditUsername] = useState("");
    const [editGenre, setEditGenre] = useState(GENRE_OPTIONS[0]);
    const [editBio, setEditBio] = useState("");
    const [editImage, setEditImage] = useState("");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileNotice, setProfileNotice] = useState("");

    const [badge, setBadge] = useState(SLOGAN_BADGES[0]);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    const currentUserId = (session?.user as { id?: string })?.id;
    const isOwner = Boolean(currentUserId && artist && currentUserId === artist.id);

    const loadArtist = useCallback(() => {
        fetch(`/api/artist/${params.id}`)
            .then((r) => r.json())
            .then((data: ArtistProfile) => {
                setArtist(data);
                if (data && !("error" in (data as object))) {
                    setEditUsername(data.username ?? "");
                    setEditGenre(data.genre || GENRE_OPTIONS[0]);
                    setEditBio(data.bio ?? "");
                    setEditImage(data.image ?? "");
                }
            })
            .finally(() => setLoading(false));
    }, [params.id]);

    useEffect(() => {
        loadArtist();
    }, [loadArtist]);

    const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            const compressed = await compressImageFile(file, 600, 0.85);
            setEditImage(compressed);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileNotice("");
        try {
            const res = await fetch("/api/dashboard/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: editUsername,
                    genre: editGenre,
                    bio: editBio,
                    image: editImage,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setProfileNotice("✅ 아티스트 이름과 프로필이 변경되었습니다!");
                setEditingProfile(false);
                loadArtist();
                window.dispatchEvent(new Event("b1f-profile-updated"));
            } else {
                setProfileNotice(`❌ ${data.error}`);
            }
        } finally {
            setSavingProfile(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm("이 연습일지를 삭제하시겠습니까?")) return;
        const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
        if (res.ok) {
            loadArtist();
        }
    };

    const handleCheer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!artist || !message.trim()) return;
        setSending(true);
        try {
            const res = await fetch("/api/cheers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiverId: artist.id,
                    badge,
                    message,
                }),
            });
            if (res.ok) {
                setMessage("");
                loadArtist();
            }
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <main className="page-container"><div className="loading-full">아티스트 아카이브를 불러오는 중...</div></main>
            </>
        );
    }

    if (!artist || ("error" in (artist as object))) {
        return (
            <>
                <Header />
                <main className="page-container">
                    <div className="empty-state">
                        <span className="empty-icon">🔍</span>
                        <p>아티스트를 찾을 수 없습니다</p>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="page-container">
                {/* 프로필 헤더 */}
                <div className="artist-profile-header">
                    <div className="artist-avatar-lg" style={{ overflow: "hidden" }}>
                        {artist.image ? (
                            <img src={artist.image} alt={artist.username ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            (artist.username ?? "?")[0].toUpperCase()
                        )}
                    </div>
                    <div className="artist-profile-info" style={{ flex: 1 }}>
                        <div className="artist-name-row">
                            <h1 className="artist-profile-name">{artist.username}</h1>
                            {artist.genre && <span className="genre-mini-tag">{artist.genre}</span>}
                            {isOwner && (
                                <button
                                    type="button"
                                    className="btn-sm btn-live"
                                    onClick={() => setEditingProfile((v) => !v)}
                                >
                                    ✏️ 이름 · 프로필 사진 변경
                                </button>
                            )}
                        </div>
                        {artist.bio && <p className="artist-profile-bio">{artist.bio}</p>}
                        <div className="artist-profile-stats">
                            <span>🎟️ 누적 관객 <strong>{artist.totalTickets}명</strong></span>
                            <span>🎸 무대 <strong>{artist._count.liveStreams}회</strong></span>
                            <span>📹 연습·습작 일지 <strong>{artist._count.posts}편</strong></span>
                            <span>🙌 응원 슬로건 <strong>{artist._count.receivedCheers}개</strong></span>
                        </div>
                    </div>
                </div>

                {profileNotice && (
                    <p className="donate-result success" style={{ marginBottom: "20px" }}>
                        {profileNotice}
                    </p>
                )}

                {/* 본인일 때 바로 열리는 프로필 수정 폼 */}
                {isOwner && editingProfile && (
                    <form onSubmit={handleSaveProfile} className="profile-cheer-form" style={{ marginBottom: "32px" }}>
                        <h2 className="section-title" style={{ marginBottom: "4px" }}>✏️ 아티스트 활동명 · 대표 사진 · 소개 수정</h2>
                        <div className="avatar-upload-row">
                            <div className="artist-avatar-lg" style={{ overflow: "hidden", width: "68px", height: "68px" }}>
                                {editImage ? (
                                    <img src={editImage} alt="프로필 미리보기" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    (editUsername || "?")[0].toUpperCase()
                                )}
                            </div>
                            <div className="upload-controls-row">
                                <label className="file-upload-btn">
                                    {uploadingAvatar ? "사진 처리 중..." : "🖼️ 대표 프로필 사진 선택"}
                                    <input type="file" accept="image/*" onChange={handleAvatarFile} hidden />
                                </label>
                                {editImage && (
                                    <button type="button" className="btn-sm btn-danger" onClick={() => setEditImage("")}>
                                        기본 아이콘으로
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="form-row-2">
                            <div className="form-group">
                                <label className="form-label">아티스트 활동명 (예: 서안)</label>
                                <input
                                    type="text"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    className="form-input"
                                    placeholder="변경할 아티스트 이름을 입력하세요"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">활동 분야 / 장르</label>
                                <select
                                    value={editGenre}
                                    onChange={(e) => setEditGenre(e.target.value)}
                                    className="form-input"
                                >
                                    {GENRE_OPTIONS.map((g) => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">아티스트 소개글</label>
                            <input
                                type="text"
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                className="form-input"
                                maxLength={150}
                                placeholder="아티스트의 세계관이나 음악 스타일을 소개해주세요"
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-sm btn-outline" onClick={() => setEditingProfile(false)}>
                                취소
                            </button>
                            <button type="submit" className="btn-sm btn-live" disabled={savingProfile || uploadingAvatar}>
                                {savingProfile ? "저장 중..." : "변경사항 저장"}
                            </button>
                        </div>
                    </form>
                )}

                {/* 라이브하우스 무대 목록 */}
                {artist.liveStreams.length > 0 && (
                    <section className="profile-section">
                        <h2 className="section-title">🎸 B1F 라이브하우스 무대</h2>
                        <div className="profile-live-grid">
                            {artist.liveStreams.map((live) => (
                                <Link key={live.id} href={`/live/${live.id}`} className="profile-live-card">
                                    <span className={`stage-status-pill ${live.isLive ? "live" : live.status === "ENDED" ? "ended" : "upcoming"}`}>
                                        {live.isLive ? "🔴 LIVE" : live.status === "ENDED" ? "📼 ARCHIVE" : "🎟️ UPCOMING"}
                                    </span>
                                    <p className="profile-live-title" style={{ marginTop: "10px" }}>{live.title}</p>
                                    <p className="profile-live-time">
                                        🎟️ 관객 {live._count.tickets}명 · 🙌 슬로건 {live._count.cheers}개
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* 지하 연습실 / 작업실 일지 */}
                {artist.posts.length > 0 && (
                    <section className="profile-section">
                        <h2 className="section-title">📹 지하 연습실 · 습작 음원 일지</h2>
                        <div className="profile-posts">
                            {artist.posts.map((post) => (
                                <div key={post.id} className="post-card">
                                    <div className="post-header">
                                        <span className="practice-day-badge">🔥 Day {post.practiceDay}</span>
                                        <span className="practice-cat-badge">{post.category}</span>
                                        <span className="post-time" style={{ marginLeft: "auto" }}>{timeAgo(post.createdAt)}</span>
                                        {isOwner && (
                                            <button
                                                type="button"
                                                className="btn-sm btn-danger"
                                                onClick={() => handleDeletePost(post.id)}
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </div>
                                    {post.stage && (
                                        <Link href={`/live/${post.stage.id}`} className="linked-stage-banner">
                                            🎯 목표 무대: {post.stage.title} →
                                        </Link>
                                    )}
                                    <p className="post-content">{post.content}</p>
                                    {post.audioUrl && (
                                        <div className="demo-audio-card">
                                            <div className="demo-audio-top">
                                                <span className="demo-tape-badge">🎧 B1F STUDIO DEMO</span>
                                                <span className="demo-audio-title">{post.audioTitle || "습작 데모 트랙"}</span>
                                            </div>
                                            <audio controls src={post.audioUrl} className="b1f-audio-player" />
                                        </div>
                                    )}
                                    {post.mediaUrl && (
                                        <img src={post.mediaUrl} alt="연습 사진" className="post-media" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 아티스트 응원 방명록 */}
                <section className="profile-section">
                    <h2 className="section-title">🙌 팬 응원 슬로건 방명록</h2>
                    {session && (
                        <form onSubmit={handleCheer} className="profile-cheer-form">
                            <div className="slogan-badges">
                                {SLOGAN_BADGES.map((b) => (
                                    <button
                                        type="button"
                                        key={b}
                                        className={`slogan-badge-btn ${badge === b ? "active" : ""}`}
                                        onClick={() => setBadge(b)}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                            <div className="profile-cheer-input-row">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={`${artist.username}님에게 응원 슬로건을 남겨주세요!`}
                                    className="form-input"
                                    style={{ flex: 1 }}
                                    maxLength={100}
                                    required
                                />
                                <button type="submit" className="btn btn-primary" disabled={sending}>
                                    {sending ? "등록 중..." : "슬로건 남기기"}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="recent-donations" style={{ marginTop: "16px" }}>
                        {artist.receivedCheers.length === 0 ? (
                            <p className="empty-text">아직 등록된 응원 슬로건이 없습니다.</p>
                        ) : (
                            artist.receivedCheers.map((c) => (
                                <div key={c.id} className="recent-donation-item">
                                    <div className="donation-left">
                                        <span className="donor-name">{c.sender.username ?? "익명 관객"}</span>
                                        <span className="donation-msg">{c.message}</span>
                                    </div>
                                    <div className="donation-right">
                                        <span className="cheer-badge-tag">{c.badge}</span>
                                        <span className="donation-time">{timeAgo(c.createdAt)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </>
    );
}
