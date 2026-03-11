import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("🌱 시드 데이터 생성 시작...");

    // 아티스트 계정 생성
    const artistPassword = await bcrypt.hash("artist123!", 12);
    const artist = await prisma.user.upsert({
        where: { email: "artist@odeon.com" },
        update: {},
        create: {
            email: "artist@odeon.com",
            password: artistPassword,
            username: "김오데온",
            role: "ARTIST",
            bio: "피아노와 기타를 연주하는 싱어송라이터입니다 🎹",
            choco_balance: 0,
        },
    });

    // 팬 계정 생성
    const fanPassword = await bcrypt.hash("fan123456", 12);
    const fan = await prisma.user.upsert({
        where: { email: "fan@odeon.com" },
        update: {},
        create: {
            email: "fan@odeon.com",
            password: fanPassword,
            username: "열렬팬",
            role: "FAN",
            choco_balance: 500,
        },
    });

    // 라이브 방송 2건
    const live1 = await prisma.liveStream.create({
        data: {
            artistId: artist.id,
            title: "🎹 피아노 즉흥 연주 라이브",
            embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            isLive: true,
        },
    });

    await prisma.liveStream.create({
        data: {
            artistId: artist.id,
            title: "🎸 어쿠스틱 기타 세션",
            embedUrl: "https://www.youtube.com/embed/jNQXAC9IVRw",
            isLive: false,
        },
    });

    // 포스트 3건
    await prisma.post.createMany({
        data: [
            {
                artistId: artist.id,
                content: "오늘 연습실에서 새 곡 작업 중입니다 🎵 조만간 라이브로 선보일게요!",
            },
            {
                artistId: artist.id,
                content: "지난 주 오프라인 공연에 와주신 팬분들 정말 감사해요 🙏 여러분 덕분에 힘이 납니다.",
            },
            {
                artistId: artist.id,
                content: "아침 6시부터 피아노 연습 중... 역시 아침이 최고의 연습 시간인 것 같아요 ☀️",
            },
        ],
    });

    // 초코 후원 샘플
    await prisma.chocoTransaction.create({
        data: {
            senderId: fan.id,
            receiverId: artist.id,
            streamId: live1.id,
            amount: 50,
            message: "최고예요! 항상 응원합니다 🍫",
        },
    });

    // 팬의 잔액 차감, 아티스트 적립
    await prisma.user.update({ where: { id: fan.id }, data: { choco_balance: { decrement: 50 } } });
    await prisma.user.update({ where: { id: artist.id }, data: { choco_balance: { increment: 50 } } });

    console.log("✅ 시드 데이터 생성 완료!");
    console.log(`   아티스트: artist@odeon.com / artist123!`);
    console.log(`   팬:       fan@odeon.com / fan123456`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
