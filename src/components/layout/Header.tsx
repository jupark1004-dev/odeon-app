"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const userId = (session?.user as { id?: string })?.id;
    const isArtist = (session?.user as { role?: string })?.role === "ARTIST";
    const [menuOpen, setMenuOpen] = useState(false);
    const [displayName, setDisplayName] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        const fetchLatestName = () => {
            fetch(`/api/artist/${userId}`)
                .then((r) => r.ok ? r.json() : null)
                .then((d) => {
                    if (d?.username) setDisplayName(d.username);
                })
                .catch(() => {});
        };
        fetchLatestName();
        window.addEventListener("b1f-profile-updated", fetchLatestName);
        return () => window.removeEventListener("b1f-profile-updated", fetchLatestName);
    }, [userId]);

    const currentName = displayName ?? session?.user?.name ?? session?.user?.email;

    const navLinks = [
        { href: "/live", label: "🎸 라이브 무대 (Stage)" },
        { href: "/posts", label: "📹 지하 연습실 (Practice Log)" },
        ...(isArtist ? [{ href: "/dashboard", label: "🎛️ 아티스트 스튜디오" }] : []),
    ];

    return (
        <header className="header">
            <div className="header-inner">
                {/* 로고 */}
                <Link href="/" className="header-logo" onClick={() => setMenuOpen(false)}>
                    <span className="b1f-badge">B1F</span>
                    <span className="header-logo-text">LIVEHOUSE</span>
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
                                <Link href="/posts/new" className="btn-new-post">
                                    + 연습일지 기록
                                </Link>
                            )}
                            <Link
                                href={isArtist && userId ? `/artist/${userId}` : "/dashboard"}
                                className="user-info"
                                title="내 프로필 보기"
                            >
                                <span className="user-role-badge">
                                    {isArtist ? "🎤 뮤지션" : "🎟️ 관객"}
                                </span>
                                <span className="user-name">{currentName}</span>
                            </Link>
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="btn-logout"
                            >
                                퇴장
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="btn-login">입장 (로그인)</Link>
                            <Link href="/signup" className="btn-signup">멤버 등록</Link>
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
                            <Link
                                href={isArtist && userId ? `/artist/${userId}` : "/dashboard"}
                                className="mobile-user-info"
                                onClick={() => setMenuOpen(false)}
                            >
                                <span>{isArtist ? "🎤 뮤지션" : "🎟️ 관객"}</span>
                                <span>{currentName}</span>
                            </Link>
                            <button
                                className="mobile-nav-link"
                                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                                style={{ textAlign: "left", background: "none", border: "none", color: "#f87171", cursor: "pointer" }}
                            >
                                퇴장 (로그아웃)
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>입장 (로그인)</Link>
                            <Link href="/signup" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>멤버 등록 (회원가입)</Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
