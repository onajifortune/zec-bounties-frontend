"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBounty } from "@/lib/bounty-context";
import { backendUrl } from "@/lib/configENV";

export default function GithubCallback() {
  const { setCurrentUser } = useBounty();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("authToken", token);

      fetch(`${backendUrl}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setCurrentUser(data.user);
          router.push("/home");
        })
        .catch((error) => {
          alert(error);
          localStorage.removeItem("authToken"); // 🔑 clear stale token
          router.push("/login?error=invalid_token");
        });
    } else {
      router.push("/login?error=missing_token");
    }
  }, [searchParams, setCurrentUser, router]);

  return <p>Completing login...</p>;
}
