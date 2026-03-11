"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// useSearchParams는 반드시 Suspense boundary 안에서 사용해야 Next.js 빌드가 통과됨
function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get("registered");

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                setError("이메일 또는 비밀번호가 올바르지 않습니다.");
                return;
            }

            router.push("/");
            router.refresh();
        } catch {
            setError("네트워크 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1 className="auth-title">로그인</h1>
            <p className="auth-subtitle">다시 만나서 반가워요 🎵</p>

            {registered && (
                <div className="form-success">
                    회원가입이 완료되었습니다! 로그인해주세요 🎉
                </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
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
                        placeholder="비밀번호를 입력하세요"
                        value={formData.password}
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
                    {loading ? "로그인 중..." : "로그인"}
                </button>
            </form>

            <p className="auth-footer">
                아직 계정이 없으신가요?{" "}
                <Link href="/signup" className="auth-link">회원가입</Link>
            </p>
        </>
    );
}

export default function LoginPage() {
    return (
        <div className="auth-card">
            <Suspense fallback={<div className="loading-full">불러오는 중...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
