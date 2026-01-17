export const formatKsh = (value: number) =>
  `Ksh ${value.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
