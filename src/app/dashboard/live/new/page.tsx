"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { compressImageFile, processAudioFile } from "@/lib/media";

export default function NewLivePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [embedUrl, setEmbedUrl] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [audioUrl, setAudioUrl] = useState("");
    const [scheduledAt, setScheduledAt] = useState(() => {
        const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        return d.toISOString().slice(0, 16);
    });
    const [status, setStatus] = useState<"UPCOMING" | "LIVE">("UPCOMING");
    const [setlist, setSetlist] = useState("");
    const [description, setDescription] = useState("");

    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [audioNotice, setAudioNotice] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        setError("");
        try {
            const compressed = await compressImageFile(file, 1080, 0.82);
            setCoverImage(compressed);
        } catch (err) {
            setError((err as Error).message || "이미지 처리 실패");
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
            const res = await processAudioFile(file);
            setAudioUrl(res.dataUrl);
            if (res.notice) setAudioNotice(res.notice);
        } catch (err) {
            setError((err as Error).message || "음원 처리 실패");
        } finally {
            setUploadingAudio(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("공연 타이틀을 입력해주세요.");
            return;
        }
        if (!embedUrl.trim() && !audioUrl.trim() && !coverImage.trim()) {
            setError("무대 음원 파일, 아티스트/포스터 이미지, 또는 유튜브 URL 중 최소 1개를 등록해주세요.");
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
                    coverImage,
                    audioUrl,
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
                    유튜브 영상뿐만 아니라 <strong>AI 가수 비주얼 이미지 + 음원 파일</strong>만으로도 B1F 리스닝 쇼케이스 무대를 열 수 있습니다.
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
                        placeholder="예: [B1F 단독 쇼케이스] 첫 번째 디지털 싱글 리스닝 스테이지"
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

                {/* 1. 비주얼 & 오디오 스테이지 (이미지 + 음원 직접 첨부) */}
                <div className="upload-section-box">
                    <div className="upload-box-header">
                        <span className="upload-box-title">🎧 음원 & 비주얼 스테이지 세팅 (AI 가수 / 음원 쇼케이스 추천)</span>
                        <span className="upload-box-badge">영상 없이 무대 오픈 가능</span>
                    </div>

                    <div className="upload-controls-row" style={{ marginTop: "8px" }}>
                        <label className="file-upload-btn">
                            {uploadingImage ? "이미지 처리 중..." : "🖼️ 무대/아티스트 사진 선택"}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverFile}
                                disabled={uploadingImage}
                                hidden
                            />
                        </label>
                        <label className="file-upload-btn">
                            {uploadingAudio ? "음원 처리 중..." : "🎵 무대 타이틀 음원 파일 선택 (.mp3, .wav)"}
                            <input
                                type="file"
                                accept="audio/*,.mp3,.wav,.m4a,.ogg"
                                onChange={handleAudioFile}
                                disabled={uploadingAudio}
                                hidden
                            />
                        </label>
                    </div>

                    {audioNotice && (
                        <p className="form-hint" style={{ color: "#ffc740" }}>💡 {audioNotice}</p>
                    )}

                    {coverImage && (
                        <div className="uploaded-image-preview" style={{ marginTop: "10px" }}>
                            <img src={coverImage} alt="무대 커버 미리보기" className="post-media" style={{ maxHeight: "220px" }} />
                            <button
                                type="button"
                                className="btn-sm btn-danger"
                                style={{ marginTop: "6px" }}
                                onClick={() => setCoverImage("")}
                            >
                                이미지 제거
                            </button>
                        </div>
                    )}

                    {audioUrl && (
                        <div className="demo-audio-card" style={{ marginTop: "10px" }}>
                            <div className="demo-audio-top">
                                <span className="demo-tape-badge">STAGE MASTER TRACK</span>
                                <button
                                    type="button"
                                    className="btn-sm btn-danger"
                                    onClick={() => setAudioUrl("")}
                                >
                                    음원 제거
                                </button>
                            </div>
                            <audio controls src={audioUrl} className="b1f-audio-player" />
                        </div>
                    )}
                </div>

                {/* 2. 유튜브 영상 URL (선택) */}
                <div className="form-group">
                    <label className="form-label">🎬 유튜브 영상 / 스트리밍 URL (선택 — 영상이 있을 경우 입력)</label>
                    <input
                        type="url"
                        value={embedUrl}
                        onChange={(e) => setEmbedUrl(e.target.value)}
                        className="form-input"
                        placeholder="https://www.youtube.com/watch?v=... (음원/이미지로만 진행 시 비워두셔도 됩니다)"
                    />
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
                        placeholder="이번 무대를 위해 준비한 곡의 배경과 스토리를 관객들에게 들려주세요!"
                        rows={3}
                    />
                </div>

                {error && <p className="form-error">{error}</p>}

                <div className="form-actions">
                    <Link href="/dashboard/live" className="btn btn-secondary">취소</Link>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting || uploadingAudio || uploadingImage}
                    >
                        {submitting ? "편성 중..." : "무대 편성 완료"}
                    </button>
                </div>
            </form>
        </div>
    );
}
