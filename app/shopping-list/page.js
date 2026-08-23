"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearAllItems,
  clearCheckedItems,
  getShoppingListSnapshot,
  removeShoppingItem,
  subscribeToShoppingListChanges,
  toggleShoppingItem,
} from "@/lib/shoppingList";

const EMPTY = [];

function groupByRecipe(items) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.recipeId)) {
      groups.set(item.recipeId, { recipeId: item.recipeId, recipeTitle: item.recipeTitle, items: [] });
    }
    groups.get(item.recipeId).items.push(item);
  }
  return Array.from(groups.values());
}

export default function ShoppingListPage() {
  const router = useRouter();
  const items = useSyncExternalStore(subscribeToShoppingListChanges, getShoppingListSnapshot, () => EMPTY);
  const hasChecked = items.some((item) => item.checked);
  const groups = groupByRecipe(items);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);

  function handleClearAll() {
    clearAllItems();
    router.back();
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-6">
      <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">Shopping list</h1>

      {items.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          {confirmingClearAll ? (
            <>
              <span className="flex-1 text-xs font-medium text-muted">Clear everything?</span>
              <button
                type="button"
                onClick={() => setConfirmingClearAll(false)}
                className="flex h-9 items-center justify-center rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-foreground transition-colors hover:border-accent/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-red-500 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-red-600"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <path d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0-.7 12.1A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-2-1.9L7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Confirm
              </button>
            </>
          ) : (
            <>
              {hasChecked && (
                <button
                  type="button"
                  onClick={clearCheckedItems}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-foreground transition-colors hover:border-accent/40 hover:text-accent"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                    <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Clear checked
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmingClearAll(true)}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 ${
                  hasChecked ? "flex-1" : "w-full"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <path d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0-.7 12.1A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-2-1.9L7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Clear all
              </button>
            </>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted">
            Add ingredients from a recipe to build your list.
          </p>
          <Link
            href="/scan"
            className="gradient-accent flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="2" />
            </svg>
            Scan a dish
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map((group) => (
            <section key={group.recipeId}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  {group.recipeTitle}
                </h2>
                <Link href={`/recipe/${group.recipeId}`} className="shrink-0 text-xs text-accent">
                  View recipe
                </Link>
              </div>
              <ul className="mt-2 divide-y divide-border">
                {group.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleShoppingItem(item.id)}
                      aria-label={item.checked ? "Mark not bought" : "Mark bought"}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        item.checked ? "gradient-accent border-transparent" : "border-border"
                      }`}
                    >
                      {item.checked && (
                        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                          <path d="M5 12.5l4.5 4.5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`flex-1 truncate text-sm ${
                        item.checked ? "text-muted line-through" : "text-foreground/90"
                      }`}
                    >
                      {item.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {[item.quantity, item.unit].filter(Boolean).join(" ")}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeShoppingItem(item.id)}
                      aria-label="Remove item"
                      className="shrink-0 text-muted hover:text-red-400"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
