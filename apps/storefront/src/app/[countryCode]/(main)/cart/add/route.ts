import { getOrSetCart } from "@/lib/data/cart"
import { getAuthHeaders, getCacheTag } from "@/lib/data/cookies"
import { MAX_LINE_ITEMS, MAX_QUANTITY } from "@/lib/ucp/ucp"
import { addLineItemsBulk } from "@/lib/util/server-cart"
import { getRequestOrigin } from "@/lib/util/site"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

const toQuantity = (value: FormDataEntryValue | null) => {
  const quantity = parseInt(value?.toString() ?? "", 10)
  return Number.isInteger(quantity) && quantity > 0
    ? Math.min(quantity, MAX_QUANTITY)
    : 0
}

/**
 * Accepts `quantity[{variant_id}]=n` fields from the product variants table,
 * or a single `variant_id` with an optional `quantity`.
 */
const parseLineItems = (form: FormData) => {
  const items: { variant_id: string; quantity: number }[] = []
  form.forEach((value, key) => {
    const variantId = key.match(/^quantity\[(.+)\]$/)?.[1]
    const quantity = toQuantity(value)
    if (variantId && quantity) {
      items.push({ variant_id: variantId, quantity })
    }
  })

  const variantId = form.get("variant_id")?.toString()
  if (variantId) {
    items.push({
      variant_id: variantId,
      quantity: toQuantity(form.get("quantity")) || 1,
    })
  }

  return items
}

/** No-JavaScript add-to-cart: the product page form posts here. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  const { countryCode } = await params
  const items = parseLineItems(await request.formData())

  if (!items.length || items.length > MAX_LINE_ITEMS) {
    return new NextResponse(
      "Enter a quantity for at least one product variant",
      { status: 400 }
    )
  }

  try {
    const cart = await getOrSetCart(countryCode)
    if (!cart) {
      throw new Error("Could not create a cart")
    }
    await addLineItemsBulk(
      cart.id,
      items,
      (await getAuthHeaders()) as Record<string, string>
    )
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Could not add items to cart",
      { status: 400 }
    )
  }

  const cartCacheTag = await getCacheTag("carts")
  if (cartCacheTag) {
    revalidateTag(cartCacheTag, { expire: 0 })
  }

  return NextResponse.redirect(
    `${getRequestOrigin(request)}/${countryCode}/cart`,
    303
  )
}
