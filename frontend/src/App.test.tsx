import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { competitionStorageKey } from "./competition";

const jsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);

const deferredResponse = () => {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

describe("App existing session flows", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test("restores a stored user and loads the dashboard", async () => {
    localStorage.setItem(
      "wingwatch-user",
      JSON.stringify({ id: "1", username: "tess" }),
    );
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation(() =>
        jsonResponse({ leaderboard: [{ username: "tess", birdCount: 2 }] }),
      );

    render(<App />);

    expect(await screen.findByText("tess")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/leaderboard?competition=australia",
    );
  });

  test("loads the signed-in user's list from dashboard navigation", async () => {
    localStorage.setItem(
      "wingwatch-user",
      JSON.stringify({ id: "1", username: "tess" }),
    );
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation((input) => {
        const url = String(input);
        if (url.includes("/leaderboard")) {
          return jsonResponse({ leaderboard: [] });
        }
        return jsonResponse({
          id: "1",
          username: "tess",
          birdCount: 1,
          birdList: [
            {
              id: "bird-1",
              name: "Emu (Dromaius novaehollandiae)",
              dateAdded: "2026-10-01T00:00:00.000Z",
            },
          ],
        });
      });

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /my list/i }));

    expect(await screen.findByText("Emu (Dromaius novaehollandiae)")).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/api/users/tess?competition=worldwide",
      ),
    );
  });
});

