export type Feed = {
  url: string;
  name: string;
  category?: string;
  enabled: boolean;
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
  category?: string;
};

/** An entry after translation, as persisted in docs/translated.xml. */
export type TranslatedEntry = {
  guid: string;
  link: string;
  titleJa: string;
  descriptionJa: string;
  pubDate: Date;
  sourceName: string;
  category?: string;
};
