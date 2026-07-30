import {
  beginOrderEditOrderWorkflow,
  createOrdersWorkflow,
  useRemoteQueryStep,
} from "@medusajs/core-flows";
import { OrderStatus } from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createQuotesWorkflow } from "./create-quote";

/*
  A workflow that creates a request for quote. 
  
  Quotes contain links to a draft order, customer and cart. Any changes (updated price, quantity, etc) made on the quote
  is performed within the scope of a draft order. We then re-use the order edit functionality of the order to stage
  any changes to the quote made by the merchant. 

  The customer can then accept or reject the changes. The lifecycle of the quote is managed through its status,
  that is performed by independent workflows - accept / reject.
*/
export const createRequestForQuoteWorkflow = createWorkflow(
  "create-request-for-quote",
  function (input: { cart_id: string; customer_id: string }) {
    const cart = useRemoteQueryStep({
      entry_point: "cart",
      fields: [
        "id",
        "sales_channel_id",
        "currency_code",
        "region_id",
        "customer.id",
        "customer.email",
        "shipping_address.*",
        "billing_address.*",
        "items.*",
        "shipping_methods.*",
        "promotions.code",
      ],
      variables: { id: input.cart_id },
      list: false,
      throw_if_key_not_found: true,
    });

    const customer = useRemoteQueryStep({
      entry_point: "customer",
      fields: ["id", "customer"],
      variables: { id: input.customer_id },
      list: false,
      throw_if_key_not_found: true,
    }).config({ name: "customer-query" });

    const orderInput = transform({ cart, customer }, ({ cart, customer }) => {
      return {
        is_draft_order: true,
        status: OrderStatus.DRAFT,
        sales_channel_id: cart.sales_channel_id,
        email: customer.email,
        customer_id: customer.id,
        billing_address: cart.billing_address,
        shipping_address: cart.shipping_address,
        // Freeze the cart's resolved prices onto the draft order explicitly:
        // passing raw cart items makes 2.18's createOrdersWorkflow re-resolve
        // prices in an order context, which yields null unit prices.
        items: cart.items.map((item) => ({
          title: item.title,
          subtitle: item.subtitle,
          thumbnail: item.thumbnail,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          compare_at_unit_price: item.compare_at_unit_price,
          metadata: item.metadata,
        })),
        region_id: cart.region_id,
        promo_codes: cart.promotions.map(({ code }) => code),
        currency_code: cart.currency_code,
        shipping_methods: cart.shipping_methods,
      };
    });

    const draftOrder = createOrdersWorkflow.runAsStep({
      input: orderInput,
    });

    const orderEditInput = transform({ draftOrder }, ({ draftOrder }) => {
      return {
        order_id: draftOrder.id,
        description: "",
        internal_note: "",
        metadata: {},
      };
    });

    const changeOrder = beginOrderEditOrderWorkflow.runAsStep({
      input: orderEditInput,
    });

    const quotes = createQuotesWorkflow.runAsStep({
      input: [
        {
          draft_order_id: draftOrder.id,
          cart_id: cart.id,
          customer_id: customer.id,
          order_change_id: changeOrder.id,
        },
      ],
    });

    return new WorkflowResponse({ quote: quotes[0] });
  }
);
