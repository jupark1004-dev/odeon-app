"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { compressImageFile } from "@/lib/media";

interface Summary {
    artist: { username: string | null; genre: string | null; bio: string | null; image: string | null } | null;
    totalTickets: number;
    cheerCount: number;
    liveCount: number;
    postCount: number;
    recentCheers: {
        id: string;
        badge: string;
        message: string;
        createdAt: string;
        sender: { username: string | null };
        stream: { title: string } | null;
    }[];
    recentTickets: {
        id: string;
        entryNumber: number;
        createdAt: string;
        user: { username: string | null };
        stream: { title: string };
    }[];
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
    const { data: session } = useSession();
    const userId = (session?.user as { id?: string })?.id;

    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);

    // 프로필 편집 상태
    const [editingProfile, setEditingProfile] = useState(false);
    const [username, setUsername] = useState("");
    const [genre, setGenre] = useState(GENRE_OPTIONS[0]);
    const [bio, setBio] = useState("");
    const [image, setImage] = useState("");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState("");

    useEffect(() => {
        fetch("/api/dashboard/summary")
            .then((r) => r.json())
            .then((data: Summary) => {
                setSummary(data);
                if (data?.artist) {
                    setUsername(data.artist.username ?? "");
                    setGenre(data.artist.genre || GENRE_OPTIONS[0]);
                    setBio(data.artist.bio ?? "");
                    setImage(data.artist.image ?? "");
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            const compressed = await compressImageFile(file, 600, 0.85);
            setImage(compressed);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMsg("");
        try {
            const res = await fetch("/api/dashboard/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, genre, bio, image }),
            });
            const data = await res.json();
            if (res.ok) {
                setProfileMsg("✅ 프로필 및 아티스트 이미지가 업데이트되었습니다.");
                setSummary((prev) => (prev ? { ...prev, artist: data.artist } : prev));
                setEditingProfile(false);
            } else {
                setProfileMsg(`❌ ${data.error}`);
            }
        } finally {
            setSavingProfile(false);
        }
    };

    if (loading) {
        return <div className="loading-full">스튜디오 데이터를 불러오는 중...</div>;
    }

    if (!summary) {
        return <div className="empty-state"><p>데이터를 불러올 수 없습니다.</p></div>;
    }

    return (
        <div className="dashboard-content">
            <div className="dashboard-page-header">
                <h1 className="dashboard-title">🎛️ B1F 아티스트 스튜디오</h1>
                {userId && (
                    <Link href={`/artist/${userId}`} className="btn-sm btn-outline">
                        내 공개 프로필 보기 →
                    </Link>
                )}
            </div>

            {/* 통계 카드 */}
            <div className="stats-grid">
                <div className="stat-card highlight">
                    <p className="stat-label">누적 입장권 발권</p>
                    <p className="stat-value">🎟️ {summary.totalTickets.toLocaleString()}명</p>
                    <p className="stat-sub">내 무대를 찾은 관객</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">지하 연습실 일지</p>
                    <p className="stat-value">📹 {summary.postCount}</p>
                    <p className="stat-sub">누적 연습 · 습작 기록</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">라이브하우스 무대</p>
                    <p className="stat-value">🎸 {summary.liveCount}</p>
                    <p className="stat-sub">편성된 공연 수</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">관객 응원 슬로건</p>
                    <p className="stat-value">🙌 {summary.cheerCount.toLocaleString()}</p>
                    <p className="stat-sub">받은 응원 메시지</p>
                </div>
            </div>

            {/* 빠른 액션 */}
            <div className="quick-actions">
                <Link href="/posts/new" className="btn btn-primary">
                    🎧 연습일지 · 습작음원 올리기
                </Link>
                <Link href="/dashboard/live/new" className="btn btn-secondary">
                    🎸 새 라이브 무대 편성
                </Link>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingProfile((v) => !v)}
                >
                    ✏️ 아티스트 이미지 · 프로필 수정
                </button>
            </div>

            {profileMsg && (
                <p className="donate-result success" style={{ marginBottom: "20px" }}>
                    {profileMsg}
                </p>
            )}

            {/* 프로필 편집 폼 */}
            {editingProfile && (
                <form onSubmit={handleSaveProfile} className="profile-cheer-form" style={{ marginBottom: "32px" }}>
                    <h2 className="section-title" style={{ marginBottom: "4px" }}>✏️ 아티스트 프로필 · 대표 이미지 수정</h2>
                    <div className="avatar-upload-row">
                        <div className="artist-avatar-lg" style={{ overflow: "hidden", width: "68px", height: "68px" }}>
                            {image ? (
                                <img src={image} alt="아티스트 이미지" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                (username || "?")[0].toUpperCase()
                            )}
                        </div>
                        <div className="upload-controls-row">
                            <label className="file-upload-btn">
                                {uploadingAvatar ? "이미지 처리 중..." : "🖼️ 대표 프로필 사진 선택"}
                                <input type="file" accept="image/*" onChange={handleAvatarFile} hidden />
                            </label>
                            {image && (
                                <button type="button" className="btn-sm btn-danger" onClick={() => setImage("")}>
                                    사진 삭제
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="form-row-2">
                        <div className="form-group">
                            <label className="form-label">팀명 / 아티스트 활동명</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">활동 분야 / 포지션</label>
                            <select
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                className="form-input"
                            >
                                {GENRE_OPTIONS.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">아티스트 소개 & 무대 각오</label>
                        <input
                            type="text"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="form-input"
                            maxLength={150}
                            placeholder="팀의 서사와 음악 스타일을 소개해주세요"
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn-sm btn-outline" onClick={() => setEditingProfile(false)}>
                            취소
                        </button>
                        <button type="submit" className="btn-sm btn-live" disabled={savingProfile || uploadingAvatar}>
                            {savingProfile ? "저장 중..." : "프로필 저장"}
                        </button>
                    </div>
                </form>
            )}

            {/* 최근 입장권 발권 관객 */}
            <div className="recent-section" style={{ marginBottom: "32px" }}>
                <h2 className="section-title">🎟️ 최근 입장 정리번호 발권 관객</h2>
                {summary.recentTickets.length === 0 ? (
                    <p className="empty-text">아직 발권된 입장권이 없습니다.</p>
                ) : (
                    <div className="recent-donations">
                        {summary.recentTickets.map((t) => (
                            <div key={t.id} className="recent-donation-item">
                                <div className="donation-left">
                                    <span className="donor-name">
                                        #{String(t.entryNumber).padStart(3, "0")} · {t.user.username ?? "관객"}
                                    </span>
                                    <span className="donation-stream">🎸 {t.stream.title}</span>
                                </div>
                                <div className="donation-right">
                                    <span className="cheer-badge-tag">입장 예약 완료</span>
                                    <span className="donation-time">{timeAgo(t.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 최근 응원 슬로건 */}
            <div className="recent-section">
                <h2 className="section-title">🙌 최근 도착한 응원 슬로건</h2>
                {summary.recentCheers.length === 0 ? (
                    <p className="empty-text">아직 도착한 응원 슬로건이 없습니다.</p>
                ) : (
                    <div className="recent-donations">
                        {summary.recentCheers.map((c) => (
                            <div key={c.id} className="recent-donation-item">
                                <div className="donation-left">
                                    <span className="donor-name">{c.sender.username ?? "익명 관객"}</span>
                                    {c.stream && (
                                        <span className="donation-stream">🎸 {c.stream.title}</span>
                                    )}
                                    <span className="donation-msg">💬 {c.message}</span>
                                </div>
                                <div className="donation-right">
                                    <span className="cheer-badge-tag">{c.badge}</span>
                                    <span className="donation-time">{timeAgo(c.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
