"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
type Checkout = { mount(element: HTMLElement): void; destroy(): void };
type StripeFactory = (key: string) => {
  initEmbeddedCheckout(input: {
    clientSecret: string;
    onComplete: () => void;
  }): Promise<Checkout>;
};

export function EmbeddedTestCheckout({
  live = false,
  clientSecret,
  publishableKey,
  onComplete,
}: {
  live?:boolean;
  clientSecret: string;
  publishableKey: string;
  onComplete: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const complete = useRef(onComplete);
  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    if (!ready || !container.current) return;
    let canceled = false;
    let checkout: Checkout | undefined;
    const factory = (window as unknown as { Stripe?: StripeFactory }).Stripe;
    if (!factory || !publishableKey.startsWith(live ? "pk_live_" : "pk_test_")) return;
    void factory(publishableKey)
      .initEmbeddedCheckout({
        clientSecret,
        onComplete: () => complete.current(),
      })
      .then((value) => {
        if (canceled) {
          value.destroy();
          return;
        }
        checkout = value;
        if (container.current) value.mount(container.current);
      })
      .catch(() => {
        if (!canceled)
          setError(
            live ? "Secure checkout could not load. Resume your existing order." : "Stripe test checkout could not load. Retry from your test order.",
          );
      });
    return () => {
      canceled = true;
      checkout?.destroy();
    };
  }, [ready, clientSecret, publishableKey, live]);
  return (
    <div>
      <Script
        src="https://js.stripe.com/v3/"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => setError(live ? "Secure checkout could not load. Resume your existing order." : "Stripe test checkout could not load.")}
      />
      <p className="mb-4 text-sm">
        {live ? "Secure Stripe checkout. Your payment is authorized first and captured after registration is confirmed." : "Stripe test mode. Use a Stripe test card; no real payment will be collected."}
      </p>
      {error ? <p role="alert">{error}</p> : null}
      <div ref={container} />
    </div>
  );
}
