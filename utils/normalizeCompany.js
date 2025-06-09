function normalizeCompanyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/(sarl|sas|inc|ltd|gmbh|sa|llc)$/g, '') // retire suffixes courants
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire accents
    .replace(/[\s\-_.]/g, '') // retire espaces, tirets, points, underscores
    .trim();
}

module.exports = { normalizeCompanyName }; 