// ParentKids.jsx — kids overview screen

function ParentKids({ kids, onSelectKid }) {
  const totalPending = kids.reduce((s, k) => s + k.pendingApprovals, 0);
  return (
    <div style={{ paddingBottom: 110 }}>
      <ParentHeader subtitle="Saturday · This week" title="Kids."
        action={
          <button style={{
            width: 36, height: 36, borderRadius: 999, border: 0,
            background: 'var(--cream-3)', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-xs)',
          }}>
            <Icon name="plus" size={18} color="var(--fg-1)" strokeWidth={2.2}/>
          </button>
        }
      />

      {totalPending > 0 && (
        <div style={{
          margin: '0 18px 14px', padding: '14px 16px',
          background: 'var(--warning-100)', borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Icon name="spark" size={20} color="var(--warning-600)" strokeWidth={2.2}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>
              {totalPending} chore{totalPending === 1 ? '' : 's'} need your approval
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 1 }}>
              Tap a kid to review.
            </div>
          </div>
          <Icon name="chev" size={16} color="var(--warning-600)"/>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 18px' }}>
        {kids.map(k => (
          <KidCard key={k.id} kid={k} onTap={() => onSelectKid(k.id)} />
        ))}
      </div>

      <div style={{ padding: '24px 22px 8px', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--fg-3)' }}>
        This week, all kids
      </div>
      <div style={{
        margin: '0 18px', padding: '16px 18px',
        background: 'var(--cream-3)', borderRadius: 16, border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36,
                        lineHeight: 1, color: 'var(--fg-1)',
                        fontVariantNumeric: 'tabular-nums' }}>
            ${kids.reduce((s, k) => s + k.earned, 0).toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>paid out Sunday night</div>
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 12 }}>
          <div><div style={{ color: 'var(--fg-3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>To spend</div><div style={{ color: 'var(--allowance-800)', fontWeight: 700, fontSize: 15, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>${(kids.reduce((s, k) => s + k.allowance, 0)).toFixed(2)}</div></div>
          <div><div style={{ color: 'var(--fg-3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>To save</div><div style={{ color: 'var(--savings-800)', fontWeight: 700, fontSize: 15, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>${(kids.reduce((s, k) => s + k.savings, 0)).toFixed(2)}</div></div>
          <div><div style={{ color: 'var(--fg-3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>To give</div><div style={{ color: 'var(--giving-800)', fontWeight: 700, fontSize: 15, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>${(kids.reduce((s, k) => s + k.giving, 0)).toFixed(2)}</div></div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ParentKids });
