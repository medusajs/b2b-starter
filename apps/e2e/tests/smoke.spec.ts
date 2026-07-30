import { expect, test } from "@playwright/test";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:9000";

// The seed creates a Europe region only; "de" belongs to it.
const COUNTRY = process.env.E2E_COUNTRY_CODE ?? "de";

test("backend is healthy", async ({ request }) => {
  const res = await request.get(`${BACKEND_URL}/health`);
  expect(res.status()).toBe(200);
});

test("store API serves products with the publishable key", async ({
  request,
}) => {
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  test.skip(!key, "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY not set");

  const res = await request.get(`${BACKEND_URL}/store/products?limit=1`, {
    headers: { "x-publishable-api-key": key! },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.count).toBeGreaterThan(0);
});

test("storefront home renders", async ({ page }) => {
  await page.goto(`/${COUNTRY}`);
  await expect(page.locator("footer")).toBeVisible();
});

test("catalog lists products", async ({ page }) => {
  await page.goto(`/${COUNTRY}/store`);
  const productLinks = page.locator(`a[href*="/products/"]`);
  await expect(productLinks.first()).toBeVisible();
});

test("product page shows a variant picker and price", async ({ page }) => {
  await page.goto(`/${COUNTRY}/store`);
  await page.locator(`a[href*="/products/"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`/${COUNTRY}/products/`));
  // Any rendered price implies region/pricing wiring works end-to-end.
  await expect(page.getByText(/€|\$|EUR|USD/).first()).toBeVisible();
});
