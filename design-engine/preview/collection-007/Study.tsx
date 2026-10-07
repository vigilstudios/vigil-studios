"use client";
/* eslint-disable @next/next/no-img-element -- Portable Lab study media uses the existing engine's native-media boundary. */
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DesignThemeProvider } from "../../foundations/DesignThemeProvider";
import type { FontBindings } from "../../foundations/typography/types";
import { VigilIcon } from "../../icons/VigilIcon";
import {
  formatMoney,
  type CommerceModel,
  type Product,
  type ProductMedia,
  type CommerceContent,
} from "./contracts";
import {
  makeCommerceModel,
  commerceContexts,
  type StressMode,
} from "./fixtures";
import type { CommerceStudy } from "./studies";
const MissingMedia = createContext(false);
const num = (i: number) => String(i + 1).padStart(2, "0");
const statusText = {
  available: "Available",
  unavailable: "Unavailable",
  preorder: "Pre-order",
  unknown: "Availability not supplied",
};

function Picture({
  media,
  compact = false,
}: {
  media?: ProductMedia;
  compact?: boolean;
}) {
  const missing = useContext(MissingMedia),
    [failed, setFailed] = useState(false);
  if (!media || missing || failed)
    return (
      <div
        className="c7-missing"
        role="img"
        aria-label={
          media
            ? `${media.label} — image unavailable`
            : "Product image not supplied"
        }
      >
        <span aria-hidden="true">↗</span>
        <p>{media?.label ?? "Product image not supplied"}</p>
        <small>Image unavailable · product information remains below</small>
      </div>
    );
  if (media.kind === "video" && !compact)
    return (
      <div className="c7-film">
        <video
          controls
          preload="none"
          playsInline
          aria-label={media.video.label}
          poster={media.video.poster.src}
          width={media.video.width}
          height={media.video.height}
        >
          <source src={media.video.src} />
          {media.video.captions && (
            <track
              kind="captions"
              src={media.video.captions.src}
              srcLang={media.video.captions.language}
              label={media.video.captions.label}
            />
          )}
        </video>
        <details>
          <summary>Visual transcript</summary>
          <p>{media.video.transcript}</p>
        </details>
      </div>
    );
  const image = media.kind === "video" ? media.video.poster : media.image;
  return (
    <div
      className={`c7-picture ${media.kind === "interactive-placeholder" ? "c7-placeholder" : ""}`}
    >
      <img
        src={image.src}
        alt={compact ? "" : image.alt}
        width={image.width}
        height={image.height}
        loading="lazy"
        onError={() => setFailed(true)}
      />
      {media.kind === "interactive-placeholder" && !compact && (
        <p>
          <strong>360° · static fallback</strong>
          <br />
          {media.explanation}
        </p>
      )}
    </div>
  );
}
function Price({ product }: { product: Product }) {
  return (
    <p className="c7-price">
      {product.compareAtPrice && (
        <>
          <span className="c7-sr-only">Previous price </span>
          <del>{formatMoney(product.compareAtPrice)}</del>
          <span className="c7-sr-only"> Sale price </span>
        </>
      )}
      <span>{formatMoney(product.price)}</span>
      <small>{product.price.currency}</small>
    </p>
  );
}
function Availability({ product }: { product: Product }) {
  return (
    <span
      className={`c7-availability c7-availability--${product.availability}`}
    >
      {statusText[product.availability]}
    </span>
  );
}
type OpenDestination = (
  data: { title: string; body: string; id: string },
  trigger: HTMLAnchorElement,
) => void;
const DestinationContext = createContext<OpenDestination>(() => {});
function ProductLink({
  product,
  children,
}: {
  product: Product;
  children?: ReactNode;
}) {
  const open = useContext(DestinationContext),
    uid = useId();
  return (
    <a
      className="c7-product-link"
      href={`#destination-${uid.replaceAll(":", "")}`}
      onClick={(event) => {
        event.preventDefault();
        open(
          {
            id: `destination-${uid.replaceAll(":", "")}`,
            title: product.title,
            body: `${product.description} ${formatMoney(product.price)} ${product.price.currency}. ${statusText[product.availability]}.`,
          },
          event.currentTarget,
        );
      }}
    >
      {children ?? product.destination.label}
      <VigilIcon decorative name="arrow-up-right" size={17} />
    </a>
  );
}
function ProductRecord({
  product,
  description = false,
}: {
  product: Product;
  description?: boolean;
}) {
  return (
    <div className="c7-record">
      <small>
        {product.category}
        {product.badges.length ? ` / ${product.badges.join(" · ")}` : ""}
      </small>
      <h3>{product.title}</h3>
      {description && <p>{product.description}</p>}
      <Price product={product} />
      <Availability product={product} />
      <ProductLink product={product} />
    </div>
  );
}
function EditorialItem({ product, note }: { product: Product; note: string }) {
  return (
    <article className="c7-editorial-item">
      <Picture media={product.media[0]} />
      <p className="c7-item-note">{note}</p>
      <ProductRecord product={product} />
    </article>
  );
}
function Ledger({ content }: { content: CommerceContent<"P02"> }) {
  const [category, setCategory] = useState("All"),
    [available, setAvailable] = useState(false),
    [sort, setSort] = useState("editorial");
  const rows = content.products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      (!available || p.availability === "available"),
  );
  if (sort !== "editorial")
    rows.sort(
      (a, b) =>
        (a.price.amountMinor - b.price.amountMinor) *
        (sort === "ascending" ? 1 : -1),
    );
  return (
    <div className="c7-ledger">
      <details className="c7-filters">
        <summary>
          Refine this selection <VigilIcon decorative name="plus" size={16} />
        </summary>
        <div>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["All", ...new Set(content.products.map((p) => p.category))].map(
                (v) => (
                  <option key={v}>{v}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Sort this slice
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="editorial">Editorial order</option>
              <option value="ascending">Price: low to high</option>
              <option value="descending">Price: high to low</option>
            </select>
          </label>
          <label className="c7-check">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />{" "}
            Available only
          </label>
        </div>
      </details>
      <div className="c7-register-labels">
        <span>Object / category</span>
        <span>Availability</span>
        <span>Price / currency</span>
      </div>
      <ul>
        {rows.map((p, i) => (
          <li key={p.productId}>
            <div className="c7-ledger-object">
              <span className="c7-number">{num(i)}</span>
              <Picture media={p.media[0]} compact />
              <div>
                <ProductLink product={p}>{p.title}</ProductLink>
                <small>{p.category}</small>
              </div>
            </div>
            <Availability product={p} />
            <Price product={p} />
          </li>
        ))}
      </ul>
      {!rows.length && (
        <p className="c7-empty">
          No products in this fixture slice match. Change the filters to
          continue.
        </p>
      )}
      <footer>
        <span role="status">
          {rows.length} of {content.products.length} fixture products shown
        </span>
        <small>{content.totalCatalogLabel}</small>
      </footer>
    </div>
  );
}
function Look({ content }: { content: CommerceContent<"P06"> }) {
  const [lookIndex, setLook] = useState(0),
    [item, setItem] = useState(0),
    uid = useId();
  const look = content.looks[lookIndex],
    product = look.products[item];
  return (
    <div className="c7-look">
      <div className="c7-choice-line" role="group" aria-label="Choose a look">
        {content.looks.map((l, i) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={i === lookIndex}
            onClick={() => {
              setLook(i);
              setItem(0);
            }}
          >
            {num(i)} / {l.title}
          </button>
        ))}
      </div>
      <figure className="c7-look-scene">
        <Picture key={look.id} media={look.campaignMedia} />
        <figcaption>{look.caption}</figcaption>
      </figure>
      <div className="c7-look-legend">
        <p className="c7-kicker">The objects in this edit</p>
        <div
          className="c7-look-choices"
          role="group"
          aria-label="Explore the look’s products"
        >
          {look.products.map((p, i) => (
            <button
              key={p.productId}
              type="button"
              aria-pressed={item === i}
              aria-controls={uid}
              onClick={() => setItem(i)}
            >
              <span>{num(i)}</span>
              <span>
                {p.title}
                <small>{look.roles[i]}</small>
              </span>
              <VigilIcon decorative name="arrow-right" size={18} />
            </button>
          ))}
        </div>
        <div id={uid} className="c7-look-selected">
          <p className="c7-kicker" role="status">
            Selected / {product.title}
          </p>
          <p>{look.roles[item]}</p>
          <ProductRecord product={product} description />
        </div>
      </div>
    </div>
  );
}
function Sequence({ children, label }: { children: ReactNode; label: string }) {
  const rail = useRef<HTMLDivElement>(null),
    uid = useId();
  return (
    <>
      <div className="c7-sequence-controls">
        <span>{label} · scroll to explore</span>
        <div>
          <button
            type="button"
            aria-label={`Previous ${label}`}
            aria-controls={uid}
            onClick={() =>
              rail.current?.scrollBy({
                left: -rail.current.clientWidth * 0.85,
                behavior: "instant",
              })
            }
          >
            <VigilIcon decorative name="arrow-left" size={20} />
          </button>
          <button
            type="button"
            aria-label={`Next ${label}`}
            aria-controls={uid}
            onClick={() =>
              rail.current?.scrollBy({
                left: rail.current.clientWidth * 0.85,
                behavior: "instant",
              })
            }
          >
            <VigilIcon decorative name="arrow-right" size={20} />
          </button>
        </div>
      </div>
      <div
        id={uid}
        className="c7-sequence"
        ref={rail}
        tabIndex={0}
        role="region"
        aria-label={label}
      >
        {children}
      </div>
    </>
  );
}
function Anatomy({ content }: { content: CommerceContent<"P08"> }) {
  const [selected, setSelected] = useState(0),
    uid = useId();
  const detail = content.materials[selected];
  return (
    <div className="c7-anatomy">
      <aside>
        <Picture media={content.product.media[0]} />
        <small>Object reference / {content.product.title}</small>
        <ProductLink product={content.product} />
      </aside>
      <div className="c7-inspection">
        <div
          className="c7-choice-line"
          role="group"
          aria-label="Inspect a material"
        >
          {content.materials.map((m, i) => (
            <button
              type="button"
              key={m.id}
              aria-pressed={i === selected}
              aria-controls={uid}
              onClick={() => setSelected(i)}
            >
              {num(i)} / {m.name}
            </button>
          ))}
        </div>
        <div id={uid}>
          <Picture key={detail.id} media={detail.media} />
          <div className="c7-material-copy">
            <h3 aria-live="polite">{detail.name}</h3>
            <p>{detail.detail}</p>
            <small>{detail.evidence}</small>
          </div>
        </div>
      </div>
    </div>
  );
}
function InspectionDesk({ content }: { content: CommerceContent<"P10"> }) {
  const [selected, setSelected] = useState(0),
    uid = useId();
  const plate = content.gallery[selected];
  return (
    <div className="c7-desk">
      <figure id={uid} className="c7-primary-media">
        <Picture key={plate.id} media={plate.media} />
        <figcaption aria-live="polite">
          <span>
            {num(selected)} / {plate.media.label}
          </span>
          {plate.caption}
        </figcaption>
      </figure>
      <div
        className="c7-contact-sheet"
        role="group"
        aria-label="Choose product media"
      >
        {content.gallery.map((p, i) => (
          <button
            type="button"
            key={p.id}
            aria-pressed={selected === i}
            aria-controls={uid}
            onClick={() => setSelected(i)}
          >
            <Picture media={p.media} compact />
            <span>
              {num(i)} /{" "}
              {p.media.kind === "image"
                ? "Still"
                : p.media.kind === "video"
                  ? "Film"
                  : "360° concept"}
            </span>
            <small>{p.media.label}</small>
          </button>
        ))}
      </div>
      <div className="c7-desk-record">
        <h3>{content.product.title}</h3>
        <Price product={content.product} />
        <ProductLink product={content.product} />
      </div>
    </div>
  );
}
function OptionAtelier({ content }: { content: CommerceContent<"P12"> }) {
  const [choices, setChoices] = useState<Record<string, string>>(() =>
      Object.fromEntries(content.options.map((o) => [o.id, o.values[0].id])),
    ),
    uid = useId();
  const variant = content.variants.find((v) =>
    content.options.every((o) => v.optionValues[o.id] === choices[o.id]),
  );
  return (
    <div className="c7-atelier">
      <div className="c7-option-object">
        <Picture media={content.product.media[0]} />
        <h3>{content.product.title}</h3>
        <p>{content.product.description}</p>
      </div>
      <div className="c7-option-workbook">
        {content.options.map((option) => (
          <fieldset key={option.id}>
            <legend>{option.name}</legend>
            <div>
              {option.values.map((value) => (
                <label className="c7-option" key={value.id}>
                  <input
                    type="radio"
                    name={`${uid}-${option.id}`}
                    value={value.id}
                    checked={choices[option.id] === value.id}
                    onChange={() =>
                      setChoices((v) => ({ ...v, [option.id]: value.id }))
                    }
                  />
                  <span>
                    {value.color && (
                      <i
                        aria-hidden="true"
                        style={{ background: value.color }}
                      />
                    )}
                    {value.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="c7-variant-receipt" role="status">
          <small>Your selection / presentation preview</small>
          <p>
            {content.options
              .map((o) => o.values.find((v) => v.id === choices[o.id])!.label)
              .join(" / ")}
          </p>
          {variant ? (
            <>
              <strong>
                {formatMoney(variant.price)} {variant.price.currency}
              </strong>
              <span>{statusText[variant.availability]}</span>
              <small>Variant {variant.id}</small>
            </>
          ) : (
            <strong>
              No matching variant. Choose a different combination.
            </strong>
          )}
        </div>
        <p className="c7-guidance">{content.guidance}</p>
        <ProductLink product={content.product} />
      </div>
    </div>
  );
}
function Comparison({ content }: { content: CommerceContent<"P13"> }) {
  const [candidate, setCandidate] = useState(1),
    a = content.products[0],
    b = content.products[candidate];
  return (
    <div className="c7-bench">
      <label className="c7-candidate">
        Compare {a.title} with
        <select
          value={candidate}
          onChange={(e) => setCandidate(Number(e.target.value))}
        >
          {content.products.slice(1).map((p, i) => (
            <option key={p.productId} value={i + 1}>
              {p.title}
            </option>
          ))}
        </select>
      </label>
      <p className="c7-sr-only" role="status">
        Comparing {a.title} and {b.title}
      </p>
      <div className="c7-bench-objects">
        {[a, b].map((p, i) => (
          <article key={p.productId}>
            <small>{i === 0 ? "Baseline" : "Candidate"}</small>
            <Picture key={p.productId} media={p.media[0]} />
            <ProductRecord product={p} />
          </article>
        ))}
      </div>
      <table>
        <caption>Shared criteria · authored product comparison</caption>
        <thead>
          <tr>
            <th scope="col">Criterion</th>
            <th scope="col">{a.title}</th>
            <th scope="col">{b.title}</th>
          </tr>
        </thead>
        <tbody>
          {content.criteria.map((c) => (
            <tr key={c.id}>
              <th scope="row">{c.label}</th>
              <td>{c.values[0]}</td>
              <td>{c.values[candidate]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Artwork({ model }: { model: CommerceModel }) {
  const open = useContext(DestinationContext),
    uid = useId();
  switch (model.kind) {
    case "P01":
      return (
        <div className="c7-edit">
          <EditorialItem {...model.content.items[0]} />
          <aside>
            <p className="c7-editor-note">{model.content.editorialNote}</p>
            <div className="c7-edit-support">
              {model.content.items.slice(1).map((item) => (
                <EditorialItem key={item.product.productId} {...item} />
              ))}
            </div>
          </aside>
        </div>
      );
    case "P02":
      return <Ledger content={model.content} />;
    case "P03":
      return (
        <div className="c7-pedestal">
          <p className="c7-edition">{model.content.edition}</p>
          <div className="c7-object">
            <Picture media={model.content.product.media[0]} />
          </div>
          <dl>
            {model.content.specifications.map((s) => (
              <div key={s.id}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
          <ProductRecord product={model.content.product} description />
        </div>
      );
    case "P04":
      return (
        <div className="c7-release">
          <h3>{model.content.statement}</h3>
          <Picture media={model.content.campaignMedia} />
          <div className="c7-release-strip">
            <p>{model.content.release}</p>
            <h4>{model.content.product.title}</h4>
            <Price product={model.content.product} />
            <Availability product={model.content.product} />
            <ProductLink product={model.content.product} />
          </div>
        </div>
      );
    case "P05":
      return (
        <div className="c7-atlas">
          {model.content.collections.map((c, i) => (
            <article key={c.id}>
              <div className="c7-atlas-title">
                <small>
                  {num(i)} / {c.productCount} objects
                </small>
                <h3>
                  <a
                    href={`#${uid}-${c.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      open(
                        {
                          id: `${uid}-${c.id}`,
                          title: c.title,
                          body: c.description,
                        },
                        e.currentTarget,
                      );
                    }}
                  >
                    {c.title}
                    <VigilIcon decorative name="arrow-up-right" size={26} />
                  </a>
                </h3>
                <p>{c.description}</p>
              </div>
              <Picture media={c.media} />
            </article>
          ))}
        </div>
      );
    case "P06":
      return <Look content={model.content} />;
    case "P07":
      return (
        <Sequence label="Campaign chapters">
          {model.content.spreads.map((s, i) => (
            <article className="c7-spread" key={s.id}>
              <div className="c7-spread-story">
                <small>Chapter {num(i)}</small>
                <h3>{s.title}</h3>
                <p>{s.story}</p>
                <Picture media={s.campaignMedia} />
              </div>
              <div className="c7-colophon">
                <span className="c7-number">{num(i)}</span>
                <small>The object in this chapter</small>
                <ProductRecord product={s.product} />
              </div>
            </article>
          ))}
        </Sequence>
      );
    case "P08":
      return <Anatomy content={model.content} />;
    case "P09":
      return (
        <div className="c7-origin">
          <div className="c7-origin-object">
            <Picture media={model.content.product.media[0]} />
            <ProductRecord product={model.content.product} />
          </div>
          <ol>
            {model.content.stages.map((s, i) => (
              <li key={s.id}>
                <div className="c7-origin-marker">
                  <span>{num(i)}</span>
                  <small>{s.place}</small>
                </div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.story}</p>
                  <small className="c7-evidence">{s.evidence}</small>
                  {s.media && (
                    <figure>
                      <Picture media={s.media} />
                      <figcaption>
                        Finished-object reference, not a process photograph.
                      </figcaption>
                    </figure>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <footer>
            Object record / {model.content.product.productId} · provenance
            requires brand verification
          </footer>
        </div>
      );
    case "P10":
      return <InspectionDesk content={model.content} />;
    case "P11":
      return (
        <div className="c7-folio">
          <div className="c7-folio-record">
            <h3>{model.content.product.title}</h3>
            <Price product={model.content.product} />
            <ProductLink product={model.content.product} />
          </div>
          {model.content.plates.map((p, i) => (
            <figure key={p.id}>
              <figcaption>
                <span className="c7-number">{num(i)}</span>
                <h4>{p.media.label}</h4>
                <p>{p.caption}</p>
              </figcaption>
              <Picture media={p.media} />
            </figure>
          ))}
        </div>
      );
    case "P12":
      return <OptionAtelier content={model.content} />;
    case "P13":
      return <Comparison content={model.content} />;
    case "P14":
      return (
        <div className="c7-companions">
          <div className="c7-anchor">
            <small>Begin with</small>
            <h3>{model.content.anchor.title}</h3>
            <p>{model.content.anchor.description}</p>
            <ProductLink product={model.content.anchor} />
          </div>
          <Sequence label="Companion products">
            {model.content.relatedProducts.map((p, i) => (
              <article className="c7-companion" key={p.product.productId}>
                <small>
                  {num(i)} / {p.relationship}
                </small>
                <p>{p.reason}</p>
                <Picture media={p.product.media[0]} />
                <ProductRecord product={p.product} />
              </article>
            ))}
          </Sequence>
        </div>
      );
  }
}
function CommerceArtwork({ model }: { model: CommerceModel }) {
  const [destination, setDestination] = useState<{
      title: string;
      body: string;
      id: string;
    } | null>(null),
    trigger = useRef<HTMLAnchorElement | null>(null),
    heading = useRef<HTMLHeadingElement>(null),
    uid = useId();
  useEffect(() => {
    if (destination) heading.current?.focus();
  }, [destination]);
  return (
    <DestinationContext.Provider
      value={(data, link) => {
        trigger.current = link;
        setDestination(data);
      }}
    >
      <section
        className={`c7-study c7-${model.kind.toLowerCase()}`}
        data-study={model.kind}
        aria-labelledby={uid}
      >
        <header className="c7-heading">
          <p className="c7-kicker">
            {model.content.brand}
            <span>Collection / 007</span>
          </p>
          <h2 id={uid}>{model.content.title}</h2>
          <p className="c7-introduction">{model.content.introduction}</p>
        </header>
        <Artwork model={model} />
        {destination && (
          <aside
            className="c7-destination"
            id={destination.id}
            aria-label="Local destination preview"
          >
            <small>
              Lab destination preview · no Shop or Product Detail page is built
            </small>
            <h3 tabIndex={-1} ref={heading}>
              {destination.title}
            </h3>
            <p>{destination.body}</p>
            <button
              type="button"
              onClick={() => {
                setDestination(null);
                trigger.current?.focus();
              }}
            >
              Return to study
            </button>
          </aside>
        )}
      </section>
    </DestinationContext.Provider>
  );
}
export function CommerceStudyPreview({
  study,
  adaptation = 0,
  stress = "authored",
  fonts,
}: {
  study: CommerceStudy;
  adaptation?: number;
  stress?: StressMode;
  fonts?: FontBindings;
}) {
  const context = commerceContexts[adaptation],
    model = makeCommerceModel(study.id, adaptation, stress);
  return (
    <DesignThemeProvider
      typography={study.typography[adaptation]}
      artDirection={study.art[adaptation]}
      motion="none"
      fonts={fonts}
      overrides={{
        color: {
          background: context.palette[0],
          surface: context.palette[0],
          foreground: context.palette[1],
          muted: context.palette[2],
          accent: context.palette[2],
          border: context.palette[2],
          accentForeground: context.palette[0],
        },
      }}
    >
      <MissingMedia.Provider value={stress === "no-media"}>
        <CommerceArtwork
          key={`${study.id}-${adaptation}-${stress}`}
          model={model}
        />
      </MissingMedia.Provider>
    </DesignThemeProvider>
  );
}
