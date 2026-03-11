"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const isArtist = (session?.user as { role?: string })?.role === "ARTIST";

    useEffect(() => {
        if (status === "unauthenticated" || (status === "authenticated" && !isArtist)) {
            router.replace("/");
        }
    }, [status, isArtist, router]);

    if (status === "loading") {
        return (
            <>
                <Header />
                <div className="loading-full">로딩 중...</div>
            </>
        );
    }

    if (!session || !isArtist) return null;

    const navItems = [
        { href: "/dashboard", label: "📊 개요", exact: true },
        { href: "/dashboard/earnings", label: "🍫 수입 내역" },
        { href: "/dashboard/live", label: "📡 라이브 관리" },
    ];

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                {/* 사이드 메뉴 */}
                <aside className="dashboard-sidebar">
                    <div className="dashboard-sidebar-header">
                        <p className="sidebar-label">아티스트 대시보드</p>
                        <p className="sidebar-name">🎤 {session.user?.name}</p>
                    </div>
                    <nav className="sidebar-nav">
                        {navItems.map((item) => {
                            const isActive = item.exact
                                ? pathname === item.href
                                : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-link ${isActive ? "active" : ""}`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* 메인 영역 */}
                <main className="dashboard-main">{children}</main>
            </div>
        </>
    );
}
