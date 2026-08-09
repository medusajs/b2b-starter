"use client"
import { E164Number } from 'libphonenumber-js/types.cjs'
import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'
import { useState } from 'react'


function PhoneNumberInput(props: { phoneNumber: E164Number; onChange: (value: E164Number) => void }) {
  const [value, setValue] = useState()
  return (
    <PhoneInput
      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
      defaultCountry="AU"
      placeholder="Enter your phone number"
      value={value}
      onChange={setValue}
    />
  )
}

export default PhoneNumberInput