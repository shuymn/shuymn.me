import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postLocaleSchema = z.enum(["ja", "en"]);

const optionalTextSchema = z.string().min(1).optional();
const linkSchema = z
  .object({
    label: z.string().min(1),
    url: z.string().min(1),
  })
  .strict();

export const localPostSchema = z
  .object({
    slug: z.string().min(1),
    locale: postLocaleSchema,
    title: z.string().min(1),
    publishedAt: z.coerce.date(),
    tags: z.array(z.string().min(1)).default([]),
    series: z
      .object({
        slug: z.string().min(1),
        order: z.number().int().positive().optional(),
      })
      .strict()
      .optional(),
    seo: z
      .object({
        title: optionalTextSchema,
        description: optionalTextSchema,
      })
      .strict()
      .default({}),
    translation: z
      .object({
        disabled: z.boolean().default(false),
        sourceLocale: postLocaleSchema.optional(),
        sourceSlug: optionalTextSchema,
        sourceVersion: optionalTextSchema,
      })
      .strict()
      .default({ disabled: false }),
    statusNote: optionalTextSchema,
  })
  .strict();

const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "**/*.md",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: localPostSchema,
});

const siteSections = defineCollection({
  loader: glob({
    base: "./src/content/site-sections",
    pattern: "**/*.md",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z
    .object({
      slug: z.string().min(1),
      locale: postLocaleSchema,
      title: z.string().min(1),
      publishedAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      links: z.array(linkSchema).default([]),
    })
    .strict(),
});

export const collections = { posts, siteSections };
