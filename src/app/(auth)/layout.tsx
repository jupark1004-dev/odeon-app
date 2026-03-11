export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="auth-layout">
            <div className="auth-container">
                {/* 로고 */}
                <div className="auth-logo">
                    <span className="auth-logo-icon">🎵</span>
                    <span className="auth-logo-text">Odeon</span>
                </div>
                {children}
            </div>
        </div>
    );
}
