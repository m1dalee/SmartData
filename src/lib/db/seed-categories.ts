import { defaultCategories } from "@/lib/db/default-categories";
import { categories } from "@/lib/db/schema";
import type { SmartDataDb } from "@/lib/db/types";

export async function seedDefaultCategories(db: SmartDataDb) {
  const existing = await db.select({ name: categories.name }).from(categories);
  if (existing.length === 0) {
    await db.insert(categories).values(defaultCategories);
    return;
  }

  const hasMovement = existing.some((row) => row.name === "Mouvement d'argent");
  if (!hasMovement) {
    await db.insert(categories).values({
      name: "Mouvement d'argent",
      icon: "arrow-left-right",
      color: "#0ea5e9",
      type: "expense",
    });
  }
}
