/** Customer-facing status comes from the saved order, never a checkout redirect. */
export function customerDomainProgress(
  order: {
    registrationState: string;
    paymentState: string;
    connectionState: string;
  },
  registration?: { status?: string; contactVerification: string } | null,
) {
  const status = registration?.status;
  if (status === "expired")
    return {
      title: "Your address needs renewing",
      description:
        "Contact Vigil to review renewal before reconnecting your website.",
      tone: "attention",
    } as const;
  if (
    status === "released" ||
    status === "transferred" ||
    status === "transfer_pending"
  )
    return {
      title: "Your domain status has changed",
      description:
        "Vigil will help you review its transfer or release before any further connection changes.",
      tone: "attention",
    } as const;
  if (
    order.registrationState === "unknown" ||
    order.registrationState === "manual_review"
  )
    return {
      title: "We’re checking your registration",
      description:
        "Your order is saved. We’ll confirm the registrar’s response before taking another step. Please don’t purchase the address again.",
      tone: "waiting",
    } as const;
  if (order.paymentState === "capture_failed")
    return {
      title: "Your address is registered",
      description:
        "Payment needs attention. Your registration is safe and will not be repeated. Contact Vigil for payment help.",
      tone: "attention",
    } as const;
  if (
    order.paymentState === "refund_pending" ||
    order.paymentState === "refunded"
  )
    return {
      title: "Your payment is being reviewed",
      description:
        "A refund does not cancel a registered domain. Vigil will confirm your payment and domain status separately.",
      tone: "attention",
    } as const;
  if (order.registrationState === "awaiting_payment")
    return {
      title: "Finish your payment",
      description:
        "Your order is saved. Resume the same checkout to continue; your address is not reserved yet.",
      tone: "waiting",
    } as const;
  if (order.registrationState === "failed" || order.paymentState === "canceled")
    return {
      title: "Registration needs attention",
      description:
        "Your order is saved. Review the message below and recheck its status before starting another purchase.",
      tone: "attention",
    } as const;
  if (order.registrationState !== "registered")
    return {
      title: "We’re registering your address",
      description:
        "You can leave this page and return. Payment authorization and registration are checked separately.",
      tone: "waiting",
    } as const;
  if (
    registration?.contactVerification !== "verified" ||
    status === "contact_hold"
  )
    return {
      title: "One email to make it yours",
      description:
        "Open the verification email from Name.com and follow its link. This confirms you own the domain and keeps it active.",
      tone: "attention",
    } as const;
  if (order.paymentState !== "paid")
    return {
      title: "We’re confirming your payment",
      description:
        "Your address is registered. We’re checking payment before preparing its website connection.",
      tone: "waiting",
    } as const;
  if (order.connectionState === "live")
    return {
      title: "Your website is connected",
      description:
        "Your address is connected to the approved website, with a secure HTTPS connection.",
      tone: "success",
    } as const;
  return {
    title: "Congratulations! Your domain is ready",
    description:
      "Your email is verified and your address is ready to connect. Once you and Vigil have completed the website review and approval process, Vigil will deploy your finished site and connect the domain.",
    tone: "ready",
  } as const;
}
