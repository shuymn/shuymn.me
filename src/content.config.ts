import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postLocaleSchema = z.enum(["ja", "en"]);

const optionalTextSchema = z.string().min(1).optional();

const localPostSchema = z
  .object({
    slug: z.string().min(1),
    locale: postLocaleSchema,
    title: z.string().min(1),
    description: optionalTextSchema,
    publishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(true),
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
    generation: z
      .object({
        promptVersion: optionalTextSchema,
        reviewerVersion: optionalTextSchema,
        sourceHash: optionalTextSchema,
        status: z.enum(["draft", "reviewing", "passed", "failed", "published"]).optional(),
      })
      .strict()
      .default({}),
  })
  .strict();

const localPosts = defineCollection({
  loader: glob({
    base: "./src/content/local-posts",
    pattern: "**/*.md",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: localPostSchema,
});

export const collections = { localPosts };
