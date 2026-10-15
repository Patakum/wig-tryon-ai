export function createWhatsAppLink({
  phone,
  message,
}: {
  phone: string;
  message: string;
}) {
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${phone}?text=${encodedMessage}`;
}