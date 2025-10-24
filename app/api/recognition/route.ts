import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ARK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing ARK_API_KEY" }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("image_file");
    const prompt = (form.get("prompt") as string) || "识别上传的图片";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "image_file is required" }, { status: 400 });
    }

    const mime = (file as any)?.type || "image/png"; // e.g., image/png, image/jpeg, image/webp
    const ab = await (file as Blob).arrayBuffer();
    const base64 = Buffer.from(ab).toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;

    const payload = {
      model: "ep-20251024223502-cb27h",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    } as const;

    const resp = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
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
      let msg = `recognition failed (${resp.status})`;
      try {
        const j = await resp.json();
        msg = j?.message || j?.error || JSON.stringify(j);
      } catch {
        try {
          msg = await resp.text();
        } catch {}
      }
      return NextResponse.json({ error: msg }, { status: resp.status });
    }

    const result = await resp.json();

    let text = "";
    try {
      const choice = result?.choices?.[0];
      const content = choice?.message?.content;
      if (Array.isArray(content)) {
        text = content
          .filter((p: any) => p?.type === "text")
          .map((p: any) => p?.text)
          .join("\n")
          .trim();
      } else if (typeof content === "string") {
        text = content;
      }
    } catch {}

    return NextResponse.json({ text, raw: result }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unexpected error" }, { status: 500 });
  }
}
