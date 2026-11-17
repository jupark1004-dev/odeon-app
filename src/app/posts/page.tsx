"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "@/components/layout/Header";

interface Post {
    id: string;
    content: string;
    mediaUrl: string | null;
    audioUrl: string | null;
    audioTitle: string | null;
    practiceDay: number;
    category: string;
    createdAt: string;
    artist: { id: string; username: string | null; genre: string | null; image: string | null };
    stage: { id: string; title: string; scheduledAt: string; status: string; isLive: boolean } | null;
}

const CATEGORIES = ["전체", "곡 작업/습작음원", "컨셉/연습사진", "합주/연습", "보컬/안무", "백스테이지"];

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "방금 전";
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
}

function getYoutubeEmbed(url: string): string | null {
    const regexps = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/shorts\/([^?]+)/,
        /youtube\.com\/embed\/([^?]+)/,
        /youtube\.com\/live\/([^?]+)/,
    ];
    for (const re of regexps) {
        const match = url.match(re);
        if (match) return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
}

export default function PostsPage() {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedCat, setSelectedCat] = useState("전체");
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const userId = (session?.user as { id?: string })?.id;
    const isArtist = (session?.user as { role?: string })?.role === "ARTIST";

    const loadPosts = () => {
        fetch("/api/posts")
            .then((r) => r.json())
            .then((data) => setPosts(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("이 연습일지를 삭제하시겠습니까?")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPosts((prev) => prev.filter((p) => p.id !== id));
            }
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = selectedCat === "전체"
        ? posts
        : posts.filter((p) => p.category === selectedCat);

    return (
        <>
            <Header />
            <main className="page-container">
                <div className="page-header">
                    <div className="page-header-row">
                        <div>
                            <span className="section-kicker">B1F PRACTICE & STUDIO LOGS</span>
                            <h1 className="page-title">
                                📹 <span className="highlight">지하 연습실 · 작업실</span> 일지
                            </h1>
                            <p className="page-subtitle">
                                미공개 습작 데모 음원, 아티스트 컨셉/연습 사진, 합주 영상까지 무대 뒤의 모든 과정을 공유합니다
                            </p>
                        </div>
                        {isArtist && (
                            <Link href="/posts/new" className="btn btn-primary">
                                + 연습일지 · 습작음원 올리기
                            </Link>
                        )}
                    </div>

                    {/* 카테고리 필터 탭 */}
                    <div className="filter-tabs">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                className={`filter-tab ${selectedCat === cat ? "active" : ""}`}
                                onClick={() => setSelectedCat(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="post-feed">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="post-skeleton" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🎧</span>
                        <p>아직 기록된 일지가 없습니다</p>
                        {isArtist && (
                            <Link href="/posts/new" className="auth-link" style={{ marginTop: "8px" }}>
                                첫 번째 습작 음원이나 연습 사진을 올려보세요 →
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="post-feed">
                        {filtered.map((post) => {
                            const ytEmbed = post.mediaUrl ? getYoutubeEmbed(post.mediaUrl) : null;
                            const isOwner = userId === post.artist.id;
                            return (
                                <article key={post.id} className="post-card">
                                    <div className="post-header">
                                        <Link href={`/artist/${post.artist.id}`} className="post-avatar" style={{ overflow: "hidden" }}>
                                            {post.artist.image ? (
                                                <img src={post.artist.image} alt={post.artist.username ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            ) : (
                                                (post.artist.username ?? "?")[0].toUpperCase()
                                            )}
                                        </Link>
                                        <div className="post-header-meta">
                                            <div className="post-author-row">
                                                <Link href={`/artist/${post.artist.id}`} className="post-author">
                                                    {post.artist.username ?? "알 수 없음"}
                                                </Link>
                                                {post.artist.genre && (
                                                    <span className="genre-mini-tag">{post.artist.genre}</span>
                                                )}
                                            </div>
                                            <p className="post-time">{timeAgo(post.createdAt)}</p>
                                        </div>
                                        <div className="post-badges-right">
                                            <span className="practice-day-badge">🔥 Day {post.practiceDay}</span>
                                            <span className="practice-cat-badge">{post.category}</span>
                                            {isOwner && (
                                                <button
                                                    type="button"
                                                    className="btn-sm btn-danger"
                                                    onClick={() => handleDelete(post.id)}
                                                    disabled={deletingId === post.id}
                                                >
                                                    {deletingId === post.id ? "삭제 중" : "삭제"}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {post.stage && (
                                        <Link href={`/live/${post.stage.id}`} className="linked-stage-banner">
                                            <span className="linked-stage-label">🎯 준비 중인 목표 무대</span>
                                            <span className="linked-stage-title">{post.stage.title} →</span>
                                        </Link>
                                    )}

                                    <p className="post-content">{post.content}</p>

                                    {/* 습작 / 데모 음원 플레이어 */}
                                    {post.audioUrl && (
                                        <div className="demo-audio-card">
                                            <div className="demo-audio-top">
                                                <span className="demo-tape-badge">🎧 B1F STUDIO DEMO</span>
                                                <span className="demo-audio-title">
                                                    {post.audioTitle || `${post.artist.username} — 습작 데모 트랙`}
                                                </span>
                                            </div>
                                            <audio controls src={post.audioUrl} className="b1f-audio-player" />
                                        </div>
                                    )}

                                    {/* 유튜브 영상 또는 연습/컨셉 사진 */}
                                    {ytEmbed ? (
                                        <div className="post-video-wrapper">
                                            <iframe
                                                src={ytEmbed}
                                                title="Practice Video"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="youtube-iframe"
                                            />
                                        </div>
                                    ) : post.mediaUrl ? (
                                        <img
                                            src={post.mediaUrl}
                                            alt="연습실 사진"
                                            className="post-media"
                                        />
                                    ) : null}
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>
        </>
    );
}
