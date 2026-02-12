import { useSearchParams } from "react-router-dom";

type TabQueryOptions<T extends string> = {
  key: string;
  defaultValue: T;
  allowed: readonly T[];
};

export const useTabQueryParam = <T extends string>({
  key,
  defaultValue,
  allowed,
}: TabQueryOptions<T>) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(key);
  const value = raw && allowed.includes(raw as T) ? (raw as T) : defaultValue;

  const setValue = (next: T) => {
    const safe = allowed.includes(next) ? next : defaultValue;
    const nextParams = new URLSearchParams(searchParams);
    if (safe === defaultValue) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, safe);
    }
    setSearchParams(nextParams, { replace: true });
  };

  return [value, setValue] as const;
};
