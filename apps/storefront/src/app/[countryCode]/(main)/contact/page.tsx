import ComingSoon from "@/modules/common/components/coming-soon"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us",
}

export default function ContactPage() {
  return (
    <ComingSoon
      eyebrow="Get in Touch"
      title="We'd love to hear from you."
      description="Our full contact form is on the way. In the meantime, call our Brooklyn office at 718-778-3329 or email info@benzfish.com to open a wholesale account."
    />
  )
}
