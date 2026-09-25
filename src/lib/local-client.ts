// Next replaces NODE_ENV at build time. Production cannot enable local mode.
export const LOCAL_LOOKUP =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_LOCAL_LOOKUP === "true";
