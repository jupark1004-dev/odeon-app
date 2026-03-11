"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";

interface LiveDetail {
    id: string;
    title: string;
    embedUrl: string;
    isLive: boolean;
    artist: { id: string; username: string | null; bio: string | null };
    transactions: {
        id: string;
        amount: number;
        message: string | null;
        sender: { username: string | null };
    }[];
}

function getYoutubeEmbedUrl(url: string): string {
    // 다양한 유튜브 URL 형태 처리
    const regexps = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/live\/([^?]+)/,
    ];
    for (const re of regexps) {
        const match = url.match(re);
        if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=0`;
    }
    return url; // 이미 embed URL이면 그대로
}

export default function LiveDetailPage() {
    const params = useParams();
    const { data: session } = useSession();
    const [live, setLive] = useState<LiveDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // 초코 후원 상태
    const [chocoAmount, setChocoAmount] = useState(10);
    const [message, setMessage] = useState("");
    const [donating, setDonating] = useState(false);
    const [donateResult, setDonateResult] = useState<string>("");

    useEffect(() => {
        fetch(`/api/lives/${params.id}`)
            .then((r) => r.json())
            .then((data) => setLive(data))
            .finally(() => setLoading(false));
    }, [params.id]);

    const handleDonate = async () => {
        if (!session || !live) return;
        setDonating(true);
        setDonateResult("");
        try {
            const res = await fetch("/api/choco", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiverId: live.artist.id,
                    streamId: live.id,
                    amount: chocoAmount,
                    message,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setDonateResult(data.message);
                setMessage("");
                // 최신 거래 다시 로드
                fetch(`/api/lives/${params.id}`)
                    .then((r) => r.json())
                    .then(setLive);
            } else {
                setDonateResult(`❌ ${data.error}`);
            }
        } finally {
            setDonating(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <main className="page-container">
                    <div className="loading-full">방송을 불러오는 중...</div>
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
                        <span className="empty-icon">📡</span>
                        <p>방송을 찾을 수 없습니다</p>
                    </div>
                </main>
            </>
        );
    }

    const embedUrl = getYoutubeEmbedUrl(live.embedUrl);
    const userId = (session?.user as { id?: string })?.id;
    const isSelf = userId === live.artist.id;

    return (
        <>
            <Header />
            <main className="page-container">
                <div className="live-detail-layout">
                    {/* 플레이어 영역 */}
                    <div className="player-section">
                        <div className="player-wrapper">
                            <iframe
                                src={embedUrl}
                                title={live.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="youtube-iframe"
                            />
                        </div>
                        <div className="live-detail-info">
                            <div className="live-detail-header">
                                <h1 className="live-detail-title">{live.title}</h1>
                                {live.isLive && <span className="live-badge">LIVE</span>}
                            </div>
                            <p className="live-detail-artist">
                                🎤 {live.artist.username ?? "알 수 없음"}
                            </p>
                            {live.artist.bio && (
                                <p className="live-detail-bio">{live.artist.bio}</p>
                            )}
                        </div>
                    </div>

                    {/* 사이드바 — 초코 후원 + 최근 후원 목록 */}
                    <div className="side-section">
                        {/* 초코 후원 */}
                        {session && !isSelf && (
                            <div className="choco-panel">
                                <h2 className="panel-title">🍫 초코 후원</h2>
                                <div className="choco-amounts">
                                    {[10, 30, 50, 100].map((n) => (
                                        <button
                                            key={n}
                                            className={`choco-btn ${chocoAmount === n ? "active" : ""}`}
                                            onClick={() => setChocoAmount(n)}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    placeholder="응원 메시지 (선택)"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="form-input"
                                    maxLength={80}
                                />
                                <button
                                    className="btn-primary choco-submit"
                                    onClick={handleDonate}
                                    disabled={donating}
                                >
                                    {donating ? "처리 중..." : `초코 ${chocoAmount}개 후원 🍫`}
                                </button>
                                {donateResult && (
                                    <p className={`donate-result ${donateResult.startsWith("❌") ? "error" : "success"}`}>
                                        {donateResult}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 최근 후원 목록 */}
                        <div className="donation-list-panel">
                            <h2 className="panel-title">최근 후원</h2>
                            {live.transactions.length === 0 ? (
                                <p className="empty-donations">아직 후원이 없습니다</p>
                            ) : (
                                <ul className="donation-list">
                                    {live.transactions.map((t) => (
                                        <li key={t.id} className="donation-item">
                                            <div className="donation-header">
                                                <span className="donor-name">{t.sender.username ?? "익명"}</span>
                                                <span className="donation-amount">🍫 {t.amount}</span>
                                            </div>
                                            {t.message && (
                                                <p className="donation-message">{t.message}</p>
                                            )}
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
