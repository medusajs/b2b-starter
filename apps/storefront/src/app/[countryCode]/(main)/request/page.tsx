import PhoneNumberInput from "@/modules/layout/components/phone-input"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamicParams = true

type Props = {
  params: Promise<{ countryCode: string }>
}

type FormData = {
  inquiryType: "support" | "quote" | "other";
  email: string;
  phone: string;
  message: string;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params

  try {
    const title = 'Get in touch'

    const description = `Get in touch with us.`

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
    <div className="content-container flex flex-col w-full">
      <div className="flex flex-col gap-y-2 xsmall:flex-row items-start justify-between py-10">
        <div>
          <h1 className="pb-2">Get in Touch</h1>

        </div>
      </div>
    </div>

  );
}
