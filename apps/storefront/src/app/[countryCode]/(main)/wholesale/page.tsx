import ComingSoon from "@/modules/common/components/coming-soon"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Wholesale",
}

export default function WholesalePage() {
  return (
    <ComingSoon
      eyebrow="Wholesale & Retail"
      title="Built for food service."
      description="Volume pricing, credit terms, delivery schedules, and account management for restaurants, caterers, hospitals, camps, and schools — our wholesale portal is launching soon."
    />
  )
}
