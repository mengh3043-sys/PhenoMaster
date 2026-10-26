import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/workbench/ProfilePage";
export const Route = createFileRoute("/user/profile")({ component: () => <ProfilePage role="user" /> });
