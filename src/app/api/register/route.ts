import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { email, password, username, role } = await req.json();

        // 입력 검증
        if (!email || !password || !username || !role) {
            return NextResponse.json(
                { error: "모든 필드를 입력해주세요." },
                { status: 400 }
            );
        }

        if (!["ARTIST", "FAN"].includes(role)) {
            return NextResponse.json(
                { error: "역할은 ARTIST 또는 FAN이어야 합니다." },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "비밀번호는 8자 이상이어야 합니다." },
                { status: 400 }
            );
        }

        // 이메일 중복 체크
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "이미 사용 중인 이메일입니다." },
                { status: 409 }
            );
        }

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 12);

        // 유저 생성
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username,
                role,
            },
        });

        return NextResponse.json(
            {
                message: "회원가입이 완료되었습니다.",
                user: { id: user.id, email: user.email, username: user.username, role: user.role },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[REGISTER ERROR]", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
