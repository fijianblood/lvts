import { CONTACT } from '../data/contact';

const linkStyle = { color: '#2563eb', fontWeight: 600, textDecoration: 'none' } as const;

export default function Footer() {
  return (
    <>
      <div style={{ maxWidth: 700, margin: '3rem auto 0', padding: '0 1.5rem' }}>
        <img
          src={`${import.meta.env.BASE_URL}payment-methods.png`}
          alt="Accepted payment methods: Visa, Amex, MasterCard, M-PAiSA, MyCash"
          style={{ width: '100%', display: 'block', borderRadius: 10 }}
        />
      </div>

      <footer style={{ background: '#f1f5f9', borderTop: '1px solid #e2e8f0', padding: '2.5rem 1.5rem 5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <address style={{ fontStyle: 'normal', fontSize: '0.9rem', color: '#334155', lineHeight: 1.9, marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>LomaVata Tech Services · {CONTACT.location}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '1.25rem' }}>
              <a href={CONTACT.phoneHref} style={linkStyle}>Call {CONTACT.phone}</a>
              <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>WhatsApp {CONTACT.whatsapp}</a>
              <a href={`mailto:${CONTACT.email}`} style={{ ...linkStyle, overflowWrap: 'anywhere' }}>{CONTACT.email}</a>
            </div>
          </address>
          <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.8 }}>
            © 2026 LomaVata Tech Services. All Rights Reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
