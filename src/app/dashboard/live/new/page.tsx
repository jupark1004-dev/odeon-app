"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewLivePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [embedUrl, setEmbedUrl] = useState("");
    const [scheduledAt, setScheduledAt] = useState(() => {
        const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        return d.toISOString().slice(0, 16);
    });
    const [status, setStatus] = useState<"UPCOMING" | "LIVE">("UPCOMING");
    const [setlist, setSetlist] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !embedUrl.trim()) {
            setError("공연 제목과 무대 영상 URL을 모두 입력해주세요.");
            return;
        }
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/lives", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    embedUrl,
                    scheduledAt,
                    status,
                    setlist,
                    description,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "오류가 발생했습니다.");
                return;
            }
            router.push("/dashboard/live");
        } catch {
            setError("네트워크 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="dashboard-content">
            <div className="form-page-header">
                <Link href="/dashboard/live" className="back-link">← 무대 관리로 돌아가기</Link>
                <h1 className="dashboard-title">🎸 새 라이브하우스 무대 편성</h1>
                <p className="page-subtitle">
                    D-Day 무대를 미리 예고하고 관객들의 입장 정리번호 발권을 받거나, 지금 바로 라이브 무대를 여세요.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="dashboard-form">
                <div className="form-group">
                    <label className="form-label">공연 타이틀</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="form-input"
                        placeholder="예: [B1F 단독 쇼케이스] 지하 1층에서 쏘아 올리는 첫 번째 야간비행"
                        maxLength={80}
                        required
                    />
                </div>

                <div className="form-row-2">
                    <div className="form-group">
                        <label className="form-label">공연 예정 일시 (D-Day)</label>
                        <input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">초기 무대 상태</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as "UPCOMING" | "LIVE")}
                            className="form-input"
                        >
                            <option value="UPCOMING">🎟️ 공연 예정 (입장권 발권 시작)</option>
                            <option value="LIVE">🔴 지금 바로 LIVE 오픈</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">무대 영상 / 스트리밍 URL (유튜브 일부 공개 가능)</label>
                    <input
                        type="url"
                        value={embedUrl}
                        onChange={(e) => setEmbedUrl(e.target.value)}
                        className="form-input"
                        placeholder="https://www.youtube.com/watch?v=..."
                        required
                    />
                    <p className="form-hint">
                        공연 전에는 티저나 리허설 영상을 등록해 두고, 본 공연 시 라이브 URL로 사용하실 수 있습니다.
                    </p>
                </div>

                <div className="form-group">
                    <label className="form-label">🎼 셋리스트 (한 줄에 한 곡씩 입력, 선택)</label>
                    <textarea
                        value={setlist}
                        onChange={(e) => setSetlist(e.target.value)}
                        className="form-textarea"
                        placeholder={"1. 새벽 2시의 합주실 (Intro)\n2. 네온사인 아래서\n3. B1F 엔딩곡 (Acoustic Ver.)"}
                        rows={4}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">공연 소개 및 아티스트 각오 (선택)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="form-textarea"
                        placeholder="이번 무대를 위해 지난 3주간 매일 지하 연습실에서 합주를 맞췄습니다. 1열에서 함께 호흡해주세요!"
                        rows={3}
                    />
                </div>

                {error && <p className="form-error">{error}</p>}

                <div className="form-actions">
                    <Link href="/dashboard/live" className="btn btn-secondary">취소</Link>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                    >
                        {submitting ? "편성 중..." : "무대 편성 완료"}
                    </button>
                </div>
            </form>
        </div>
    );
}
