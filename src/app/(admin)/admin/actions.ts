"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getMetricsKey } from "@/lib/d1";
import { AUTH_COOKIE, hashKey, timingSafeEqual } from "./auth";

export async function signIn(formData: FormData) {
  const submitted = String(formData.get("key") ?? "");
  const expected = await getMetricsKey();

  if (!expected || !timingSafeEqual(submitted, expected)) {
    redirect("/admin?error=1");
  }

  const store = await cookies();
  store.set(AUTH_COOKIE, await hashKey(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/admin");
}

export async function signOut() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  redirect("/admin");
}
