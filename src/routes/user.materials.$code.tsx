import { createFileRoute } from "@tanstack/react-router";
import { MaterialDetail } from "@/components/workbench/MaterialDetail";

export const Route = createFileRoute("/user/materials/$code")({
  component: Page,
});

function Page() {
  const { code } = Route.useParams();
  return <MaterialDetail role="user" code={code} />;
}
