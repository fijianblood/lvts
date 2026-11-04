// How to reach LvTS. Shown in the footer on every page, and used by the
// "Book a Repair" / "Register Your Interest" style buttons, which open WhatsApp.
// Keep these in step with the business details in index.html.
export const CONTACT = {
  phone: '833 1088',
  phoneHref: 'tel:+6798331088',
  whatsapp: '746 6941',
  whatsappUrl: 'https://wa.me/6797466941',
  email: 'lomavatatechfiji@gmail.com',
  location: 'Raiwai, Suva, Fiji',
};

/** Opens a WhatsApp chat with LvTS in a new tab, with `message` typed in ready to send. */
export function openWhatsApp(message?: string) {
  const url = message ? `${CONTACT.whatsappUrl}?text=${encodeURIComponent(message)}` : CONTACT.whatsappUrl;
  window.open(url, '_blank', 'noopener,noreferrer');
}
