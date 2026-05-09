import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postLocaleSchema = z.enum(["ja", "en"]);

const optionalTextSchema = z.string().min(1).optional();

export const postSchema = z
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
    relatedPostSlugs: z
      .array(z.string().min(1))
      .refine((slugs) => new Set(slugs).size === slugs.length, {
        message: "relatedPostSlugs must not contain duplicate values",
      })
      .default([]),
  })
  .strict();

const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "**/*.md",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: postSchema,
});

export const collections = { posts };
