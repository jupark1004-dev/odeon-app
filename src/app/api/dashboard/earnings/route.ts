import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/earnings — 수입 전체 내역
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const user = session.user as { id: string; role?: string };
        if (user.role !== "ARTIST") {
            return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
        }

        const [transactions, total] = await Promise.all([
            prisma.chocoTransaction.findMany({
                where: { receiverId: user.id },
                orderBy: { createdAt: "desc" },
                include: {
                    sender: { select: { username: true } },
                    stream: { select: { title: true } },
                },
            }),
            prisma.chocoTransaction.aggregate({
                where: { receiverId: user.id },
                _sum: { amount: true },
                _count: { id: true },
            }),
        ]);

        return NextResponse.json({
            transactions,
            totalAmount: total._sum.amount ?? 0,
            totalCount: total._count.id,
        });
    } catch (error) {
        console.error("[EARNINGS GET]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
