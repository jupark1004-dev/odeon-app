import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/dashboard/profile — 아티스트 프로필(팀명, 장르, 소개, 대표 이미지) 수정
export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const user = session.user as { id: string; role?: string };
        if (user.role !== "ARTIST") {
            return NextResponse.json({ error: "뮤지션만 수정할 수 있습니다." }, { status: 403 });
        }

        const { username, genre, bio, image } = await req.json();
        if (!username?.trim()) {
            return NextResponse.json({ error: "활동명(팀명)을 입력해주세요." }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                username: username.trim(),
                genre: genre?.trim() || null,
                bio: bio?.trim() || null,
                ...(image !== undefined ? { image: image || null } : {}),
            },
            select: {
                id: true,
                username: true,
                genre: true,
                bio: true,
                image: true,
            },
        });

        return NextResponse.json({
            message: "프로필이 저장되었습니다.",
            artist: updated,
        });
    } catch (error) {
        console.error("[PROFILE PATCH]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
