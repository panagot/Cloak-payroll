import { DemoSimulation } from "@/components/demo/DemoSimulation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Walkthrough (demo)",
  description:
    "Automatic, timed walkthrough: real SDK keys, createUtxo, payment JSON, and mock wallet—off-chain, no Next clicks.",
};

export default function DemoPage() {
  return <DemoSimulation />;
}
