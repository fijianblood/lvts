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

      <footer style={{ background: '#f1f5f9', borderTop: '1px solid #e2e8f0', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', marginBottom: '0.5rem' }}>
            JS<span style={{ color: '#06b6d4' }}>🏝</span>LvTS
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.8 }}>
            LomaVata Tech Services · Raiwai, Suva, Fiji<br />
            Maka Ni Dau Vaámaé Na Moú · Living With Technology ☪
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1.5rem' }}>
            © 2026 LomaVata Tech Services. All Rights Reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
