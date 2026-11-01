import { describe, expect, it } from "vitest";
import { customerDomainProgress } from "../domain-engine/customer-progress";

const registered = {
  registrationState: "registered",
  paymentState: "paid",
  connectionState: "ready_for_launch",
};
const verified = { status: "registered", contactVerification: "verified" };

describe("customer domain next steps", () => {
  it("does not confuse checkout authorization with a captured payment", () => {
    expect(
      customerDomainProgress(
        { ...registered, paymentState: "authorized" },
        verified,
      ),
    ).toMatchObject({
      title: "We’re confirming your payment",
      tone: "waiting",
    });
  });
  it("resumes an unpaid order instead of offering another purchase", () => {
    const result = customerDomainProgress({
      ...registered,
      registrationState: "awaiting_payment",
      paymentState: "pending",
    });
    expect(result.title).toBe("Finish your payment");
    expect(result.description).toContain("same checkout");
    expect(result.description).toContain("not reserved");
  });
  it.each(["unknown", "manual_review"])(
    "keeps an uncertain %s order in reconciliation",
    (registrationState) => {
      const result = customerDomainProgress({
        ...registered,
        registrationState,
        paymentState: "authorized",
      });
      expect(result.tone).toBe("waiting");
      expect(result.description).toContain("don’t purchase the address again");
    },
  );
  it("preserves a registration when payment capture fails", () => {
    const result = customerDomainProgress(
      { ...registered, paymentState: "capture_failed" },
      verified,
    );
    expect(result.tone).toBe("attention");
    expect(result.description).toContain("will not be repeated");
  });
  it.each(["refunded", "refund_pending"])(
    "does not describe %s as canceling a domain",
    (paymentState) => {
      expect(
        customerDomainProgress({ ...registered, paymentState }, verified)
          .description,
      ).toContain("does not cancel a registered domain");
    },
  );
  it("requires real email verification even when connection state says live", () => {
    expect(
      customerDomainProgress(
        { ...registered, connectionState: "live" },
        { ...verified, contactVerification: "pending" },
      ),
    ).toMatchObject({ title: "One email to make it yours", tone: "attention" });
  });
  it("never calls an expired or held domain connected", () => {
    expect(
      customerDomainProgress(
        { ...registered, connectionState: "live" },
        { ...verified, status: "expired" },
      ).title,
    ).toBe("Your address needs renewing");
    expect(
      customerDomainProgress(
        { ...registered, connectionState: "live" },
        { ...verified, status: "contact_hold" },
      ).tone,
    ).toBe("attention");
  });
  it.each(["released", "transferred", "transfer_pending"])(
    "pauses connection for %s",
    (status) => {
      expect(
        customerDomainProgress(
          { ...registered, connectionState: "live" },
          { ...verified, status },
        ).tone,
      ).toBe("attention");
    },
  );
  it("separates a registered address from an approved live website", () => {
    const result = customerDomainProgress(registered, verified);
    expect(result.tone).toBe("ready");
    expect(result.title).toContain("Congratulations");
    expect(result.description).toContain("website review and approval process");
    expect(result.description).toContain("Vigil will deploy");
    expect(registered.connectionState).toBe("ready_for_launch");
  });
  it("shows success only for a paid, verified, active and connected domain", () => {
    expect(
      customerDomainProgress(
        { ...registered, connectionState: "live" },
        verified,
      ),
    ).toMatchObject({ title: "Your website is connected", tone: "success" });
  });
});
