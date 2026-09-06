import { useState } from "react";
import { DEMO_CAMERAS } from "../services/demoData";
import type { Camera } from "../types";
import SurveillanceVideo from "../components/SurveillanceVideo";

type ViewMode = "grid" | "single";

export default function LiveSurveillance() {
  const [cameras] = useState<Camera[]>(DEMO_CAMERAS);

  const [view, setView] =
    useState<ViewMode>("grid");

  const [selected, setSelected] =
    useState<Camera>(cameras[0]);

  const [fullscreen, setFullscreen] =
    useState<Camera | null>(null);

  const [filterSector, setFilterSector] =
    useState("ALL");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const sectors = [
    "ALL",
    ...Array.from(
      new Set(cameras.map((camera) => camera.sector))
    ),
  ];

  const filtered = cameras.filter(
    (camera) =>
      filterSector === "ALL" ||
      camera.sector === filterSector
  );

  const openCamera = (camera: Camera) => {
    setSelected(camera);
    setView("single");
  };

  return (
    <div className="p-4 space-y-4 min-h-full">

      {/* HEADER */}

      <div className="flex items-center justify-between flex-wrap gap-3">

        <div>
          <div className="font-mono text-xs text-cyan-700 tracking-widest">
            IBVAP / LIVE SURVEILLANCE
          </div>

          <h1 className="font-display font-bold text-2xl text-white tracking-wide">
            Live Surveillance
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          {/* SECTOR FILTER */}

          <div className="flex items-center gap-1 flex-wrap">

            <span className="font-mono text-xs text-slate-500">
              SECTOR:
            </span>

            {sectors.map((sector) => (

              <button
                key={sector}
                type="button"
                onClick={() =>
                  setFilterSector(sector)
                }
                className={`px-2 py-0.5 font-mono text-xs border transition-colors ${
                  filterSector === sector
                    ? "border-cyan-500 text-cyan-400"
                    : "border-slate-700 text-slate-500 hover:border-slate-500"
                }`}
                style={
                  filterSector === sector
                    ? {
                        background:
                          "rgba(34,211,238,0.08)",
                      }
                    : {}
                }
              >
                {sector}
              </button>

            ))}

          </div>


          {/* VIEW MODE */}

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">

            <button
              type="button"
              onClick={() =>
                setView("grid")
              }
              className={`px-2 py-0.5 font-mono text-xs border transition-colors ${
                view === "grid"
                  ? "border-cyan-500 text-cyan-400"
                  : "border-slate-700 text-slate-500 hover:border-slate-500"
              }`}
            >
              GRID
            </button>

            <button
              type="button"
              onClick={() =>
                setView("single")
              }
              className={`px-2 py-0.5 font-mono text-xs border transition-colors ${
                view === "single"
                  ? "border-cyan-500 text-cyan-400"
                  : "border-slate-700 text-slate-500 hover:border-slate-500"
              }`}
            >
              SINGLE
            </button>

          </div>


          {/* ADD CAMERA */}

          <button
            type="button"
            onClick={() =>
              setShowAddModal(true)
            }
            className="px-3 py-1.5 font-mono text-xs border border-cyan-800 text-cyan-400 hover:border-cyan-600 transition-colors"
            style={{
              background:
                "rgba(34,211,238,0.05)",
            }}
          >
            + ADD CAMERA
          </button>

        </div>

      </div>


      {/* GRID VIEW */}

      {view === "grid" && (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">

          {filtered.map((camera) => {

            /*
             * PERFORMANCE FIX
             *
             * Only ONE camera is allowed to actively
             * decode video in GRID mode.
             *
             * Other cameras use the lightweight
             * simulated/preview display.
             */

            const shouldPlayVideo =
              camera.id === selected.id;

            return (

              <div
                key={camera.id}
                className={`glass-panel overflow-hidden cursor-pointer transition-all ${
                  selected.id === camera.id
                    ? "border-glow-cyan"
                    : ""
                }`}
                onClick={() =>
                  openCamera(camera)
                }
              >

                <SurveillanceVideo
                  camera={camera}
                  enableVideo={shouldPlayVideo}
                  onFullscreen={() => {
                    setFullscreen(camera);
                  }}
                />


                <div className="px-3 py-2 flex items-center justify-between border-t border-cyan-900/20">

                  <div>

                    <div className="font-mono text-xs text-slate-300">

                      {camera.camera_id}
                      {" — "}
                      {camera.name}

                    </div>

                    <div className="font-mono text-[10px] text-slate-500">

                      Sector {camera.sector}
                      {" | "}
                      {camera.type}

                    </div>

                  </div>


                  <div className="text-right">

                    <div
                      className="font-mono text-[10px]"
                      style={{
                        color:
                          camera.status === "ONLINE"
                            ? "#22c55e"
                            : "#ef4444",
                      }}
                    >
                      {camera.status}
                    </div>

                    <div className="font-mono text-[10px] text-slate-600">

                      AI: {camera.ai_status}

                    </div>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      )}


      {/* SINGLE VIEW */}

      {view === "single" && (

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">

          {/* ACTIVE CAMERA */}

          <div className="xl:col-span-3 glass-panel overflow-hidden">

            <SurveillanceVideo
              camera={selected}
              showPTZ
              enableVideo={true}
              onFullscreen={() =>
                setFullscreen(selected)
              }
            />

          </div>


          {/* CAMERA INFORMATION */}

          <div className="space-y-2">

            <div className="glass-panel p-3">

              <div className="font-mono text-xs text-cyan-400 mb-2">

                CAMERA INFO

              </div>


              <div className="space-y-1.5 text-xs font-mono">

                {[
                  ["Camera ID", selected.camera_id],
                  ["Name", selected.name],
                  ["Sector", selected.sector],
                  ["Type", selected.type],
                  ["Location", selected.location],
                  ["Status", selected.status],
                  ["FPS", `${selected.fps} fps`],
                  [
                    "Resolution",
                    selected.resolution || "—",
                  ],
                  [
                    "AI Status",
                    selected.ai_status || "—",
                  ],
                  [
                    "Reliability",
                    `${selected.reliability_score}%`,
                  ],
                  [
                    "Alerts Today",
                    `${selected.alerts_today}`,
                  ],
                ].map(([key, value]) => (

                  <div
                    key={key}
                    className="flex justify-between gap-2"
                  >

                    <span className="text-slate-600">

                      {key}

                    </span>

                    <span className="text-slate-300 text-right">

                      {value}

                    </span>

                  </div>

                ))}

              </div>

            </div>


            {/* CAMERA SELECTOR */}

            <div className="font-mono text-xs text-slate-600 mb-1">

              SELECT CAMERA

            </div>


            {filtered.map((camera) => (

              <button
                key={camera.id}
                type="button"
                onClick={() =>
                  setSelected(camera)
                }
                className={`w-full text-left px-2 py-1.5 font-mono text-xs border transition-colors ${
                  selected.id === camera.id
                    ? "border-cyan-600 text-cyan-400"
                    : "border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                }`}
                style={{
                  background:
                    selected.id === camera.id
                      ? "rgba(34,211,238,0.06)"
                      : "rgba(15,23,42,0.6)",
                }}
              >

                <div className="flex items-center justify-between">

                  <span>

                    {camera.camera_id}
                    {" — "}
                    {camera.name}

                  </span>


                  <span
                    style={{
                      color:
                        camera.status === "ONLINE"
                          ? "#22c55e"
                          : "#ef4444",
                    }}
                  >
                    ●
                  </span>

                </div>

              </button>

            ))}

          </div>

        </div>

      )}


      {/* FULLSCREEN */}

      {fullscreen && (

        <div
          className="fixed inset-0 z-50"
          style={{
            background:
              "rgba(0,0,0,0.95)",
          }}
        >

          <SurveillanceVideo
            camera={fullscreen}
            showPTZ
            isFullscreen
            enableVideo={true}
            onClose={() =>
              setFullscreen(null)
            }
          />

        </div>

      )}


      {/* ADD CAMERA MODAL */}

      {showAddModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background:
              "rgba(0,0,0,0.8)",
          }}
        >

          <div className="glass-panel p-6 w-full max-w-lg animate-fade-in">

            <div className="flex items-center justify-between mb-4">

              <span className="font-display font-bold text-lg text-cyan-400">

                ADD CAMERA

              </span>


              <button
                type="button"
                onClick={() =>
                  setShowAddModal(false)
                }
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>

            </div>


            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                setShowAddModal(false);
              }}
            >

              {[
                [
                  "Camera Name",
                  "text",
                  "Alpha Gate South",
                ],
                [
                  "Camera ID",
                  "text",
                  "CAM-07",
                ],
                [
                  "Sector",
                  "text",
                  "G-01",
                ],
                [
                  "Location",
                  "text",
                  "South Gate",
                ],
                [
                  "RTSP URL",
                  "text",
                  "rtsp://...",
                ],
                [
                  "Latitude",
                  "number",
                  "23.41",
                ],
                [
                  "Longitude",
                  "number",
                  "71.27",
                ],
              ].map(
                ([label, type, placeholder]) => (

                  <div key={label}>

                    <label className="block font-mono text-xs text-cyan-700 tracking-widest mb-1">

                      {label.toUpperCase()}

                    </label>


                    <input
                      type={type}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 font-mono text-sm text-slate-200 border border-slate-700 focus:border-cyan-500 outline-none"
                      style={{
                        background:
                          "rgba(15,23,42,0.8)",
                      }}
                    />

                  </div>

                )
              )}


              <div className="flex gap-2 pt-2">

                <button
                  type="submit"
                  className="flex-1 py-2 font-mono text-sm tracking-widest"
                  style={{
                    background:
                      "#22d3ee",
                    color:
                      "#020817",
                  }}
                >
                  ADD CAMERA
                </button>


                <button
                  type="button"
                  onClick={() =>
                    setShowAddModal(false)
                  }
                  className="px-4 py-2 font-mono text-sm border border-slate-700 text-slate-400 hover:border-slate-500"
                >
                  CANCEL
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}
