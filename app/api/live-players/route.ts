import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 引入数据库客户端

interface PalPlayer {
  name: string;
  playerId?: string;
  userId?: string;
  level: number;
  location_x?: number;
  location_y?: number;
  ip?: string;
  ping?: number;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = Buffer.from(
      `${process.env.PAL_USER}:${process.env.PAL_PASS}`
    ).toString("base64");

    const res = await fetch(`${process.env.PAL_HOST}/v1/api/players`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Palworld API Error: ${res.status}`);

    const data = (await res.json()) as { players: PalPlayer[] };
    const players = data.players || [];

    // 1. 整理数据
    const validPlayers = players
      .filter((p) => p.location_x !== undefined && p.location_y !== undefined)
      .map((p) => ({
        name: p.name,
        level: p.level,
        id: p.userId || p.playerId || p.name,
        loc_x: p.location_x!,
        loc_y: p.location_y!,
      }));

    // 2. [新增功能] 同步写入数据库
    // 使用 Promise.all 并发处理，提高速度
    if (validPlayers.length > 0) {
      await Promise.all(
        validPlayers.map((p) =>
          prisma.player.upsert({
            where: { name: p.name }, // 以名字为唯一键
            update: {
              level: p.level,
              loc_x: p.loc_x,
              loc_y: p.loc_y,
              lastSeen: new Date(), // 更新最后在线时间
              playerId: p.id,
            },
            create: {
              name: p.name,
              level: p.level,
              loc_x: p.loc_x,
              loc_y: p.loc_y,
              playerId: p.id,
              lastSeen: new Date(),
            },
          })
        )
      );
    }

    // 3. 返回数据给前端
    return NextResponse.json({
      success: true,
      players: validPlayers,
      savedCount: validPlayers.length, // 告诉前端存了多少人
    });
  } catch (error: unknown) {
    console.error("Live API Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
