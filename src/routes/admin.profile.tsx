import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/workbench/ProfilePage";
export const Route = createFileRoute("/admin/profile")({ component: () => <ProfilePage role="admin" /> });
