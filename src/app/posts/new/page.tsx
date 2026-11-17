"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { compressImageFile, processAudioFile } from "@/lib/media";

interface StageOption {
    id: string;
    title: string;
    artist: { id: string };
}

const CATEGORIES = [
    "곡 작업/습작음원",
    "컨셉/연습사진",
    "합주/연습",
    "보컬/안무",
    "백스테이지",
];

export default function NewPostPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [content, setContent] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [audioUrl, setAudioUrl] = useState("");
    const [audioTitle, setAudioTitle] = useState("");
    const [practiceDay, setPracticeDay] = useState(1);
    const [category, setCategory] = useState("곡 작업/습작음원");
    const [stageId, setStageId] = useState("");
    const [myStages, setMyStages] = useState<StageOption[]>([]);

    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [audioNotice, setAudioNotice] = useState("");
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

    const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        setError("");
        try {
            const compressed = await compressImageFile(file, 1080, 0.82);
            setMediaUrl(compressed);
        } catch (err) {
            setError((err as Error).message || "이미지 처리 중 오류가 발생했습니다.");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAudio(true);
        setAudioNotice("");
        setError("");
        try {
            if (!audioTitle.trim()) {
                setAudioTitle(file.name.replace(/\.[^/.]+$/, ""));
            }
            const result = await processAudioFile(file);
            setAudioUrl(result.dataUrl);
            if (result.notice) {
                setAudioNotice(result.notice);
            }
        } catch (err) {
            setError((err as Error).message || "음원 파일 처리 중 오류가 발생했습니다.");
        } finally {
            setUploadingAudio(false);
        }
    };

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
            setError("연습/작업 일지 내용을 입력해주세요.");
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
                    audioUrl: audioUrl.trim() || null,
                    audioTitle: audioTitle.trim() || null,
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

    const isImagePreview = mediaUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(mediaUrl);

    return (
        <>
            <Header />
            <main className="page-container">
                <div className="form-page">
                    <div className="form-page-header">
                        <Link href="/posts" className="back-link">← 지하 연습실 피드로 돌아가기</Link>
                        <h1 className="page-title">📹 지하 연습실 · 작업실 일지 기록</h1>
                        <p className="page-subtitle">
                            연습 영상뿐만 아니라 <strong>습작/데모 음원 파일(.mp3, .wav)</strong>과 <strong>아티스트/연습실 사진</strong>을 직접 올려 서사를 쌓을 수 있습니다.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="post-form">
                        <div className="form-row-2">
                            <div className="form-group">
                                <label className="form-label">일지 카테고리</label>
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
                                <label className="form-label">연습 · 작업 일차 (Day N)</label>
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
                                <option value="">연결할 예정 무대 없음 (일반 연습/습작 기록)</option>
                                {myStages.map((s) => (
                                    <option key={s.id} value={s.id}>{s.title}</option>
                                ))}
                            </select>
                            <p className="form-hint">무대를 연결하면 해당 공연 상세 페이지에 연습 과정 타임라인으로 함께 전시됩니다.</p>
                        </div>

                        {/* 1. 습작 / 데모 음원 업로드 박스 */}
                        <div className="upload-section-box">
                            <div className="upload-box-header">
                                <span className="upload-box-title">🎧 습작 / 데모 음원 첨부 (선택)</span>
                                <span className="upload-box-badge">MP3 · WAV · M4A · OGG 지원</span>
                            </div>

                            <div className="form-group" style={{ marginTop: "8px" }}>
                                <input
                                    type="text"
                                    value={audioTitle}
                                    onChange={(e) => setAudioTitle(e.target.value)}
                                    className="form-input"
                                    placeholder="데모 트랙 제목 (예: Track 01. 새벽의 알고리즘 Demo Ver.)"
                                    maxLength={80}
                                />
                            </div>

                            <div className="upload-controls-row">
                                <label className="file-upload-btn">
                                    {uploadingAudio ? "음원 최적화 처리 중..." : "🎵 내 기기에서 음원 파일 선택"}
                                    <input
                                        type="file"
                                        accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac"
                                        onChange={handleAudioFile}
                                        disabled={uploadingAudio}
                                        hidden
                                    />
                                </label>
                                {audioUrl && (
                                    <button
                                        type="button"
                                        className="btn-sm btn-danger"
                                        onClick={() => { setAudioUrl(""); setAudioNotice(""); }}
                                    >
                                        음원 제거
                                    </button>
                                )}
                            </div>

                            {audioNotice && (
                                <p className="form-hint" style={{ color: "#ffc740" }}>💡 {audioNotice}</p>
                            )}

                            {audioUrl && (
                                <div className="demo-audio-card" style={{ marginTop: "10px" }}>
                                    <div className="demo-audio-top">
                                        <span className="demo-tape-badge">B1F DEMO TAPE</span>
                                        <span className="demo-audio-title">{audioTitle || "습작 데모 트랙"}</span>
                                    </div>
                                    <audio controls src={audioUrl} className="b1f-audio-player" />
                                </div>
                            )}
                        </div>

                        {/* 2. 연습 사진 / 아티스트 비주얼 업로드 또는 유튜브 URL */}
                        <div className="upload-section-box">
                            <div className="upload-box-header">
                                <span className="upload-box-title">📸 연습 사진 업로드 또는 영상 URL (선택)</span>
                                <span className="upload-box-badge">사진 + 음원 동시 첨부 가능</span>
                            </div>

                            <div className="upload-controls-row" style={{ marginTop: "8px" }}>
                                <label className="file-upload-btn">
                                    {uploadingImage ? "사진 압축 중..." : "🖼️ 내 기기에서 사진 파일 선택"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageFile}
                                        disabled={uploadingImage}
                                        hidden
                                    />
                                </label>
                                {mediaUrl && (
                                    <button
                                        type="button"
                                        className="btn-sm btn-danger"
                                        onClick={() => setMediaUrl("")}
                                    >
                                        미디어 제거
                                    </button>
                                )}
                            </div>

                            <div className="form-group" style={{ marginTop: "8px" }}>
                                <input
                                    type="text"
                                    value={mediaUrl.startsWith("data:") ? "" : mediaUrl}
                                    onChange={(e) => setMediaUrl(e.target.value)}
                                    className="form-input"
                                    placeholder="또는 유튜브 영상/쇼츠 URL, 외부 이미지 주소 직접 입력"
                                />
                            </div>

                            {isImagePreview && (
                                <div className="uploaded-image-preview">
                                    <img src={mediaUrl} alt="업로드 미리보기" className="post-media" />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="content" className="form-label">
                                오늘의 작업 · 연습 노트 ✨
                            </label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="form-textarea"
                                placeholder="예: 오늘 새벽에 완성한 신곡 1절 보컬 가이드 데모와 컨셉 아트워크입니다. 브릿지 멜로디 라인에 대해 관객분들의 생각이 궁금해요!"
                                rows={5}
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
                                disabled={submitting || uploadingAudio || uploadingImage || !content.trim()}
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
