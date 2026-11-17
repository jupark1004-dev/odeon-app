import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 B1F 언더그라운드 라이브하우스 시드 데이터 생성 시작...");

    // 기존 데이터 초기화
    await prisma.cheer.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.post.deleteMany();
    await prisma.liveStream.deleteMany();

    // 1. 아티스트 계정 2팀 생성
    const artistPassword = await bcrypt.hash("artist123!", 12);
    const artist1 = await prisma.user.upsert({
        where: { email: "artist@odeon.com" },
        update: {
            username: "네온즈 (NEONS)",
            role: "ARTIST",
            genre: "지하아이돌 / 퍼포먼스팀",
            bio: "홍대 지하 1층 연습실에서 매일 밤 땀 흘리며 단독 무대를 만드는 4인조 라이브 퍼포먼스 팀입니다 ⚡",
        },
        create: {
            email: "artist@odeon.com",
            password: artistPassword,
            username: "네온즈 (NEONS)",
            role: "ARTIST",
            genre: "지하아이돌 / 퍼포먼스팀",
            bio: "홍대 지하 1층 연습실에서 매일 밤 땀 흘리며 단독 무대를 만드는 4인조 라이브 퍼포먼스 팀입니다 ⚡",
        },
    });

    const artist2 = await prisma.user.upsert({
        where: { email: "band@b1f.live" },
        update: {
            username: "새벽합주실 (2AM ROOM)",
            role: "ARTIST",
            genre: "인디 밴드 / 록",
            bio: "보정 없는 원테이크 사운드로 승부하는 3피스 록 밴드. 우리의 무대는 언제나 B1F에서 시작됩니다 🎸",
        },
        create: {
            email: "band@b1f.live",
            password: artistPassword,
            username: "새벽합주실 (2AM ROOM)",
            role: "ARTIST",
            genre: "인디 밴드 / 록",
            bio: "보정 없는 원테이크 사운드로 승부하는 3피스 록 밴드. 우리의 무대는 언제나 B1F에서 시작됩니다 🎸",
        },
    });

    // 2. 관객(팬) 계정 생성
    const fanPassword = await bcrypt.hash("fan123456", 12);
    const fan1 = await prisma.user.upsert({
        where: { email: "fan@odeon.com" },
        update: { username: "1열고정석", role: "FAN" },
        create: {
            email: "fan@odeon.com",
            password: fanPassword,
            username: "1열고정석",
            role: "FAN",
        },
    });

    const fan2 = await prisma.user.upsert({
        where: { email: "scout@b1f.live" },
        update: { username: "심야리스너", role: "FAN" },
        create: {
            email: "scout@b1f.live",
            password: fanPassword,
            username: "심야리스너",
            role: "FAN",
        },
    });

    // 3. B1F 무대(Stage) 3건 생성
    const stage1 = await prisma.liveStream.create({
        data: {
            artistId: artist1.id,
            title: "[B1F金曜公演] 네온즈 14일간의 합주 결산 단독 라이브",
            embedUrl: "https://www.youtube.com/embed/jfKfPfyJRdk",
            isLive: true,
            status: "LIVE",
            scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
            setlist: "1. Basement Overture (Intro)\n2. 지하 1층의 별빛 (New Song)\n3. 땀방울 시그널 (Original Ver.)\n4. Encore: 새벽을 달리는 우리",
            description: "지난 2주간 지하 연습실에서 하루도 빠짐없이 호흡을 맞춘 신곡 '지하 1층의 별빛'을 처음 공개하는 무대입니다. 1열에서 함께 외쳐주세요!",
        },
    });

    const stage2 = await prisma.liveStream.create({
        data: {
            artistId: artist2.id,
            title: "[D-3 예고] 새벽합주실 무보정 원테이크 어쿠스틱 & 록 세션",
            embedUrl: "https://www.youtube.com/embed/5qap5aO4i9A",
            isLive: false,
            status: "UPCOMING",
            scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            setlist: "1. 좁은 방의 앰프 소리\n2. 고장난 메트로놈\n3. B1F Exit (Unplugged)",
            description: "오직 기타, 베이스, 드럼 그리고 날것의 보컬만으로 채우는 40분간의 원테이크 쇼케이스입니다. 무료 입장 정리번호를 미리 발권하세요!",
        },
    });

    await prisma.liveStream.create({
        data: {
            artistId: artist1.id,
            title: "[지난 무대 아카이브] 네온즈 첫 번째 지하 소극장 데뷔 쇼케이스",
            embedUrl: "https://www.youtube.com/embed/jfKfPfyJRdk",
            isLive: false,
            status: "ENDED",
            scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            setlist: "1. First Step in B1F\n2. 빛이 스며드는 계단",
            description: "관객 5명으로 시작했던 우리의 첫 번째 B1F 무대 기록.",
        },
    });

    // 4. 지하 연습실 일지 (Practice Logs — 무대 연결 서사)
    await prisma.post.createMany({
        data: [
            {
                artistId: artist1.id,
                stageId: stage1.id,
                practiceDay: 3,
                category: "곡 작업",
                content: "단독 무대에 올릴 신곡 '지하 1층의 별빛' 가이드 녹음 완료! 아직 가사가 설익었지만 우리 이야기를 그대로 담았습니다.",
            },
            {
                artistId: artist1.id,
                stageId: stage1.id,
                practiceDay: 9,
                category: "보컬/안무",
                content: "새벽 3시 연습실 거울 앞. 라이브로 흔들림 없이 부르기 위해 달리기하면서 라이브 연습 중입니다. 숨이 턱끝까지 차오르지만 무대에서 후회하기 싫어요.",
            },
            {
                artistId: artist1.id,
                stageId: stage1.id,
                practiceDay: 14,
                category: "합주/연습",
                content: "드디어 D-Day 최종 리허설 완료! 14일 동안 지하 연습실 바닥에 흘린 땀방울을 오늘 무대 위에서 전부 터뜨리겠습니다. 입장권 발권해주신 관객분들 곧 만나요! 🔥",
            },
            {
                artistId: artist2.id,
                stageId: stage2.id,
                practiceDay: 7,
                category: "합주/연습",
                content: "3일 뒤 열릴 원테이크 세션을 위해 메트로놈 없이 세 명 눈빛만으로 템포 맞추는 합주 5시간째. 기타 줄이 두 번 끊어졌습니다.",
            },
        ],
    });

    // 5. 입장권(정리번호 Ticket) 발권 샘플
    await prisma.ticket.createMany({
        data: [
            { streamId: stage1.id, userId: fan1.id, entryNumber: 1 },
            { streamId: stage1.id, userId: fan2.id, entryNumber: 2 },
            { streamId: stage2.id, userId: fan1.id, entryNumber: 1 },
        ],
    });

    // 6. 무대 응원 슬로건(Cheer) 샘플
    await prisma.cheer.createMany({
        data: [
            {
                senderId: fan1.id,
                receiverId: artist1.id,
                streamId: stage1.id,
                badge: "🕯️ 1열대기",
                message: "입장 정리번호 #001 발권 완료!! 연습일지 Day 3부터 매일 챙겨봤는데 드디어 본 무대네요 🔥",
            },
            {
                senderId: fan2.id,
                receiverId: artist1.id,
                streamId: stage1.id,
                badge: "💪 땀방울증인",
                message: "새벽 3시 연습 일지 보고 입덕했습니다. 진짜 실력파들이 빛을 보는 무대가 되길!",
            },
            {
                senderId: fan1.id,
                receiverId: artist2.id,
                streamId: stage2.id,
                badge: "🎸 미친연주",
                message: "무보정 원테이크 세션 너무 기대됩니다! 티켓 1번으로 대기 중!",
            },
        ],
    });

    console.log("✅ B1F 시드 데이터 생성 완료!");
    console.log("   뮤지션1: artist@odeon.com / artist123! (네온즈)");
    console.log("   뮤지션2: band@b1f.live / artist123! (새벽합주실)");
    console.log("   관객1:   fan@odeon.com / fan123456 (1열고정석)");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
