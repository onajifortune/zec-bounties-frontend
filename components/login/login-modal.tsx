"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const handleGitHubLogin = () => {
    // Implement your GitHub OAuth login logic here
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login to ZEC Bounties</DialogTitle>
          <DialogDescription>
            Choose your preferred login method to continue
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button
            onClick={handleGitHubLogin}
            className="gap-2 w-full"
            size="lg"
          >
            <Github className="h-5 w-5" />
            Continue with GitHub
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
