export default function HomePage() {
    return (
        <main className="home-page">
            <div className="hero">
                <div className="hero-badge">🎵 Live Now</div>
                <h1 className="hero-title">
                    오데온<br />
                    <span className="hero-title-highlight">광장에 오신 것을 환영합니다</span>
                </h1>
                <p className="hero-subtitle">
                    아티스트의 라이브 방송과 일상을 가장 가까이서 만나보세요.<br />
                    초코로 응원하고, 함께 성장하세요.
                </p>
                <div className="hero-actions">
                    <a href="/live" className="btn btn-primary">라이브 보기</a>
                    <a href="/posts" className="btn btn-secondary">포스트 피드</a>
                </div>
            </div>
        </main>
    );
}
