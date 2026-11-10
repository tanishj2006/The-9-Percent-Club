import { notFound } from "next/navigation";

/** Sends any path the course does not have to the localized not-found page. */
export default function CatchAll() {
  notFound();
}
