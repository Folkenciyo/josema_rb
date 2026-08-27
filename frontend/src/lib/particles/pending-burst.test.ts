import {
  clearBurst,
  isBurstPending,
  noBurstOnServer,
  requestBurst,
  subscribeToBurst,
} from "./pending-burst";

describe("pending burst", () => {
  // The module holds the flag, so each test has to start from a clean one.
  beforeEach(() => {
    clearBurst();
  });

  it("is quiet when nobody asked for it", () => {
    expect(isBurstPending()).toBe(false);
  });

  it("stands until the screen that plays it says it is over", () => {
    requestBurst();

    expect(isBurstPending()).toBe(true);
    // Reading it must not spend it: a component may render several times
    // before the animation has had a single frame.
    expect(isBurstPending()).toBe(true);

    clearBurst();
    expect(isBurstPending()).toBe(false);
  });

  it("tells the subscribed screen when it is asked for", () => {
    const listener = jest.fn();
    subscribeToBurst(listener);

    requestBurst();

    expect(listener).toHaveBeenCalled();
  });

  it("stops telling a screen that has gone away", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToBurst(listener);
    unsubscribe();

    requestBurst();

    expect(listener).not.toHaveBeenCalled();
  });

  it("never explodes where there is nothing to paint on", () => {
    requestBurst();

    expect(noBurstOnServer()).toBe(false);
  });
});
