"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";

export default function NewPostPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const isArtist = (session?.user as { role?: string })?.role === "ARTIST";

    // 로그인 체크
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
                        <p>아티스트만 포스트를 작성할 수 있습니다</p>
                        <Link href="/posts" className="auth-link" style={{ marginTop: "8px" }}>
                            포스트 피드로 돌아가기
                        </Link>
                    </div>
                </main>
            </>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            setError("내용을 입력해주세요.");
            return;
        }
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
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
                        <Link href="/posts" className="back-link">← 피드로 돌아가기</Link>
                        <h1 className="page-title">새 포스트 작성</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="post-form">
                        <div className="form-group">
                            <label htmlFor="content" className="form-label">
                                오늘의 이야기를 나눠보세요 ✨
                            </label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="form-textarea"
                                placeholder="연습 실황, 촬영 비하인드, 일상 등 팬들과 나누고 싶은 이야기를 작성해보세요."
                                rows={6}
                                maxLength={500}
                            />
                            <p className="char-count">{content.length} / 500</p>
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
                                {submitting ? "게시 중..." : "포스트 게시"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
