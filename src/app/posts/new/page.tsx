"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";

interface StageOption {
    id: string;
    title: string;
    artist: { id: string };
}

const CATEGORIES = ["합주/연습", "보컬/안무", "곡 작업", "백스테이지"];

export default function NewPostPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [content, setContent] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [practiceDay, setPracticeDay] = useState(1);
    const [category, setCategory] = useState("합주/연습");
    const [stageId, setStageId] = useState("");
    const [myStages, setMyStages] = useState<StageOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const userId = (session?.user as { id?: string })?.id;
    const isArtist = (session?.user as { role?: string })?.role === "ARTIST";

    useEffect(() => {
        if (!userId) return;
        fetch("/api/lives")
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setMyStages(data.filter((s: StageOption) => s.artist?.id === userId));
                }
            });
    }, [userId]);

    if (status === "loading") {
        return (
            <>
                <Header />
                <main className="page-container">
                    <div className="loading-full">로딩 중...</div>
                </main>
            </>
        );
    }

    if (!session || !isArtist) {
        return (
            <>
                <Header />
                <main className="page-container">
                    <div className="empty-state">
                        <span className="empty-icon">🔒</span>
                        <p>뮤지션 계정만 연습일지를 기록할 수 있습니다</p>
                        <Link href="/posts" className="auth-link" style={{ marginTop: "8px" }}>
                            연습실 피드로 돌아가기
                        </Link>
                    </div>
                </main>
            </>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            setError("연습 일지 내용을 입력해주세요.");
            return;
        }
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content,
                    mediaUrl: mediaUrl.trim() || null,
                    practiceDay,
                    category,
                    stageId: stageId || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "오류가 발생했습니다.");
                return;
            }
            router.push("/posts");
        } catch {
            setError("네트워크 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Header />
            <main className="page-container">
                <div className="form-page">
                    <div className="form-page-header">
                        <Link href="/posts" className="back-link">← 지하 연습실 피드로 돌아가기</Link>
                        <h1 className="page-title">📹 지하 연습실 일지 기록</h1>
                        <p className="page-subtitle">오늘 흘린 땀방울과 연습 영상을 기록해 관객들과 무대까지의 서사를 공유하세요.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="post-form">
                        <div className="form-row-2">
                            <div className="form-group">
                                <label className="form-label">연습 카테고리</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="form-input"
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">연습 일차 (Day N)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={999}
                                    value={practiceDay}
                                    onChange={(e) => setPracticeDay(Number(e.target.value))}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">🎯 연결할 목표 무대 (선택)</label>
                            <select
                                value={stageId}
                                onChange={(e) => setStageId(e.target.value)}
                                className="form-input"
                            >
                                <option value="">연결할 예정 무대 없음 (일반 연습 기록)</option>
                                {myStages.map((s) => (
                                    <option key={s.id} value={s.id}>{s.title}</option>
                                ))}
                            </select>
                            <p className="form-hint">무대를 연결하면 해당 공연 상세 페이지에 연습 과정 타임라인으로 함께 전시됩니다.</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="mediaUrl" className="form-label">
                                연습 영상(유튜브/쇼츠 URL) 또는 사진 URL (선택)
                            </label>
                            <input
                                id="mediaUrl"
                                type="url"
                                value={mediaUrl}
                                onChange={(e) => setMediaUrl(e.target.value)}
                                className="form-input"
                                placeholder="https://www.youtube.com/watch?v=... 또는 이미지 주소"
                            />
                            <p className="form-hint">유튜브(일부 공개 포함) 링크를 입력하면 피드에서 즉시 영상 플레이어로 재생됩니다.</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="content" className="form-label">
                                오늘의 연습 노트 ✨
                            </label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="form-textarea"
                                placeholder="예: 단독 공연 D-5! 오늘 브릿지 구간 드럼-베이스 합을 30번 넘게 다시 맞췄다. 아직 거칠지만 본 무대에서는 완벽하게 터뜨릴 예정."
                                rows={6}
                                maxLength={800}
                            />
                            <p className="char-count">{content.length} / 800</p>
                        </div>

                        {error && <p className="form-error">{error}</p>}

                        <div className="form-actions">
                            <Link href="/posts" className="btn btn-secondary">
                                취소
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting || !content.trim()}
                            >
                                {submitting ? "기록 중..." : "연습일지 남기기"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
