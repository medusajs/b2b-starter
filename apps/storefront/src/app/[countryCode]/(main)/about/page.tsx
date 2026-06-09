import ComingSoon from "@/modules/common/components/coming-soon"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us",
}

export default function AboutPage() {
  return (
    <ComingSoon
      eyebrow="A Family Story"
      title="Our story, since 1976."
      description="The full history of Benz's Food Products — a family-run business, the home made taste, and strict kosher supervision year round — is being written for the web."
    />
  )
}
