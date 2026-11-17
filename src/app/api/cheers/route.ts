import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/cheers — 무대 또는 아티스트에게 응원 슬로건 남기기
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "응원 슬로건을 남기려면 로그인해주세요." }, { status: 401 });
        }

        const senderId = (session.user as { id: string }).id;
        const { receiverId, streamId, badge, message } = await req.json();

        if (!receiverId || !message?.trim()) {
            return NextResponse.json({ error: "응원 메시지를 입력해주세요." }, { status: 400 });
        }

        const cheer = await prisma.cheer.create({
            data: {
                senderId,
                receiverId,
                streamId: streamId || null,
                badge: badge || "🔥 최애무대",
                message: message.trim(),
            },
            include: {
                sender: { select: { id: true, username: true } },
            },
        });

        return NextResponse.json(
            { message: "응원 슬로건이 무대 전광판에 걸렸습니다! 🙌", cheer },
            { status: 201 }
        );
    } catch (error) {
        console.error("[CHEER POST]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
