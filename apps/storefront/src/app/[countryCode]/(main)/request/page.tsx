import { getCategoryByHandle, listCategories } from "@/lib/data/categories"
import { listRegions } from "@/lib/data/regions"
import CategoryTemplate from "@/modules/categories/templates"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamicParams = true

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params

  try {
    const title = 'Submit a request'

    const description = `Submit a request to the Maxxam support team.`

    return {
      title: `${title} | Maxxam Store`,
      description,
    }
  } catch (error) {
    notFound()
  }
}

export default async function RequestPage(props: Props) {
  const params = await props.params

  return (
    <>
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-2 xsmall:flex-row items-start justify-between py-10">
          <div>
            <h1>Send us a Request</h1>
            <p>Have a question or need assistance? Fill out the form below and our support team will get back to you as soon as possible.</p>
            <form>
              <div className="flex flex-col gap-y-4">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" name="name" required className="border border-ui-border-base rounded px-2 py-1" /> 
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
