import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("tag"),
  color: text("color").notNull().default("#6366f1"),
  type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  label: text("label").notNull(),
  amount: real("amount").notNull(),
  type: text("type", { enum: ["expense", "income"] }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  source: text("source", { enum: ["manual", "import"] }).notNull().default("manual"),
  bankReference: text("bank_reference"),
  createdAt: text("created_at").notNull(),
});

export const budgets = sqliteTable("budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  month: text("month").notNull(),
  amount: real("amount").notNull(),
});

export const savingsGoals = sqliteTable("savings_goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  startingAmount: real("starting_amount").notNull().default(0),
  deadline: text("deadline"),
});

export const categoryRules = sqliteTable("category_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  keyword: text("keyword").notNull().unique(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  createdAt: text("created_at").notNull(),
});

/** Budget mensuel personnel (une seule ligne de config). */
export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Salaire net mensuel (virement principal). */
  monthlySalaryNet: real("monthly_salary_net").notNull().default(1830),
  /** Tickets restaurant mensuels. */
  mealVoucherAmount: real("meal_voucher_amount").notNull().default(160),
  /** Montant à mettre de côté chaque mois avant les dépenses. */
  monthlySavingsTarget: real("monthly_savings_target").notNull().default(1500),
  /** Jour de début de la fenêtre de paye (ex. 3). */
  paydayStartDay: integer("payday_start_day").notNull().default(3),
  /** Jour de fin de la fenêtre de paye (ex. 5). */
  paydayEndDay: integer("payday_end_day").notNull().default(5),
  updatedAt: text("updated_at").notNull(),
});

export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type CategoryRule = typeof categoryRules.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
