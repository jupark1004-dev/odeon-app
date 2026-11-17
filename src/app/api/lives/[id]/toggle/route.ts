import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/lives/[id]/toggle — 무대 상태 전환 (UPCOMING -> LIVE -> ENDED -> UPCOMING)
export async function PATCH(
    req: Request,
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
            return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
        }

        let nextStatus: string;
        try {
            const body = await req.json();
            if (body?.status && ["UPCOMING", "LIVE", "ENDED"].includes(body.status)) {
                nextStatus = body.status;
            } else {
                nextStatus = live.isLive ? "ENDED" : "LIVE";
            }
        } catch {
            nextStatus = live.isLive ? "ENDED" : "LIVE";
        }

        const updated = await prisma.liveStream.update({
            where: { id },
            data: {
                status: nextStatus,
                isLive: nextStatus === "LIVE",
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[LIVE TOGGLE]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
