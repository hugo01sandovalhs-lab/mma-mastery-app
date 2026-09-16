import { createElement } from "react";
import Link from "next/link";
import { expect, it } from "vitest";
import { Button } from "@/components/ui/button";

it("preserves native button semantics and treats navigation links as links", () => {
  expect(Button({}).props.nativeButton).toBe(true);
  expect(Button({ render: createElement(Link, { href: "/training" }) }).props.nativeButton).toBe(false);
  expect(Button({ render: createElement(Link, { href: "/training" }) }).props.role).toBe("link");
  expect(Button({ render: createElement("a", { href: "/skills" }) }).props.nativeButton).toBe(false);
  expect(Button({ render: createElement("button") }).props.nativeButton).toBe(true);
  expect(Button({ nativeButton: false }).props.nativeButton).toBe(false);
});
