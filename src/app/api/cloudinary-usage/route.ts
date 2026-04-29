import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Free plan: 25 GB storage limit
// result.storage.limit does NOT exist in the API — define manually
const STORAGE_LIMIT_BYTES = 25 * 1024 * 1024 * 1024;

export async function GET() {
  try {
    const result = await cloudinary.api.usage();

    return NextResponse.json({
      used: result.storage?.usage ?? 0,
      limit: STORAGE_LIMIT_BYTES,
    });
  } catch (error) {
    console.error("Cloudinary usage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Cloudinary usage" },
      { status: 500 }
    );
  }
}
