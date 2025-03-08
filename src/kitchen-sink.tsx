import { useEffect, useState } from "react"

export function assertUnreachable(_: never): never {
  throw new Error("unreachable!")
}

// ----------------------------------------------------------------------------

type CacheEntry = {
  type: "pending"
  value: Promise<any>
} | {
  type: "ready"
  value: any
} | {
  type: "error"
  value: any
}
const fetchCache = new Map<string, CacheEntry>();

function populateCache(url: string): CacheEntry {
  let entry = fetchCache.get(url);
  if (entry) {
    return entry;
  }

  // bit of finagling to handle hypothetical promise that finishes immediately
  const p = fetch(url);
  entry = { type: "pending", value: p };
  fetchCache.set(url, entry);
  entry.value = p
    .then(res => res.json())
    .then(value => {
      fetchCache.set(url, { type: "ready", value });
      return value;
    }).catch(error => {
      fetchCache.set(url, { type: "error", value: error });
      return error;
    });
  return fetchCache.get(url)!;
}

export function useFetchEager<T>(url: string): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    const entry = populateCache(url);
    if (entry.type === "ready") {
      setValue(entry.value as T);
    } else if (entry.type === "error") {
      // TODO handle better
      setValue(null);
    } else if (entry.type === "pending") {
      entry.value.then(v => {
        setValue(v as T);
      });
    } else assertUnreachable(entry);
  }, [url]);

  return value;
}

export function useFetch<T>(url: string): T {
  const entry = populateCache(url);
  if (entry.type === "ready") {
    return entry.value as T;
  } else if (entry.type === "error") {
    throw new Promise(() => {})
    throw entry.value;
  } else if (entry.type === "pending") {
    throw entry.value;
  } else assertUnreachable(entry);
}

// ----------------------------------------------------------------------------

export function JumpToHash() {
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.substring(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  return <></>
}
