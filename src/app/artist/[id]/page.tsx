"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { useParams } from "next/navigation";

interface ArtistProfile {
    id: string;
    username: string | null;
    bio: string | null;
    image: string | null;
    choco_balance: number;
    createdAt: string;
    liveStreams: { id: string; title: string; isLive: boolean; createdAt: string }[];
    posts: { id: string; content: string; createdAt: string }[];
    _count: { liveStreams: number; posts: number; receivedChocos: number };
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

export default function ArtistProfilePage() {
    const params = useParams();
    const [artist, setArtist] = useState<ArtistProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/artist/${params.id}`)
            .then((r) => r.json())
            .then(setArtist)
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) {
        return (
            <>
                <Header />
                <main className="page-container"><div className="loading-full">불러오는 중...</div></main>
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
                    <div className="artist-avatar-lg">
                        {(artist.username ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="artist-profile-info">
                        <h1 className="artist-profile-name">{artist.username}</h1>
                        {artist.bio && <p className="artist-profile-bio">{artist.bio}</p>}
                        <div className="artist-profile-stats">
                            <span>📡 라이브 {artist._count.liveStreams}</span>
                            <span>📝 포스트 {artist._count.posts}</span>
                            <span>🍫 후원 {artist._count.receivedChocos}건</span>
                        </div>
                    </div>
                </div>

                {/* 라이브 방송 */}
                {artist.liveStreams.length > 0 && (
                    <section className="profile-section">
                        <h2 className="section-title">📡 라이브 방송</h2>
                        <div className="profile-live-grid">
                            {artist.liveStreams.map((live) => (
                                <Link key={live.id} href={`/live/${live.id}`} className="profile-live-card">
                                    {live.isLive && <span className="live-badge">LIVE</span>}
                                    <p className="profile-live-title">{live.title}</p>
                                    <p className="profile-live-time">{timeAgo(live.createdAt)}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* 최근 포스트 */}
                {artist.posts.length > 0 && (
                    <section className="profile-section">
                        <h2 className="section-title">📝 최근 포스트</h2>
                        <div className="profile-posts">
                            {artist.posts.map((post) => (
                                <div key={post.id} className="post-card">
                                    <div className="post-header">
                                        <div className="post-avatar">
                                            {(artist.username ?? "?")[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="post-author">{artist.username}</p>
                                            <p className="post-time">{timeAgo(post.createdAt)}</p>
                                        </div>
                                    </div>
                                    <p className="post-content">{post.content}</p>
                                </div>
                            ))}
                            <Link href="/posts" className="auth-link" style={{ marginTop: "8px" }}>
                                전체 포스트 보기 →
                            </Link>
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}
