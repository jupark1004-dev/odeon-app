import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/choco — 초코 후원
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const senderId = (session.user as { id: string }).id;
        const { receiverId, streamId, amount, message } = await req.json();

        if (!receiverId || !amount || amount <= 0) {
            return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
        }

        if (senderId === receiverId) {
            return NextResponse.json({ error: "자신에게 후원할 수 없습니다." }, { status: 400 });
        }

        // 잔액 확인
        const sender = await prisma.user.findUnique({ where: { id: senderId } });
        if (!sender || sender.choco_balance < amount) {
            return NextResponse.json({ error: "초코가 부족합니다." }, { status: 400 });
        }

        // 트랜잭션: 잔액 차감 + 적립 + 기록 원자적 처리
        const [, , transaction] = await prisma.$transaction([
            prisma.user.update({
                where: { id: senderId },
                data: { choco_balance: { decrement: amount } },
            }),
            prisma.user.update({
                where: { id: receiverId },
                data: { choco_balance: { increment: amount } },
            }),
            prisma.chocoTransaction.create({
                data: { senderId, receiverId, streamId: streamId ?? null, amount, message: message ?? null },
            }),
        ]);

        return NextResponse.json(
            { message: `초코 ${amount}개를 후원했습니다! 🍫`, transaction },
            { status: 201 }
        );
    } catch (error) {
        console.error("[CHOCO POST]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
