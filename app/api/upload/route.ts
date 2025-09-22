import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const userId = formData.get("userId") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        const videoId = uuidv4();
        const filePath = `${videoId}.mp4`;

        const { error: uploadError } = await supabase.storage.from("raw_uploads").upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
        })
        if (uploadError) {
            console.error("Upload error:", uploadError.message);
            return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
        }

        const { error: dbError } = await supabase.from("videos").insert([
            {
                id: videoId,
                title,
                description,
                uploader: userId,
                status: "uploaded",
                raw_path:filePath,
            }
        ]);
        if (dbError) {
            console.error("DB error:", dbError.message);
            return NextResponse.json({ error: "Failed to save video metadata" }, { status: 500 });
        }

        fetch(process.env.RENDER_TRANSCODE_URL!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoId: videoId }),
        }).catch(error => {
            console.error('Failed to trigger transcoding service:', error);
        });
        return NextResponse.json({ message: "Upload successful", videoId }, { status: 200 });

    } catch (e: unknown) {
    if (e instanceof Error) {
        console.log(e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
}
}