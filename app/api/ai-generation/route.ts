import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ARK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing ARK_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt || "";
    if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

    const payload = {
      model: body?.model || "ep-20251024232519-x4mss",
      prompt,
      sequential_image_generation: body?.sequential_image_generation || "disabled",
      response_format: body?.response_format || "url",
      size: body?.size || "2K",
      stream: false,
      watermark: body?.watermark ?? true,
      // Optional advanced params passthrough
      ...("n" in body ? { n: body.n } : {}),
      ...("cfg_scale" in body ? { cfg_scale: body.cfg_scale } : {}),
      ...("sampler" in body ? { sampler: body.sampler } : {}),
      ...("steps" in body ? { steps: body.steps } : {}),
    } as Record<string, any>;

    const resp = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!resp.ok) {
      let msg = `image generation failed (${resp.status})`;
      try {
        const j = await resp.json();
        msg = j?.message || j?.error || JSON.stringify(j);
      } catch {
        try { msg = await resp.text(); } catch {}
      }
      return NextResponse.json({ error: msg }, { status: resp.status });
    }

    const result = await resp.json();
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unexpected error" }, { status: 500 });
  }
}
