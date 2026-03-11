"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        passwordConfirm: "",
        username: "",
        role: "FAN" as "ARTIST" | "FAN",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "회원가입 실패");
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
            <h1 className="auth-title">회원가입</h1>
            <p className="auth-subtitle">Odeon과 함께 음악을 시작하세요</p>

            <form onSubmit={handleSubmit} className="auth-form">
                {/* 역할 선택 */}
                <div className="role-selector">
                    <button
                        type="button"
                        className={`role-btn ${formData.role === "FAN" ? "active" : ""}`}
                        onClick={() => setFormData((p) => ({ ...p, role: "FAN" }))}
                    >
                        🎧 팬
                    </button>
                    <button
                        type="button"
                        className={`role-btn ${formData.role === "ARTIST" ? "active" : ""}`}
                        onClick={() => setFormData((p) => ({ ...p, role: "ARTIST" }))}
                    >
                        🎤 아티스트
                    </button>
                </div>

                <div className="form-group">
                    <label htmlFor="username" className="form-label">닉네임</label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="활동할 닉네임을 입력하세요"
                        value={formData.username}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>

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
                    {loading ? "처리 중..." : "가입하기"}
                </button>
            </form>

            <p className="auth-footer">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="auth-link">로그인</Link>
            </p>
        </div>
    );
}
