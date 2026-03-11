"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";

interface LiveStream {
    id: string;
    title: string;
    embedUrl: string;
    isLive: boolean;
    createdAt: string;
    artist: { id: string; username: string | null; image: string | null };
    _count: { transactions: number };
}

export default function LiveListPage() {
    const [lives, setLives] = useState<LiveStream[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/lives")
            .then((r) => r.json())
            .then((data) => setLives(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Header />
            <main className="page-container">
                <div className="page-header">
                    <h1 className="page-title">
                        📡 <span className="highlight">라이브</span> 방송
                    </h1>
                    <p className="page-subtitle">아티스트의 실시간 공연을 만나보세요</p>
                </div>

                {loading ? (
                    <div className="loading-grid">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="card-skeleton" />
                        ))}
                    </div>
                ) : lives.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📡</span>
                        <p>현재 진행 중인 라이브가 없습니다</p>
                    </div>
                ) : (
                    <div className="card-grid">
                        {lives.map((live) => (
                            <Link href={`/live/${live.id}`} key={live.id} className="live-card">
                                <div className="live-thumbnail">
                                    <span className="thumbnail-icon">🎸</span>
                                    {live.isLive && <span className="live-badge">LIVE</span>}
                                </div>
                                <div className="live-card-body">
                                    <h2 className="live-card-title">{live.title}</h2>
                                    <div className="live-card-meta">
                                        <span className="artist-name">🎤 {live.artist.username ?? "알 수 없음"}</span>
                                        <span className="choco-count">🍫 {live._count.transactions}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}
