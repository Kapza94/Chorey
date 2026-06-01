// KidYou.jsx — profile / giving / settings
function KidYou({ totals }) {
  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{ padding: '12px 22px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)',
                      letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Profile
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 32,
                      lineHeight: 1.05, letterSpacing: '-0.02em',
                      color: 'var(--fg-1)', marginTop: 2 }}>
          You.
        </div>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 22px 18px' }}>
        <div style={{
          width: 60, height: 60, borderRadius: 999,
          background: 'var(--allowance-200)',
          color: 'var(--allowance-800)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26,
          border: '1px solid var(--border)',
        }}>M</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-1)' }}>Mia</div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>9 years old · joined Feb</div>
        </div>
      </div>

      {/* Savings + giving breakdown */}
      <div style={{
        margin: '0 18px', background: 'var(--cream-3)', borderRadius: 18,
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'var(--fg-3)' }}>
            Savings (locked)
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36,
                          lineHeight: 1, color: 'var(--savings-800)',
                          fontVariantNumeric: 'tabular-nums' }}>
              ${totals.savings.toFixed(2)}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', background: 'var(--savings-100)',
              color: 'var(--savings-600)', borderRadius: 999,
              fontSize: 11, fontWeight: 700,
            }}>
              <Icon name="lock" size={11} strokeWidth={2.4}/>not spendable
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'var(--fg-3)' }}>
            Giving
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36,
                          lineHeight: 1, color: 'var(--giving-800)',
                          fontVariantNumeric: 'tabular-nums' }}>
              ${totals.giving.toFixed(2)}
            </div>
            <button style={{
              padding: '8px 14px', borderRadius: 999, border: 0,
              background: 'var(--giving-400)', color: 'var(--giving-800)',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'inherit',
            }}>
              <Icon name="heart" size={13} strokeWidth={2.6}/>Donate
            </button>
          </div>
          <div style={{
            marginTop: 10, padding: 12, background: 'var(--giving-100)',
            borderRadius: 10, fontSize: 12, color: 'var(--fg-1)', lineHeight: 1.45,
          }}>
            <span style={{ fontWeight: 700 }}>Picked:</span> City Food Bank — $1.20 sent this month.
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 22px 8px', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--fg-3)' }}>
        Quick actions
      </div>
      <div style={{
        margin: '0 18px', background: 'var(--cream-3)', borderRadius: 14,
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        {[
          { label: 'Pick a different charity', icon: 'heart' },
          { label: 'See all earnings', icon: 'arrowR' },
          { label: 'Tell a parent something', icon: 'spark' },
        ].map((r, i, a) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px',
            borderBottom: i < a.length - 1 ? '1px solid var(--border)' : 0,
            cursor: 'pointer',
          }}>
            <Icon name={r.icon} size={18} color="var(--fg-2)"/>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{r.label}</div>
            <Icon name="chev" size={16} color="var(--fg-3)"/>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { KidYou });
