import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/lives/[id] — 무대 상세 정보 + 티켓 발권 현황 + 응원 슬로건 + 연결된 연습일지
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const live = await prisma.liveStream.findUnique({
            where: { id },
            include: {
                artist: {
                    select: { id: true, username: true, genre: true, bio: true },
                },
                tickets: {
                    orderBy: { entryNumber: "asc" },
                    include: {
                        user: { select: { id: true, username: true } },
                    },
                },
                cheers: {
                    orderBy: { createdAt: "desc" },
                    take: 30,
                    include: {
                        sender: { select: { id: true, username: true } },
                    },
                },
                practiceLogs: {
                    orderBy: { practiceDay: "desc" },
                    select: {
                        id: true,
                        content: true,
                        mediaUrl: true,
                        practiceDay: true,
                        category: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: { tickets: true, cheers: true, practiceLogs: true },
                },
            },
        });

        if (!live) {
            return NextResponse.json({ error: "무대를 찾을 수 없습니다." }, { status: 404 });
        }

        return NextResponse.json(live);
    } catch (error) {
        console.error("[LIVE GET]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}

// DELETE /api/lives/[id] — 본인 무대 삭제
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const { id } = await params;
        const userId = (session.user as { id: string }).id;

        const live = await prisma.liveStream.findUnique({ where: { id } });
        if (!live) {
            return NextResponse.json({ error: "무대를 찾을 수 없습니다." }, { status: 404 });
        }
        if (live.artistId !== userId) {
            return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
        }

        await prisma.liveStream.delete({ where: { id } });
        return NextResponse.json({ message: "무대가 삭제되었습니다." });
    } catch (error) {
        console.error("[LIVE DELETE]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
