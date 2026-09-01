/**
 * Seeds 50 extra published products so the storefront's search surfaces have
 * enough catalogue to be exercised properly. With the eight products from
 * `initial-data-seed`, the store list holds 58 — five pages at the storefront's
 * twelve per page, which is what makes paging past page two testable at all.
 *
 * The catalogue is shaped around the facets rather than around realism. Every
 * facet the sidebar renders needs values that overlap in awkward ways, or it
 * only ever gets tested against the case where each filter narrows to a clean,
 * separate slice:
 *
 * - `min_price` spans €19–€2,499 in uneven steps, so the range slider has a
 *   long track and no two products share a bound.
 * - `category` covers the four existing categories plus two new ones, with very
 *   different counts per category, so a refinement can leave one product or
 *   fifteen.
 * - `labels` comes from product tags, which nothing seeded before — the Labels
 *   section of the sidebar was permanently empty.
 * - `option_values` mixes four option groups across products that share none of
 *   them, which is the case where a value facet has to stay disjunctive.
 * - `on_sale` and `discount_percentage` need a variant whose original price is
 *   higher than its calculated one, which only a price list produces. Without
 *   one, the "On sale" toggle could never match anything.
 *
 * Everything here is derived from a fixed seed, so two runs against two
 * databases produce the same catalogue and a filter that broke once can be
 * reproduced from the URL alone.
 */
import { MedusaContainer } from "@medusajs/framework";
import type { CreatePriceListWorkflowInputDTO } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  PriceListStatus,
  PriceListType,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductTagsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";

/** How many products this script adds on top of the initial seed's eight. */
const PRODUCT_COUNT = 50;

/**
 * Products per `createProductsWorkflow` call. One call for all fifty works, but
 * a failure halfway through then says nothing about how far it got.
 */
const BATCH_SIZE = 10;

/** Every handle this script owns starts here, which is what makes it re-runnable. */
const HANDLE_PREFIX = "seed";

/** The share of products that get a sale price, as one in every N. */
const SALE_EVERY = 3;

/**
 * A deterministic generator. `Math.random` would make the catalogue — and so
 * every facet count in it — different on every database it is seeded into.
 */
