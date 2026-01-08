"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// --- 类型定义 ---
interface MapPlayer {
  id: string;
  name: string;
  level: number;
  loc_x: number;
  loc_y: number;
}

// --- 核心配置区 ---
const CONFIG = {
  mapImage: "/palworld-map.webp",

  // 地图逻辑边界 (Wiki 标准)
  mapBounds: {
    minX: -1954.07407407,
    maxX: 1200.26143791,
    minY: -1908.61002179,
    maxY: 1245.7254902,
  },

  calibration: {
    anchor: {
      // 你的校准锚点
      rawX: -307361.34,
      rawY: 191524.59,
      gameX: 73,
      gameY: -400,
    },
    // 比例系数
    scaleX: 0.011,
    scaleY: 0.011,
  },
};

export default function MapPage() {
  const [players, setPlayers] = useState<MapPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [cursorCoord, setCursorCoord] = useState({ x: 0, y: 0 });

  // 地图视图状态
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // 获取数据
  const fetchPlayers = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch("/api/live-players");
      const data = await res.json();
      if (data.success && Array.isArray(data.players)) {
        setPlayers(data.players);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(() => fetchPlayers(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // --- 核心工具函数：原始坐标 -> 游戏显示坐标 ---
  const toGameCoords = (rawX: number, rawY: number) => {
    const { anchor, scaleX, scaleY } = CONFIG.calibration;
    // 使用校准公式计算
    const gameX = (rawX - anchor.rawX) * scaleX + anchor.gameX;
    const gameY = (rawY - anchor.rawY) * scaleY + anchor.gameY;
    return {
      x: Math.round(gameX),
      y: Math.round(gameY),
    };
  };

  // --- 坐标转换逻辑 (用于 CSS 定位) ---
  const getPositionStyle = (rawX: number, rawY: number) => {
    // 1. 先转成游戏坐标
    const { x: gameX, y: gameY } = toGameCoords(rawX, rawY);
    const { mapBounds } = CONFIG;

    // 2. 再转成百分比
    const width = mapBounds.maxX - mapBounds.minX;
    const height = mapBounds.maxY - mapBounds.minY;

    const leftPercent = ((gameX - mapBounds.minX) / width) * 100;
    const topPercent = ((mapBounds.maxY - gameY) / height) * 100;

    return { left: `${leftPercent}%`, top: `${topPercent}%` };
  };

  // --- 鼠标移动逻辑 ---
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setTransform((p) => ({
        ...p,
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      }));
    }
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;
      const percentX = relativeX / rect.width;
      const percentY = relativeY / rect.height;

      const { mapBounds } = CONFIG;
      const width = mapBounds.maxX - mapBounds.minX;
      const height = mapBounds.maxY - mapBounds.minY;

      const currentGameX = mapBounds.minX + percentX * width;
      const currentGameY = mapBounds.maxY - percentY * height;

      setCursorCoord({
        x: Math.round(currentGameX),
        y: Math.round(currentGameY),
      });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const scaleAmount = -e.deltaY * 0.001;
    setTransform((p) => ({
      ...p,
      scale: Math.min(Math.max(0.1, p.scale + scaleAmount), 20),
    }));
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - transform.x,
      y: e.clientY - transform.y,
    };
  };
  const handleMouseUp = () => setIsDragging(false);

  const markerScale = 1 / transform.scale;

  return (
    <div className="w-screen h-screen bg-[#0D151C] overflow-hidden relative text-white font-sans select-none flex">
      {/* 侧边栏 */}
      <div className="w-64 h-full bg-gray-900/95 border-r border-white/10 flex flex-col z-50 shadow-2xl backdrop-blur-md">
        <div className="p-4 border-b border-white/10 bg-black/20">
          <h1 className="text-xl font-bold text-blue-400 mb-1">🗺️ 帕鲁监控</h1>
          <div className="text-[10px] text-gray-500 mb-3 flex justify-between">
            <span>自动刷新: 15s</span>
            <span>更新于: {lastUpdated}</span>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-center py-2 rounded text-xs transition-colors"
            >
              ⬅️ 榜单
            </Link>
            <button
              onClick={() => fetchPlayers(false)}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-center py-2 rounded text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {loading && (
                <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              )}
              {loading ? "同步中" : "立即刷新"}
            </button>
          </div>
        </div>

        {/* 列表区域 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {isFirstLoad ? (
            <div className="text-center text-gray-500 mt-10 text-sm animate-pulse">
              正在连接卫星...
            </div>
          ) : players.length === 0 ? (
            <div className="text-gray-500 text-center mt-10 text-sm">
              暂无在线玩家
            </div>
          ) : (
            players.map((p) => {
              // 在这里转换坐标，供列表显示
              const gamePos = toGameCoords(p.loc_x, p.loc_y);
              return (
                <div
                  key={p.id}
                  className="bg-gray-800/50 p-3 rounded-lg border border-white/5 hover:bg-gray-700/80 hover:border-blue-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-200">{p.name}</span>
                    <span className="text-xs bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">
                      Lv.{p.level}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    {/* 显示转换后的游戏坐标 */}
                    <span className="text-blue-400/80">
                      坐标： {gamePos.x}, {gamePos.y}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="p-2 text-[10px] text-gray-600 text-center border-t border-white/5">
          Palworld Map Monitor v1.2
        </div>
      </div>

      {/* 地图区域 */}
      <div className="flex-1 relative h-full bg-[#050505]">
        <div className="absolute bottom-4 left-4 z-40 bg-black/60 px-3 py-1 rounded text-xs font-mono text-yellow-500 pointer-events-none border border-white/10">
          坐标： {cursorCoord.x}, {cursorCoord.y}
        </div>

        <div
          className="w-full h-full flex items-center justify-center cursor-crosshair overflow-hidden"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div
            ref={mapContainerRef}
            className="relative w-[800px] h-[800px] origin-center will-change-transform"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            }}
          >
            <Image
              src={CONFIG.mapImage}
              alt="Map"
              fill
              className="object-contain pointer-events-none"
              priority
              draggable={false}
            />

            {players.map((p) => {
              // 在这里也转换一次，供悬浮气泡显示
              const gamePos = toGameCoords(p.loc_x, p.loc_y);
              return (
                <div
                  key={p.id}
                  className="absolute flex flex-col items-center justify-center group z-10"
                  style={{
                    ...getPositionStyle(p.loc_x, p.loc_y),
                    transform: `translate(-50%, -50%) scale(${markerScale})`,
                  }}
                >
                  <div className="relative cursor-pointer">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-50"></div>
                    <div className="relative w-3 h-3 bg-red-600 rounded-full border border-white shadow-sm"></div>

                    {/* 悬浮信息 */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                      <div className="bg-gray-900/95 text-white text-[12px] px-3 py-2 rounded-lg border border-gray-600 whitespace-nowrap shadow-xl flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-300 text-sm">
                            {p.name}
                          </span>
                          <span className="text-gray-400 text-xs bg-gray-800 px-1 rounded">
                            Lv.{p.level}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {/* 这里也显示转换后的坐标 */}({gamePos.x},{" "}
                          {gamePos.y})
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-gray-900/95 border-r border-b border-gray-600 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
