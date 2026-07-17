import { createFileRoute } from "@tanstack/react-router";
import { LandingView } from "@/public/views/LandingView";

export const Route = createFileRoute("/")({
  component: LandingView,
});
