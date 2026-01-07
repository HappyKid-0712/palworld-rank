// app/api/sync/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

// ✅ 修改点：把 request 改为 _request，或者直接删掉参数 ()
export async function GET() {
  // 2. 删除了未使用的 'searchParams' 和 'key' 变量，消除 unused variable 警告

  try {
    const auth = Buffer.from(
      `${process.env.PAL_USER}:${process.env.PAL_PASS}`
    ).toString("base64");

    const res = await fetch(`${process.env.PAL_HOST}/v1/api/players`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Palworld API Error: ${res.status}`);

    // 3. 显式断言返回数据的类型
    const data = (await res.json()) as { players: PalPlayer[] };
    const players = data.players || [];

    let updatedCount = 0;

    for (const p of players) {
      // p 现在有明确的类型 PalPlayer，不会报 any 错误
      await prisma.player.upsert({
        where: { name: p.name },
        update: {
          level: p.level,
          lastSeen: new Date(),
          loc_x: p.location_x,
          loc_y: p.location_y,
          playerId: p.userId || p.playerId,
        },
        create: {
          name: p.name,
          level: p.level,
          playerId: p.userId || p.playerId,
          loc_x: p.location_x,
          loc_y: p.location_y,
        },
      });
      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      msg: `Synced ${updatedCount} players`,
      online_now: players.length,
    });
  } catch (error: unknown) {
    // 4. 安全地处理错误类型
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