describe("competition selection", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test("defaults to Australia and scopes the first dashboard request", async () => {
    localStorage.setItem(
      "wingwatch-user",
      JSON.stringify({ id: "1", username: "tess" }),
    );
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation(() => jsonResponse({ leaderboard: [] }));

    render(<App />);

    expect(await screen.findByText("Australian Comp")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/leaderboard?competition=australia",
    );
  });

  test("restores Worldwide before the first request and keeps it across navigation", async () => {
    localStorage.setItem(
      "wingwatch-user",
      JSON.stringify({ id: "1", username: "tess" }),
    );
    localStorage.setItem(competitionStorageKey("tess"), "worldwide");
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation((input) =>
        String(input).includes("/leaderboard")
          ? jsonResponse({ leaderboard: [] })
          : jsonResponse({
              id: "1",
              username: "tess",
              birdCount: 0,
              birdList: [],
            }),
      );

    render(<App />);

    expect(await screen.findByText("Worldwide Comp")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:3001/api/leaderboard?competition=worldwide",
    );
    fireEvent.click(screen.getByRole("button", { name: /my list/i }));
    await screen.findByRole("heading", { name: /my list/i });
    fireEvent.click(screen.getByRole("button", { name: /dashboard/i }));
    expect(await screen.findByText("Worldwide Comp")).toBeInTheDocument();
  });

  test("toggles competition directly from the current-scope icon", async () => {
    localStorage.setItem(
      "wingwatch-user",
      JSON.stringify({ id: "1", username: "tess" }),
    );
    jest.spyOn(global, "fetch").mockImplementation(() =>
      jsonResponse({ leaderboard: [] }),
    );
    render(<App />);

    const toggle = await screen.findByRole("button", {
      name: "Switch to Worldwide Comp",
    });
    expect(toggle).toHaveTextContent("🇦🇺");
    fireEvent.click(toggle);
    expect(
      await screen.findByRole("button", { name: "Switch to Australian Comp" }),
    ).toHaveTextContent("🌐");
    expect(localStorage.getItem(competitionStorageKey("tess"))).toBe(
      "worldwide",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to Australian Comp" }),
    );
    expect(
      await screen.findByRole("button", { name: "Switch to Worldwide Comp" }),
    ).toHaveTextContent("🇦🇺");
    expect(localStorage.getItem(competitionStorageKey("tess"))).toBe(
      "australia",
    );
  });

  test("My List searches worldwide birds regardless of the active competition", async () => {
    localStorage.setItem(
      "wingwatch-user",
      JSON.stringify({ id: "1", username: "tess" }),
    );
    localStorage.setItem(competitionStorageKey("tess"), "worldwide");
    const fetchMock = jest.spyOn(global, "fetch").mockImplementation((input) =>
      String(input).includes("/leaderboard")
        ? jsonResponse({ leaderboard: [] })
        : jsonResponse({
            id: "1",
            username: "tess",
            birdCount: 0,
            birdList: [],
          }),
    );
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /my list/i }));

    const input = await screen.findByPlaceholderText("Search for a bird...");
    fireEvent.change(input, { target: { value: "Kagu" } });
    expect(await screen.findByText("Rhynochetos jubatus")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Emu" } });
    expect(await screen.findByText("Dromaius novaehollandiae")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Kagu" } });
    fireEvent.click(await screen.findByText("Rhynochetos jubatus"));
    expect(screen.getByRole("button", { name: "Add Bird" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /dashboard/i }));
    fireEvent.click(
      screen.getByRole("button", { name: "Switch to Australian Comp" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /my list/i }));
    const australianInput = await screen.findByPlaceholderText(
      "Search for a bird...",
    );
    expect(australianInput).toHaveValue("");
    fireEvent.change(australianInput, { target: { value: "Kagu" } });
    expect(await screen.findByText("Rhynochetos jubatus")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Rhynochetos jubatus"));
    expect(screen.getByRole("button", { name: "Add Bird" })).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/users/tess?competition=worldwide",
    );
  });

  test("scopes competitor profiles and omits info actions for birds without URLs", async () => {
    localStorage.setItem(
      "wingwatch-user",
      JSON.stringify({ id: "1", username: "tess" }),
    );
    localStorage.setItem(competitionStorageKey("tess"), "worldwide");
    const fetchMock = jest.spyOn(global, "fetch").mockImplementation((input) =>
      String(input).includes("/leaderboard")
        ? jsonResponse({ leaderboard: [{ username: "alex", birdCount: 1 }] })
        : jsonResponse({
            id: "2",
            username: "alex",
            birdCount: 1,
            birdList: [
              {
                id: "bird-2",
                name: "Kagu (Rhynochetos jubatus)",
                dateAdded: "2026-10-01T00:00:00.000Z",
              },
            ],
          }),
    );
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /alex/i }));

    expect(await screen.findByText("Kagu (Rhynochetos jubatus)")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/users/alex?competition=worldwide",
    );
    expect(
      screen.queryByTitle("View bird information"),
    ).not.toBeInTheDocument();
  });

  test("hides old rows during a scope change and offers retry without changing scope", async () => {
    localStorage.setItem(
      "wingwatch-user",
      JSON.stringify({ id: "1", username: "tess" }),
    );
    let worldwideAttempt = 0;
    const fetchMock = jest.spyOn(global, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("competition=australia")) {
        return jsonResponse({
          leaderboard: [{ username: "australia-row", birdCount: 2 }],
        });
      }
      worldwideAttempt += 1;
      return worldwideAttempt === 1
        ? jsonResponse({ error: "offline" }, false)
        : jsonResponse({
            leaderboard: [{ username: "world-row", birdCount: 3 }],
          });
    });
    render(<App />);
    expect(await screen.findByText("australia-row")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to Worldwide Comp" }),
    );
    expect(screen.queryByText("australia-row")).not.toBeInTheDocument();
    expect(
      screen.getByText("Loading Worldwide Comp leaderboard…"),
    ).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByText("Worldwide Comp")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("world-row")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:3001/api/leaderboard?competition=worldwide",
    );
  });

  test("refreshes the selected competition after adding and deleting", async () => {
    localStorage.setItem(
      "wingwatch-user",
      JSON.stringify({ id: "1", username: "tess" }),
    );
    localStorage.setItem(competitionStorageKey("tess"), "worldwide");
    let profileReads = 0;
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation((input, init) => {
        const url = String(input);
        if (url.includes("/leaderboard")) {
          return jsonResponse({ leaderboard: [] });
        }
        if (init?.method === "POST" || init?.method === "DELETE") {
          return jsonResponse({ success: true });
        }
        profileReads += 1;
        return jsonResponse({
          id: "1",
          username: "tess",
          birdCount: profileReads > 1 ? 1 : 0,
          birdList:
            profileReads > 1
              ? [
                  {
                    id: "bird-2",
                    name: "Kagu (Rhynochetos jubatus)",
                    dateAdded: "2026-10-01T00:00:00.000Z",
                  },
                ]
              : [],
        });
      });
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /my list/i }));
    const input = await screen.findByPlaceholderText("Search for a bird...");
    fireEvent.change(input, { target: { value: "Kagu" } });
    fireEvent.click(await screen.findByText("Rhynochetos jubatus"));
    fireEvent.click(screen.getByRole("button", { name: "Add Bird" }));

    expect(await screen.findByText("Kagu (Rhynochetos jubatus)")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/users/tess?competition=worldwide",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/leaderboard?competition=worldwide",
    );

    fireEvent.click(screen.getByRole("button", { name: "×" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/api/users/tess/birds/bird-2",
        { method: "DELETE" },
      ),
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:3001/api/leaderboard?competition=worldwide",
    );
  });

  test("refreshes the active competition when an add resolves after a scope change", async () => {
    localStorage.setItem(
      "wingwatch-user",
      JSON.stringify({ id: "1", username: "tess" }),
    );
    localStorage.setItem(competitionStorageKey("tess"), "worldwide");
    const pendingPost = deferredResponse();
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation((input, init) => {
        const url = String(input);
        if (init?.method === "POST") return pendingPost.promise;
        if (url.includes("/leaderboard")) {
          return jsonResponse({ leaderboard: [] });
        }
        return jsonResponse({
          id: "1",
          username: "tess",
          birdCount: 0,
          birdList: [],
        });
      });

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /my list/i }));
    const input = await screen.findByPlaceholderText("Search for a bird...");
    fireEvent.change(input, { target: { value: "Kagu" } });
    fireEvent.click(await screen.findByText("Rhynochetos jubatus"));
    fireEvent.click(screen.getByRole("button", { name: "Add Bird" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/api/users/tess/birds",
        expect.objectContaining({ method: "POST" }),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: /dashboard/i }));
    fireEvent.click(
      screen.getByRole("button", { name: "Switch to Australian Comp" }),
    );
    const callsBeforeResolution = fetchMock.mock.calls.length;

    await act(async () => {
      pendingPost.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);
      await pendingPost.promise;
    });

    await waitFor(() =>
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(
        callsBeforeResolution + 2,
      ),
    );
    const refreshUrls = fetchMock.mock.calls
      .slice(callsBeforeResolution)
      .map(([input]) => String(input));
    expect(refreshUrls).toContain(
      "http://localhost:3001/api/users/tess?competition=worldwide",
    );
    expect(refreshUrls).toContain(
      "http://localhost:3001/api/leaderboard?competition=australia",
    );
    expect(refreshUrls).not.toContain(
      "http://localhost:3001/api/users/tess?competition=australia",
    );
    expect(refreshUrls).not.toContain(
      "http://localhost:3001/api/leaderboard?competition=worldwide",
    );
  });

  test("refreshes the active competition when a delete resolves after a scope change", async () => {
    localStorage.setItem(
      "wingwatch-user",
      JSON.stringify({ id: "1", username: "tess" }),
    );
    localStorage.setItem(competitionStorageKey("tess"), "worldwide");
    const pendingDelete = deferredResponse();
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation((input, init) => {
        const url = String(input);
        if (init?.method === "DELETE") return pendingDelete.promise;
        if (url.includes("/leaderboard")) {
          return jsonResponse({ leaderboard: [] });
        }
        return jsonResponse({
          id: "1",
          username: "tess",
          birdCount: 1,
          birdList: [
            {
              id: "bird-2",
              name: "Kagu (Rhynochetos jubatus)",
              dateAdded: "2026-10-01T00:00:00.000Z",
            },
          ],
        });
      });

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /my list/i }));
    await screen.findByText("Kagu (Rhynochetos jubatus)");
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/api/users/tess/birds/bird-2",
        { method: "DELETE" },
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: /dashboard/i }));
    fireEvent.click(
      screen.getByRole("button", { name: "Switch to Australian Comp" }),
    );
    const callsBeforeResolution = fetchMock.mock.calls.length;

    await act(async () => {
      pendingDelete.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);
      await pendingDelete.promise;
    });

    await waitFor(() =>
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(
        callsBeforeResolution + 2,
      ),
    );
    const refreshUrls = fetchMock.mock.calls
      .slice(callsBeforeResolution)
      .map(([input]) => String(input));
    expect(refreshUrls).toContain(
      "http://localhost:3001/api/users/tess?competition=worldwide",
    );
    expect(refreshUrls).toContain(
      "http://localhost:3001/api/leaderboard?competition=australia",
    );
    expect(refreshUrls).not.toContain(
      "http://localhost:3001/api/users/tess?competition=australia",
    );
    expect(refreshUrls).not.toContain(
      "http://localhost:3001/api/leaderboard?competition=worldwide",
    );
  });

  test("backs up the complete worldwide list while Australia is selected", async () => {
    localStorage.setItem(
      "wingwatch-user",
      JSON.stringify({ id: "1", username: "tess" }),
    );
    const fetchMock = jest.spyOn(global, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/leaderboard")) {
        return jsonResponse({ leaderboard: [] });
      }
      if (url.includes("competition=worldwide")) {
        return jsonResponse({
          id: "1",
          username: "tess",
          birdCount: 1,
          birdList: [
            {
              id: "bird-2",
              name: "Kagu (Rhynochetos jubatus)",
              dateAdded: "2026-10-01T00:00:00.000Z",
            },
          ],
        });
      }
      return jsonResponse({
        id: "1",
        username: "tess",
        birdCount: 0,
        birdList: [],
      });
    });
    const createObjectURL = jest.fn((_blob: Blob) => "blob:wing-watch-backup");
    const revokeObjectURL = jest.fn();
    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(window.URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /my list/i }));
    const backupButton = await screen.findByRole("button", {
      name: "Data Backup",
    });
    expect(backupButton).toBeEnabled();
    fireEvent.click(backupButton);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/api/users/tess?competition=worldwide",
      ),
    );
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
    const exportedBlob = createObjectURL.mock.calls[0][0] as Blob;
    const csvContent = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(exportedBlob);
    });
    expect(csvContent).toContain("Kagu (Rhynochetos jubatus)");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:wing-watch-backup");
  });
});
