import { act, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { createInitialSimulation } from "@/simulation/engine";
import { useAppStore } from "@/store";

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({
    mode: "lunar",
    selectedCrewId: "aur-01",
    solarConjunction: false,
    simulationSpeed: 1,
    temperatureUnit: "C",
    simulation: createInitialSimulation(),
    alerts: [],
    alertHysteresis: {},
    medicalLog: [],
    soundEnabled: false,
    alarmVolume: 0.35,
  });
});

describe("dashboard interactions", () => {
  it("switches the selected crew and opens settings", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Select Javier Ortiz/ }));
    expect(useAppStore.getState().selectedCrewId).toBe("aur-02");
    expect(screen.getByRole("heading", { name: /Javier Ortiz/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    expect(screen.getByRole("dialog", { name: "Dashboard settings" })).toBeInTheDocument();
  });

  it("shows three astronauts in the doctor workspace and only personal telemetry in astronaut mode", () => {
    render(<App />);
    expect(screen.getAllByRole("button", { name: /Select / })).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Open AURA" }));
    const aura = screen.getByRole("complementary", { name: "AURA" });
    expect(within(aura).getByText("Doctor Mode")).toBeInTheDocument();

    const profile = screen.getByRole("combobox", { name: "Demo profile" });
    for (const [id, name] of [
      ["aur-01", "Maya Chen"],
      ["aur-02", "Javier Ortiz"],
      ["aur-03", "Priya Nair"],
    ]) {
      fireEvent.change(profile, { target: { value: id } });
      expect(screen.getByRole("heading", { name: new RegExp(name) })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Select / })).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Medical log" })).not.toBeInTheDocument();
      expect(
        within(screen.getByRole("complementary", { name: "AURA" })).getByText("Astronaut Mode"),
      ).toBeInTheDocument();
    }

    fireEvent.change(profile, { target: { value: "" } });
    expect(screen.getByRole("heading", { name: /Maya Chen/ })).toBeInTheDocument();
    expect(
      within(screen.getByRole("complementary", { name: "AURA" })).getByRole("textbox", {
        name: "Ask AURA",
      }),
    ).toBeEnabled();
  });

  it("answers from the current telemetry and clears the conversation when switching roles", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ text: "Maya Chen 7.4 h; Javier Ortiz 6.9 h; Priya Nair 7.8 h" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ text: "Javier history", chartCrewId: "aur-02" }),
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ text: "Priya Nair 7.8 h" }) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ text: "Astronaut Mode shows your own health data." }),
        }),
    );
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Open AURA" }));
    const ask = async (question: string) => {
      fireEvent.change(screen.getByRole("textbox", { name: "Ask AURA" }), {
        target: { value: question },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
      await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    };

    await ask("Compare crew sleep");
    const log = screen.getByRole("log");
    expect(log).toHaveTextContent("Maya Chen");
    expect(log).toHaveTextContent("7.4 h");
    expect(log).toHaveTextContent("Javier Ortiz");
    expect(log).toHaveTextContent("Priya Nair");

    await ask("Show Javier’s heart-rate history");
    expect(useAppStore.getState().selectedCrewId).toBe("aur-02");

    fireEvent.change(screen.getByRole("combobox", { name: "Demo profile" }), {
      target: { value: "aur-03" },
    });
    expect(screen.queryByRole("log")).not.toBeInTheDocument();
    await ask("How much did I sleep?");
    expect(screen.getByRole("log")).toHaveTextContent("7.8 h");
    await ask("Show Maya’s pulse");
    expect(screen.getByRole("log")).toHaveTextContent("Astronaut Mode shows your own health data.");
  });

  it("adds a selected-crew medical note and persists it", () => {
    render(<App />);
    const log = screen.getByRole("heading", { name: "Medical log" }).closest("section");
    expect(log).not.toBeNull();
    fireEvent.change(within(log!).getByRole("textbox", { name: /Medical note for Maya Chen/ }), {
      target: { value: "Crew member reports feeling well." },
    });
    fireEvent.click(within(log!).getByRole("button", { name: "Add note" }));

    expect(within(log!).getByText("Crew member reports feeling well.")).toBeInTheDocument();
    expect(useAppStore.getState().medicalLog).toHaveLength(1);
    expect(localStorage.getItem("astropulse-app-state")).toContain(
      "Crew member reports feeling well.",
    );
  });

  it("raises a crew alert after the emergency scenario reaches its threshold", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Simulate emergency/ }));
    expect(useAppStore.getState().simulation.scenario?.id).toBe("cardiac-event");
    act(() => {
      for (let tick = 0; tick < 9; tick += 1) useAppStore.getState().tick();
    });
    expect(useAppStore.getState().simulation.crew[0].vitals.heartRateBpm).toBeGreaterThanOrEqual(
      140,
    );
    expect(useAppStore.getState().alerts).toContainEqual(
      expect.objectContaining({
        id: "aur-01:heart-rate",
        level: "emergency",
        active: true,
      }),
    );
    expect(screen.getByText("Critical heart-rate excursion")).toBeInTheDocument();
    expect(screen.getByText("EMERGENCY", { selector: "span" })).toBeInTheDocument();
  });
});
