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
    <div className="content-container flex flex-col w-full">
      <div className="flex flex-col gap-y-2 xsmall:flex-row items-start justify-between py-10">
        <div>
          <h1 className="pb-2">Get in Touch</h1>
          <form className="mx-auto max-w-xl space-y-6 rounded-lg bg-white p-6 shadow py-10"
          // onSubmit={handleSubmit}
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Inquiry type
              </label>
              <select
                name="inquiryType"
                // value={formData.inquiryType}
                // onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
              >
                <option value="support">Support</option>
                <option value="quote">Quote</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                name="email"
                // value={formData.email}
                // onChange={handleChange}
                readOnly
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Preferred phone number
              </label>
              <PhoneNumberInput
                phoneNumber={undefined}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                name="message"
                // value={formData.message}
                // onChange={handleChange}
                rows={5}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                placeholder="Enter your message..."
              />
            </div>

            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>

  );
}
