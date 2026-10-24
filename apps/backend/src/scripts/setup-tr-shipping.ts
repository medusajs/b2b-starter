import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import {
  createServiceZonesWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/core-flows";

/**
 * TR flat-rate kargo kurulumu (idempotent):
 *   cd apps/backend && pnpm medusa exec ./src/scripts/setup-tr-shipping.ts
 */
export default async function setupTrShipping({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);

  // --- TRY bölgesi ---
  const {
    data: [trRegion],
  } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
    filters: { currency_code: "try" },
  });
  if (!trRegion) {
    throw new Error("TRY bölgesi yok — scripts/bootstrap-aklast.mjs çalıştırın");
  }
  logger.info(`TRY bölgesi: ${trRegion.id}`);

  // --- Depo ---
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "sales_channels.id"],
  });
  if (!locations.length) {
    throw new Error("Depo (stock location) yok — admin panelinden bir depo ekleyin");
  }
  logger.info(`Depo: ${locations[0].name} (${locations[0].id})`);

  // --- Fulfillment provider'ları ---
  const { data: providers } = await query.graph({
    entity: "fulfillment_provider",
    fields: ["id"],
  });
  if (!providers.length) {
    throw new Error("Fulfillment provider yok");
  }
  logger.info(`Providers: ${providers.map((p: any) => p.id).join(", ")}`);

  // --- Fulfillment set (idempotent: isim normalize edilir) ---
  const { data: sets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "service_zones.id", "service_zones.name"],
  });
  const norm = (s: any) => (s?.name ?? "").trim().toLowerCase();
  const candidates = sets.filter((s: any) => norm(s) === "aklast depo");
  let fset =
    candidates.find((s: any) =>
      (s.service_zones ?? []).some((z: any) => z.name === "Türkiye")
    ) ?? candidates[0];
  // Fazla kopyalanmış setleri temizle (idempotency hasarını gider)
  const extras = candidates.filter((s: any) => s.id !== (fset as any)?.id);
  for (const extra of extras) {
    try {
      await (container.resolve(Modules.FULFILLMENT) as any).deleteFulfillmentSets(
        extra.id
      );
      logger.info(`Kopya fulfillment set silindi: ${extra.id}`);
    } catch (e: any) {
      logger.info(`Kopya set silinemedi: ${extra.id}: ${e.message}`);
    }
  }
  if (!fset) {
    const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
    fset = await (fulfillmentModule as any).createFulfillmentSets({
      name: "AKLAST Depo",
      type: "shipping",
    });
    logger.info(`Fulfillment set oluşturuldu: ${fset.id}`);
  }
  // set ↔ lokasyon bağlantısı (idempotent link)
  try {
    await remoteLink.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: locations[0].id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: (fset as any).id },
    });
  } catch (e: any) {
    if (!/already|exist/i.test(String(e?.message ?? e))) throw e;
  }

  // Silinmiş (bırakılmış) setlerin link kalıntılarını temizle
  if (extras.length) {
    for (const extra of extras) {
      try {
        await remoteLink.dismiss({
          [Modules.STOCK_LOCATION]: { stock_location_id: locations[0].id },
          [Modules.FULFILLMENT]: { fulfillment_set_id: (extra as any).id },
        });
        logger.info(`Kopya set linki kaldırıldı: ${(extra as any).id}`);
      } catch (e: any) {
        logger.info(
          `Kopya set linki kaldırılamadı: ${(extra as any).id}: ${e.message}`
        );
      }
    }
  }

  // Tüm satış kanallarını depoya bağla (store kargo listesi için zorunlu)
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  });
  const linkedChannelIds = new Set(
    (locations[0].sales_channels ?? []).map((c: any) => c.id)
  );
  const missingChannelIds = channels
    .filter((c) => !linkedChannelIds.has(c.id))
    .map((c) => c.id);
  if (missingChannelIds.length) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: locations[0].id,
        add: missingChannelIds,
        remove: [],
      },
    });
    logger.info(
      `Satış kanalları depoya bağlandı: ${missingChannelIds.join(", ")}`
    );
  }

  // --- Service zone (Türkiye) ---
  let zone: any = ((fset as any).service_zones ?? []).find(
    (z: any) => z.name === "Türkiye"
  );
  if (!zone) {
    try {
      const { result } = await createServiceZonesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Türkiye",
              fulfillment_set_id: (fset as any).id,
              geo_zones: [{ type: "country", country_code: "tr" }],
            },
          ],
        },
      });
      zone = result[0];
      logger.info(`Service zone oluşturuldu: ${zone.id}`);
    } catch (e: any) {
      if (/already exists/i.test(String(e?.message ?? e))) {
        const { data: zones } = await query.graph({
          entity: "service_zone",
          fields: ["id", "name", "fulfillment_set_id"],
          filters: { name: "Türkiye" },
        });
        logger.info(`DEBUG zones: ${JSON.stringify(zones)} | fset=${(fset as any).id}`);
        const dbZones: any[] = zones as any[];
        zone = dbZones.find(
          (z: any) => z.fulfillment_set_id === (fset as any).id
        );
        if (!stampede(zone)) throw e;
      } else {
        throw e;
      }
    }
  }
  logger.info(`Service zone: ${zone.id}`);

  // --- Shipping profile ---
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
  });
  let profileId = profiles.find((p: any) => p.name === "Default")?.id;
  if (!profileId) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default", type: "default" }] },
    });
    profileId = (result as any)[0].id;
    logger.info(`Shipping profile oluşturuldu: ${profileId}`);
  } else {
    logger.info(`Shipping profile: ${profileId}`);
  }

  // --- Flat-rate shipping option ---
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
  });
  let option: { id: string; name: string } | undefined = options.find(
    (o: any) => o.name === "Yurtiçi Kargo (Sabit)"
  );
  if (!option) {
    const { result } = await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Yurtiçi Kargo (Sabit)",
          service_zone_id: zone.id,
          shipping_profile_id: profileId,
          provider_id: providers[0].id,
          price_type: "flat",
          type: {
            label: "Standart",
            description: "Yurtiçi standart kargo teslimatı",
            code: "yurtici-standart",
          },
          prices: [{ region_id: trRegion.id, amount: 12500 }],
        } as any,
      ],
    });
    logger.info(`Shipping option oluşturuldu: ${result[0].id}`);
    option = result[0];
  } else {
    logger.info(`Shipping option zaten var: ${option.id}`);
  }

  logger.info(`✅ TR kargo kurulumu tamamlandı (${option.id})`);
}

function stampede(zone: any): boolean {
  return Boolean(zone);
}
