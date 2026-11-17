import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/lives/[id]/ticket — B1F 무대 무료 입장권(정리번호) 발권
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "입장권을 발권하려면 먼저 로그인해주세요." }, { status: 401 });
        }

        const { id: streamId } = await params;
        const userId = (session.user as { id: string }).id;

        const stream = await prisma.liveStream.findUnique({
            where: { id: streamId },
        });

        if (!stream) {
            return NextResponse.json({ error: "존재하지 않는 무대입니다." }, { status: 404 });
        }

        // 이미 발권했는지 확인
        const existing = await prisma.ticket.findUnique({
            where: {
                streamId_userId: { streamId, userId },
            },
        });

        if (existing) {
            return NextResponse.json({
                message: `이미 입장권이 발권되었습니다! (입장 정리번호 #${String(existing.entryNumber).padStart(3, "0")})`,
                ticket: existing,
            });
        }

        // 현재 마지막 정리번호 조회 후 +1 부여
        const lastTicket = await prisma.ticket.findFirst({
            where: { streamId },
            orderBy: { entryNumber: "desc" },
        });
        const nextEntryNumber = (lastTicket?.entryNumber ?? 0) + 1;

        const ticket = await prisma.ticket.create({
            data: {
                streamId,
                userId,
                entryNumber: nextEntryNumber,
            },
            include: {
                user: { select: { id: true, username: true } },
            },
        });

        return NextResponse.json(
            {
                message: `🎟️ B1F 입장 정리번호 #${String(ticket.entryNumber).padStart(3, "0")} 발권 완료!`,
                ticket,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[TICKET POST]", error);
        return NextResponse.json({ error: "입장권 발권 중 오류가 발생했습니다." }, { status: 500 });
    }
}
