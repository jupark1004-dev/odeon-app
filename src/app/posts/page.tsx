"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "@/components/layout/Header";

interface Post {
    id: string;
    content: string;
    mediaUrl: string | null;
    createdAt: string;
    artist: { id: string; username: string | null; image: string | null };
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "방금 전";
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
}

export default function PostsPage() {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const isArtist = (session?.user as { role?: string })?.role === "ARTIST";

    useEffect(() => {
        fetch("/api/posts")
            .then((r) => r.json())
            .then((data) => setPosts(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Header />
            <main className="page-container">
                <div className="page-header">
                    <div className="page-header-row">
                        <div>
                            <h1 className="page-title">
                                📝 <span className="highlight">데일리</span> 포스트
                            </h1>
                            <p className="page-subtitle">아티스트의 연습 실황과 일상을 만나보세요</p>
                        </div>
                        {isArtist && (
                            <Link href="/posts/new" className="btn btn-primary">
                                + 새 포스트
                            </Link>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="post-feed">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="post-skeleton" />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📝</span>
                        <p>아직 포스트가 없습니다</p>
                        {isArtist && (
                            <Link href="/posts/new" className="auth-link" style={{ marginTop: "8px" }}>
                                첫 번째 포스트를 작성해보세요 →
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="post-feed">
                        {posts.map((post) => (
                            <article key={post.id} className="post-card">
                                <div className="post-header">
                                    <div className="post-avatar">
                                        {(post.artist.username ?? "?")[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="post-author">{post.artist.username ?? "알 수 없음"}</p>
                                        <p className="post-time">{timeAgo(post.createdAt)}</p>
                                    </div>
                                </div>
                                <p className="post-content">{post.content}</p>
                                {post.mediaUrl && (
                                    <img
                                        src={post.mediaUrl}
                                        alt="미디어"
                                        className="post-media"
                                    />
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}
