import type { DecisionLogEntry } from "@/types/dashboard";
import { SectionHeading } from "@/components/SectionHeading";

interface DecisionLogProps {
  title: string;
  description: string;
  entries: DecisionLogEntry[];
}

export function DecisionLog({
  title,
  description,
  entries,
}: DecisionLogProps) {
  return (
    <section className="decision-log" aria-labelledby="decision-log-title">
      <SectionHeading title={title} description={description} />

      <ol>
        {entries.map((entry) => (
          <li key={entry.id}>
            <time>{entry.date}</time>
            <div className="decision-log__entry">
              <div>
                <strong>{entry.label}</strong>
                <p>{entry.keyReason}</p>
              </div>
              <span>{entry.confidence}% confidence</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
