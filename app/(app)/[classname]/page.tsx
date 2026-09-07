import { ClassPageClient } from "./ClassPageClient";

export default async function ClassPage({ params }: { params: Promise<{ classname: string }> }) {
  const { classname } = await params;
  return <ClassPageClient slug={classname} />;
}
