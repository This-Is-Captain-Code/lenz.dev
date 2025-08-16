import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const lenses = pgTable("lenses", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  creator: text("creator").notNull(),
  downloads: integer("downloads").default(0),
  snapLensId: text("snap_lens_id").notNull(),
  snapGroupId: text("snap_group_id"),
  category: text("category").default("all"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userLenses = pgTable("user_lenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  lensId: varchar("lens_id").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertLensSchema = createInsertSchema(lenses).omit({
  id: true,
  createdAt: true,
});

export const insertUserLensSchema = createInsertSchema(userLenses).omit({
  id: true,
  purchasedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLens = z.infer<typeof insertLensSchema>;
export type Lens = typeof lenses.$inferSelect;
export type InsertUserLens = z.infer<typeof insertUserLensSchema>;
export type UserLens = typeof userLenses.$inferSelect;
