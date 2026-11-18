import Link from "next/link";
import { ArrowUpRight, Image, Tags, FilePenLine, Package, Store, Plug } from "lucide-react";
import styles from "./field-guide.module.css";

/** Product bundles are eligibility guidance, not additional billing SKUs. */
export function ProductPlanComparison() {
  return (
    <section id="product-plans" className="my-12 border-t border-[var(--border)] pt-12" aria-labelledby="product-plans-title">
      <p className={styles.marker}>Products / Included with eligible packages</p>
      <h2 id="product-plans-title" className={styles.heading}>A catalog today. Room for commerce tomorrow.</h2>
      <p className={`${styles.body} mt-4 max-w-3xl`}>Your website package and Vigil subscription determine your product tools. Products Lite and Commerce Pro are package capabilities, with no separate recurring product add-on at launch.</p>
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
          <p className={styles.marker}>Native product management</p>
          <h3 className={styles.subhead}>Products Lite</h3>
          <p className={`${styles.body} mt-3`}>Present what you sell and keep your collection up to date from Vigil.</p>
          <ul className="my-5 space-y-3 text-sm text-[var(--text-secondary)]">
            {([[Image, "Product listings, images, and descriptions"], [Tags, "Price labels and categories"], [FilePenLine, "Drafts and publication for your connected catalog"]] as const).map(([Icon, item]) => <li key={item} className="flex gap-2"><Icon size={16} className="shrink-0 text-[var(--accent)]" aria-hidden />{item}</li>)}
          </ul>
          <p className={`${styles.body} border-t border-[var(--border)] pt-4`}>Express + Care or higher.<br />Professional or Growth website + Basic.</p>
        </article>
        <article className="rounded-2xl border border-[var(--accent)] bg-[var(--bg-surface)] p-6">
          <p className={styles.marker}>Expanded commerce workspace</p>
          <h3 className={styles.subhead}>Commerce Pro</h3>
          <p className={`${styles.body} mt-3`}>Build on your native catalog with commerce capabilities as integrations become available.</p>
          <ul className="my-5 space-y-3 text-sm text-[var(--text-secondary)]">
            {([[Package, "Native product catalog management"], [Store, "Eligible for connected commerce tools"], [Plug, "Provider features require supported connections and activation"]] as const).map(([Icon, item]) => <li key={item} className="flex gap-2"><Icon size={16} className="shrink-0 text-[var(--accent)]" aria-hidden />{item}</li>)}
          </ul>
          <p className={`${styles.body} border-t border-[var(--border)] pt-4`}>Professional or Growth website + Care or higher.<br />Minimum bundle: Professional + Care.</p>
        </article>
      </div>
      <p className={`${styles.body} mt-5`}>Express + Basic does not include standard Products Lite access. A higher subscription alone does not unlock Commerce Pro on Express. Commerce integrations are rolling out; confirm available capabilities before purchase. Virtue commerce features remain in development for eligible Growth and Priority subscriptions.</p>
      <Link href="/find-your-fit" className={`${styles.textLink} mt-4`}>Find the right website and product setup <ArrowUpRight size={15} aria-hidden /></Link>
    </section>
  );
}
