// KidWishlist.jsx — things the kid is saving for
function KidWishlist({ totals }) {
  const items = [
    { name: 'Skateboard',    price: 65.00, saved: 28.50, emoji: null, color: 'allowance' },
    { name: 'Lego set',      price: 49.99, saved: 49.99, emoji: null, color: 'savings' },
    { name: 'New book',      price: 14.00, saved: 6.00,  emoji: null, color: 'giving' },
    { name: 'Headphones',    price: 80.00, saved: 12.00, emoji: null, color: 'allowance' },
  ];

  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{ padding: '12px 22px 6px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)',
                      letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          What you're saving for
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 32,
                      lineHeight: 1.05, letterSpacing: '-0.02em',
                      color: 'var(--fg-1)', marginTop: 2 }}>
          Wishlist.
        </div>
      </div>

      <div style={{
        margin: '8px 18px 0',
        background: 'var(--cream-3)',
        borderRadius: 18,
        padding: '14px 16px',
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--fg-3)' }}>
          Spendable now
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 38,
                      lineHeight: 1, color: 'var(--allowance-800)',
                      fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
          ${totals.allowance.toFixed(2)}
        </div>
      </div>

      <div style={{ padding: '20px 22px 10px', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--fg-3)' }}>
        4 wishes
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 18px' }}>
        {items.map((it, i) => {
          const pct = Math.min(100, (it.saved / it.price) * 100);
          const done = it.saved >= it.price;
          return (
            <div key={i} style={{
              background: 'var(--cream-3)',
              borderRadius: 14,
              border: '1px solid var(--border)',
              padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>
                    {it.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2,
                                fontVariantNumeric: 'tabular-nums' }}>
                    ${it.saved.toFixed(2)} of ${it.price.toFixed(2)}
                  </div>
                </div>
                {done ? (
                  <button style={{
                    padding: '8px 14px', borderRadius: 999, border: 0,
                    background: 'var(--accent-600)', color: 'var(--cream-4)',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>Buy it</button>
                ) : (
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22,
                    color: 'var(--fg-1)', fontVariantNumeric: 'tabular-nums',
                  }}>{Math.round(pct)}%</div>
                )}
              </div>
              <div style={{
                height: 6, background: 'var(--cream-1)', borderRadius: 999,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: pct + '%', height: '100%',
                  background: `var(--${it.color}-400)`,
                  borderRadius: 999,
                  transition: 'width 400ms var(--ease-out)',
                }}/>
              </div>
            </div>
          );
        })}
      </div>

      <button style={{
        margin: '18px 18px 0', width: 'calc(100% - 36px)',
        padding: '14px', borderRadius: 14, border: '1.5px dashed var(--border-mid)',
        background: 'transparent', color: 'var(--fg-2)',
        fontWeight: 700, fontSize: 14, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'inherit',
      }}>
        <Icon name="plus" size={16}/> Add a wish
      </button>
    </div>
  );
}

Object.assign(window, { KidWishlist });
