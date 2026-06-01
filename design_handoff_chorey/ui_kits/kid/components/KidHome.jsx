// KidHome.jsx — Home / earnings dashboard
function KidHome({ chores, onToggle, totals }) {
  const remaining = chores.filter(c => !c.done).length;
  return (
    <div style={{ paddingBottom: 110 }}>
      <KidHeader name="Mia" streak={4} />
      <KidHeroBalance
        earned={totals.earned}
        allowance={totals.allowance}
        savings={totals.savings}
        giving={totals.giving} />

      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        padding: '24px 22px 8px',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'var(--fg-3)' }}>
            Today
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26,
                        lineHeight: 1.1, color: 'var(--fg-1)', marginTop: 2,
                        letterSpacing: '-0.01em' }}>
            {remaining > 0 ? (
              <>{remaining} {remaining === 1 ? 'chore' : 'chores'} <span style={{ color: 'var(--fg-2)' }}>to go</span></>
            ) : (
              <>Done for today.</>
            )}
          </div>
        </div>
      </div>

      <div style={{
        margin: '0 18px',
        background: 'var(--cream-3)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {chores.map(c => (
          <ChoreRow key={c.id} chore={c} onToggle={onToggle} />
        ))}
      </div>

      <div style={{
        margin: '18px 18px 0', padding: '14px 16px',
        background: 'var(--info-100)', borderRadius: 14,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <Icon name="spark" size={18} color="var(--info-600)" strokeWidth={2.2}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>
            Every dollar splits three ways.
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2,
                        lineHeight: 1.45 }}>
            40% to spend, 40% saved up, 20% to a charity you pick.
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { KidHome });
