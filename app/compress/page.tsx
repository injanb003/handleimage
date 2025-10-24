"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type OutputFormat = "image/jpeg" | "image/webp";

type PreviewInfo = {
  url: string;
  width: number;
  height: number;
  size: number; // bytes
  mime: string;
};

export default function CompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [srcInfo, setSrcInfo] = useState<PreviewInfo | null>(null);
  const [quality, setQuality] = useState<number>(80); // 1-100
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultInfo, setResultInfo] = useState<PreviewInfo | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  // Choose sensible default output format based on input
  const outputFormat: OutputFormat = useMemo(() => {
    if (!file) return "image/webp";
    const t = file.type.toLowerCase();
    if (t.includes("png") || t.includes("webp")) return "image/webp"; // keeps alpha when present
    return "image/jpeg";
  }, [file]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("请上传图片文件");
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(f);
    objectUrlRef.current = url;
    const img = new Image();
    img.onload = () => {
      setFile(f);
      setSrcInfo({ url, width: img.width, height: img.height, size: f.size, mime: f.type });
      imgRef.current = img;
      // reset previous result
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      setResultBlob(null);
      setResultInfo(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      objectUrlRef.current = null;
      alert("图片加载失败，请重试");
    };
    img.src = url;
  }

  async function compressNow() {
    if (!imgRef.current || !srcInfo) return;
    setProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = srcInfo.width;
      canvas.height = srcInfo.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("无法获取画布上下文");
      ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);

      const q = Math.min(100, Math.max(1, quality)) / 100; // 0-1
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("压缩失败，返回空 Blob"))),
          outputFormat,
          q
        );
      });

      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;

      setResultBlob(blob);
      setResultInfo({ url, width: canvas.width, height: canvas.height, size: blob.size, mime: outputFormat });
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "压缩出错");
    } finally {
      setProcessing(false);
    }
  }

  const humanSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50 md:px-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-zinc-200 bg-white/70 px-3 py-1.5 text-sm text-zinc-700 shadow-sm transition hover:border-transparent hover:text-sky-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
            >
              ← 返回
            </Link>
            <h1 className="text-2xl font-semibold">图片压缩</h1>
          </div>
        </div>

        {/* Upload */}
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
          <input
            id="uploader"
            type="file"
            accept="image/*"
            onChange={onSelect}
            className="hidden"
          />
          <label
            htmlFor="uploader"
            className="mx-auto block w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-5 py-10 text-zinc-700 hover:border-sky-300 hover:text-sky-600 dark:border-white/10 dark:bg-white/10 dark:text-zinc-300"
          >
            {file ? (
              <span className="font-medium">已选择：{file.name}</span>
            ) : (
              <>
                <div className="text-sm">点击选择或拖拽图片到此处</div>
                <div className="mt-1 text-xs text-zinc-500">支持 JPG、PNG、WEBP 等格式</div>
              </>
            )}
          </label>
        </div>

        {/* Controls */}
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">压缩百分比（质量）</div>
              <div className="text-sm font-medium">{quality}%</div>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
            <div className="text-xs text-zinc-500">
              输出格式：{outputFormat === "image/webp" ? "WEBP（支持透明度）" : "JPEG"}
            </div>
            <div>
              <button
                disabled={!file || processing}
                onClick={compressNow}
                className="rounded-lg bg-sky-600 px-4 py-2 text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? "压缩中..." : "开始压缩"}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid content-start gap-3 rounded-2xl border border-zinc-200 bg-white/70 p-6 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="font-medium">尺寸与大小</div>
            <div className="text-zinc-600 dark:text-zinc-400">
              原图：{srcInfo ? `${srcInfo.width}×${srcInfo.height} · ${humanSize(srcInfo.size)}` : "-"}
            </div>
            <div className="text-zinc-600 dark:text-zinc-400">
              压缩：{resultInfo ? `${resultInfo.width}×${resultInfo.height} · ${humanSize(resultInfo.size)}` : "-"}
            </div>
            {srcInfo && resultInfo ? (
              <div className="text-emerald-600 dark:text-emerald-400">
                体积减少约 {Math.max(0, 100 - Math.round((resultInfo.size / srcInfo.size) * 100))}%
              </div>
            ) : null}
          </div>
        </div>

        {/* Previews */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 text-sm font-medium">原图预览</div>
            <div className="flex h-96 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
              {srcInfo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={srcInfo.url} alt="原图" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-sm text-zinc-500">请先上传图片</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">压缩预览</span>
              {resultInfo && resultBlob ? (
                <a
                  href={resultInfo.url}
                  download={genDownloadName(file, outputFormat)}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 shadow-sm transition hover:border-sky-300 hover:text-sky-600 dark:border-white/10 dark:bg-white/10 dark:text-zinc-300"
                >
                  保存压缩后图片
                </a>
              ) : null}
            </div>
            <div className="flex h-96 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
              {resultInfo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resultInfo.url} alt="压缩后" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-sm text-zinc-500">压缩后预览将在此显示</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function genDownloadName(file: File | null, mime: OutputFormat) {
  const base = file?.name?.replace(/\.[^.]+$/, "") || "compressed";
  const ext = mime === "image/webp" ? "webp" : "jpg";
  return `${base}-${Date.now()}.${ext}`;
}
