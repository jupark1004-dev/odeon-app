"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewLivePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [embedUrl, setEmbedUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !embedUrl.trim()) {
            setError("제목과 URL을 모두 입력해주세요.");
            return;
        }
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/lives", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, embedUrl }),
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
                <Link href="/dashboard/live" className="back-link">← 라이브 관리로 돌아가기</Link>
                <h1 className="dashboard-title">📡 새 방송 등록</h1>
            </div>

            <form onSubmit={handleSubmit} className="dashboard-form">
                <div className="form-group">
                    <label className="form-label">방송 제목</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="form-input"
                        placeholder="예: 🎹 피아노 즉흥 연주 라이브"
                        maxLength={80}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">유튜브 URL</label>
                    <input
                        type="url"
                        value={embedUrl}
                        onChange={(e) => setEmbedUrl(e.target.value)}
                        className="form-input"
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="form-hint">유튜브 영상 또는 라이브 스트림 URL을 입력하세요</p>
                </div>

                {error && <p className="form-error">{error}</p>}

                <div className="form-actions">
                    <Link href="/dashboard/live" className="btn btn-secondary">취소</Link>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                    >
                        {submitting ? "등록 중..." : "방송 등록"}
                    </button>
                </div>
            </form>
        </div>
    );
}
