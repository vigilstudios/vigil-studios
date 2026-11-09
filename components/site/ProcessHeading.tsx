import type { CSSProperties } from "react";
import styles from "./process-heading.module.css";

export function ProcessHeading({ id, title, active }: { id?: string; title: string; active: boolean }) {
  return (
    <h3 id={id} aria-label={title} className={styles.heading} data-typing={active}>
      <span aria-hidden="true">
        {Array.from(title, (character, index) =>
          character === " " ? character : (
            <span className={styles.character} key={index} style={{ "--character": index } as CSSProperties}>{character}</span>
          ),
        )}
      </span>
    </h3>
  );
}
