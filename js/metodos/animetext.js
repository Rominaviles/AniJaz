function splitTextForTranslation(texto, maxLen = 480) {
  const oraciones = texto.match(/[^.!?]+[.!?]*/g) || [texto];
  const chunks = [];
  let actual = "";
  for (const oracion of oraciones) {
    if ((actual + oracion).length > maxLen) {
      if (actual) chunks.push(actual.trim());
      actual = oracion;
    } else {
      actual += oracion;
    }
  }
  if (actual) chunks.push(actual.trim());
  return chunks;
}