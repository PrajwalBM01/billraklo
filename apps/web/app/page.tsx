import { hello } from "@billraklo/core";

export default function Home() {
  return <main className="p-8">{hello("web")}</main>;
}