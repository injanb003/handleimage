import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // ensure no caching of route
export const runtime = "nodejs"; // ensure Node.js runtime so process.env is available

export async function GET() {
  // Simple health check without exposing the secret
  const hasKey = Boolean(process.env.REMOVE_BG_API_KEY);
  return NextResponse.json({ ok: true, hasKey });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing REMOVE_BG_API_KEY" }, { status: 500 });
    }

    const inForm = await req.formData();
    const file = inForm.get("image_file");
    const size = (inForm.get("size") as string) || "auto";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "image_file is required" }, { status: 400 });
    }

    const outForm = new FormData();
    // @ts-ignore: name may not exist on Blob in lib.dom typings
    const name = (file as any)?.name || "upload.png";
    outForm.append("image_file", file, name);
    outForm.append("size", size);

    const resp = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        Accept: "image/png",
      },
      body: outForm,
    });

    if (!resp.ok) {
      // Try to parse JSON error for better context
      const ct = resp.headers.get("content-type") || "";
      let message = `remove.bg failed (${resp.status})`;
      if (ct.includes("application/json")) {
        try {
          const j = await resp.json();
          message = j?.errors?.[0]?.title || j?.error || message;
        } catch {}
      } else {
        try { message = await resp.text(); } catch {}
      }
      return NextResponse.json({ error: message }, { status: resp.status });
    }

    const blob = await resp.blob();
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": blob.type || "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unexpected error" }, { status: 500 });
  }
}
