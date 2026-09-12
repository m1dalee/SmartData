import { NextResponse } from "next/server";
import { importBankCsv } from "@/app/actions/import";

/** Réception d'un CSV partagé (PWA share target, surtout Android). */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await importBankCsv(formData);
    const params = new URLSearchParams({
      shared: "1",
      success: result.success ? "1" : "0",
    });
    return NextResponse.redirect(new URL(`/import?${params.toString()}`, request.url));
  } catch {
    return NextResponse.redirect(new URL("/import?shared=1&success=0", request.url));
  }
}
