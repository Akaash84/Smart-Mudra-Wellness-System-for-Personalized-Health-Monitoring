import DetectionClient from "./DetectionClient";

type DetectionPageProps = {
  searchParams?: { mudra?: string };
};

export default function DetectionPage({ searchParams }: DetectionPageProps) {
  return <DetectionClient requestedMudra={searchParams?.mudra ?? ""} />;
}