const createRandom = (seed: number) => {
  let state = seed;

  return () => {
    // Numerical Recipes' LCG constants; the shift drops the low bits, which
    // cycle far too regularly to use on their own.
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const pick = <T,>(random: () => number, values: readonly T[]): T =>
  values[Math.floor(random() * values.length)]!;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Categories the products are spread over. The first four already exist from
 * the initial seed and are reused rather than duplicated; the last two are
 * added here so the category facet has values whose counts differ enough to
 * notice when one is refined.
 */
const CATEGORY_NAMES = [
  "Laptops",
  "Accessories",
  "Phones",
  "Monitors",
  "Audio",
  "Networking",
] as const;

/**
 * Tags, which the search index writes as `labels`. Kept short and overlapping —
 * a label that only ever appears with one category cannot show whether two
 * facets combine correctly.
 */
const TAGS = [
  "bestseller",
  "new-arrival",
  "refurbished",
  "eco-friendly",
  "pro",
  "budget",
  "clearance",
] as const;

/**
 * Option groups. `Color` and `Storage` already exist from the initial seed;
 * `Size` and `Connectivity` are added so `option_values` holds groups that no
 * single product carries all of.
 */
const OPTION_DEFINITIONS = [
  { title: "Color", values: ["Blue", "Red", "Black", "White", "Purple"] },
  { title: "Storage", values: ["256 GB", "512 GB"] },
  { title: "Size", values: ["S", "M", "L", "XL"] },
  { title: "Connectivity", values: ["Wired", "Wireless", "Bluetooth"] },
] as const;

/** Which option groups a product in each category is built from. */
const CATEGORY_OPTIONS: Record<string, readonly string[]> = {
  Laptops: ["Color", "Storage"],
  Accessories: ["Color", "Connectivity"],
  Phones: ["Color", "Storage"],
  Monitors: ["Size"],
  Audio: ["Color", "Connectivity"],
  Networking: ["Connectivity"],
};

/** Product name parts, per category. */
const NAME_PARTS: Record<string, { prefixes: string[]; nouns: string[] }> = {
  Laptops: {
    prefixes: ["14-inch", "16-inch", "Ultra-Slim", "Creator", "Field"],
    nouns: ["Notebook", "Workstation", "Laptop"],
  },
  Accessories: {
    prefixes: ["Compact", "Travel", "Desk", "Precision", "Everyday"],
    nouns: ["Hub", "Stand", "Dock", "Sleeve", "Charger"],
  },
  Phones: {
    prefixes: ["Compact", "Pro", "Rugged", "Everyday", "Flagship"],
    nouns: ["Smartphone", "Handset", "Phone"],
  },
  Monitors: {
    prefixes: ["27-inch", "32-inch", "Curved", "Studio", "Portable"],
    nouns: ["Display", "Monitor", "Panel"],
  },
  Audio: {
    prefixes: ["Studio", "Open-Back", "Noise-Cancelling", "Desktop", "Portable"],
    nouns: ["Headphones", "Speaker", "Earbuds", "Microphone"],
  },
  Networking: {
    prefixes: ["Mesh", "Gigabit", "Travel", "Rack", "Managed"],
    nouns: ["Router", "Switch", "Access Point", "Adapter"],
  },
};

/**
 * Images are reused from the existing seed rather than invented, so the product
 * cards render something and the grid's layout is worth looking at.
 */
const IMAGES: Record<string, string> = {
  Laptops:
    "https://medusa-public-images.s3.eu-west-1.amazonaws.com/laptop-front.png",
  Accessories:
    "https://medusa-public-images.s3.eu-west-1.amazonaws.com/keyboard-front.png",
  Phones:
    "https://medusa-public-images.s3.eu-west-1.amazonaws.com/phone-front.png",
  Monitors:
    "https://medusa-public-images.s3.eu-west-1.amazonaws.com/screen-front.png",
  Audio:
    "https://medusa-public-images.s3.eu-west-1.amazonaws.com/headphone-front.png",
  Networking:
    "https://medusa-public-images.s3.eu-west-1.amazonaws.com/speaker-top.png",
};

/**
 * Price bands per category, in whole currency units. Medusa stores prices
 * as-is, so 1299 here is €1,299.00 — not cents.
 */
const PRICE_BANDS: Record<string, [number, number]> = {
  Laptops: [899, 2499],
  Accessories: [19, 249],
  Phones: [349, 1499],
  Monitors: [199, 1199],
  Audio: [49, 599],
  Networking: [39, 449],
};

type PlannedVariant = {
  title: string;
  sku: string;
  options: Record<string, string>;
  amount: number;
  onSale: boolean;
};

type PlannedProduct = {
  title: string;
  handle: string;
  category: string;
  description: string;
  tags: string[];
  optionValues: Record<string, string[]>;
  variants: PlannedVariant[];
};

/**
 * Builds the whole catalogue up front, before anything is written. Planning and
 * persisting separately keeps every decision about what the data should look
 * like in one place, and means a re-run can drop the products that already
 * exist without re-deriving the rest.
 */
const planCatalogue = (): PlannedProduct[] => {
  const random = createRandom(20260901);
  const products: PlannedProduct[] = [];
  const usedHandles = new Set<string>();

  for (let index = 0; index < PRODUCT_COUNT; index++) {
    // Round-robin rather than random, so no category ends up empty and the
    // counts stay predictable.
    const category = CATEGORY_NAMES[index % CATEGORY_NAMES.length]!;
    const parts = NAME_PARTS[category]!;
    const prefix = pick(random, parts.prefixes);
    const noun = pick(random, parts.nouns);
    const title = `${prefix} ${noun} ${String(index + 1).padStart(2, "0")}`;

    let handle = `${HANDLE_PREFIX}-${slugify(title)}`;
    while (usedHandles.has(handle)) {
      handle = `${handle}-x`;
    }
    usedHandles.add(handle);

    const [low, high] = PRICE_BANDS[category]!;
    // Uneven steps, and never a round number: two products landing on the same
    // price would hide an off-by-one in a range bound.
    const basePrice = Math.round(low + random() * (high - low)) + (index % 7);

    const groups = CATEGORY_OPTIONS[category]!;
    const optionValues: Record<string, string[]> = {};

    for (const group of groups) {
      const available = OPTION_DEFINITIONS.find(
        (definition) => definition.title === group
      )!.values;
      // Two or three values per group, so two products in one category still
      // differ in which values they carry.
      const count = Math.min(available.length, 2 + Math.floor(random() * 2));
      const start = Math.floor(random() * available.length);

      optionValues[group] = Array.from(
        { length: count },
        (_, offset) => available[(start + offset) % available.length]!
      );
    }

    const variants: PlannedVariant[] = [];
    const [firstGroup, secondGroup] = groups;
    const firstValues = optionValues[firstGroup!]!;
    const secondValues = secondGroup ? optionValues[secondGroup]! : [undefined];

    for (const firstValue of firstValues) {
      for (const secondValue of secondValues) {
        const options: Record<string, string> = { [firstGroup!]: firstValue };
        if (secondGroup && secondValue) {
          options[secondGroup] = secondValue;
        }

        const label = Object.values(options).join(" / ");
        // Each variant costs a little more than the last, so the index's
        // "cheapest variant" price is a real choice rather than a formality.
        const amount = basePrice + variants.length * 10;

        variants.push({
          title: label,
          sku: `${handle}-${slugify(label)}`.toUpperCase(),
          options,
          amount,
          onSale: index % SALE_EVERY === 0,
        });
      }
    }

    const tagCount = 1 + Math.floor(random() * 2);
    const tags = Array.from(new Set(
      Array.from({ length: tagCount }, () => pick(random, TAGS))
    ));

    products.push({
      title,
      handle,
      category,
      description: `${title}. Seeded product for exercising search, faceting and pagination in the ${category} category.`,
      tags,
      optionValues,
      variants,
    });
  }

  return products;
};

export default async function search_catalog_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const planned = planCatalogue();

  // A data migration script re-runs until it succeeds, so a failure halfway
  // through would otherwise create the first half a second time.
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["handle"],
    filters: { handle: planned.map((product) => product.handle) },
  });

  const existingHandles = new Set(
    existing.map((product: { handle?: string | null }) => product.handle)
  );
  const pending = planned.filter(
    (product) => !existingHandles.has(product.handle)
  );

  if (!pending.length) {
    logger.info("Search catalogue already seeded, skipping.");
    return;
  }

  logger.info(`Seeding ${pending.length} products for search testing...`);

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  });

  const salesChannel =
    salesChannels.find(
      (channel: { name?: string }) => channel.name === "Default Sales Channel"
    ) ?? salesChannels[0];

  if (!salesChannel) {
    throw new Error(
      "No sales channel found. Run the initial data seed before this script."
    );
  }

  // Categories: reuse whatever the initial seed created, add only what is new.
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });

  const categoryIds = new Map<string, string>(
    existingCategories.map((category: { id: string; name: string }) => [
      category.name,
      category.id,
    ])
  );

  const missingCategories = CATEGORY_NAMES.filter(
    (name) => !categoryIds.has(name)
  );

  if (missingCategories.length) {
    const { result: created } = await createProductCategoriesWorkflow(
      container
    ).run({
      input: {
        product_categories: missingCategories.map((name) => ({
          name,
          is_active: true,
        })),
      },
    });

    created.forEach((category) => categoryIds.set(category.name, category.id));
  }

  // Options are global in this project — shared across products and referenced
  // by id, so they are looked up rather than redeclared per product.
  const { data: allOptions } = await query.graph({
    entity: "product_option",
    fields: ["id", "title", "product_id", "values.id", "values.value"],
  });

  type GlobalOption = {
    id: string;
    title: string;
    product_id?: string | null;
    values?: { id: string; value: string }[] | null;
  };

  const globalOptions = new Map<string, GlobalOption>(
    (allOptions as GlobalOption[])
      .filter((option) => !option.product_id)
      .map((option) => [option.title, option])
  );

  const missingOptions = OPTION_DEFINITIONS.filter(
    (definition) => !globalOptions.has(definition.title)
  );

  if (missingOptions.length) {
    const { result: created } = await createProductOptionsWorkflow(
      container
    ).run({
      input: {
        product_options: missingOptions.map((definition) => ({
          title: definition.title,
          values: [...definition.values],
        })),
      },
    });

    created.forEach((option) =>
      globalOptions.set(option.title, option as GlobalOption)
    );
  }

  const valueId = (optionTitle: string, value: string): string => {
    const option = globalOptions.get(optionTitle)!;
    const match = option.values?.find(
      (optionValue) => optionValue.value === value
    );

    if (!match) {
      throw new Error(
        `Option "${optionTitle}" has no value "${value}". Its values are seeded by the initial data seed.`
      );
    }

    return match.id;
  };

  /**
   * Tags have to exist before a product can reference them: `createProducts`
   * resolves `tags` by id and rejects the whole batch with "Tag with id
   * undefined not found" if handed a bare value it has never seen.
   */
  const { data: existingTags } = await query.graph({
    entity: "product_tag",
    fields: ["id", "value"],
  });

  const tagIds = new Map<string, string>(
    existingTags.map((tag: { id: string; value: string }) => [tag.value, tag.id])
  );

  const missingTags = TAGS.filter((value) => !tagIds.has(value));

  if (missingTags.length) {
    const { result: created } = await createProductTagsWorkflow(container).run({
      input: { product_tags: missingTags.map((value) => ({ value })) },
    });

    created.forEach((tag) => tagIds.set(tag.value, tag.id));
  }

  for (let offset = 0; offset < pending.length; offset += BATCH_SIZE) {
    const batch = pending.slice(offset, offset + BATCH_SIZE);

    await createProductsWorkflow(container).run({
      input: {
        products: batch.map((product) => ({
          title: product.title,
          handle: product.handle,
          description: product.description,
          status: ProductStatus.PUBLISHED,
          category_ids: [categoryIds.get(product.category)!],
          tags: product.tags.map((value) => ({ id: tagIds.get(value)! })),
          images: [{ url: IMAGES[product.category]! }],
          weight: 400,
          options: Object.entries(product.optionValues).map(
            ([title, values]) => ({
              id: globalOptions.get(title)!.id,
              value_ids: values.map((value) => valueId(title, value)),
            })
          ),
          variants: product.variants.map((variant) => ({
            title: variant.title,
            sku: variant.sku,
            options: variant.options,
            manage_inventory: false,
            prices: [
              { amount: variant.amount, currency_code: "eur" },
              { amount: variant.amount, currency_code: "usd" },
            ],
          })),
          sales_channels: [{ id: salesChannel.id }],
        })),
      },
    });

    logger.info(
      `Seeded ${Math.min(offset + BATCH_SIZE, pending.length)}/${
        pending.length
      } products.`
    );
  }

  /**
   * The sale. `on_sale` and `discount_percentage` are derived in the search
   * index from `original_amount` being higher than `calculated_amount`, and
   * only a price list makes those two differ — so without this, the "On sale"
   * facet would exist but never match a product.
   */
  const saleHandles = pending
    .filter((product) => product.variants.some((variant) => variant.onSale))
    .map((product) => product.handle);

  if (saleHandles.length) {
    const { data: saleProducts } = await query.graph({
      entity: "product",
      fields: ["handle", "variants.id", "variants.sku"],
      filters: { handle: saleHandles },
    });

    const plannedByHandle = new Map(
      pending.map((product) => [product.handle, product])
    );

    const prices = saleProducts.flatMap(
      (product: {
        handle: string
        variants?: { id: string; sku?: string | null }[] | null
      }) => {
        const plan = plannedByHandle.get(product.handle);

        if (!plan) {
          return [];
        }

        return (product.variants ?? []).flatMap((variant) => {
          const planned = plan.variants.find(
            (candidate) => candidate.sku === variant.sku
          );

          if (!planned) {
            return [];
          }

          // A quarter off, rounded down — enough of a gap that
          // `discount_percentage` is a whole number worth filtering on.
          const amount = Math.floor(planned.amount * 0.75);

          return [
            { variant_id: variant.id, amount, currency_code: "eur" },
            { variant_id: variant.id, amount, currency_code: "usd" },
          ];
        });
      }
    );

    if (prices.length) {
      const priceList = {
        title: "Seeded Sale",
        description:
          "Discounts on part of the seeded catalogue, so the on-sale facet has something to match.",
        type: PriceListType.SALE,
        status: PriceListStatus.ACTIVE,
        prices,
      };

      await createPriceListsWorkflow(container).run({
        input: {
          // `price_lists_data` is typed as `CreatePriceListWorkflowInputDTO[]`,
          // which is `{ price_lists: [...] }` — one wrapper deeper than what the
          // workflow actually does with it. Each entry is handed straight to the
          // Pricing Module's `createPriceLists`, so the shape above is the one
          // that works; the cast is only there to get past the declared type.
          price_lists_data: [priceList] as unknown as CreatePriceListWorkflowInputDTO[],
        },
      });

      logger.info(`Put ${prices.length / 2} variants on sale.`);
    }
  }

  /**
   * Rebuild the index rather than trusting the `product.created` events these
   * workflows emit: a migration script runs against a container that is not
   * serving requests, so nothing guarantees the index's subscribers have drained
   * before the process exits.
   */
  const search = container.resolve(Modules.SEARCH);
  await search.reindex({ index: "product" });

  logger.info("Finished seeding the search catalogue.");
}
