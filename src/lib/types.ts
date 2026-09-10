export type Domain = "claude" | "kubernetes" | "aws";
export type Kind = "content" | "release";

export type Feed = {
  url: string;
  name: string;
  domain: Domain;
  kind: Kind;
  enabled?: boolean;
};

export type FeedsConfig = {
  feeds: Feed[];
};

/** A normalized entry from a source feed, before translation. */
export type SourceEntry = {
  guid: string;
  link: string;
  title: string;
  description: string;
  pubDate: Date;
  sourceName: string;
};

/** An entry after translation, as persisted in translated-<domain>.xml. */
export type TranslatedEntry = {
  guid: string;
  link: string;
  titleJa: string;
  descriptionJa: string;
  pubDate: Date;
  sourceName: string;
};
