// app/api/sync/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 实例化 Prisma (避免开发环境热重载产生过多连接)

export async function GET(request: Request) {
  // 1. 简单的权限验证 (通过 URL 参数或 Header)
  // Vercel Cron 会自动带上 Authorization Header，我们这里简单演示用 URL 参数方便浏览器测试
  // 生产环境建议检查 Header
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  // 如果想严格点，检查 request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`

  try {
    // 2. 构造 Basic Auth
    const auth = Buffer.from(
      `${process.env.PAL_USER}:${process.env.PAL_PASS}`
    ).toString("base64");

    // 3. 请求帕鲁服务器
    const res = await fetch(`${process.env.PAL_HOST}/v1/api/players`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Palworld API Error: ${res.status}`);

    const data = await res.json();
    const players = data.players || [];

    // 4. 写入数据库 (Upsert: 有则更新，无则插入)
    let updatedCount = 0;

    for (const p of players) {
      // 数据清洗：API返回的数据可能不全，做个防御性编程
      await prisma.player.upsert({
        where: { name: p.name }, // 根据名字查找
        update: {
          level: p.level,
          lastSeen: new Date(),
          loc_x: p.location_x,
          loc_y: p.location_y,
          playerId: p.userId || p.playerId, // 尝试保存 ID
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
