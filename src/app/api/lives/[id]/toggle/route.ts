import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/lives/[id]/toggle — isLive 상태 토글
export async function PATCH(
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
            return NextResponse.json({ error: "방송을 찾을 수 없습니다." }, { status: 404 });
        }
        if (live.artistId !== userId) {
            return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
        }

        const updated = await prisma.liveStream.update({
            where: { id },
            data: { isLive: !live.isLive },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[LIVE TOGGLE]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
