import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("react-chartjs-2", () => ({
  Line: (props: { id?: string; "aria-label"?: string }) => createElement("canvas", props),
}));

afterEach(cleanup);
