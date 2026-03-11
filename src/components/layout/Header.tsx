"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const isArtist = (session?.user as { role?: string })?.role === "ARTIST";
    const [menuOpen, setMenuOpen] = useState(false);

    const navLinks = [
        { href: "/live", label: "📡 라이브" },
        { href: "/posts", label: "📝 포스트" },
        ...(isArtist ? [{ href: "/dashboard", label: "📊 대시보드" }] : []),
    ];

    return (
        <header className="header">
            <div className="header-inner">
                {/* 로고 */}
                <Link href="/" className="header-logo" onClick={() => setMenuOpen(false)}>
                    <span className="header-logo-icon">🎵</span>
                    <span className="header-logo-text">Odeon</span>
                </Link>

                {/* 데스크톱 내비게이션 */}
                <nav className="header-nav">
                    {navLinks.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-link ${pathname.startsWith(item.href) ? "active" : ""}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* 데스크톱 유저 영역 */}
                <div className="header-user">
                    {session ? (
                        <>
                            {isArtist && (
                                <Link href="/dashboard" className="btn-new-post">
                                    📊 대시보드
                                </Link>
                            )}
                            <div className="user-info">
                                <span className="user-role-badge">
                                    {isArtist ? "🎤" : "🎧"}
                                </span>
                                <span className="user-name">{session.user?.name ?? session.user?.email}</span>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="btn-logout"
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="btn-login">로그인</Link>
                            <Link href="/signup" className="btn-signup">회원가입</Link>
                        </>
                    )}
                </div>

                {/* 모바일 햄버거 버튼 */}
                <button
                    className="hamburger"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="메뉴 열기"
                >
                    <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
                    <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
                    <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
                </button>
            </div>

            {/* 모바일 드롭다운 메뉴 */}
            {menuOpen && (
                <div className="mobile-menu">
                    {navLinks.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`mobile-nav-link ${pathname.startsWith(item.href) ? "active" : ""}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <div className="mobile-menu-divider" />
                    {session ? (
                        <>
                            <div className="mobile-user-info">
                                <span>{isArtist ? "🎤" : "🎧"}</span>
                                <span>{session.user?.name ?? session.user?.email}</span>
                            </div>
                            <button
                                className="mobile-nav-link"
                                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                                style={{ textAlign: "left", background: "none", border: "none", color: "#f87171", cursor: "pointer" }}
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>로그인</Link>
                            <Link href="/signup" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>회원가입</Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
