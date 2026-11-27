import { AuthenticatedMedusaRequest } from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";

export const ensureCartOwner = async (
  req: AuthenticatedMedusaRequest,
  cartId: string
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: [cart] } = await query.graph({
    entity: "cart",
    fields: ["id", "customer_id"],
    filters: { id: cartId },
  });

  if (!cart?.customer_id || cart.customer_id !== req.auth_context.actor_id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found");
  }
};
