export const ENDING_START_EVENT = "clicker-guild:ending-start";

export type EndingLaunchMode = "campaign" | "preview";

export type EndingRequest = {
  mode: EndingLaunchMode;
  onComplete: () => void;
};

export function requestEnding(request: EndingRequest) {
  window.dispatchEvent(new CustomEvent<EndingRequest>(ENDING_START_EVENT, { detail: request }));
}
