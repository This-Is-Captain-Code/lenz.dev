import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// Lens interactions tracking for reward calculations
export const lensInteractions = pgTable("lens_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lensId: varchar("lens_id").notNull(),
  userId: varchar("user_id"), // Can be null for anonymous interactions
  interactionType: text("interaction_type").notNull(), // 'apply', 'capture', 'share', 'download'
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  lensIdIdx: index("lens_interactions_lens_id_idx").on(table.lensId),
  createdAtIdx: index("lens_interactions_created_at_idx").on(table.createdAt),
}));

// Weekly reward distribution tracking
export const rewardDistributions = pgTable("reward_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  totalRewardPool: decimal("total_reward_pool", { precision: 18, scale: 8 }).notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  transactionHash: text("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  weekStartIdx: index("reward_distributions_week_start_idx").on(table.weekStart),
}));

// Individual creator rewards within each distribution
export const creatorRewards = pgTable("creator_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  distributionId: varchar("distribution_id").notNull(),
  creatorAddress: text("creator_address").notNull(),
  creatorName: text("creator_name").notNull(),
  interactionCount: integer("interaction_count").notNull(),
  rewardWeight: decimal("reward_weight", { precision: 10, scale: 8 }).notNull(),
  rewardAmount: decimal("reward_amount", { precision: 18, scale: 8 }).notNull(),
  transactionHash: text("transaction_hash"),
  status: text("status").notNull().default("pending"), // 'pending', 'sent', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  distributionIdIdx: index("creator_rewards_distribution_id_idx").on(table.distributionId),
  creatorAddressIdx: index("creator_rewards_creator_address_idx").on(table.creatorAddress),
}));

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

export const insertLensInteractionSchema = createInsertSchema(lensInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertRewardDistributionSchema = createInsertSchema(rewardDistributions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertCreatorRewardSchema = createInsertSchema(creatorRewards).omit({
  id: true,
  createdAt: true,
});

// Relations
export const lensesRelations = relations(lenses, ({ many }) => ({
  interactions: many(lensInteractions),
  userLenses: many(userLenses),
}));

export const lensInteractionsRelations = relations(lensInteractions, ({ one }) => ({
  lens: one(lenses, {
    fields: [lensInteractions.lensId],
    references: [lenses.id],
  }),
}));

export const rewardDistributionsRelations = relations(rewardDistributions, ({ many }) => ({
  creatorRewards: many(creatorRewards),
}));

export const creatorRewardsRelations = relations(creatorRewards, ({ one }) => ({
  distribution: one(rewardDistributions, {
    fields: [creatorRewards.distributionId],
    references: [rewardDistributions.id],
  }),
}));

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLens = z.infer<typeof insertLensSchema>;
export type Lens = typeof lenses.$inferSelect;
export type InsertUserLens = z.infer<typeof insertUserLensSchema>;
export type UserLens = typeof userLenses.$inferSelect;
export type InsertLensInteraction = z.infer<typeof insertLensInteractionSchema>;
export type LensInteraction = typeof lensInteractions.$inferSelect;
export type InsertRewardDistribution = z.infer<typeof insertRewardDistributionSchema>;
export type RewardDistribution = typeof rewardDistributions.$inferSelect;
export type InsertCreatorReward = z.infer<typeof insertCreatorRewardSchema>;
export type CreatorReward = typeof creatorRewards.$inferSelect;
