import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import Button from "./Button";

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [hasOverflow, setHasOverflow] = React.useState(false);

  const updateScrollButtons = React.useCallback(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    setHasOverflow(node.scrollWidth > node.clientWidth + 1);
    setCanScrollLeft(node.scrollLeft > 0);
    setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 1);
  }, []);

  React.useEffect(() => {
    updateScrollButtons();
    const node = scrollRef.current;
    const observer = typeof ResizeObserver !== "undefined" && node
      ? new ResizeObserver(updateScrollButtons)
      : null;

    if (node && observer) {
      observer.observe(node);
      observer.observe(document.body);
    }

    window.addEventListener("resize", updateScrollButtons);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons]);

  function scrollTabs(direction: "left" | "right") {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    node.scrollBy({
      left: direction === "left" ? -Math.round(node.clientWidth * 0.75) : Math.round(node.clientWidth * 0.75),
      behavior: "smooth"
    });
  }

  return (
    <div className={cn("relative grid items-end border-b border-surfaceMuted", hasOverflow ? "grid-cols-[auto_minmax(0,1fr)_auto]" : "grid-cols-1")}>
      {hasOverflow ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Scroll tabs left"
          onClick={() => scrollTabs("left")}
          disabled={!canScrollLeft}
          className="mb-0 mr-1 h-9 w-9 shrink-0 bg-white/70 hover:border-[#b7b0a1] hover:bg-white disabled:opacity-35"
        >
          <ChevronLeft size={18} />
        </Button>
      ) : null}
      <div
        ref={scrollRef}
        onScroll={updateScrollButtons}
        className="overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <TabsPrimitive.List
          className={cn(
            "flex min-h-10 w-max items-end gap-1 bg-transparent px-0 pt-1",
            className
          )}
          {...props}
        />
      </div>
      {hasOverflow ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Scroll tabs right"
          onClick={() => scrollTabs("right")}
          disabled={!canScrollRight}
          className="mb-0 ml-1 h-9 w-9 shrink-0 bg-white/70 hover:border-[#b7b0a1] hover:bg-white disabled:opacity-35"
        >
          <ChevronRight size={18} />
        </Button>
      ) : null}
    </div>
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative -mb-px inline-flex min-h-10 min-w-[7.25rem] flex-none items-center justify-center whitespace-nowrap rounded-t-md border border-transparent border-b-0 bg-transparent px-3 py-2 text-center text-sm font-medium text-textMuted underline-offset-4 transition hover:bg-white/55 hover:text-text focus:outline-none focus:ring-2 focus:ring-sage/25 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:z-10 data-[state=active]:border-surfaceMuted data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-text data-[state=active]:shadow-none after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent data-[state=active]:after:bg-sage",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-3 animate-tab-content-enter focus:outline-none focus:ring-2 focus:ring-sage/20", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
