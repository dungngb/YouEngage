import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslator } from "@/i18n";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const t = await getTranslator();
  const attachment = await prisma.attachment.findUnique({
    where: { id: params.id },
  });

  if (!attachment) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Data scope: verify user is member of the engagement (or admin)
  if (attachment.engagementId && session.user.role !== "admin") {
    const member = await prisma.engagementMember.findUnique({
      where: {
        engagementId_userId: {
          engagementId: attachment.engagementId,
          userId: session.user.id,
        },
      },
    });
    if (!member) {
      return NextResponse.json(
        { error: t("error.noAccess") },
        { status: 403 }
      );
    }
  }

  // storagePath is now a Vercel Blob URL — fetch and proxy
  try {
    const blobRes = await fetch(attachment.storagePath);
    if (!blobRes.ok) {
      return NextResponse.json(
        { error: "File not found in storage" },
        { status: 404 }
      );
    }

    const buffer = await blobRes.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.originalName)}"`,
        "Content-Length": attachment.size.toString(),
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "File not found in storage" },
      { status: 404 }
    );
  }
}
