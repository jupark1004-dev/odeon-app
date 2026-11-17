import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="auth-layout">
            <div className="auth-container">
                {/* 로고 */}
                <Link href="/" className="auth-logo">
                    <span className="b1f-badge">B1F</span>
                    <span className="auth-logo-text">UNDERGROUND STAGE</span>
                </Link>
                {children}
            </div>
        </div>
    );
}
