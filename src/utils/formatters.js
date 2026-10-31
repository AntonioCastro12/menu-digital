// Formats price into Mexican Pesos (MXN) currency format
export function formatCurrency(amount, currency = 'MXN') {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numeric);
}

// Formats ISO date into friendly Spanish date
export function formatDate(isoString) {
  if (!isoString) return 'Nunca';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return isoString;
  }
}

// Generate direct WhatsApp link with prefilled order text
export function buildWhatsAppLink(phone, message = '') {
  if (!phone) return '#';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message || '¡Hola! Quisiera ordenar desde el menú digital.');
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
