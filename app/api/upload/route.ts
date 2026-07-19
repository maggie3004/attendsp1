import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// POST /api/upload
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { file, folder = "general" } = body;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate base64 or URL
  if (!file.startsWith("data:") && !file.startsWith("http")) {
    return NextResponse.json({ error: "Invalid file format" }, { status: 400 });
  }

  const result = await uploadToCloudinary(file, folder);

  return NextResponse.json({
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    },
    success: true,
  });
}
