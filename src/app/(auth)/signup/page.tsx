"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const GENRE_OPTIONS = [
    "지하아이돌 / 퍼포먼스팀",
    "인디 밴드 / 록",
    "싱어송라이터",
    "보컬리스트",
    "피아노 / 기타 / 세션",
    "힙합 / R&B / 일렉트로닉",
];

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        passwordConfirm: "",
        username: "",
        role: "FAN" as "ARTIST" | "FAN",
        genre: "지하아이돌 / 퍼포먼스팀",
        bio: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.passwordConfirm) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }

        if (formData.password.length < 8) {
            setError("비밀번호는 8자 이상이어야 합니다.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    username: formData.username,
                    role: formData.role,
                    genre: formData.role === "ARTIST" ? formData.genre : undefined,
                    bio: formData.role === "ARTIST" ? formData.bio : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "등록 실패");
                return;
            }

            router.push("/login?registered=true");
        } catch {
            setError("네트워크 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <h1 className="auth-title">B1F 멤버 등록</h1>
            <p className="auth-subtitle">지하 연습실의 땀방울부터 약속된 라이브 무대까지</p>

            <form onSubmit={handleSubmit} className="auth-form">
                {/* 역할 선택 */}
                <div className="role-selector">
                    <button
                        type="button"
                        className={`role-btn ${formData.role === "FAN" ? "active" : ""}`}
                        onClick={() => setFormData((p) => ({ ...p, role: "FAN" }))}
                    >
                        🎟️ 관객 / 팬
                    </button>
                    <button
                        type="button"
                        className={`role-btn ${formData.role === "ARTIST" ? "active" : ""}`}
                        onClick={() => setFormData((p) => ({ ...p, role: "ARTIST" }))}
                    >
                        🎤 뮤지션 / 팀
                    </button>
                </div>

                <div className="form-group">
                    <label htmlFor="username" className="form-label">
                        {formData.role === "ARTIST" ? "팀명 / 아티스트 활동명" : "관객 닉네임"}
                    </label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder={formData.role === "ARTIST" ? "예: 네온즈 (NEONS) / 김결" : "공연장에서 불릴 닉네임"}
                        value={formData.username}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>

                {formData.role === "ARTIST" && (
                    <>
                        <div className="form-group">
                            <label htmlFor="genre" className="form-label">활동 분야 / 포지션</label>
                            <select
                                id="genre"
                                name="genre"
                                value={formData.genre}
                                onChange={handleChange}
                                className="form-input"
                            >
                                {GENRE_OPTIONS.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="bio" className="form-label">팀 소개 & 무대 각오 (선택)</label>
                            <input
                                id="bio"
                                name="bio"
                                type="text"
                                placeholder="예: 홍대 지하 연습실에서 첫 단독 무대를 준비하는 4인조 밴드"
                                value={formData.bio}
                                onChange={handleChange}
                                className="form-input"
                                maxLength={120}
                            />
                        </div>
                    </>
                )}

                <div className="form-group">
                    <label htmlFor="email" className="form-label">이메일</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="이메일 주소를 입력하세요"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password" className="form-label">비밀번호</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="8자 이상 입력하세요"
                        value={formData.password}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="passwordConfirm" className="form-label">비밀번호 확인</label>
                    <input
                        id="passwordConfirm"
                        name="passwordConfirm"
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>

                {error && <p className="form-error">{error}</p>}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                >
                    {loading ? "등록 중..." : "B1F 시작하기"}
                </button>
            </form>

            <p className="auth-footer">
                이미 멤버이신가요?{" "}
                <Link href="/login" className="auth-link">입장 (로그인)</Link>
            </p>
        </div>
    );
}
