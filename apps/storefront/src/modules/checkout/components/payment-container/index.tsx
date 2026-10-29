import { getPaymentInfo, isManual } from "@/lib/constants"
import PaymentTest from "@/modules/checkout/components/payment-test"
import Divider from "@/modules/common/components/divider"
import Radio from "@/modules/common/components/radio"
import { RadioGroup } from "@headlessui/react"
import { Text, clx } from "@medusajs/ui"
import React from "react"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  disabled = false,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"
  const paymentInfo = getPaymentInfo(paymentProviderId)

  return (
    <>
      <RadioGroup.Option
        key={paymentProviderId}
        value={paymentProviderId}
        disabled={disabled}
        className={clx(
          "flex flex-col gap-y-2 text-small-regular cursor-pointer py-2",
          {
            "border-ui-border-interactive":
              selectedPaymentOptionId === paymentProviderId,
          }
        )}
      >
        <div className="flex items-center justify-between ">
          <div className="flex items-center gap-x-4">
            <Radio checked={selectedPaymentOptionId === paymentProviderId} />
            <Text className="text-base-regular">
              {paymentInfo?.title || paymentProviderId}
            </Text>
            {isManual(paymentProviderId) && isDevelopment && (
              <PaymentTest className="hidden small:block" />
            )}
          </div>
          <span className="justify-self-end text-ui-fg-base">
            {paymentInfo?.icon}
          </span>
        </div>
        {isManual(paymentProviderId) && isDevelopment && (
          <PaymentTest className="small:hidden text-[10px]" />
        )}
      </RadioGroup.Option>
      <Divider />
    </>
  )
}

export default PaymentContainer
