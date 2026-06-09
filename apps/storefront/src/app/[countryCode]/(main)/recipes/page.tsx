import ComingSoon from "@/modules/common/components/coming-soon"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recipes",
}

export default function RecipesPage() {
  return (
    <ComingSoon
      eyebrow="From Our Kitchen"
      title="Recipes worth keeping."
      description="Classic gefilte preparations, holiday tables, and chef-tested ideas for our fresh and frozen fish — our recipe collection is being plated for launch."
    />
  )
}
