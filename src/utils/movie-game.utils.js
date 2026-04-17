export function normalizeTitle(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function resolveDecadeClass(yearValue) {
  const decade = Math.floor(yearValue / 10) * 10
  const classes = {
    1950: "year-50",
    1960: "year-60",
    1970: "year-70",
    1980: "year-80",
    1990: "year-90",
    2000: "year-2000",
    2010: "year-2010"
  }
  return classes[decade] || "year-2020"
}
